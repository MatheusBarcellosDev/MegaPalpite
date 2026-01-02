// Configuration for all supported lottery types

export type LotteryType = 
  | "megasena" 
  | "quina" 
  | "lotofacil" 
  | "lotomania" 
  | "timemania" 
  | "duplasena" 
  | "diadesorte" 
  | "supersete" 
  | "maismilionaria";

export interface LotteryConfig {
  type: LotteryType;
  name: string;
  shortName: string;
  description: string;
  // Number generation rules
  numbersCount: number;      // How many numbers to pick
  minNumber: number;         // Minimum number in range
  maxNumber: number;         // Maximum number in range
  minBet: number;            // Minimum numbers on a bet
  maxBet: number;            // Maximum numbers on a bet
  // Prize tiers (how many hits to win)
  minHitsToWin: number;
  maxHits: number;
  // Extra fields for special games
  hasExtraField?: boolean;
  extraFieldName?: string;
  extraFieldOptions?: string[] | number[];
  // UI
  primaryColor: string;
  icon: string;
  // API path
  apiPath: string;
}

export const LOTTERY_CONFIGS: Record<LotteryType, LotteryConfig> = {
  megasena: {
    type: "megasena",
    name: "Mega-Sena",
    shortName: "Mega",
    description: "6 números de 1 a 60",
    numbersCount: 6,
    minNumber: 1,
    maxNumber: 60,
    minBet: 6,
    maxBet: 20,
    minHitsToWin: 4,
    maxHits: 6,
    primaryColor: "#22c55e", // green-500
    icon: "🍀",
    apiPath: "megasena",
  },
  quina: {
    type: "quina",
    name: "Quina",
    shortName: "Quina",
    description: "5 números de 1 a 80",
    numbersCount: 5,
    minNumber: 1,
    maxNumber: 80,
    minBet: 5,
    maxBet: 15,
    minHitsToWin: 2,
    maxHits: 5,
    primaryColor: "#8b5cf6", // violet-500
    icon: "🎲",
    apiPath: "quina",
  },
  lotofacil: {
    type: "lotofacil",
    name: "Lotofácil",
    shortName: "Lotofácil",
    description: "15 números de 1 a 25",
    numbersCount: 15,
    minNumber: 1,
    maxNumber: 25,
    minBet: 15,
    maxBet: 20,
    minHitsToWin: 11,
    maxHits: 15,
    primaryColor: "#ec4899", // pink-500
    icon: "🎯",
    apiPath: "lotofacil",
  },
  lotomania: {
    type: "lotomania",
    name: "Lotomania",
    shortName: "Lotomania",
    description: "50 números de 0 a 99",
    numbersCount: 20,
    minNumber: 0,
    maxNumber: 99,
    minBet: 50,
    maxBet: 50,
    minHitsToWin: 15,
    maxHits: 20,
    primaryColor: "#f97316", // orange-500
    icon: "🎪",
    apiPath: "lotomania",
  },
  timemania: {
    type: "timemania",
    name: "Timemania",
    shortName: "Timemania",
    description: "7 números de 1 a 80 + time",
    numbersCount: 7,
    minNumber: 1,
    maxNumber: 80,
    minBet: 10,
    maxBet: 10,
    minHitsToWin: 3,
    maxHits: 7,
    hasExtraField: true,
    extraFieldName: "Time do Coração",
    primaryColor: "#06b6d4", // cyan-500
    icon: "⚽",
    apiPath: "timemania",
  },
  duplasena: {
    type: "duplasena",
    name: "Dupla Sena",
    shortName: "Dupla",
    description: "6 números de 1 a 50 (2 sorteios)",
    numbersCount: 6,
    minNumber: 1,
    maxNumber: 50,
    minBet: 6,
    maxBet: 15,
    minHitsToWin: 3,
    maxHits: 6,
    primaryColor: "#eab308", // yellow-500
    icon: "✌️",
    apiPath: "duplasena",
  },
  diadesorte: {
    type: "diadesorte",
    name: "Dia de Sorte",
    shortName: "Dia",
    description: "7 números de 1 a 31 + mês",
    numbersCount: 7,
    minNumber: 1,
    maxNumber: 31,
    minBet: 7,
    maxBet: 15,
    minHitsToWin: 4,
    maxHits: 7,
    hasExtraField: true,
    extraFieldName: "Mês da Sorte",
    extraFieldOptions: [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ],
    primaryColor: "#14b8a6", // teal-500
    icon: "📅",
    apiPath: "diadesorte",
  },
  supersete: {
    type: "supersete",
    name: "Super Sete",
    shortName: "Super7",
    description: "7 colunas de 0 a 9",
    numbersCount: 7,
    minNumber: 0,
    maxNumber: 9,
    minBet: 7,
    maxBet: 21,
    minHitsToWin: 3,
    maxHits: 7,
    primaryColor: "#ef4444", // red-500
    icon: "7️⃣",
    apiPath: "supersete",
  },
  maismilionaria: {
    type: "maismilionaria",
    name: "+Milionária",
    shortName: "+Milion",
    description: "6 números + 2 trevos",
    numbersCount: 6,
    minNumber: 1,
    maxNumber: 50,
    minBet: 6,
    maxBet: 12,
    minHitsToWin: 2,
    maxHits: 6,
    hasExtraField: true,
    extraFieldName: "Trevos",
    primaryColor: "#a855f7", // purple-500
    icon: "🍀",
    apiPath: "maismilionaria",
  },
};

// Get list of active/implemented lotteries
export const ACTIVE_LOTTERIES: LotteryType[] = ["megasena", "lotofacil", "quina"];

// Helper functions
export function getLotteryConfig(type: LotteryType): LotteryConfig {
  return LOTTERY_CONFIGS[type];
}

export function getActiveLotteries(): LotteryConfig[] {
  return ACTIVE_LOTTERIES.map(type => LOTTERY_CONFIGS[type]);
}

export function isValidLotteryType(type: string): type is LotteryType {
  return type in LOTTERY_CONFIGS;
}
