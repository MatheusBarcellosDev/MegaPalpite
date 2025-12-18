import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GameList } from "@/components/game-card";
import { getUserGames } from "@/actions/games";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { History, Clock, CheckCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Dices } from "lucide-react";

export default async function GamesPage() {
  const games = await getUserGames();

  // Separate games by status
  const pendingGames = games.filter((g) => g.hits === undefined);
  const checkedGames = games.filter((g) => g.hits !== undefined);

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Meus Jogos</h1>
          <p className="text-muted-foreground">
            {games.length} jogos salvos no total
          </p>
        </div>
        <Link href="/dashboard/generate">
          <Button>
            <Dices className="h-4 w-4 mr-2" />
            Novo Jogo
          </Button>
        </Link>
      </div>

      {/* Games Tabs */}
      <Card>
        <CardHeader>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Todos ({games.length})
              </TabsTrigger>
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Pendentes ({pendingGames.length})
              </TabsTrigger>
              <TabsTrigger value="checked" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Verificados ({checkedGames.length})
              </TabsTrigger>
            </TabsList>

            <CardContent className="pt-6 px-0">
              <TabsContent value="all" className="mt-0">
                <GameList
                  games={games}
                  showResults
                  emptyMessage="Você ainda não gerou nenhum jogo"
                />
              </TabsContent>

              <TabsContent value="pending" className="mt-0">
                <GameList
                  games={pendingGames}
                  emptyMessage="Nenhum jogo pendente de verificação"
                />
              </TabsContent>

              <TabsContent value="checked" className="mt-0">
                <GameList
                  games={checkedGames}
                  showResults
                  emptyMessage="Nenhum jogo verificado ainda"
                />
              </TabsContent>
            </CardContent>
          </Tabs>
        </CardHeader>
      </Card>
    </div>
  );
}
