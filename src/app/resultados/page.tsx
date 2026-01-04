import { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, TrendingUp } from "lucide-react";
import { ACTIVE_LOTTERIES } from "@/lib/lottery/types-config";
import { getContestDetails } from "@/actions/results";

export const metadata: Metadata = {
  title: "Resultados Mega-Sena, Lotofácil e Quina | MegaPalpite",
  description: "Confira os últimos resultados e números sorteados da Mega-Sena, Lotofácil e Quina.",
  keywords: [
    "resultados loteria",
    "resultado mega sena",
    "resultado lotofácil",
    "resultado quina",
    "números sorteados",
  ],
};

export default async function ResultadosIndexPage() {
  // Fetch latest results for all lotteries
  const results = await Promise.all(
    ACTIVE_LOTTERIES.map(async (lottery) => {
      const result = await getContestDetails(lottery);
      return { lottery, result };
    })
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-emerald-950/20 to-black">
      {/* Hero */}
      <div className="py-16 border-b border-emerald-500/20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Resultados das Loterias
            </h1>
            <p className="text-xl text-muted-foreground">
              Confira os últimos números sorteados da Mega-Sena, Lotofácil e Quina
            </p>
          </div>
        </div>
      </div>

      {/* Results Grid */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {results.map(({ lottery, result }) => {
            if (!result) {
              return (
                <Card key={lottery} className="p-6">
                  <div className="text-center text-muted-foreground">
                    Nenhum resultado disponível
                  </div>
                </Card>
              );
            }

            return (
              <Card
                key={lottery}
                className="p-6 bg-black/40 border-emerald-500/20 hover:border-emerald-500/40 transition-all"
              >
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600">
                        <span className="text-2xl">{result.lotteryIcon}</span>
                      </div>
                      <div>
                        <h2 className="font-bold text-lg text-white">{result.lotteryName}</h2>
                        <p className="text-sm text-gray-400">
                          Concurso {result.contestNumber}
                        </p>
                        <p className="text-xs text-gray-500">
                          {result.formattedDrawDate}
                        </p>
                      </div>
                    </div>
                    {result.isAccumulated && (
                      <Badge className="bg-amber-500 text-black">
                        Acumulou!
                      </Badge>
                    )}
                  </div>

                  {/* Numbers */}
                  <div>
                    <p className="text-sm text-gray-400 mb-3">Números Sorteados:</p>
                    <div className="flex flex-wrap gap-2">
                      {result.drawnNumbers.map((num, idx) => (
                        <div
                          key={idx}
                          className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-sm font-bold text-white"
                        >
                          {num.toString().padStart(2, "0")}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Prize */}
                  <div className="pt-4 border-t border-emerald-500/20">
                    <div className="text-sm text-gray-400 mb-1">
                      {result.isAccumulated ? "Acumulado" : "Prêmio Principal"}
                    </div>
                    <div className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">
                      {result.jackpotValue}
                    </div>
                  </div>

                  {/* Winners Table */}
                  {result.winners.length > 0 && (
                    <div className="pt-4 border-t border-emerald-500/20">
                      <p className="text-sm text-gray-400 mb-3">Ganhadores:</p>
                      <div className="space-y-2">
                        {result.winners.slice(0, 3).map((winner, idx) => (
                          <div key={idx} className="flex justify-between items-center text-sm">
                            <span className="text-gray-300">{winner.tier}</span>
                            <div className="text-right">
                              <div className="text-white font-semibold">
                                {winner.numberOfWinners} {winner.numberOfWinners === 1 ? 'ganhador' : 'ganhadores'}
                              </div>
                              <div className="text-xs text-emerald-400">{winner.prizePerWinner}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Next Draw */}
                  {result.nextContest.estimatedPrize !== "R$ 0" && (
                    <div className="pt-4 border-t border-emerald-500/20">
                      <p className="text-sm text-gray-400 mb-2">Próximo Sorteio:</p>
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-white font-semibold">Concurso {result.nextContest.number}</div>
                          {result.nextContest.date && (
                            <div className="text-xs text-gray-400 capitalize">
                              {new Intl.DateTimeFormat("pt-BR", {
                                weekday: "long",
                                day: "numeric",
                                month: "long",
                                timeZone: "UTC",
                              }).format(new Date(result.nextContest.date))}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-400">Estimado</div>
                          <div className="font-semibold text-emerald-400">
                            {result.nextContest.estimatedPrize}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </Card>
            );
          })}
        </div>

        {/* CTA Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <Card className="p-8 text-center bg-gradient-to-br from-emerald-900/20 to-emerald-950/20 border-emerald-500/20">
            <h3 className="text-2xl font-bold mb-4">
              Gere Seus Números com Inteligência Artificial
            </h3>
            <p className="text-muted-foreground mb-6">
              Use nossa tecnologia para criar combinações inteligentes baseadas em análise 
              estatística de milhares de concursos. É gratuito e ilimitado!
            </p>
            <Link href="/dashboard/generate">
              <Button size="lg" className="text-lg px-8">
                Começar Agora
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
