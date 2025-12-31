import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendResultEmail } from "@/lib/email";
import { countMatches } from "@/lib/lottery/generator";
import { createClient } from "@supabase/supabase-js";

const CAIXA_API_URL = "https://servicebus2.caixa.gov.br/portaldeloterias/api/megasena";
const FALLBACK_API_URL = "https://loteriascaixa-api.herokuapp.com/api/megasena/latest";

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

// Helper function to try fetching from multiple APIs
async function fetchContestData(): Promise<LotteryContest | null> {
  // Try Caixa API first
  try {
    const response = await fetch(CAIXA_API_URL, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
        "Referer": "https://loterias.caixa.gov.br/",
      },
      cache: "no-store",
    });
    if (response.ok) {
      const data = await response.json();
      return data as LotteryContest;
    }
  } catch (e) {
    console.log("Caixa API failed, trying fallback...", e);
  }

  // Fallback to alternative API
  try {
    const response = await fetch(FALLBACK_API_URL, {
      headers: { "Accept": "application/json" },
      cache: "no-store",
    });
    if (response.ok) {
      const data = await response.json();
      // Map alternative API format to our interface
      return {
        numero: data.concurso,
        dataApuracao: data.data,
        listaDezenas: data.dezenas,
        valorAcumuladoProximoConcurso: data.valorAcumuladoProximoConcurso || 0,
        valorEstimadoProximoConcurso: data.valorEstimadoProximoConcurso || 0,
        acumulado: data.acumulou,
        listaRateioPremio: data.premiacoes?.map((p: { descricao: string; faixa: number; ganhadores: number; valorPremio: number }) => ({
          faixa: p.faixa,
          numeroDeGanhadores: p.ganhadores,
          valorPremio: p.valorPremio,
          descricaoFaixa: p.descricao,
        })),
      };
    }
  } catch (e) {
    console.log("Fallback API also failed", e);
  }

  return null;
}

function parseDate(dateStr: string): Date {
  const parts = dateStr.split("/");
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);
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
  games.forEach((game: typeof games[number]) => {
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
      userGames.map(async (game: typeof userGames[number]) => {
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
    // Fetch latest contest (tries Caixa first, then fallback)
    const contest = await fetchContestData();

    if (!contest) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch from all lottery APIs" },
        { status: 500 }
      );
    }

    const drawnNumbers = contest.listaDezenas.map((n: string) => parseInt(n, 10));

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
