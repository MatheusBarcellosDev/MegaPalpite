import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendResultEmail } from "@/lib/email";
import { countMatches } from "@/lib/lottery/generator";
import { createClient } from "@supabase/supabase-js";

const CAIXA_API_URL = "https://servicebus2.caixa.gov.br/portaldeloterias/api/megasena";

interface LotteryContest {
  numero: number;
  dataApuracao: string;
  listaDezenas: string[];
  valorAcumuladoProximoConcurso: number;
  valorEstimadoProximoConcurso: number;
  acumulado: boolean;
  listaRateioPremio?: Array<{
    faixa: number;
    numeroDeGanhadores: number;
    valorPremio: number;
    descricaoFaixa: string;
  }>;
}

function parseDate(dateStr: string): Date {
  const [day, month, year] = dateStr.split("/").map(Number);
  return new Date(year, month - 1, day);
}

async function checkAndNotifyUsers(contestNumber: number, drawnNumbers: number[]) {
  // Get all games for this contest
  const games = await prisma.game.findMany({
    where: { contestNumber },
    include: { result: true },
  });

  // Group games by userId
  const gamesByUser = new Map<string, typeof games>();
  games.forEach((game) => {
    const userGames = gamesByUser.get(game.userId) || [];
    userGames.push(game);
    gamesByUser.set(game.userId, userGames);
  });

  // Process each user
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.log("Supabase service key not configured, skipping notifications");
    return { processed: 0 };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  let processed = 0;
  let emailsSent = 0;

  for (const [userId, userGames] of gamesByUser.entries()) {
    // Get user email
    const { data: userData } = await supabase.auth.admin.getUserById(userId);
    const email = userData?.user?.email;

    if (!email) continue;

    // Calculate hits for each game and save results
    const gamesWithHits = await Promise.all(
      userGames.map(async (game) => {
        const hits = countMatches(game.numbers, drawnNumbers);

        // Save result if not already saved
        if (!game.result) {
          await prisma.result.create({
            data: {
              gameId: game.id,
              hits,
            },
          });
        }

        return {
          numbers: game.numbers,
          hits: game.result?.hits ?? hits,
        };
      })
    );

    // Send email notification
    const emailResult = await sendResultEmail({
      to: email,
      contestNumber,
      drawnNumbers,
      userGames: gamesWithHits,
    });

    if (emailResult.success) {
      emailsSent++;
    }

    processed++;
  }

  return { processed, emailsSent };
}

export async function GET() {
  try {
    // Fetch latest contest from Caixa API
    const response = await fetch(CAIXA_API_URL, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch from Caixa API" },
        { status: 500 }
      );
    }

    const contest: LotteryContest = await response.json();
    const drawnNumbers = contest.listaDezenas.map((n) => parseInt(n, 10));

    // Check if we already have this contest
    const existing = await prisma.contest.findUnique({
      where: { id: contest.numero },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        message: "Already up to date",
        contestNumber: contest.numero,
        isNew: false,
      });
    }

    // Save new contest
    await prisma.contest.create({
      data: {
        id: contest.numero,
        drawDate: parseDate(contest.dataApuracao),
        drawnNumbers,
        jackpotValue: contest.valorAcumuladoProximoConcurso || contest.valorEstimadoProximoConcurso,
        isAccumulated: contest.acumulado,
        nextJackpot: contest.valorEstimadoProximoConcurso,
        winnersData: contest.listaRateioPremio || [],
      },
    });

    // Check games for this contest and notify users
    const notifications = await checkAndNotifyUsers(contest.numero, drawnNumbers);

    return NextResponse.json({
      success: true,
      message: "New contest saved and users notified",
      contestNumber: contest.numero,
      isNew: true,
      drawnNumbers: contest.listaDezenas,
      isAccumulated: contest.acumulado,
      notifications,
    });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
