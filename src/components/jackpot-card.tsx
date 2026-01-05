"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Calendar, Timer, Sparkles } from "lucide-react";
import {
  formatCurrency,
  formatDate,
  getTimeUntilDraw,
} from "@/lib/lottery/api";
import { FormattedContest } from "@/lib/lottery/types";
import { getLotteryConfig } from "@/lib/lottery/types-config";

interface JackpotCardProps {
  contest: (FormattedContest & { lotteryType?: string }) | null;
  loading?: boolean;
  compact?: boolean;
  showDrawDate?: boolean;
}

export function JackpotCard({
  contest,
  loading = false,
  compact = false,
  showDrawDate = false,
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
    const interval = setInterval(updateTime, 60000);

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

  const lotteryType = contest.lotteryType || "megasena";
  const lotteryConfig = getLotteryConfig(lotteryType as any);

  return (
    <Card
      className={`jackpot-card animated-border ${
        compact ? "p-4 md:p-6" : "p-6 md:p-10"
      }`}
      style={{
        borderTop: `4px solid ${lotteryConfig.primaryColor}`,
      }}
    >
      <div className="space-y-6">
        {/* Lottery Name Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{lotteryConfig.icon}</span>
            <div>
              <h3 className="text-2xl font-bold" style={{ color: lotteryConfig.primaryColor }}>
                {lotteryConfig.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                Concurso {contest.contestNumber + 1}{showDrawDate ? ` • ${formatDate(contest.drawDate)}` : ''}
              </p>
            </div>
          </div>
          {contest.isAccumulated && (
            <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/50">
              🔥 Acumulado!
            </Badge>
          )}
        </div>

        {/* Jackpot Value */}
        <div>
          <p className="text-sm text-muted-foreground mb-1">Prêmio Estimado</p>
          <h2
            className={`font-bold font-mono ${
              compact ? "text-2xl md:text-4xl" : "text-3xl md:text-5xl lg:text-6xl"
            }`}
            style={{ color: lotteryConfig.primaryColor }}
          >
            {formatCurrency(contest.estimatedValue)}
          </h2>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Próximo Sorteio</p>
              <p className="font-medium">{formatDate(contest.nextDrawDate)}</p>
            </div>
          </div>

          {timeUntil && (
            <div className="flex items-center gap-2 text-sm">
              <Timer className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Tempo Restante</p>
                <p className="font-medium font-mono">
                  {timeUntil.days}d {timeUntil.hours}h {timeUntil.minutes}m
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Generate Button */}
        <Link href={`/dashboard/generate?lottery=${lotteryType}`}>
          <Button
            size="lg"
            className="w-full"
            style={{ backgroundColor: lotteryConfig.primaryColor }}
          >
            <Sparkles className="h-5 w-5 mr-2" />
            Gerar Números com IA
          </Button>
        </Link>
     </div>
    </Card>
  );
}
