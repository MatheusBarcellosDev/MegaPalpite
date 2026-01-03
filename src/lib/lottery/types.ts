// Lottery-related types

export interface LotteryContest {
  numero: number;
  dataApuracao: string;
  dataProximoConcurso: string;
  valorAcumuladoProximoConcurso: number;
  valorEstimadoProximoConcurso: number;
  listaDezenas: string[];
  listaRateioPremio: RateioPremio[];
  acumulado: boolean;
  localSorteio?: string;
  nomeMunicipioUFSorteio?: string;
}

export interface RateioPremio {
  faixa: number;
  numeroDeGanhadores: number;
  valorPremio: number;
  descricaoFaixa: string;
}

export interface FormattedContest {
  contestNumber: number;
  drawDate: string;
  nextDrawDate: string;
  jackpotValue: number;
  estimatedValue: number;
  drawnNumbers: number[];
  isAccumulated: boolean;
  winners: {
    tier: number;
    winners: number;
    prize: number;
    description: string;
  }[];
}

export interface GeneratedGame {
  numbers: number[];
  explanation: string;
  contestNumber: number;
}

export interface GameWithResult {
  id: string;
  lotteryType?: string;
  numbers: number[];
  explanation: string | null;
  contestNumber: number;
  createdAt: string;
  hits?: number;
  checkedAt?: string;
  drawnNumbers?: number[];
}

export interface NumberFrequency {
  number: number;
  frequency: number;
  percentage: number;
}

export interface GenerationStats {
  oddCount: number;
  evenCount: number;
  lowCount: number; // 1-30
  highCount: number; // 31-60
  sum: number;
  consecutiveCount: number;
  avgFrequency: number;
}
