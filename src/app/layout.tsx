import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mega-Sena Smart - Gerador Inteligente de Números",
  description:
    "Gere números da Mega-Sena baseados em análise estatística de sorteios anteriores. Não aumentamos suas chances, mas tornamos a experiência mais interessante.",
  keywords: [
    "mega-sena",
    "loteria",
    "números",
    "gerador",
    "estatística",
    "sorteio",
  ],
  authors: [{ name: "Mega-Sena Smart" }],
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "Mega-Sena Smart - Gerador Inteligente de Números",
    description:
      "Gere números da Mega-Sena baseados em análise estatística de sorteios anteriores.",
    type: "website",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
