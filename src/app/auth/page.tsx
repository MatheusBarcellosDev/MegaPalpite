import { AuthForm } from "@/components/auth-form";
import { Disclaimer } from "@/components/disclaimer";
import { Logo } from "@/components/logo";
import Link from "next/link";

interface AuthPageProps {
  searchParams: Promise<{ redirect?: string }>;
}

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const params = await searchParams;
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border py-4">
        <div className="container mx-auto px-4">
          <Link href="/" className="w-fit inline-block">
            <Logo />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Bem-vindo de volta!</h1>
            <p className="text-muted-foreground mt-2">
              Entre para gerar seus números da sorte
            </p>
          </div>

          <AuthForm redirectTo={params.redirect || "/dashboard"} />

          <Disclaimer variant="inline" />
        </div>
      </main>

      {/* Footer */}
      <Disclaimer variant="footer" />
    </div>
  );
}
