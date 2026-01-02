import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NumberBalls } from "@/components/number-balls";
import { ArrowLeft, Trophy, Calendar, Hash, Info } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function GameDetailPage({ params }: Props) {
  const { id } = await params;
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  // Get game with result
  const game = await prisma.game.findUnique({
    where: { id, userId: user.id },
    include: { result: true },
  });

  if (!game) {
    notFound();
  }

  // Get contest info
  const contest = await prisma.contest.findUnique({
    where: { id: game.contestNumber },
  });

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    }).format(date);
  };

  const getStatusBadge = () => {
    if (game.result) {
      const hits = game.result.hits;
      if (hits === 6) {
        return (
          <Badge className="bg-amber-500 text-black text-lg px-4 py-2">
            <Trophy className="h-4 w-4 mr-2" /> SENA! 🎉
          </Badge>
        );
      }
      if (hits >= 4) {
        return (
          <Badge className="bg-emerald-500 text-black text-lg px-4 py-2">
            {hits} acertos - Premiado!
          </Badge>
        );
      }
      return (
        <Badge variant="secondary" className="text-lg px-4 py-2">
          {hits} {hits === 1 ? "acerto" : "acertos"}
        </Badge>
      );
    }
    
    if (!contest || contest.drawnNumbers.length === 0) {
      return (
        <Badge variant="outline" className="text-lg px-4 py-2">
          Aguardando Sorteio
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className="text-lg px-4 py-2">
        Pendente de Verificação
      </Badge>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Back Button */}
      <Link href="/dashboard/games">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Meus Jogos
        </Button>
      </Link>

      {/* Game Info Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5" />
              Concurso {game.contestNumber}
            </CardTitle>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Your Numbers */}
          <div>
            <h3 className="text-sm text-muted-foreground mb-3">Seus Números</h3>
            <NumberBalls
              numbers={game.numbers}
              matchedNumbers={contest?.drawnNumbers || []}
              size="md"
            />
          </div>

          {/* Drawn Numbers (if available) */}
          {contest && contest.drawnNumbers.length === 6 && (
            <div>
              <h3 className="text-sm text-muted-foreground mb-3">Números Sorteados</h3>
              <NumberBalls
                numbers={contest.drawnNumbers}
                size="md"
              />
            </div>
          )}

          {/* Game Details */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Criado em: {formatDate(game.createdAt)}
            </div>
            
            {game.result && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Trophy className="h-4 w-4" />
                Verificado em: {formatDate(game.result.checkedAt)}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Explanation Card */}
      {game.explanation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Análise Estatística
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              {game.explanation}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
