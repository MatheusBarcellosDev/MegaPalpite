"use server";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { 
  generateNumbersWithStrategy, 
  calculateFrequencyFromDB, 
  generateExplanationContext,
  getNextContestNumber,
  getAvailableStrategies,
  countMatches,
  type GenerationStrategy,
} from "@/lib/lottery/generator";
import { getLatestContestFromDB } from "@/actions/contests";
import { generateExplanation } from "@/lib/openai";
import { GameWithResult } from "@/lib/lottery/types";

export async function getStrategies() {
  return getAvailableStrategies();
}

export async function getLatestContest(lotteryType: string = "megasena") {
  const contest = await getLatestContestFromDB(lotteryType);
  return contest;
}

export async function generateGame(
  strategy: GenerationStrategy = "balanced",
  lotteryType: string = "megasena"
): Promise<{
  success: boolean;
  game?: {
    numbers: number[];
    explanation: string;
    contestNumber: number;
    strategy: string;
    lotteryType: string;
  };
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Check auth
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Não autenticado" };
    }

    // Get next contest number for this specific lottery
    const contestNumber = await getNextContestNumber(lotteryType);

    // Generate numbers using selected strategy
    const { numbers, stats } = await generateNumbersWithStrategy(strategy, lotteryType);

    // Calculate frequencies for explanation context
    const frequencies = await calculateFrequencyFromDB(100, lotteryType as any);
    const context = generateExplanationContext(numbers, frequencies, strategy);

    // Generate AI explanation
    let explanation: string;
    try {
      explanation = await generateExplanation(context);
    } catch {
      // Fallback explanation if OpenAI fails
      explanation = `Números gerados usando estratégia "${strategy}". ` +
        `Estatísticas: ${stats.oddCount} ímpares, ${stats.evenCount} pares, ` +
        `soma total ${stats.sum}.`;
    }

    // Save to database - linked to current contest
    await prisma.game.create({
      data: {
        userId: user.id,
        lotteryType,
        numbers,
        explanation,
        contestNumber,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/games");

    return {
      success: true,
      game: {
        numbers,
        explanation,
        contestNumber,
        strategy,
        lotteryType,
      },
    };
  } catch (error) {
    console.error("Error generating game:", error);
    return { success: false, error: "Erro ao gerar números" };
  }
}

export async function saveGame(
  numbers: number[],
  explanation: string,
  contestNumber: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Não autenticado" };
    }

    await prisma.game.create({
      data: {
        userId: user.id,
        numbers,
        explanation,
        contestNumber,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/games");

    return { success: true };
  } catch (error) {
    console.error("Error saving game:", error);
    return { success: false, error: "Erro ao salvar jogo" };
  }
}

export async function getUserGames(): Promise<GameWithResult[]> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return [];
    }

    const games = await prisma.game.findMany({
      where: { userId: user.id },
      include: { result: true },
      orderBy: { createdAt: "desc" },
    });

    // Get drawn numbers for games with results
    const gamesWithResults: GameWithResult[] = await Promise.all(
      games.map(async (game: typeof games[number]) => {
        let drawnNumbers: number[] | undefined;
        
        // Get contest data if it exists
        const contest = await prisma.contest.findUnique({
          where: { id: game.contestNumber },
          select: { drawnNumbers: true },
        });
        
        if (contest && contest.drawnNumbers.length > 0) {
          drawnNumbers = contest.drawnNumbers;
        }

        return {
          id: game.id,
          lotteryType: game.lotteryType,
          numbers: game.numbers,
          explanation: game.explanation,
          contestNumber: game.contestNumber,
          createdAt: game.createdAt.toISOString(),
          hits: game.result?.hits,
          checkedAt: game.result?.checkedAt?.toISOString(),
          drawnNumbers,
        };
      })
    );

    return gamesWithResults;
  } catch (error) {
    console.error("Error fetching games:", error);
    return [];
  }
}

export async function getUserGamesForContest(contestNumber: number): Promise<GameWithResult[]> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return [];
    }

    const games = await prisma.game.findMany({
      where: { 
        userId: user.id,
        contestNumber,
      },
      include: { result: true },
      orderBy: { createdAt: "desc" },
    });

    return games.map((game: typeof games[number]) => ({
      id: game.id,
      numbers: game.numbers,
      explanation: game.explanation,
      contestNumber: game.contestNumber,
      createdAt: game.createdAt.toISOString(),
      hits: game.result?.hits,
      checkedAt: game.result?.checkedAt.toISOString(),
    }));
  } catch (error) {
    console.error("Error fetching games:", error);
    return [];
  }
}

export async function checkGameResults(): Promise<{
  checked: number;
  updated: number;
}> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { checked: 0, updated: 0 };
    }

    // Get games without results
    const games = await prisma.game.findMany({
      where: {
        userId: user.id,
        result: null,
      },
    });

    let updated = 0;

    for (const game of games) {
      // Get contest result from local database
      const contest = await prisma.contest.findUnique({
        where: { id: game.contestNumber },
        select: { drawnNumbers: true },
      });

      if (contest && contest.drawnNumbers.length === 6) {
        // Calculate hits
        const hits = countMatches(game.numbers, contest.drawnNumbers);

        // Save result
        await prisma.result.create({
          data: {
            gameId: game.id,
            hits,
          },
        });

        updated++;
      }
    }

    revalidatePath("/dashboard/games");
    revalidatePath("/dashboard/results");

    return { checked: games.length, updated };
  } catch (error) {
    console.error("Error checking results:", error);
    return { checked: 0, updated: 0 };
  }
}

export async function getRecentGames(limit: number = 5): Promise<GameWithResult[]> {
  const games = await getUserGames();
  return games.slice(0, limit);
}
