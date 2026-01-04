import { Card } from "@/components/ui/card";
import { Trophy, TrendingUp } from "lucide-react";

interface WinnersTableProps {
  winners: Array<{
    tier: string;
    numberOfWinners: number;
    prizePerWinner: string;
  }>;
  isAccumulated: boolean;
}

export function WinnersTable({ winners, isAccumulated }: WinnersTableProps) {
  const hasWinners = winners.some(w => w.numberOfWinners > 0);

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="h-5 w-5 text-amber-500" />
        <h2 className="text-xl font-bold">Premiação</h2>
      </div>

      {isAccumulated && (
        <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-amber-500" />
          <span className="font-semibold text-amber-500">Acumulou!</span>
        </div>
      )}

      {!hasWinners ? (
        <p className="text-muted-foreground text-center py-4">
          Informações de ganhadores não disponíveis
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2 font-semibold">Faixa</th>
                <th className="text-right py-3 px-2 font-semibold">Ganhadores</th>
                <th className="text-right py-3 px-2 font-semibold">Prêmio</th>
              </tr>
            </thead>
            <tbody>
              {winners.map((winner, index) => (
                <tr key={index} className="border-b last:border-0 hover:bg-secondary/50">
                  <td className="py-3 px-2 font-medium">{winner.tier}</td>
                  <td className="text-right py-3 px-2">
                    {winner.numberOfWinners === 0 ? (
                      <span className="text-muted-foreground">-</span>
                    ) : (
                      <span className="font-medium">{winner.numberOfWinners}</span>
                    )}
                  </td>
                  <td className="text-right py-3 px-2 font-mono">
                    <span className="text-emerald-500 font-semibold">
                      {winner.prizePerWinner}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
