import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GameList } from "@/components/game-card";
import { getLatestContestFromDB } from "@/actions/contests";
import { getRecentGames } from "@/actions/games";
import { Dices, History, TrendingUp, ChevronRight, Trophy, Clock, Calendar } from "lucide-react";
import { ACTIVE_LOTTERIES, getLotteryConfig } from "@/lib/lottery/types-config";

export const dynamic = "force-dynamic";
export const revalidate = 300; // Revalidate every 5 minutes

export default async function DashboardPage() {
  // Fetch all active lotteries in parallel
  const lotteryDataPromises = ACTIVE_LOTTERIES.map(async (lotteryType) => {
    const contest = await getLatestContestFromDB(lotteryType);
    const config = getLotteryConfig(lotteryType);
    return { lotteryType, contest, config };
  });

  const [lotteries, recentGames] = await Promise.all([
    Promise.all(lotteryDataPromises),
    getRecentGames(3),
  ]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Escolha sua loteria e gere seus números com inteligência artificial
        </p>
      </div>

      {/* Lottery Cards Grid */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Loterias Disponíveis</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lotteries.map(({ lotteryType, contest, config }) => (
            <Card
              key={lotteryType}
              className="relative overflow-hidden hover:shadow-lg transition-shadow"
              style={{
                borderTop: `4px solid ${config.primaryColor}`,
              }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">{config.icon}</span>
                    <span>{config.name}</span>
                  </CardTitle>
                  {contest.isAccumulated && (
                    <span className="px-2 py-1 text-xs font-semibold bg-amber-500/20 text-amber-500 rounded">
                      Acumulado!
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {config.description}
                </p>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Prize Value */}
                <div>
                  <p className="text-sm text-muted-foreground">Prêmio Estimado</p>
                  <p
                    className="text-3xl font-bold"
                    style={{ color: config.primaryColor }}
                  >
                    {formatCurrency(contest.estimatedValue)}
                  </p>
                </div>

                {/* Contest Info */}
                {(() => {
                  const nextContestNumber = contest.contestNumber + 1;
                  const nextDrawDate = new Date(contest.nextDrawDate);
                  // Sorteio é às 20:00 BRT (23:00 UTC)
                  nextDrawDate.setUTCHours(23, 0, 0, 0);
                  const now = new Date();
                  // Concurso fecha 3 horas antes do sorteio (17:00 BRT)
                  const closingTime = new Date(nextDrawDate.getTime() - (3 * 60 * 60 * 1000));
                  const isContestClosed = now > closingTime;
                  
                  return (
                    <>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Concurso {nextContestNumber} • {new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(nextDrawDate)}
                        </span>
                      </div>
                      
                      {isContestClosed ? (
                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-center">
                          <div className="flex items-center justify-center gap-2 text-amber-500">
                            <Clock className="h-4 w-4" />
                            <span className="text-sm font-medium">Concurso encerrado</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Aguardando resultado e próximo concurso</p>
                        </div>
                      ) : (
                        <Link href={`/dashboard/generate?lottery=${lotteryType}`}>
                          <Button
                            className="w-full"
                            style={{
                              backgroundColor: config.primaryColor,
                            }}
                          >
                            <Dices className="h-4 w-4 mr-2" />
                            Gerar Números
                          </Button>
                        </Link>
                      )}
                    </>
                  );
                })()}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Quick Actions */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* View Games */}
        <Link href="/dashboard/games" className="block">
          <Card className="h-full hover:bg-secondary/50 transition-colors cursor-pointer group">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                <History className="h-6 w-6 text-blue-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">Meus Jogos</h3>
                <p className="text-sm text-muted-foreground">
                  {recentGames.length} jogos salvos
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </CardContent>
          </Card>
        </Link>

        {/* View Results */}
        <Link href="/dashboard/results" className="block">
          <Card className="h-full hover:bg-secondary/50 transition-colors cursor-pointer group">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                <Trophy className="h-6 w-6 text-amber-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">Resultados</h3>
                <p className="text-sm text-muted-foreground">Verificar acertos</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </CardContent>
          </Card>
        </Link>

        {/* View Statistics */}
        <Link href="/dashboard/statistics" className="block">
          <Card className="h-full hover:bg-secondary/50 transition-colors cursor-pointer group">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                <TrendingUp className="h-6 w-6 text-emerald-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">Estatísticas</h3>
                <p className="text-sm text-muted-foreground">
                  Análise de padrões
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </CardContent>
          </Card>
        </Link>
      </section>

      {/* Recent Games */}
      {recentGames.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Jogos Recentes</h2>
            <Link href="/dashboard/games">
              <Button variant="ghost" size="sm">
                Ver todos
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
          <GameList games={recentGames} />
        </section>
      )}
    </div>
  );
}
