import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FrequencyChart, TopNumbersLists } from "@/components/frequency-chart";
import { getNumberFrequency, getHotColdNumbers } from "@/actions/statistics";
import { BarChart3, TrendingUp, TrendingDown, Percent } from "lucide-react";

export default async function StatisticsPage() {
  const [frequency, hotCold] = await Promise.all([
    getNumberFrequency(100),
    getHotColdNumbers(),
  ]);

  // Calculate some additional stats
  const avgFrequency = frequency.reduce((sum, f) => sum + f.frequency, 0) / 60;
  const maxFreq = frequency[0];
  const minFreq = frequency[frequency.length - 1];

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Estatísticas</h1>
        <p className="text-muted-foreground">
          Análise dos últimos 100 sorteios da Mega-Sena
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Concursos Analisados</p>
                <p className="text-xl font-bold">100</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Nº Mais Frequente</p>
                <p className="text-xl font-bold">
                  {maxFreq.number.toString().padStart(2, "0")}
                  <span className="text-sm text-muted-foreground ml-1">
                    ({maxFreq.frequency}x)
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Nº Menos Frequente</p>
                <p className="text-xl font-bold">
                  {minFreq.number.toString().padStart(2, "0")}
                  <span className="text-sm text-muted-foreground ml-1">
                    ({minFreq.frequency}x)
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Percent className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Média por Número</p>
                <p className="text-xl font-bold">{avgFrequency.toFixed(1)}x</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Frequency Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Frequência de Cada Número (1-60)</CardTitle>
        </CardHeader>
        <CardContent>
          <FrequencyChart data={frequency} title="" />
        </CardContent>
      </Card>

      {/* Top Numbers Lists */}
      <TopNumbersLists
        hotNumbers={hotCold.hotNumbersDetailed}
        coldNumbers={hotCold.coldNumbersDetailed}
      />

      {/* Info */}
      <Card className="bg-card/50">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            <strong>Nota:</strong> Estas estatísticas são baseadas nos últimos 100 sorteios 
            e servem apenas para fins informativos. Cada sorteio é um evento independente 
            e os resultados passados não influenciam os futuros.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
