import { Card } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { formatDate } from "@/lib/lottery/api";

interface NextDrawInfoProps {
  nextContestNumber: number;
  nextDrawDate: string | null;
  estimatedPrize: string;
}

export function NextDrawInfo({
  nextContestNumber,
  nextDrawDate,
  estimatedPrize,
}: NextDrawInfoProps) {
  return (
    <Card className="p-6 bg-gradient-to-br from-emerald-900/20 to-emerald-950/20 border-emerald-500/20">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="h-5 w-5 text-emerald-500" />
          Próximo Sorteio
        </h3>

        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-muted-foreground">Concurso:</span>
            <span className="text-xl font-bold">{nextContestNumber}</span>
          </div>

          {nextDrawDate && (
            <div className="flex items-baseline gap-2">
              <span className="text-muted-foreground">Data:</span>
              <span className="font-medium capitalize">
                {formatDate(nextDrawDate)}
              </span>
            </div>
          )}

          {estimatedPrize !== "R$ 0" && (
            <div className="pt-2 border-t border-emerald-500/20">
              <div className="text-sm text-muted-foreground">Prêmio Estimado</div>
              <div className="text-2xl font-bold text-emerald-500">
                {estimatedPrize}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
