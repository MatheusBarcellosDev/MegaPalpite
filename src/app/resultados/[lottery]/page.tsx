import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles, Eye } from "lucide-react";
import { ACTIVE_LOTTERIES } from "@/lib/lottery/types-config";
import { getContestDetails, getContestHistory } from "@/actions/results";
import { NumberBalls } from "@/components/number-balls";
import { WinnersTable } from "@/components/results/winners-table";
import { NextDrawInfo } from "@/components/results/next-draw-info";

interface PageProps {
  params: {
    lottery: string;
  };
}

export async function generateStaticParams() {
  return ACTIVE_LOTTERIES.map((lottery) => ({
    lottery,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const result = await getContestDetails(params.lottery);

  if (!result) {
    return {
      title: `Resultados | MegaPalpite`,
      description: `Confira os resultados da loteria`,
    };
  }

  const numbersText = result.drawnNumbers.map(n => n.toString().padStart(2, "0")).join(", ");

  return {
    title: `Resultado ${result.lotteryName} Concurso ${result.contestNumber} | MegaPalpite`,
    description: `Números sorteados do concurso ${result.contestNumber} da ${result.lotteryName}: ${numbersText}. Confira ganhadores e prêmios.`,
    keywords: [
      `resultado ${result.lotteryName.toLowerCase()}`,
      `concurso ${result.contestNumber}`,
      `números sorteados`,
    ],
  };
}

export default async function ResultsPage({ params }: PageProps) {
  const result = await getContestDetails(params.lottery);
  const history = await getContestHistory(params.lottery, 15);

  if (!result) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="border-b bg-gradient-to-br from-emerald-950/50 to-black">
        <div className="container mx-auto px-4 py-6">
          <Link href="/resultados" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4" />
            Voltar para todos os resultados
          </Link>

          <div className="flex items-center gap-4 mt-4">
            <div className="p-3 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600">
              <span className="text-4xl">{result.lotteryIcon}</span>
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">{result.lotteryName}</h1>
              <p className="text-muted-foreground">
                Concurso {result.contestNumber} • {result.formattedDrawDate}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Drawn Numbers */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6 text-center">Números Sorteados</h2>
              <NumberBalls numbers={result.drawnNumbers} animate={true} />
              
              {/* Prize Info */}
              <div className="mt-6 pt-6 border-t text-center">
                <div className="text-sm text-muted-foreground mb-2">
                  {result.isAccumulated ? "Acumulado em" : "Valor do Concurso"}
                </div>
                <div className="text-3xl font-bold text-emerald-500">
                  {result.jackpotValue}
                </div>
              </div>
            </Card>

            {/* Winners Table */}
            <WinnersTable 
              winners={result.winners} 
              isAccumulated={result.isAccumulated}
            />

            {/* History */}
            {history.length > 0 && (
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">Últimos Resultados</h2>
                <div className="space-y-3">
                  {history.map((item) => (
                    <div key={item.contestNumber} className="p-4 rounded-lg border hover:bg-secondary/50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="font-semibold">Concurso {item.contestNumber}</div>
                          <div className="text-sm text-muted-foreground">{item.drawDate}</div>
                        </div>
                        <div className="text-sm text-emerald-500 font-semibold">
                          {item.jackpotValue}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {item.drawnNumbers.map((num, idx) => (
                          <div
                            key={idx}
                            className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-sm font-bold"
                          >
                            {num.toString().padStart(2, "0")}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Next Draw */}
            <NextDrawInfo
              nextContestNumber={result.nextContest.number}
              nextDrawDate={result.nextContest.date}
              estimatedPrize={result.nextContest.estimatedPrize}
            />

            {/* CTAs */}
            <Card className="p-6 space-y-3">
              <Link href={`/dashboard/generate?lottery=${params.lottery}`}>
                <Button className="w-full h-12 text-lg" size="lg">
                  <Sparkles className="h-5 w-5 mr-2" />
                  Gerar Números com IA
                </Button>
              </Link>

              <Link href="/dashboard/games">
                <Button variant="outline" className="w-full" size="lg">
                  <Eye className="h-4 w-4 mr-2" />
                  Conferir Meus Jogos
                </Button>
              </Link>
            </Card>

            {/* Info Card */}
            <Card className="p-6 bg-gradient-to-br from-blue-900/20 to-blue-950/20 border-blue-500/20">
              <h3 className="font-semibold mb-2">Como funciona?</h3>
              <p className="text-sm text-muted-foreground">
                Use nossa IA para gerar combinações inteligentes baseadas em análise estatística 
                de milhares de concursos anteriores. 100% gratuito e ilimitado!
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
