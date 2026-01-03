import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendResultEmail } from "@/lib/email";
import { countMatches } from "@/lib/lottery/generator";
import { createClient } from "@supabase/supabase-js";
import { LotteryType, ACTIVE_LOTTERIES, getLotteryConfig } from "@/lib/lottery/types-config";
import { LotteryContest } from "@/lib/lottery/types";

const CAIXA_API_BASE = "https://servicebus2.caixa.gov.br/portaldeloterias/api";
const FALLBACK_API_BASE = "https://loteriascaixa-api.herokuapp.com/api";

// Helper function to try fetching from multiple APIs
async function fetchContestData(lotteryType: LotteryType): Promise<LotteryContest | null> {
  const config = getLotteryConfig(lotteryType);
  
  // Try Caixa API first
  try {
    const response = await fetch(`${CAIXA_API_BASE}/${config.apiPath}`, {
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
    console.log(`Caixa API failed for ${lotteryType}, trying fallback...`, e);
  }

  // Fallback to alternative API
  try {
    const response = await fetch(`${FALLBACK_API_BASE}/${config.apiPath}/latest`, {
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
    console.log(`Fallback API also failed for ${lotteryType}`, e);
  }

  return null;
}

function parseDate(dateStr: string): Date {
  const parts = dateStr.split("/");
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);
  // Use UTC to avoid timezone issues
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

// Check games and notify users for a specific lottery
async function checkAndNotifyUsers(
  contestNumber: number,
  drawnNumbers: number[],
  lotteryType: LotteryType
): Promise<{ notified: number; errors: number }> {
  let notified = 0;
  let errors = 0;
  
  const config = getLotteryConfig(lotteryType);

  try {
    // Find all games for this contest that don't have results yet
    // Note: Using raw query until lotteryType field is added to DB
    const games = await prisma.game.findMany({
      where: {
        contestNumber,
        result: null,
      },
    });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.log("Supabase admin credentials not configured, skipping email notifications");
      
      // Still save results
      for (const game of games) {
        const hits = countMatches(game.numbers, drawnNumbers);
        await prisma.result.create({
          data: {
            gameId: game.id,
            hits,
          },
        });
      }
      
      return { notified: 0, errors: 0 };
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    for (const game of games) {
      try {
        const hits = countMatches(game.numbers, drawnNumbers);

        // Save result  
        await prisma.result.create({
          data: {
            gameId: game.id,
            hits,
          },
        });

        // Only send email if user hit at least the minimum to win
        if (hits >= config.minHitsToWin) {
          const { data: userData } = await supabaseAdmin.auth.admin.getUserById(game.userId);
          
          if (userData?.user?.email) {
            const sent = await sendResultEmail({
              to: userData.user.email,
              contestNumber,
              numbers: game.numbers,
              drawnNumbers,
              hits,
              lotteryType: config.name,
            });
            if (sent) notified++;
          }
        }
      } catch (e) {
        console.error(`Error processing game ${game.id}:`, e);
        errors++;
      }
    }
  } catch (e) {
    console.error("Error checking user games:", e);
    errors++;
  }

  return { notified, errors };
}

// Sync a single lottery type
async function syncLottery(lotteryType: LotteryType): Promise<{
  success: boolean;
  message: string;
  contestNumber?: number;
  isNew?: boolean;
}> {
  const contest = await fetchContestData(lotteryType);
  
  if (!contest) {
    return { success: false, message: `Failed to fetch ${lotteryType} data` };
  }

  // Parse drawn numbers
  const drawnNumbers = contest.listaDezenas.map((n: string) => parseInt(n, 10));
  
  // Check if already exists (for now, just check by ID until lotteryType column is added)
  const existing = await prisma.contest.findUnique({
    where: { id: contest.numero },
  });

  if (existing && existing.drawnNumbers.length === drawnNumbers.length) {
    return {
      success: true,
      message: `${lotteryType} already up to date`,
      contestNumber: contest.numero,
      isNew: false,
    };
  }

  // Save new contest or update existing
  if (existing) {
    await prisma.contest.update({
      where: { id: contest.numero },
      data: {
        drawnNumbers,
        nextDrawDate: contest.dataProximoConcurso ? parseDate(contest.dataProximoConcurso) : null,
        jackpotValue: contest.valorAcumuladoProximoConcurso || contest.valorEstimadoProximoConcurso,
        isAccumulated: contest.acumulado,
        nextJackpot: contest.valorEstimadoProximoConcurso,
        winnersData: (contest.listaRateioPremio || []) as any,
      },
    });
  } else {
    await prisma.contest.create({
      data: {
        id: contest.numero,
        lotteryType,
        drawDate: parseDate(contest.dataApuracao),
        nextDrawDate: contest.dataProximoConcurso ? parseDate(contest.dataProximoConcurso) : null,
        drawnNumbers,
        jackpotValue: contest.valorAcumuladoProximoConcurso || contest.valorEstimadoProximoConcurso,
        isAccumulated: contest.acumulado,
        nextJackpot: contest.valorEstimadoProximoConcurso,
        winnersData: (contest.listaRateioPremio || []) as any,
      },
    });
  }

  // Check games and notify users
  await checkAndNotifyUsers(contest.numero, drawnNumbers, lotteryType);

  return {
    success: true,
    message: `${lotteryType} synced - contest ${contest.numero}`,
    contestNumber: contest.numero,
    isNew: !existing,
  };
}

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const specificLottery = searchParams.get("lottery") as LotteryType | null;

  try {
    // Sync specific lottery or all active lotteries
    const lotteriesToSync = specificLottery 
      ? [specificLottery] 
      : ACTIVE_LOTTERIES;

    const results: Record<string, { success: boolean; message: string; contestNumber?: number }> = {};

    for (const lotteryType of lotteriesToSync) {
      results[lotteryType] = await syncLottery(lotteryType);
    }

    const allSuccess = Object.values(results).every(r => r.success);

    return NextResponse.json({
      success: allSuccess,
      message: allSuccess ? "All lotteries synced" : "Some lotteries failed",
      results,
    });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
