"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { NumberBalls } from "@/components/number-balls";
import { HotColdNumbers } from "@/components/hot-cold-numbers";
import { LotterySelector, LOTTERY_OPTIONS } from "@/components/lottery-selector";
import { generateGame, getStrategies, getLatestContest } from "@/actions/games";
import { getHotColdNumbers } from "@/actions/statistics";
import { 
  Dices, 
  Sparkles, 
  RefreshCw, 
  Loader2, 
  CheckCircle2,
  Flame,
  Snowflake,
  Scale,
  Shuffle,
  ExternalLink,
} from "lucide-react";

type Strategy = {
  id: string;
  name: string;
  description: string;
};

type HotColdData = {
  hotNumbers: number[];
  coldNumbers: number[];
};

const strategyIcons: Record<string, React.ReactNode> = {
  balanced: <Scale className="h-5 w-5" />,
  hot: <Flame className="h-5 w-5" />,
  cold: <Snowflake className="h-5 w-5" />,
  mixed: <Shuffle className="h-5 w-5" />,
};

function GeneratePageContent() {
  const searchParams = useSearchParams();
  const lotteryParam = searchParams.get("lottery") || "megasena";
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [selectedLottery, setSelectedLottery] = useState(lotteryParam);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<string>("balanced");
  const [contestNumber, setContestNumber] = useState<number | null>(null);
  const [hotColdData, setHotColdData] = useState<HotColdData | null>(null);
  const [game, setGame] = useState<{
    numbers: number[];
    explanation: string;
    contestNumber: number;
    strategy: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInitialData(selectedLottery);
  }, []);

  // Reload data when lottery changes
  useEffect(() => {
    if (!initialLoading) {
      loadInitialData(selectedLottery);
    }
  }, [selectedLottery]);

  const loadInitialData = async (lotteryType: string = "megasena") => {
    setInitialLoading(true);
    try {
      const [strats, contest, hotCold] = await Promise.all([
        getStrategies(),
        getLatestContest(lotteryType),
        getHotColdNumbers(lotteryType),
      ]);
      setStrategies(strats);
      if (contest) {
        setContestNumber(contest.contestNumber + 1);
      }
      setHotColdData({
        hotNumbers: hotCold.hotNumbers,
        coldNumbers: hotCold.coldNumbers,
      });
    } catch (err) {
      console.error("Error loading initial data:", err);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await generateGame(
        selectedStrategy as "balanced" | "hot" | "cold" | "mixed",
        selectedLottery
      );

      if (result.success && result.game) {
        setGame(result.game);
      } else {
        setError(result.error || "Erro ao gerar números");
      }
    } catch (err) {
      console.error(err);
      setError("Erro ao gerar números. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Gerar Números</h1>
        
        {/* Lottery Selector */}
        <div className="flex justify-center">
          <LotterySelector 
            selectedLottery={selectedLottery}
            onSelect={(lottery) => {
              setSelectedLottery(lottery);
              setGame(null); // Reset game when changing lottery
            }}
          />
        </div>
        
        <p className="text-muted-foreground">
          {contestNumber 
            ? `Gerando para o Concurso ${contestNumber}`
            : "Carregando informações do concurso..."}
        </p>
      </div>

      {/* Hot & Cold Numbers */}
      <HotColdNumbers 
        hotNumbers={hotColdData?.hotNumbers || []}
        coldNumbers={hotColdData?.coldNumbers || []}
        loading={initialLoading}
      />

      {/* Strategy Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Escolha sua Estratégia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {strategies.length > 0 ? (
              strategies.map((strategy) => (
                <button
                  key={strategy.id}
                  onClick={() => setSelectedStrategy(strategy.id)}
                  disabled={loading}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    selectedStrategy === strategy.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={selectedStrategy === strategy.id ? "text-primary" : "text-muted-foreground"}>
                      {strategyIcons[strategy.id]}
                    </span>
                    <span className="font-semibold">{strategy.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{strategy.description}</p>
                </button>
              ))
            ) : (
              [1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Generate Button */}
      <div className="flex justify-center">
        <Button
          size="lg"
          onClick={handleGenerate}
          disabled={loading || initialLoading}
          className="h-14 px-8 text-lg"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Gerando...
            </>
          ) : game ? (
            <>
              <RefreshCw className="h-5 w-5 mr-2" />
              Gerar Novos Números
            </>
          ) : (
            <>
              <Dices className="h-5 w-5 mr-2" />
              Gerar Meus Números
            </>
          )}
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg p-4 text-center">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && !game && (
        <Card>
          <CardContent className="p-8">
            <div className="space-y-6">
              <div className="flex justify-center gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-16 w-16 rounded-full" />
                ))}
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generated Numbers */}
      {game && (
        <div className="space-y-6">
          {/* Numbers Card */}
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 p-8">
              <div className="text-center mb-6">
                <p className="text-sm text-muted-foreground mb-2">
                  Seus números para o concurso {game.contestNumber}
                </p>
                <p className="text-xs text-primary">
                  Estratégia: {strategies.find(s => s.id === game.strategy)?.name || game.strategy}
                </p>
              </div>
              <NumberBalls numbers={game.numbers} size="lg" animate />
            </div>

            {/* Actions */}
            <CardContent className="p-4 flex flex-wrap justify-center gap-3">
              <Button
                variant="outline"
                onClick={handleGenerate}
                disabled={loading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Gerar Outros
              </Button>
              <Button disabled className="cursor-default bg-green-600 hover:bg-green-600">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Salvo!
              </Button>
              <Button
                asChild
                className="bg-blue-600 hover:bg-blue-700"
              >
                <a
                  href="https://loterias.caixa.gov.br/Paginas/Mega-Sena.aspx"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Fazer Aposta na Caixa
                </a>
              </Button>
            </CardContent>
          </Card>

          {/* Explanation Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Por que esses números?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {game.explanation}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function GeneratePage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8"><Skeleton className="h-96 w-full" /></div>}>
      <GeneratePageContent />
    </Suspense>
  );
}
