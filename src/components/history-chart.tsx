"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Target, Trophy, Hash } from "lucide-react";

interface HistoryData {
  contestNumber: number;
  hits: number;
  date: string;
}

interface HistoryStats {
  totalGames: number;
  avgHits: number;
  bestHits: number;
  bestContest: number | null;
}

interface HistoryChartProps {
  data: HistoryData[];
  stats: HistoryStats;
}

export function HistoryChart({ data, stats }: HistoryChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">
            Você ainda não tem jogos conferidos. Gere números e aguarde o sorteio!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Hash className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total de Jogos</p>
                <p className="text-xl font-bold">{stats.totalGames}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Média de Acertos</p>
                <p className="text-xl font-bold">{stats.avgHits}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Trophy className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Melhor Resultado</p>
                <p className="text-xl font-bold">{stats.bestHits} acertos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Target className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Melhor Concurso</p>
                <p className="text-xl font-bold">
                  {stats.bestContest ? `#${stats.bestContest}` : "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Seus Acertos ao Longo do Tempo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis
                  dataKey="contestNumber"
                  stroke="#888"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) => `#${value}`}
                />
                <YAxis 
                  stroke="#888" 
                  tick={{ fontSize: 11 }}
                  domain={[0, 6]}
                  ticks={[0, 1, 2, 3, 4, 5, 6]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1a1a",
                    border: "1px solid #333",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#fff" }}
                  formatter={(value) => [`${value} acertos`, "Resultado"]}
                  labelFormatter={(label) => `Concurso #${label}`}
                />
                <ReferenceLine 
                  y={stats.avgHits} 
                  stroke="#666" 
                  strokeDasharray="5 5"
                  label={{ value: `Média: ${stats.avgHits}`, fill: "#888", fontSize: 11 }}
                />
                <Line
                  type="monotone"
                  dataKey="hits"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={{ fill: "#22c55e", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: "#22c55e" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Prize Reference */}
      <Card className="bg-card/50">
        <CardContent className="p-4">
          <h4 className="font-semibold mb-2">Referência de Prêmios</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">6 acertos:</span>
              <span className="ml-2 text-green-500 font-semibold">Sena 💰</span>
            </div>
            <div>
              <span className="text-muted-foreground">5 acertos:</span>
              <span className="ml-2 text-blue-500 font-semibold">Quina</span>
            </div>
            <div>
              <span className="text-muted-foreground">4 acertos:</span>
              <span className="ml-2 text-purple-500 font-semibold">Quadra</span>
            </div>
            <div>
              <span className="text-muted-foreground">0-3 acertos:</span>
              <span className="ml-2 text-muted-foreground">Sem prêmio</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
