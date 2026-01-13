import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NumberBall } from "@/components/number-balls";
import { Calendar, ChevronRight, Trophy } from "lucide-react";
import { GameWithResult } from "@/lib/lottery/types";
import { getLotteryConfig, LotteryType } from "@/lib/lottery/types-config";

interface GameCardProps {
  game: GameWithResult;
  showResult?: boolean;
}

export function GameCard({ game, showResult = false }: GameCardProps) {
  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    }).format(new Date(dateString));
  };

  const getStatusBadge = () => {
    if (game.hits !== undefined) {
      const lotteryType = (game.lotteryType as LotteryType) || "megasena";
      const config = getLotteryConfig(lotteryType);
      
      // Jackpot match (max hits)
      if (game.hits === config.maxHits) {
        return (
          <Badge className="bg-amber-500 text-black hover:bg-amber-600">
            <Trophy className="h-3 w-3 mr-1" /> {config.name}!
          </Badge>
        );
      }
      
      // Winning tier (min hits to win)
      if (game.hits >= config.minHitsToWin) {
        return (
          <Badge className="bg-emerald-500 text-white hover:bg-emerald-600 border-emerald-600">
            <Trophy className="h-3 w-3 mr-1" /> {game.hits} acertos
          </Badge>
        );
      }
      
      // Non-winning
      return (
        <Badge variant="secondary">
          {game.hits} {game.hits === 1 ? "acerto" : "acertos"}
        </Badge>
      );
    }
    return <Badge variant="outline">Pendente</Badge>;
  };

  return (
    <Link href={`/dashboard/games/${game.id}`}>
      <Card className="p-4 hover:bg-secondary/50 transition-colors cursor-pointer group">
        <div className="flex items-center justify-between gap-4">
          {/* Numbers */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-2 mb-2">
              {game.numbers.map((number) => (
                <NumberBall
                  key={number}
                  number={number}
                  size="sm"
                  isMatched={game.drawnNumbers?.includes(number)}
                />
              ))}
            </div>

            {/* Info */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
              {/* Lottery Type */}
              {game.lotteryType && (() => {
                const lotteryConfig = {
                  megasena: { name: "Mega-Sena", icon: "🍀", color: "#22c55e" },
                  lotofacil: { name: "Lotofácil", icon: "🎯", color: "#ec4899" },
                  quina: { name: "Quina", icon: "🎲", color: "#8b5cf6" },
                }[game.lotteryType] || { name: "Mega-Sena", icon: "🍀", color: "#22c55e" };
                
                return (
                  <Badge 
                    variant="outline" 
                    className="gap-1"
                    style={{ borderColor: lotteryConfig.color, color: lotteryConfig.color }}
                  >
                    <span>{lotteryConfig.icon}</span>
                    {lotteryConfig.name}
                  </Badge>
                );
              })()}
              
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(game.createdAt)}
              </div>
              <span>Concurso {game.contestNumber}</span>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-2">
            {showResult && getStatusBadge()}
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </div>
        </div>
      </Card>
    </Link>
  );
}

interface GameListProps {
  games: GameWithResult[];
  showResults?: boolean;
  emptyMessage?: string;
}

export function GameList({
  games,
  showResults = false,
  emptyMessage = "Nenhum jogo encontrado",
}: GameListProps) {
  if (games.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {games.map((game) => (
        <GameCard key={game.id} game={game} showResult={showResults} />
      ))}
    </div>
  );
}
