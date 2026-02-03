import { prisma } from "@/lib/prisma";
import { NumberFrequency, GenerationStats } from "./types";
import { LotteryType, getLotteryConfig } from "./types-config";

// Estratégias disponíveis
export type GenerationStrategy = "balanced" | "hot" | "cold" | "mixed" | "repeater" | "pureRandom";

interface StrategyConfig {
  name: string;
  description: string;
  hotNumbers: number;   // Quantos números "quentes" (frequentes)
  coldNumbers: number;  // Quantos números "frios" (atrasados)
  balancedNumbers: number; // Quantos números equilibrados
}

const STRATEGY_RATIOS: Record<GenerationStrategy, { hot: number; cold: number; balanced: number }> = {
  balanced: { hot: 0.33, cold: 0.33, balanced: 0.34 },
  hot: { hot: 0.66, cold: 0.17, balanced: 0.17 },
  cold: { hot: 0.17, cold: 0.66, balanced: 0.17 },
  mixed: { hot: 0.33, cold: 0.33, balanced: 0.34 },
  repeater: { hot: 0.0, cold: 0.0, balanced: 0.0 }, // Custom logic used
  pureRandom: { hot: 0.0, cold: 0.0, balanced: 0.0 }, // Pure random - no filters
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
    repeater: {
      name: "Repetição Inteligente",
      description: "Baseado na tendência de repetição do último sorteio",
    },
    pureRandom: {
      name: "Aleatório Puro",
      description: "Números 100% aleatórios, sem nenhum filtro estatístico",
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
  return (["balanced", "hot", "cold", "mixed", "repeater", "pureRandom"] as GenerationStrategy[]).map(key => ({
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
  
  const contests = await prisma.contest.findMany({
    where: { lotteryType },
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
export async function getNextContestNumber(lotteryType: string = "megasena"): Promise<number> {
  const latest = await prisma.contest.findFirst({
    where: { lotteryType },
    orderBy: { id: "desc" },
    select: { id: true, drawnNumbers: true, drawDate: true },
  });

  if (!latest) {
    // No contests in DB for this lottery, use approximate current numbers
    const defaults: Record<string, number> = {
      megasena: 2955,
      lotofacil: 3577,
      quina: 6917,
    };
    return defaults[lotteryType] || 1;
  }

  // Check if the latest contest has already been drawn
  // A contest is considered drawn if it has numbers
  const isDrawn = latest.drawnNumbers && latest.drawnNumbers.length > 0;
  
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
  
  console.log(`[GENERATOR] Lottery: ${lotteryType}, Range: ${minNumber}-${maxNumber}, Count: ${numbersCount}`);
  
  const config = getStrategyConfig(strategy, numbersCount);
  console.log(`[GENERATOR] Fetching frequency data...`);
  // Analisa 500 concursos para Lotofácil, 100 para outras
  const analysisDepth = lotteryType === "lotofacil" ? 500 : 100;
  const frequency = await calculateFrequencyFromDB(analysisDepth, lotteryType as any);
  console.log(`[GENERATOR] Frequency data length: ${frequency.length}`);
  
  // FALLBACK: Se não há dados históricos, gera números puramente aleatórios
  if (frequency.length === 0 || frequency.every(f => f.frequency === 0)) {
    console.log(`[GENERATOR] No historical data, using pure random generation`);
    const randomNumbers: number[] = [];
    const used = new Set<number>();
    
    while (randomNumbers.length < numbersCount) {
      const num = Math.floor(Math.random() * (maxNumber - minNumber + 1)) + minNumber;
      if (!used.has(num)) {
        used.add(num);
        randomNumbers.push(num);
      }
    }
    
    randomNumbers.sort((a, b) => a - b);
    const stats = calculateGameStats(randomNumbers, []);
    return { numbers: randomNumbers, stats };
  }

  // PURE RANDOM STRATEGY - No filters, just random numbers (only for Lotofácil)
  if (strategy === "pureRandom" && lotteryType === "lotofacil") {
    console.log(`[GENERATOR] Pure random mode - no filters applied`);
    const randomNumbers: number[] = [];
    const used = new Set<number>();
    
    while (randomNumbers.length < numbersCount) {
      const num = Math.floor(Math.random() * (maxNumber - minNumber + 1)) + minNumber;
      if (!used.has(num)) {
        used.add(num);
        randomNumbers.push(num);
      }
    }
    
    randomNumbers.sort((a, b) => a - b);
    const stats = calculateGameStats(randomNumbers, frequency);
    return { numbers: randomNumbers, stats };
  }

  
  // LOGIC FOR REPEATER STRATEGY
  if (strategy === "repeater") {
    // Get last contest numbers
    const lastContest = await prisma.contest.findFirst({
      where: { lotteryType, drawnNumbers: { isEmpty: false } },
      orderBy: { id: "desc" },
      select: { drawnNumbers: true }
    });
    
    // Store last numbers for use in constraints regardless of strategy
    const lastContestNumbers = lastContest?.drawnNumbers || [];

    if (lastContest?.drawnNumbers && lastContest.drawnNumbers.length > 0) {
      const lastNumbers = lastContest.drawnNumbers;
      
      // Define how many to repeat based on lottery type
      let repeatCount = 1; // Default for Mega and Quina
      if (lotteryType === "lotofacil") repeatCount = 9; // Average 9 repeat for Lotofacil
      
      const selectedSet = new Set<number>();
      
      // Select numbers from valid last numbers (ensure they are within range)
      const validLastNumbers = lastNumbers.filter(n => n >= minNumber && n <= maxNumber);
      
      const repeatCandidates = fisherYatesShuffle(validLastNumbers).slice(0, Math.min(repeatCount, validLastNumbers.length));
      repeatCandidates.forEach(n => selectedSet.add(n));
      
      // Fill the rest from numbers NOT in last draw
      const otherNumbers = Array.from({ length: maxNumber - minNumber + 1 }, (_: unknown, i: number) => i + minNumber)
        .filter(n => !validLastNumbers.includes(n));
        
      const remainingCount = numbersCount - selectedSet.size;
      const otherCandidates = fisherYatesShuffle(otherNumbers).slice(0, remainingCount);
      otherCandidates.forEach(n => selectedSet.add(n));
      
      let numbers = Array.from(selectedSet).sort((a, b) => a - b);
      
      // Apply constraints (dynamic ones we just fixed)
      numbers = applyStatisticalConstraints(numbers, frequency, minNumber, maxNumber, lastContestNumbers);
      
      numbers.sort((a, b) => a - b);
      const stats = calculateGameStats(numbers, frequency);
      return { numbers, stats };
    }
    // Fallback if no last contest
  }

  // Get last contest numbers for general constraints even if not repeater strategy
  const lastContest = await prisma.contest.findFirst({
    where: { lotteryType, drawnNumbers: { isEmpty: false } },
    orderBy: { id: "desc" },
    select: { drawnNumbers: true }
  });
  const lastContestNumbers = lastContest?.drawnNumbers || [];

  const delayed = await getDelayedNumbers(30, lotteryType);

  // Separa números por categoria
  // Se não há dados suficientes (ex: Lotofácil tem só 25 números), usa todo o range disponível
  const totalAvailable = frequency.length;
  const hotNumbers = totalAvailable > 0 
    ? frequency.slice(0, Math.min(15, Math.floor(totalAvailable / 2))).map((f: NumberFrequency) => f.number)
    : [];
  const coldNumbers = delayed.length > 0 
    ? delayed 
    : (totalAvailable > 15 ? frequency.slice(-15).map((f: NumberFrequency) => f.number) : []);
  const balancedNumbers = totalAvailable > 15
    ? frequency.slice(Math.min(15, Math.floor(totalAvailable / 3)), Math.min(45, Math.floor(totalAvailable * 0.83))).map((f: NumberFrequency) => f.number)
    : frequency.slice(0, totalAvailable).map((f: NumberFrequency) => f.number);

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
  numbers = applyStatisticalConstraints(numbers, frequency, minNumber, maxNumber, lastContestNumbers);

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
  frequency: NumberFrequency[],
  minNumber: number,
  maxNumber: number,
  lastDraw: number[] = []
): number[] {
  let result = [...numbers];
  const frequencyMap = new Map(frequency.map((f: NumberFrequency) => [f.number, f]));

  // Configurações dinâmicas baseadas no tamanho do jogo
  const isLotofacil = maxNumber === 25 && numbers.length === 15;
  
  // High/Low threshold (metade do range)
  const highLowThreshold = Math.floor(maxNumber / 2);
  
  // Faixas aceitáveis padrão
  let targetMin = Math.floor(numbers.length * 0.33); 
  let targetMax = Math.ceil(numbers.length * 0.66);  
  
  // REGRAS OTIMIZADAS PARA LOTOFÁCIL (Baseado em 500 jogos)
  if (isLotofacil) {
      targetMin = 6; // Mínimo 6 ímpares (era 7)
      targetMax = 10; // Máximo 10 ímpares (era 9)
  }
  
  // 1. Verifica equilíbrio par/ímpar
  const oddCount = result.filter((n: number) => n % 2 === 1).length;
  if (oddCount < targetMin || oddCount > targetMax) {
    result = rebalance(result, frequencyMap, "oddEven", minNumber, maxNumber, targetMin, targetMax, highLowThreshold);
  }

  // 2. Verifica equilíbrio alto/baixo (Skipped for Lotofacil to prioritize others)
  if (!isLotofacil) {
    const lowCount = result.filter((n: number) => n <= highLowThreshold).length;
    const lowMin = Math.floor(numbers.length * 0.33);
    const lowMax = Math.ceil(numbers.length * 0.66);
    if (lowCount < lowMin || lowCount > lowMax) {
        result = rebalance(result, frequencyMap, "highLow", minNumber, maxNumber, lowMin, lowMax, highLowThreshold);
    }
  }

  if (isLotofacil) {
    // 3. Verifica Primos (3 a 7) - OTIMIZADO
    const PRIMES = new Set([2, 3, 5, 7, 11, 13, 17, 19, 23]);
    let primeCount = result.filter(n => PRIMES.has(n)).length;
    if (primeCount < 3 || primeCount > 7) {
        result = rebalance(result, frequencyMap, "prime", minNumber, maxNumber, 3, 7, highLowThreshold);
    }

    // 4. Verifica Moldura/Frame (9 a 11)
    // Frame: 1, 2, 3, 4, 5, 6, 10, 11, 15, 16, 20, 21, 22, 23, 24, 25
    const FRAME = new Set([1, 2, 3, 4, 5, 6, 10, 11, 15, 16, 20, 21, 22, 23, 24, 25]);
    let frameCount = result.filter(n => FRAME.has(n)).length;
    if (frameCount < 9 || frameCount > 11) {
        result = rebalance(result, frequencyMap, "frame", minNumber, maxNumber, 9, 11, highLowThreshold);
    }

    // 5. Verifica Fibonacci (2 a 6) - OTIMIZADO
    // Fib: 1, 2, 3, 5, 8, 13, 21
    const FIB = new Set([1, 2, 3, 5, 8, 13, 21]);
    let fibCount = result.filter(n => FIB.has(n)).length;
    if (fibCount < 2 || fibCount > 6) {
        result = rebalance(result, frequencyMap, "fibonacci", minNumber, maxNumber, 2, 6, highLowThreshold);
    }

    // 6. Verifica Soma (170 a 220) - OTIMIZADO
    let sum = result.reduce((a, b) => a + b, 0);
    let attempts = 0;
    while ((sum < 170 || sum > 220) && attempts < 20) {
        // Simple swap: if too low, swap lowest for higher free number. If too high, swap highest for lower free number.
        if (sum < 180) {
            const minVal = Math.min(...result);
            const idx = result.indexOf(minVal);
            const candidates = Array.from({length: 25}, (_, i) => i + 1).filter(n => !result.includes(n) && n > minVal);
            if (candidates.length) {
                result[idx] = candidates[Math.floor(Math.random() * candidates.length)];
            }
        } else {
            const maxVal = Math.max(...result);
            const idx = result.indexOf(maxVal);
            const candidates = Array.from({length: 25}, (_, i) => i + 1).filter(n => !result.includes(n) && n < maxVal);
            if (candidates.length) {
                result[idx] = candidates[Math.floor(Math.random() * candidates.length)];
            }
        }
        sum = result.reduce((a, b) => a + b, 0);
        attempts++;
    }

    // 7. Verifica Repetição do Anterior (7 a 11) - OTIMIZADO
    if (lastDraw.length > 0) {
        const lastSet = new Set(lastDraw);
        let repeatCount = result.filter(n => lastSet.has(n)).length;
        if (repeatCount < 7 || repeatCount > 11) {
             attempts = 0;
             while ((repeatCount < 7 || repeatCount > 11) && attempts < 20) {
                 if (repeatCount < 7) {
                     // Need MORE repeats -> Swap a non-repeat for a repeat candidate
                     const nonRepeats = result.filter(n => !lastSet.has(n));
                     if (nonRepeats.length > 0) {
                         const toRemove = nonRepeats[Math.floor(Math.random() * nonRepeats.length)];
                         const candidates = lastDraw.filter(n => !result.includes(n));
                         if (candidates.length) {
                             result[result.indexOf(toRemove)] = candidates[Math.floor(Math.random() * candidates.length)];
                         }
                     }
                 } else {
                     // Need FEWER repeats -> Swap a repeat for a non-repeat candidate
                     const repeats = result.filter(n => lastSet.has(n));
                     if (repeats.length > 0) {
                         const toRemove = repeats[Math.floor(Math.random() * repeats.length)];
                         const candidates = Array.from({length: 25}, (_, i) => i + 1).filter(n => !lastSet.has(n) && !result.includes(n));
                         if (candidates.length) {
                             result[result.indexOf(toRemove)] = candidates[Math.floor(Math.random() * candidates.length)];
                         }
                     }
                 }
                 repeatCount = result.filter(n => lastSet.has(n)).length;
                 attempts++;
             }
        }
    }
  }

  // Evita sequências excessivas
  const maxSeq = isLotofacil ? 4 : 2;
  result = removeExcessiveSequentials(result, frequencyMap, minNumber, maxNumber, maxSeq);

  return result;
}

function rebalance(
  numbers: number[],
  frequencyMap: Map<number, NumberFrequency>,
  type: "oddEven" | "highLow" | "prime" | "frame" | "fibonacci",
  minNumber: number,
  maxNumber: number,
  targetMin: number,
  targetMax: number,
  highLowThreshold: number
): number[] {
  const result = [...numbers];
  const PRIMES = new Set([2, 3, 5, 7, 11, 13, 17, 19, 23]);
  const FRAME = new Set([1, 2, 3, 4, 5, 6, 10, 11, 15, 16, 20, 21, 22, 23, 24, 25]);
  const FIB = new Set([1, 2, 3, 5, 8, 13, 21]);

  let isTarget: (n: number) => boolean;
  
  if (type === "oddEven") isTarget = (n: number) => n % 2 === 1;
  else if (type === "highLow") isTarget = (n: number) => n <= highLowThreshold;
  else if (type === "prime") isTarget = (n: number) => PRIMES.has(n);
  else if (type === "frame") isTarget = (n: number) => FRAME.has(n);
  else if (type === "fibonacci") isTarget = (n: number) => FIB.has(n);
  else isTarget = (n: number) => false;

  let targetCount = result.filter(isTarget).length;

  // Tenta equilibrar (com limite de iterações para evitar loop infinito)
  let iterations = 0;
  const maxIterations = 50;
  
  while ((targetCount < targetMin || targetCount > targetMax) && iterations < maxIterations) {
    iterations++;
    
    if (targetCount < targetMin) {
      // Precisa de mais números do tipo alvo
      const toRemove = result.find((n) => !isTarget(n));
      if (toRemove !== undefined) {
        const idx = result.indexOf(toRemove);
        const candidates = Array.from({ length: maxNumber - minNumber + 1 }, (_: unknown, i: number) => i + minNumber)
          .filter((n: number) => isTarget(n) && !result.includes(n));
        if (candidates.length > 0) {
          result[idx] = candidates[Math.floor(Math.random() * candidates.length)];
        } else {
          break; // Não há mais candidatos, sai do loop
        }
      }
    } else if (targetCount > targetMax) {
      // Precisa de menos números do tipo alvo
      const toRemove = result.find(isTarget);
      if (toRemove !== undefined) {
        const idx = result.indexOf(toRemove);
        const candidates = Array.from({ length: maxNumber - minNumber + 1 }, (_: unknown, i: number) => i + minNumber)
          .filter((n: number) => !isTarget(n) && !result.includes(n));
        if (candidates.length > 0) {
          result[idx] = candidates[Math.floor(Math.random() * candidates.length)];
        } else {
          break; // Não há mais candidatos, sai do loop
        }
      }
    }
    targetCount = result.filter(isTarget).length;
  }

  return result;
}

function removeExcessiveSequentials(
  numbers: number[],
  frequencyMap: Map<number, NumberFrequency>,
  minNumber: number,
  maxNumber: number,
  maxSeq: number
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
  if (maxSequence > maxSeq) {
    // Encontra o número do meio da sequência e substitui
    for (let i = 1; i < sorted.length - 1; i++) {
      if (sorted[i] === sorted[i - 1] + 1 && sorted[i] === sorted[i + 1] - 1) {
        const candidates = Array.from({ length: maxNumber - minNumber + 1 }, (_: unknown, j: number) => j + minNumber)
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
  const highLowThreshold = Math.floor(Math.max(...frequency.map(f => f.number)) / 2) || 30;
  const lowCount = numbers.filter((n: number) => n <= highLowThreshold).length;
  const highCount = numbers.length - lowCount;
  const sum = numbers.reduce((a: number, b: number) => a + b, 0);
  
  // Conta consecutivos
  const sorted = [...numbers].sort((a: number, b: number) => a - b);
  let consecutiveCount = 0;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === sorted[i - 1] + 1) {
    }
  }

  // Count Fibonacci
  const FIB = new Set([1, 2, 3, 5, 8, 13, 21]);
  const fibonacciCount = numbers.filter(n => FIB.has(n)).length;

  // Count Frame
  const FRAME = new Set([1, 2, 3, 4, 5, 6, 10, 11, 15, 16, 20, 21, 22, 23, 24, 25]);
  const frameCount = numbers.filter(n => FRAME.has(n)).length;

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
    fibonacciCount,
    frameCount,
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
