"use client";

import { NumberBalls } from "./number-balls";
import { Flame, Snowflake, TrendingUp, TrendingDown } from "lucide-react";

interface HotColdNumbersProps {
  hotNumbers: number[];
  coldNumbers: number[];
  loading?: boolean;
}

export function HotColdNumbers({ hotNumbers, coldNumbers, loading = false }: HotColdNumbersProps) {
  if (loading) {
    return (
      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-4 rounded-lg bg-orange-500/5 border border-orange-500/20 animate-pulse">
          <div className="h-20"></div>
        </div>
        <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20 animate-pulse">
          <div className="h-20"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {/* Hot Numbers */}
      <div className="p-4 rounded-lg bg-gradient-to-br from-orange-500/10 to-red-500/5 border border-orange-500/20">
        <div className="flex items-center gap-2 mb-3">
          <Flame className="h-5 w-5 text-orange-500" />
          <span className="font-semibold text-orange-400">Números Quentes</span>
          <TrendingUp className="h-4 w-4 text-orange-400 ml-auto" />
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Mais frequentes nos últimos 50 sorteios
        </p>
        <div className="flex flex-wrap gap-2">
          {hotNumbers.slice(0, 6).map((num) => (
            <div
              key={num}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold text-sm shadow-lg"
            >
              {num.toString().padStart(2, "0")}
            </div>
          ))}
        </div>
      </div>

      {/* Cold Numbers */}
      <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border border-blue-500/20">
        <div className="flex items-center gap-2 mb-3">
          <Snowflake className="h-5 w-5 text-blue-400" />
          <span className="font-semibold text-blue-400">Números Frios</span>
          <TrendingDown className="h-4 w-4 text-blue-400 ml-auto" />
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Não saem há mais de 20 sorteios
        </p>
        <div className="flex flex-wrap gap-2">
          {coldNumbers.slice(0, 6).map((num) => (
            <div
              key={num}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm shadow-lg"
            >
              {num.toString().padStart(2, "0")}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
