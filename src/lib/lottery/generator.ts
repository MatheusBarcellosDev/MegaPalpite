import { prisma } from "@/lib/prisma";
import { NumberFrequency, GenerationStats } from "./types";
import { LotteryType, getLotteryConfig } from "./types-config";

// Estratégias disponíveis
export type GenerationStrategy = "balanced" | "hot" | "cold" | "mixed";

interface StrategyConfig {
  name: string;
  description: string;
  hotNumbers: number;   // Quantos números "quentes" (frequentes)
  coldNumbers: number;  // Quantos números "frios" (atrasados)
  balancedNumbers: number; // Quantos números equilibrados
}

// Strategy configs will be scaled based on lottery's numbersCount
const STRATEGY_RATIOS: Record<GenerationStrategy, { hot: number; cold: number; balanced: number }> = {
  balanced: { hot: 0.33, cold: 0.33, balanced: 0.34 },
  hot: { hot: 0.66, cold: 0.17, balanced: 0.17 },
  cold: { hot: 0.17, cold: 0.66, balanced: 0.17 },
  mixed: { hot: 0.33, cold: 0.33, balanced: 0.34 },
};

function getStrategyConfig(strategy: GenerationStrategy, numbersCount: number): StrategyConfig {
  const ratios = STRATEGY_RATIOS[strategy];
  const hot = Math.max(1, Math.round(numbersCount * ratios.hot));
  const cold = Math.max(1, Math.round(numbersCount * ratios.cold));
  const balanced = numbersCount - hot - cold;
  
  const names: Record<GenerationStrategy, { name: string; description: string }> = {
    balanced: {
      name: "Equilibrado",
      description: "Mix de números quentes, frios e equilibrados",
    },
    hot: {
      name: "Quente",
      description: "Foco em números que mais saíram recentemente",
    },
    cold: {
      name: "Frio",
      description: "Foco em números 'atrasados' que não saem há tempo",
    },
    mixed: {
      name: "Aleatório Inteligente",
      description: "Seleção aleatória respeitando padrões estatísticos",
    },
  };
  
  return {
    ...names[strategy],
    hotNumbers: hot,
    coldNumbers: cold,
    balancedNumbers: balanced,
  };
}

export function getAvailableStrategies() {
  return (["balanced", "hot", "cold", "mixed"] as GenerationStrategy[]).map(key => ({
    id: key,
    name: getStrategyConfig(key, 6).name,
    description: getStrategyConfig(key, 6).description,
  }));
}

/**
 * Calcula a frequência de cada número nos últimos N concursos
 */
export async function calculateFrequencyFromDB(
  contestCount: number = 100,
  lotteryType: LotteryType = "megasena"
): Promise<NumberFrequency[]> {
  const config = getLotteryConfig(lotteryType);
  
  // Note: lotteryType filter will be added after DB migration
  const contests = await prisma.contest.findMany({
    orderBy: { id: "desc" },
    take: contestCount,
    select: { drawnNumbers: true },
  });

  const frequency: Record<number, number> = {};
  
  // Inicializa todos os números no range da loteria
  for (let i = config.minNumber; i <= config.maxNumber; i++) {
    frequency[i] = 0;
  }

  // Conta frequência
  contests.forEach((contest: { drawnNumbers: number[] }) => {
    contest.drawnNumbers.forEach((num: number) => {
      frequency[num]++;
    });
  });

  // Converte para array ordenado
  return Object.entries(frequency)
    .map(([number, count]: [string, number]) => ({
      number: parseInt(number),
      frequency: count,
      percentage: contests.length > 0 ? (count / contests.length) * 100 : 0,
    }))
    .sort((a: { frequency: number }, b: { frequency: number }) => b.frequency - a.frequency);
}

/**
 * Identifica números "atrasados" - que não saem há muitos sorteios
 */
export async function getDelayedNumbers(
  threshold: number = 20,
  lotteryType: string = "megasena"
): Promise<number[]> {
  const { getLotteryConfig } = await import("./types-config");
  const lotteryConfig = getLotteryConfig(lotteryType as any);
  
  const contests = await prisma.contest.findMany({
    where: { lotteryType },
    orderBy: { id: "desc" },
    take: threshold,
    select: { drawnNumbers: true },
  });

  const recentNumbers = new Set<number>();
  contests.forEach((contest: { drawnNumbers: number[] }) => {
    contest.drawnNumbers.forEach((num: number) => recentNumbers.add(num));
  });

  // Números que NÃO apareceram nos últimos 'threshold' sorteios
  const delayed: number[] = [];
  for (let i = lotteryConfig.minNumber; i <= lotteryConfig.maxNumber; i++) {
    if (!recentNumbers.has(i)) {
      delayed.push(i);
    }
  }

  return delayed;
}

/**
 * Obtém o próximo número de concurso para jogar
 * Se o último concurso já foi sorteado, retorna o próximo
 * Se o último concurso ainda não foi sorteado, retorna ele mesmo
 */
export async function getNextContestNumber(): Promise<number> {
  const latest = await prisma.contest.findFirst({
    orderBy: { id: "desc" },
    select: { id: true, drawnNumbers: true, drawDate: true },
  });

  if (!latest) {
    // No contests in DB, start with 2955 (current approximate)
    return 2955;
  }

  // Check if the latest contest has already been drawn
  // A contest is considered drawn if it has 6 numbers
  const isDrawn = latest.drawnNumbers && latest.drawnNumbers.length === 6;
  
  if (isDrawn) {
    // Latest contest was drawn, next games are for the following contest
    return latest.id + 1;
  }
  
  // Latest contest hasn't been drawn yet, games are for this contest
  return latest.id;
}

/**
 * Verifica se o concurso ainda está aberto para apostas
 * Retorna info sobre o concurso ativo
 */
export async function getActiveContestInfo(): Promise<{
  contestNumber: number;
  isOpen: boolean;
  message?: string;
}> {
  const contestNumber = await getNextContestNumber();
  
  // Check if we have this contest in DB (with draw date info)
  const contest = await prisma.contest.findUnique({
    where: { id: contestNumber - 1 }, // Get the previous (drawn) contest
    select: { drawDate: true },
  });
  
  // For now, always allow - we can add time-based validation later
  return {
    contestNumber,
    isOpen: true,
  };
}


/**
 * Gera números usando a estratégia especificada
 */
export async function generateNumbersWithStrategy(
  strategy: GenerationStrategy = "balanced",
  lotteryType: string = "megasena"
): Promise<{ numbers: number[]; stats: GenerationStats }> {
  // Import lottery config
  const { getLotteryConfig } = await import("./types-config");
  const lotteryConfig = getLotteryConfig(lotteryType as any);
  
  const numbersCount = lotteryConfig.numbersCount;
  const minNumber = lotteryConfig.minNumber;
  const maxNumber = lotteryConfig.maxNumber;
  
  const config = getStrategyConfig(strategy, numbersCount);
  const frequency = await calculateFrequencyFromDB(100, lotteryType as any);
  const delayed = await getDelayedNumbers(30, lotteryType);

  // Separa números por categoria
  const hotNumbers = frequency.slice(0, 15).map((f: NumberFrequency) => f.number); // Top 15 mais frequentes
  const coldNumbers = delayed.length > 0 ? delayed : frequency.slice(-15).map((f: NumberFrequency) => f.number);
  const balancedNumbers = frequency.slice(15, 45).map((f: NumberFrequency) => f.number); // Meio da tabela

  const selected: Set<number> = new Set();

  // Função auxiliar para selecionar números aleatórios de um pool
  const selectRandom = (pool: number[], count: number): number[] => {
    const available = pool.filter((n: number) => !selected.has(n));
    const shuffled = fisherYatesShuffle([...available]);
    return shuffled.slice(0, count);
  };

  // Seleciona de acordo com a estratégia
  const fromHot = selectRandom(hotNumbers, config.hotNumbers);
  fromHot.forEach((n: number) => selected.add(n));

  const fromCold = selectRandom(coldNumbers, config.coldNumbers);
  fromCold.forEach((n: number) => selected.add(n));

  const fromBalanced = selectRandom(balancedNumbers, config.balancedNumbers);
  fromBalanced.forEach((n: number) => selected.add(n));

  // Se ainda faltam números, completa do pool geral
  while (selected.size < numbersCount) {
    const allAvailable = Array.from({ length: maxNumber - minNumber + 1 }, (_: unknown, i: number) => i + minNumber).filter(
      (n: number) => !selected.has(n)
    );
    const random = allAvailable[Math.floor(Math.random() * allAvailable.length)];
    selected.add(random);
  }

  let numbers = Array.from(selected);

  // Aplica restrições estatísticas
  numbers = applyStatisticalConstraints(numbers, frequency);

  // Ordena os números
  numbers.sort((a, b) => a - b);

  // Calcula estatísticas do jogo gerado
  const stats = calculateGameStats(numbers, frequency);

  return { numbers, stats };
}

/**
 * Aplica restrições estatísticas aos números selecionados
 */
function applyStatisticalConstraints(
  numbers: number[],
  frequency: NumberFrequency[]
): number[] {
  let result = [...numbers];
  const frequencyMap = new Map(frequency.map((f: NumberFrequency) => [f.number, f]));

  // Verifica equilíbrio par/ímpar (2-4 de cada)
  const oddCount = result.filter((n: number) => n % 2 === 1).length;
  if (oddCount < 2 || oddCount > 4) {
    result = rebalance(result, frequencyMap, "oddEven");
  }

  // Verifica equilíbrio alto/baixo (2-4 de cada)
  const lowCount = result.filter((n: number) => n <= 30).length;
  if (lowCount < 2 || lowCount > 4) {
    result = rebalance(result, frequencyMap, "highLow");
  }

  // Evita mais de 2 consecutivos
  result = removeExcessiveSequentials(result, frequencyMap);

  return result;
}

function rebalance(
  numbers: number[],
  frequencyMap: Map<number, NumberFrequency>,
  type: "oddEven" | "highLow"
): number[] {
  const result = [...numbers];
  const isTarget = type === "oddEven" 
    ? (n: number) => n % 2 === 1 
    : (n: number) => n <= 30;

  let targetCount = result.filter(isTarget).length;

  // Tenta equilibrar para 3 de cada
  while (targetCount < 2 || targetCount > 4) {
    if (targetCount < 2) {
      // Precisa de mais números do tipo alvo
      const toRemove = result.find((n) => !isTarget(n));
      if (toRemove !== undefined) {
        const idx = result.indexOf(toRemove);
        const candidates = Array.from({ length: 60 }, (_: unknown, i: number) => i + 1)
          .filter((n: number) => isTarget(n) && !result.includes(n));
        if (candidates.length > 0) {
          result[idx] = candidates[Math.floor(Math.random() * candidates.length)];
        }
      }
    } else if (targetCount > 4) {
      // Precisa de menos números do tipo alvo
      const toRemove = result.find(isTarget);
      if (toRemove !== undefined) {
        const idx = result.indexOf(toRemove);
        const candidates = Array.from({ length: 60 }, (_: unknown, i: number) => i + 1)
          .filter((n: number) => !isTarget(n) && !result.includes(n));
        if (candidates.length > 0) {
          result[idx] = candidates[Math.floor(Math.random() * candidates.length)];
        }
      }
    }
    targetCount = result.filter(isTarget).length;
  }

  return result;
}

function removeExcessiveSequentials(
  numbers: number[],
  frequencyMap: Map<number, NumberFrequency>
): number[] {
  const sorted = [...numbers].sort((a: number, b: number) => a - b);
  
  // Conta sequências
  let maxSequence = 1;
  let currentSequence = 1;
  
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === sorted[i - 1] + 1) {
      currentSequence++;
      maxSequence = Math.max(maxSequence, currentSequence);
    } else {
      currentSequence = 1;
    }
  }

  // Se mais de 2 consecutivos, substitui um
  if (maxSequence > 2) {
    // Encontra o número do meio da sequência e substitui
    for (let i = 1; i < sorted.length - 1; i++) {
      if (sorted[i] === sorted[i - 1] + 1 && sorted[i] === sorted[i + 1] - 1) {
        const candidates = Array.from({ length: 60 }, (_: unknown, j: number) => j + 1)
          .filter((n: number) => !sorted.includes(n) && Math.abs(n - sorted[i - 1]) > 1 && Math.abs(n - sorted[i + 1]) > 1);
        if (candidates.length > 0) {
          sorted[i] = candidates[Math.floor(Math.random() * candidates.length)];
          break;
        }
      }
    }
  }

  return sorted;
}

function calculateGameStats(
  numbers: number[],
  frequency: NumberFrequency[]
): GenerationStats {
  const frequencyMap = new Map(frequency.map((f: NumberFrequency) => [f.number, f.frequency]));

  const oddCount = numbers.filter((n: number) => n % 2 === 1).length;
  const evenCount = 6 - oddCount;
  const lowCount = numbers.filter((n: number) => n <= 30).length;
  const highCount = 6 - lowCount;
  const sum = numbers.reduce((a: number, b: number) => a + b, 0);
  
  // Conta consecutivos
  const sorted = [...numbers].sort((a: number, b: number) => a - b);
  let consecutiveCount = 0;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === sorted[i - 1] + 1) {
      consecutiveCount++;
    }
  }

  // Média de frequência dos números escolhidos
  const avgFrequency =
    numbers.reduce((sum: number, n: number) => sum + (frequencyMap.get(n) || 0), 0) / 6;

  return {
    oddCount,
    evenCount,
    lowCount,
    highCount,
    sum,
    consecutiveCount,
    avgFrequency,
  };
}

function fisherYatesShuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Conta quantos números coincidem entre dois conjuntos
 */
export function countMatches(userNumbers: number[], drawnNumbers: number[]): number {
  const drawnSet = new Set(drawnNumbers);
  return userNumbers.filter((n: number) => drawnSet.has(n)).length;
}

/**
 * Gera contexto para explicação da IA
 */
export function generateExplanationContext(
  numbers: number[],
  frequency: NumberFrequency[],
  strategy: GenerationStrategy
): string {
  const strategyConfig = getStrategyConfig(strategy, 6);
  const frequencyMap = new Map(frequency.map((f: NumberFrequency) => [f.number, f]));

  const numbersInfo = numbers.map((n: number) => {
    const freq = frequencyMap.get(n);
    return `${n} (apareceu ${freq?.frequency || 0}x nos últimos 100 sorteios)`;
  });

  return `
Estratégia utilizada: ${strategyConfig.name}
Descrição: ${strategyConfig.description}

Números gerados: ${numbers.join(", ")}

Detalhes:
${numbersInfo.join("\n")}

Estatísticas do jogo:
- Ímpares: ${numbers.filter((n: number) => n % 2 === 1).length}
- Pares: ${numbers.filter((n: number) => n % 2 === 0).length}
- Baixos (1-30): ${numbers.filter((n: number) => n <= 30).length}
- Altos (31-60): ${numbers.filter((n: number) => n > 30).length}
- Soma total: ${numbers.reduce((a: number, b: number) => a + b, 0)}
`;
}
