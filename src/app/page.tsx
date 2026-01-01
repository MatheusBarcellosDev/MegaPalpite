import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { JackpotCard } from "@/components/jackpot-card";
import { Disclaimer } from "@/components/disclaimer";
import { Logo } from "@/components/logo";
import { getLatestContestFromDB } from "@/actions/contests";
import {
  Dices,
  TrendingUp,
  Shield,
  Sparkles,
  ChevronRight,
  BarChart3,
  Brain,
  Lock,
} from "lucide-react";

export const revalidate = 300; // Revalidate every 5 minutes

async function LandingPage() {
  const contest = await getLatestContestFromDB();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border sticky top-0 z-50 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Logo size="lg" />
            <div className="flex items-center gap-3">
              <Link href="/auth">
                <Button variant="ghost">Entrar</Button>
              </Link>
              <Link href="/auth">
                <Button>Começar Grátis</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="py-16 md:py-24 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center space-y-6 mb-12">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 text-sm">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>Análise estatística inteligente</span>
              </div>

              {/* Title */}
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
                Gerador Inteligente de
                <br />
                <span className="gradient-text">Números Mega-Sena</span>
              </h1>

              {/* Subtitle */}
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Gere números baseados em análise estatística de sorteios
                anteriores. Não aumentamos suas chances, mas tornamos a
                experiência mais interessante.
              </p>

              {/* CTA */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Link href="/auth">
                  <Button size="lg" className="text-lg px-8 h-14">
                    <Dices className="h-5 w-5 mr-2" />
                    Gerar Meus Números
                  </Button>
                </Link>
                <Link href="#features">
                  <Button size="lg" variant="outline" className="text-lg px-8 h-14">
                    Como Funciona
                    <ChevronRight className="h-5 w-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Jackpot Card - PROMINENT */}
            <div className="max-w-2xl mx-auto animate-float">
              <JackpotCard contest={contest} />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 px-4 bg-secondary/20">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Como Funciona
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Utilizamos dados históricos para gerar números com base em
                padrões estatísticos. Tudo para entretenimento.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <Card className="p-6 bg-card/50 border-border">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Análise de Frequência
                </h3>
                <p className="text-muted-foreground">
                  Analisamos a frequência de cada número nos últimos 100
                  sorteios para identificar padrões estatísticos.
                </p>
              </Card>

              {/* Feature 2 */}
              <Card className="p-6 bg-card/50 border-border">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Equilíbrio Estatístico
                </h3>
                <p className="text-muted-foreground">
                  Balanceamos números pares/ímpares e baixos/altos seguindo
                  padrões observados em sorteios anteriores.
                </p>
              </Card>

              {/* Feature 3 */}
              <Card className="p-6 bg-card/50 border-border">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Explicação com IA
                </h3>
                <p className="text-muted-foreground">
                  A IA explica o raciocínio por trás de cada seleção de números,
                  tornando a experiência educativa.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Trust Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h2 className="text-3xl md:text-4xl font-bold">
                  Transparente e Seguro
                </h2>
                <p className="text-lg text-muted-foreground">
                  Todos os dados de sorteios vêm diretamente da API oficial da
                  Caixa Econômica Federal. Suas informações são protegidas com
                  criptografia de ponta a ponta.
                </p>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Shield className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Dados Oficiais</h4>
                      <p className="text-sm text-muted-foreground">
                        Resultados obtidos diretamente da Caixa
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Lock className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Privacidade Garantida</h4>
                      <p className="text-sm text-muted-foreground">
                        Seus jogos são privados e seguros
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Disclaimer Card */}
              <div className="space-y-6">
                <Disclaimer variant="card" />
                <Card className="p-6 bg-card/50">
                  <h4 className="font-semibold mb-2">Importante Saber</h4>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• Cada sorteio é independente e aleatório</li>
                    <li>• Padrões passados não garantem resultados futuros</li>
                    <li>• Este app é para entretenimento apenas</li>
                    <li>• Jogue com responsabilidade</li>
                  </ul>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 bg-gradient-to-b from-primary/5 to-transparent">
          <div className="container mx-auto max-w-3xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Pronto para começar?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Crie sua conta gratuita e comece a gerar números inteligentes hoje
              mesmo.
            </p>
            <Link href="/auth">
              <Button size="lg" className="text-lg px-8 h-14">
                <Dices className="h-5 w-5 mr-2" />
                Criar Conta Grátis
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Logo size="sm" showTagline={false} />
            <Disclaimer variant="inline" />
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
