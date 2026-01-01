"use server";

import { prisma } from "@/lib/prisma";
import { FormattedContest } from "@/lib/lottery/types";

// Get next draw date (calculated on server)
function getNextDrawDate(): string {
  const now = new Date();
  const dayOfWeek = now.getDay();

  // Mega-Sena draws on Tuesday (2), Thursday (4), and Saturday (6)
  const drawDays = [2, 4, 6];
  let daysUntilNext = 1;

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

export async function getLatestContestFromDB(): Promise<FormattedContest> {
  try {
    const dbContest = await prisma.contest.findFirst({
      orderBy: { id: "desc" },
    });

    if (!dbContest) {
      return getDefaultContest();
    }

    return {
      contestNumber: dbContest.id,
      drawDate: dbContest.drawDate.toISOString().split("T")[0],
      nextDrawDate: getNextDrawDate(),
      jackpotValue: Number(dbContest.nextJackpot) || Number(dbContest.jackpotValue),
      estimatedValue: Number(dbContest.nextJackpot) || Number(dbContest.jackpotValue),
      drawnNumbers: dbContest.drawnNumbers,
      isAccumulated: dbContest.isAccumulated,
      winners: [],
    };
  } catch (error) {
    console.error("Error fetching contest from DB:", error);
    return getDefaultContest();
  }
}

function getDefaultContest(): FormattedContest {
  return {
    contestNumber: 2954,
    drawDate: new Date().toISOString().split("T")[0],
    nextDrawDate: getNextDrawDate(),
    jackpotValue: 600000000,
    estimatedValue: 600000000,
    drawnNumbers: [],
    isAccumulated: true,
    winners: [],
  };
}
