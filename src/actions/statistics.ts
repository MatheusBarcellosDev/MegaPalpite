"use server";

import { prisma } from "@/lib/prisma";

export interface FrequencyData {
  number: number;
  frequency: number;
  percentage: number;
}

export interface HotColdData {
  hotNumbers: number[];
  coldNumbers: number[];
  hotNumbersDetailed: { number: number; frequency: number }[];
  coldNumbersDetailed: { number: number; lastSeen: number }[];
}

/**
 * Get frequency of all numbers in the last N contests
 */
export async function getNumberFrequency(contestCount: number = 100): Promise<FrequencyData[]> {
  const contests = await prisma.contest.findMany({
    orderBy: { id: "desc" },
    take: contestCount,
    select: { drawnNumbers: true },
  });

  const frequency: Record<number, number> = {};
  
  // Initialize all numbers
  for (let i = 1; i <= 60; i++) {
    frequency[i] = 0;
  }

  // Count frequency
  contests.forEach((contest: { drawnNumbers: number[] }) => {
    contest.drawnNumbers.forEach((num: number) => {
      frequency[num]++;
    });
  });

  // Convert to array sorted by frequency (descending)
  return Object.entries(frequency)
    .map(([number, count]) => ({
      number: parseInt(number),
      frequency: count,
      percentage: (count / contests.length) * 100,
    }))
    .sort((a, b) => b.frequency - a.frequency);
}

/**
 * Get hot and cold numbers
 */
export async function getHotColdNumbers(): Promise<HotColdData> {
  // Get last 50 contests for hot numbers
  const recentContests = await prisma.contest.findMany({
    orderBy: { id: "desc" },
    take: 50,
    select: { drawnNumbers: true },
  });

  // Count frequency
  const frequency: Record<number, number> = {};
  for (let i = 1; i <= 60; i++) {
    frequency[i] = 0;
  }

  recentContests.forEach((contest: { drawnNumbers: number[] }) => {
    contest.drawnNumbers.forEach((num: number) => {
      frequency[num]++;
    });
  });

  // Get all contests for "last seen" calculation
  const allContests = await prisma.contest.findMany({
    orderBy: { id: "desc" },
    take: 100,
    select: { id: true, drawnNumbers: true },
  });

  // Calculate last seen for each number
  const lastSeen: Record<number, number> = {};
  for (let i = 1; i <= 60; i++) {
    lastSeen[i] = 100; // Default: not seen in last 100
  }

  allContests.forEach((contest: { id: number; drawnNumbers: number[] }, index: number) => {
    contest.drawnNumbers.forEach((num: number) => {
      if (lastSeen[num] === 100) {
        lastSeen[num] = index;
      }
    });
  });

  // Sort by frequency (hot) and last seen (cold)
  const sortedByFrequency = Object.entries(frequency)
    .map(([number, freq]) => ({ number: parseInt(number), frequency: freq }))
    .sort((a, b) => b.frequency - a.frequency);

  const sortedByLastSeen = Object.entries(lastSeen)
    .map(([number, seen]) => ({ number: parseInt(number), lastSeen: seen }))
    .sort((a, b) => b.lastSeen - a.lastSeen);

  return {
    hotNumbers: sortedByFrequency.slice(0, 10).map((n: { number: number }) => n.number),
    coldNumbers: sortedByLastSeen.slice(0, 10).map((n: { number: number }) => n.number),
    hotNumbersDetailed: sortedByFrequency.slice(0, 10),
    coldNumbersDetailed: sortedByLastSeen.slice(0, 10),
  };
}

/**
 * Get user's history of results for charting
 */
export async function getUserResultsHistory(userId: string): Promise<{
  data: { contestNumber: number; hits: number; date: string }[];
  stats: {
    totalGames: number;
    avgHits: number;
    bestHits: number;
    bestContest: number | null;
  };
}> {
  const games = await prisma.game.findMany({
    where: { userId },
    include: { result: true },
    orderBy: { contestNumber: "asc" },
  });

  // Get contest dates
  const contestNumbers = [...new Set(games.map((g: typeof games[number]) => g.contestNumber))];
  const contests = await prisma.contest.findMany({
    where: { id: { in: contestNumbers } },
    select: { id: true, drawDate: true },
  });
  const contestDateMap = new Map<number, Date>();
  contests.forEach((c: { id: number; drawDate: Date }) => {
    contestDateMap.set(c.id, c.drawDate);
  });

  // Build history data
  const data = games
    .filter((g: typeof games[number]) => g.result)
    .map((g: typeof games[number]) => {
      const drawDate = contestDateMap.get(g.contestNumber);
      return {
        contestNumber: g.contestNumber,
        hits: g.result!.hits,
        date: drawDate ? drawDate.toISOString().split("T")[0] : "",
      };
    });

  // Calculate stats
  const totalGames = data.length;
  const totalHits = data.reduce((sum: number, d: { hits: number }) => sum + d.hits, 0);
  const avgHits = totalGames > 0 ? totalHits / totalGames : 0;
  const bestHits = totalGames > 0 ? Math.max(...data.map((d: { hits: number }) => d.hits)) : 0;
  const bestGame = data.find((d: { contestNumber: number; hits: number }) => d.hits === bestHits);

  return {
    data,
    stats: {
      totalGames,
      avgHits: Math.round(avgHits * 10) / 10,
      bestHits,
      bestContest: bestGame?.contestNumber || null,
    },
  };
}
