import { LotteryContest, FormattedContest } from "./types";

const CAIXA_API_URL =
  "https://servicebus2.caixa.gov.br/portaldeloterias/api/megasena";

// Cache the latest contest for 5 minutes
let cachedContest: FormattedContest | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function formatContest(data: LotteryContest): FormattedContest {
  return {
    contestNumber: data.numero,
    drawDate: data.dataApuracao,
    nextDrawDate: data.dataProximoConcurso,
    // Use estimated value as main jackpot (this is what Caixa shows as "Estimativa de prêmio")
    jackpotValue: data.valorEstimadoProximoConcurso || data.valorAcumuladoProximoConcurso,
    estimatedValue: data.valorEstimadoProximoConcurso,
    drawnNumbers: data.listaDezenas.map((n) => parseInt(n, 10)),
    isAccumulated: data.acumulado,
    winners: data.listaRateioPremio?.map((r) => ({
      tier: r.faixa,
      winners: r.numeroDeGanhadores,
      prize: r.valorPremio,
      description: r.descricaoFaixa,
    })) || [],
  };
}

export async function getLatestContest(): Promise<FormattedContest> {
  // Check cache
  const now = Date.now();
  if (cachedContest && now - cacheTimestamp < CACHE_DURATION) {
    return cachedContest;
  }

  try {
    const response = await fetch(CAIXA_API_URL, {
      next: { revalidate: 300 }, // Revalidate every 5 minutes
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch lottery data: ${response.status}`);
    }

    const data: LotteryContest = await response.json();
    cachedContest = formatContest(data);
    cacheTimestamp = now;

    return cachedContest;
  } catch (error) {
    console.error("Error fetching lottery data:", error);

    // Return cached data if available, even if expired
    if (cachedContest) {
      return cachedContest;
    }

    // Return fallback data for development/demo
    return {
      contestNumber: 2800,
      drawDate: new Date().toISOString().split("T")[0],
      nextDrawDate: getNextDrawDate(),
      jackpotValue: 50000000,
      estimatedValue: 50000000,
      drawnNumbers: [],
      isAccumulated: true,
      winners: [],
    };
  }
}

export async function getContestByNumber(
  contestNumber: number
): Promise<FormattedContest | null> {
  try {
    const response = await fetch(`${CAIXA_API_URL}/${contestNumber}`, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return null;
    }

    const data: LotteryContest = await response.json();
    return formatContest(data);
  } catch (error) {
    console.error(`Error fetching contest ${contestNumber}:`, error);
    return null;
  }
}

export async function getHistoricalContests(
  count: number = 100
): Promise<FormattedContest[]> {
  const latest = await getLatestContest();
  const contests: FormattedContest[] = [latest];

  // Fetch last N contests for statistical analysis
  const startNumber = latest.contestNumber - count;
  const promises: Promise<FormattedContest | null>[] = [];

  for (let i = latest.contestNumber - 1; i > startNumber; i--) {
    promises.push(getContestByNumber(i));
  }

  const results = await Promise.all(promises);
  results.forEach((contest) => {
    if (contest) {
      contests.push(contest);
    }
  });

  return contests;
}

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

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(dateString: string): string {
  if (!dateString) return "Data não disponível";
  
  try {
    // Handle dd/mm/yyyy format from Caixa API
    let date: Date;
    if (dateString.includes("/")) {
      const [day, month, year] = dateString.split("/");
      date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    } else {
      date = new Date(dateString + "T00:00:00");
    }
    
    if (isNaN(date.getTime())) {
      return "Data não disponível";
    }
    
    return new Intl.DateTimeFormat("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(date);
  } catch {
    return "Data não disponível";
  }
}

export function getTimeUntilDraw(nextDrawDate: string): {
  days: number;
  hours: number;
  minutes: number;
} {
  if (!nextDrawDate) {
    return { days: 0, hours: 0, minutes: 0 };
  }

  try {
    const now = new Date();
    let draw: Date;
    
    // Handle dd/mm/yyyy format from Caixa API
    if (nextDrawDate.includes("/")) {
      const [day, month, year] = nextDrawDate.split("/");
      draw = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 20, 0, 0);
    } else {
      draw = new Date(nextDrawDate + "T20:00:00-03:00");
    }

    if (isNaN(draw.getTime())) {
      return { days: 0, hours: 0, minutes: 0 };
    }

    const diff = draw.getTime() - now.getTime();

    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0 };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return { days, hours, minutes };
  } catch {
    return { days: 0, hours: 0, minutes: 0 };
  }
}
