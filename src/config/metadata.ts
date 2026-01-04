import type { Metadata } from "next";

export const siteConfig = {
  name: "MegaPalpite",
  title: "MegaPalpite - Gerador de Números para Loteria com IA | Mega-Sena, Lotofácil e Quina",
  description: "Gere números inteligentes para Mega-Sena, Lotofácil e Quina com IA. Análise estatística gratuita, estratégias personalizadas e histórico completo. Aumente suas chances de ganhar!",
  url: "https://mega-palpite.vercel.app",
  ogImage: "https://mega-palpite.vercel.app/og-image.png",
  keywords: [
    "gerador números mega sena",
    "números loteria",
    "lotofácil gerador",
    "quina números",
    "palpites loteria",
    "números da sorte",
    "mega sena inteligência artificial",
    "análise estatística loteria",
    "gerar números aleatórios",
    "estratégia mega sena",
    "como ganhar na loteria",
    "números quentes loteria",
    "números frios loteria",
    "gerador lotofácil grátis",
    "números quina grátis",
  ],
  authors: [
    {
      name: "MegaPalpite",
      url: "https://mega-palpite.vercel.app",
    },
  ],
  creator: "MegaPalpite",
  publisher: "MegaPalpite",
  locale: "pt_BR",
  type: "website",
};

export const defaultMetadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: siteConfig.authors,
  creator: siteConfig.creator,
  publisher: siteConfig.publisher,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: siteConfig.url,
    title: siteConfig.title,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    creator: "@megapalpite",
  },
  icons: {
    icon: [
      { url: "/favicons/favicon.ico" },
      { url: "/favicons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    shortcut: "/favicons/favicon.ico",
    apple: [
      { url: "/favicons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { rel: "icon", url: "/favicons/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { rel: "icon", url: "/favicons/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
  alternates: {
    canonical: siteConfig.url,
  },
};
