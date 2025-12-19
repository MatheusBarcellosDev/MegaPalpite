import { createClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HistoryChart } from "@/components/history-chart";
import { getUserResultsHistory } from "@/actions/statistics";
import { checkGameResults } from "@/actions/games";
import { RefreshCw, BarChart3 } from "lucide-react";
import Link from "next/link";

export default async function ResultsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { data, stats } = await getUserResultsHistory(user.id);

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Resultados</h1>
          <p className="text-muted-foreground">
            Acompanhe seus acertos ao longo do tempo
          </p>
        </div>

        <div className="flex gap-3">
          <Link href="/dashboard/statistics">
            <Button variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />
              Ver Estatísticas
            </Button>
          </Link>
          <form action={async () => {
            "use server";
            await checkGameResults();
          }}>
            <Button type="submit">
              <RefreshCw className="h-4 w-4 mr-2" />
              Conferir Resultados
            </Button>
          </form>
        </div>
      </div>

      {/* History Chart */}
      <HistoryChart data={data} stats={stats} />

      {/* Recent Results Table */}
      {data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Últimos Resultados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4">Concurso</th>
                    <th className="text-left py-3 px-4">Data</th>
                    <th className="text-center py-3 px-4">Acertos</th>
                    <th className="text-left py-3 px-4">Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {data.slice(-10).reverse().map((item) => (
                    <tr key={item.contestNumber} className="border-b border-border/50">
                      <td className="py-3 px-4 font-mono">#{item.contestNumber}</td>
                      <td className="py-3 px-4 text-muted-foreground">{item.date}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                          item.hits >= 4 ? "bg-green-500/20 text-green-500" :
                          item.hits >= 2 ? "bg-yellow-500/20 text-yellow-500" :
                          "bg-gray-500/20 text-gray-500"
                        }`}>
                          {item.hits}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {item.hits === 6 && <span className="text-green-500 font-semibold">🎉 SENA!</span>}
                        {item.hits === 5 && <span className="text-blue-500 font-semibold">Quina</span>}
                        {item.hits === 4 && <span className="text-purple-500 font-semibold">Quadra</span>}
                        {item.hits < 4 && <span className="text-muted-foreground">Sem prêmio</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {data.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center space-y-4">
            <p className="text-muted-foreground">
              Você ainda não tem jogos conferidos.
            </p>
            <Link href="/dashboard/generate">
              <Button>Gerar Números</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
