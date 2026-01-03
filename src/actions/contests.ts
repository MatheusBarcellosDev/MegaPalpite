"use server";

import { prisma } from "@/lib/prisma";
import { FormattedContest } from "@/lib/lottery/types";

// Get next draw date based on lottery type
function getNextDrawDate(lotteryType: string = "megasena"): string {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday

  let drawDays: number[];
  
  // Define draw days for each lottery
  switch (lotteryType) {
    case "megasena":
      // Mega-Sena: Tuesday (2), Thursday (4), Saturday (6)
      drawDays = [2, 4, 6];
      break;
    case "lotofacil":
    case "quina":
      // Lotofácil and Quina: Monday to Saturday (1-6)
      drawDays = [1, 2, 3, 4, 5, 6];
      break;
    default:
      drawDays = [2, 4, 6];
  }

  let daysUntilNext = 1;

  // Find next draw day
  for (let i = 1; i <= 7; i++) {
    const nextDay = (dayOfWeek + i) % 7;
    if (drawDays.includes(nextDay)) {
      daysUntilNext = i;
      break;
    }
  }

  const nextDraw = new Date(now);
  nextDraw.setDate(now.getDate() + daysUntilNext);
  return nextDraw.toISOString().split("T")[0];
}

export async function getLatestContestFromDB(lotteryType: string = "megasena"): Promise<FormattedContest> {
  try {
    const dbContest = await prisma.contest.findFirst({
      where: { lotteryType },
      orderBy: { id: "desc" },
    });

    if (!dbContest) {
      return getDefaultContest(lotteryType);
    }

    return {
      contestNumber: dbContest.id,
      drawDate: dbContest.drawDate.toISOString().split("T")[0],
      nextDrawDate: dbContest.nextDrawDate 
        ? dbContest.nextDrawDate.toISOString().split("T")[0]
        : getNextDrawDate(lotteryType),
      jackpotValue: Number(dbContest.nextJackpot) || Number(dbContest.jackpotValue),
      estimatedValue: Number(dbContest.nextJackpot) || Number(dbContest.jackpotValue),
      drawnNumbers: dbContest.drawnNumbers,
      isAccumulated: dbContest.isAccumulated,
      winners: [],
    };
  } catch (error) {
    console.error("Error fetching contest from DB:", error);
    return getDefaultContest(lotteryType);
  }
}

function getDefaultContest(lotteryType: string = "megasena"): FormattedContest {
  return {
    contestNumber: 2956,
    drawDate: new Date().toISOString().split("T")[0],
    nextDrawDate: getNextDrawDate(lotteryType),
    jackpotValue: 3500000,
    estimatedValue: 3500000,
    drawnNumbers: [],
    isAccumulated: true,
    winners: [],
  };
}
