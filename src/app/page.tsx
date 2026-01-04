import Link from "next/link";
import { Button } from "@/components/ui/button";
import { JackpotCard } from "@/components/jackpot-card";
import { getLatestContestFromDB } from "@/actions/contests";
import { ACTIVE_LOTTERIES, getLotteryConfig } from "@/lib/lottery/types-config";
import { Sparkles, TrendingUp, Shield } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 300;

export default async function LandingPage() {
  // Fetch all lotteries
  const lotteryPromises = ACTIVE_LOTTERIES.map(async (type) => {
    const contest = await getLatestContestFromDB(type);
    const config = getLotteryConfig(type);
    return { type, contest, config };
  });

  const lotteries = await Promise.all(lotteryPromises);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-emerald-950/20 to-black">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 sm:py-24 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Badge */}
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
              <Sparkles className="h-4 w-4" />
              <span>Gerador Inteligente com IA</span>
            </div>
          </div>

          {/* Main Heading - SEO Critical */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight">
            <span className="text-white">Gere Números para </span>
            <span className="bg-gradient-to-r from-emerald-400 via-green-500 to-emerald-600 bg-clip-text text-transparent">
              Mega-Sena, Lotofácil e Quina
            </span>
          </h1>

          {/* Description - SEO Critical */}
          <p className="text-xl sm:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Gerador gratuito de números para loteria com análise estatística e inteligência artificial. 
            Aumente suas chances com estratégias baseadas nos últimos sorteios!
          </p>

          {/* CTA Button */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/auth">
              <Button
                size="lg"
                className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold px-8 py-6 text-lg"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Começar Grátis Agora
              </Button>
            </Link>
            <Link href="/resultados">
              <Button
                variant="outline"
                size="lg"
                className="border-emerald-500/20 hover:border-emerald-500/40 px-8 py-6 text-lg"
              >
                Ver Resultados
              </Button>
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-8 text-gray-400 pt-8">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              <span>Análise com IA</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-500" />
              <span>100% Gratuito</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-500" />
              <span>Geração Ilimitada</span>
            </div>
          </div>
        </div>
      </section>

      {/* Lotteries Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Section Header - SEO */}
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Prêmios Estimados - Loterias da Caixa
            </h2>
            <p className="text-lg text-gray-400">
              Valores atualizados em tempo real. Gere seus números agora!
            </p>
          </div>

          {/* Desktop: Grid of 3 columns */}
          <div className="hidden md:grid md:grid-cols-3 gap-6">
            {lotteries.map(({ type, contest, config }) => (
              <JackpotCard key={type} contest={{...contest, lotteryType: type}} compact />
            ))}
          </div>

          {/* Mobile: Carousel */}
          <div className="md:hidden">
            <div className="relative">
              <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 scrollbar-hide">
                {lotteries.map(({ type, contest, config }) => (
                  <div key={type} className="min-w-[85vw] snap-center">
                    <JackpotCard contest={{...contest, lotteryType: type}} />
                  </div>
                ))}
              </div>
              {/* Scroll indicator */}
              <div className="flex justify-center gap-2 mt-4">
                {lotteries.map((_, i) => (
                  <div
                    key={i}
                    className="h-2 w-2 rounded-full bg-gray-600"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEO Content Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto space-y-8 text-gray-300">
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">
              Como funciona o gerador de números para loteria?
            </h2>
            <p className="leading-relaxed">
              Nosso gerador utiliza <strong>inteligência artificial</strong> para analisar os últimos 100 sorteios 
              da Mega-Sena, Lotofácil e Quina. Com base em <strong>análise estatística</strong>, identificamos 
              números quentes (mais sorteados), números frios (menos sorteados) e números atrasados para gerar 
              combinações inteligentes.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-bold text-white mb-3">
              Estratégias Personalizadas
            </h3>
            <p className="leading-relaxed">
              Escolha entre diferentes estratégias: <strong>números quentes</strong> (baseados em frequência), 
              <strong>números frios</strong> (apostas ousadas), <strong>balanceados</strong> (mix equilibrado) 
              ou <strong>mistos</strong>. Cada estratégia usa dados reais dos concursos anteriores.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-bold text-white mb-3">
              100% Gratuito e Ilimitado
            </h3>
            <p className="leading-relaxed">
              Gere <strong>quantos jogos quiser</strong>, completamente grátis! Sem limites, sem cadastros complicados. 
              Todos os seus jogos ficam salvos para você conferir resultados e acompanhar seus palpites.
            </p>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-6 mt-8">
            <p className="text-sm text-amber-200">
              <strong>Aviso:</strong> Este gerador não aumenta suas chances matemáticas de ganhar na loteria. 
              Todos os números têm a mesma probabilidade. Nossa ferramenta torna a escolha mais informada 
              baseada em dados históricos, mas não garante prêmios. Jogue com responsabilidade.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Pronto para gerar seus números da sorte?
          </h2>
          <p className="text-xl text-gray-300">
            Comece agora e tenha acesso a análises estatísticas completas
          </p>
          <Link href="/auth">
            <Button
              size="lg"
              className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold px-10 py-6 text-lg"
            >
              Gerar Números Grátis
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
