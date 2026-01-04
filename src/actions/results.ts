"use server";

import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/lottery/api";
import { getLotteryConfig } from "@/lib/lottery/types-config";

export interface ContestDetails {
  contestNumber: number;
  lotteryName: string;
  lotteryIcon: string;
  drawDate: string;
  formattedDrawDate: string;
  drawnNumbers: number[];
  jackpotValue: string;
  isAccumulated: boolean;
  nextContest: {
    number: number;
    date: string | null;
    estimatedPrize: string;
  };
  winners: {
    tier: string;
    numberOfWinners: number;
    prizePerWinner: string;
  }[];
}

/**
 * Busca detalhes completos de um concurso para exibição pública
 */
export async function getContestDetails(lotteryType: string): Promise<ContestDetails | null> {
  try {
    const config = getLotteryConfig(lotteryType as any);
    
    const contest = await prisma.contest.findFirst({
      where: { 
        lotteryType,
        drawnNumbers: { isEmpty: false }
      },
      orderBy: { id: "desc" },
    });

    if (!contest) {
      return null;
    }

    // Parse winners from JSON
    const winnersData = contest.winnersData as any;
    const winners = Array.isArray(winnersData) 
      ? winnersData.map((w: any) => ({
          tier: w.descricaoFaixa || `Faixa ${w.faixa}`,
          numberOfWinners: w.numeroDeGanhadores || 0,
          prizePerWinner: formatCurrency(w.valorPremio || 0),
        }))
      : [];

    return {
      contestNumber: contest.id,
      lotteryName: config.name,
      lotteryIcon: config.icon,
      drawDate: contest.drawDate.toISOString(),
      formattedDrawDate: formatDate(contest.drawDate.toISOString()),
      drawnNumbers: contest.drawnNumbers,
      jackpotValue: formatCurrency(Number(contest.jackpotValue)),
      isAccumulated: contest.isAccumulated,
      nextContest: {
        number: contest.id + 1,
        date: contest.nextDrawDate?.toISOString() || null,
        estimatedPrize: contest.nextJackpot 
          ? formatCurrency(Number(contest.nextJackpot)) 
          : formatCurrency(0),
      },
      winners,
    };
  } catch (error) {
    console.error("Error fetching contest details:", error);
    return null;
  }
}

/**
 * Busca histórico de resultados (formato compacto)
 */
export async function getContestHistory(lotteryType: string, limit: number = 20) {
  try {
    const contests = await prisma.contest.findMany({
      where: { 
        lotteryType,
        drawnNumbers: { isEmpty: false }
      },
      orderBy: { id: "desc" },
      take: limit,
      select: {
        id: true,
        drawDate: true,
        drawnNumbers: true,
        jackpotValue: true,
        isAccumulated: true,
      },
    });

    return contests.map(c => ({
      contestNumber: c.id,
      drawDate: formatDate(c.drawDate.toISOString()),
      drawnNumbers: c.drawnNumbers,
      jackpotValue: formatCurrency(Number(c.jackpotValue)),
      isAccumulated: c.isAccumulated,
    }));
  } catch (error) {
    console.error("Error fetching contest history:", error);
    return [];
  }
}
