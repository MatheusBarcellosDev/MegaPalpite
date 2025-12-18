"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Calendar, Timer } from "lucide-react";
import {
  formatCurrency,
  formatDate,
  getTimeUntilDraw,
} from "@/lib/lottery/api";
import { FormattedContest } from "@/lib/lottery/types";

interface JackpotCardProps {
  contest: FormattedContest | null;
  loading?: boolean;
  compact?: boolean;
}

export function JackpotCard({
  contest,
  loading = false,
  compact = false,
}: JackpotCardProps) {
  const [timeUntil, setTimeUntil] = useState<{
    days: number;
    hours: number;
    minutes: number;
  } | null>(null);

  useEffect(() => {
    if (!contest?.nextDrawDate) return;

    const updateTime = () => {
      setTimeUntil(getTimeUntilDraw(contest.nextDrawDate));
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [contest?.nextDrawDate]);

  if (loading) {
    return (
      <Card className={`jackpot-card p-6 ${compact ? "" : "p-8"}`}>
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-16 w-64" />
          <div className="flex gap-4">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>
      </Card>
    );
  }

  if (!contest) {
    return (
      <Card className="jackpot-card p-6">
        <p className="text-muted-foreground">
          Não foi possível carregar os dados do concurso.
        </p>
      </Card>
    );
  }

  return (
    <Card
      className={`jackpot-card animate-pulse-glow ${
        compact ? "p-4 md:p-6" : "p-6 md:p-10"
      }`}
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">
              Concurso {contest.contestNumber + 1}
            </span>
          </div>
          {contest.isAccumulated && (
            <Badge variant="secondary" className="bg-primary/20 text-primary">
              Acumulado!
            </Badge>
          )}
        </div>

        {/* Jackpot Value */}
        <div>
          <p className="text-sm text-muted-foreground mb-1">Prêmio Estimado</p>
          <h2
            className={`jackpot-value ${
              compact ? "text-2xl md:text-4xl" : "text-3xl md:text-5xl lg:text-6xl"
            }`}
          >
            {formatCurrency(contest.jackpotValue)}
          </h2>
        </div>

        {/* Draw Info */}
        <div
          className={`flex flex-wrap gap-4 ${compact ? "gap-3" : "gap-6"} pt-2`}
        >
          {/* Next Draw Date */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <div>
              <p className="text-xs">Próximo Sorteio</p>
              <p className="text-sm font-medium text-foreground capitalize">
                {formatDate(contest.nextDrawDate)}
              </p>
            </div>
          </div>

          {/* Countdown */}
          {timeUntil && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Timer className="h-4 w-4" />
              <div>
                <p className="text-xs">Faltam</p>
                <p className="text-sm font-medium text-foreground">
                  {timeUntil.days > 0 && `${timeUntil.days}d `}
                  {timeUntil.hours}h {timeUntil.minutes}min
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
