import { FormattedContest } from "./types";

// Utility functions that can be used in client components

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

// Default contest for fallback
export function getDefaultContest(): FormattedContest {
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

// NOTE: For server components, import getLatestContestFromDB from "@/actions/contests"
