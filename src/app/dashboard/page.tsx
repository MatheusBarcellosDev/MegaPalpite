import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JackpotCard } from "@/components/jackpot-card";
import { GameList } from "@/components/game-card";
import { getLatestContestFromDB } from "@/actions/contests";
import { getRecentGames } from "@/actions/games";
import { Dices, History, TrendingUp, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 300; // Revalidate every 5 minutes

export default async function DashboardPage() {
  const [contest, recentGames] = await Promise.all([
    getLatestContestFromDB(),
    getRecentGames(3),
  ]);

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Jackpot Section - Most Prominent */}
      <section>
        <JackpotCard contest={contest} />
      </section>

      {/* Quick Actions */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Generate Numbers */}
        <Link href="/dashboard/generate" className="block">
          <Card className="h-full hover:bg-secondary/50 transition-colors cursor-pointer group">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Dices className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">Gerar Novo Jogo</h3>
                <p className="text-sm text-muted-foreground">
                  Análise estatística inteligente
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </CardContent>
          </Card>
        </Link>

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
        <Link href="/dashboard/results" className="block sm:col-span-2 lg:col-span-1">
          <Card className="h-full hover:bg-secondary/50 transition-colors cursor-pointer group">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                <TrendingUp className="h-6 w-6 text-amber-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">Resultados</h3>
                <p className="text-sm text-muted-foreground">
                  Verificar acertos
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </CardContent>
          </Card>
        </Link>
      </section>

      {/* Recent Games */}
      <section>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Jogos Recentes</CardTitle>
            <Link href="/dashboard/games">
              <Button variant="ghost" size="sm">
                Ver todos
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentGames.length > 0 ? (
              <GameList games={recentGames} showResults />
            ) : (
              <div className="text-center py-12">
                <Dices className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">
                  Nenhum jogo ainda
                </h3>
                <p className="text-muted-foreground mb-4">
                  Gere seu primeiro jogo para começar
                </p>
                <Link href="/dashboard/generate">
                  <Button>
                    <Dices className="h-4 w-4 mr-2" />
                    Gerar Primeiro Jogo
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
