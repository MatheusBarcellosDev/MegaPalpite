# 🎲 Mega-Sena Smart Number Generator

A modern, production-ready web application that generates Mega-Sena lottery numbers based on statistical analysis of historical contests. Built with Next.js 15, TypeScript, Supabase, and AI-powered explanations.

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?style=flat-square&logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat-square&logo=tailwind-css)

## ⚠️ Disclaimer

**This application does NOT guarantee winnings. Lottery draws are random and independent. Past results do not influence future outcomes. This app is for entertainment and educational purposes only.**

## ✨ Features

- 🎰 **Number Generation**: Generate 6 numbers based on statistical analysis
- 📊 **Frequency Analysis**: Analyzes the last 100+ contests
- 🤖 **AI Explanations**: OpenAI-powered explanations of number selection
- 💰 **Live Jackpot**: Real-time jackpot data from official Caixa API
- 🔐 **Authentication**: Magic link and Google OAuth via Supabase
- 📱 **Responsive**: Beautiful mobile-first design
- 📈 **Results Tracking**: Check your games against official results
- 🎨 **Modern UI**: Fintech-style dark theme with glassmorphism

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- OpenAI API key

### 1. Clone and Install

```bash
cd megasena
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# OpenAI Configuration (for AI explanations only)
OPENAI_API_KEY=sk-your-openai-api-key-here

# App URL (for OAuth callbacks)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Setup Supabase Database

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the contents of `supabase-setup.sql`

### 4. Configure Authentication

In your Supabase dashboard:

1. Go to **Authentication > Providers**
2. Enable **Email** provider (for magic links)
3. Enable **Google** provider (optional, for OAuth)
4. Add `http://localhost:3000/auth/callback` to redirect URLs

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
megasena/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── auth/               # Authentication pages
│   │   ├── dashboard/          # Protected dashboard pages
│   │   │   ├── generate/       # Number generation
│   │   │   ├── games/          # Saved games list
│   │   │   └── results/        # Results tracking
│   │   └── page.tsx            # Landing page
│   │
│   ├── components/             # React components
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── jackpot-card.tsx    # Jackpot display
│   │   ├── number-balls.tsx    # Lottery numbers
│   │   └── ...
│   │
│   ├── lib/                    # Utilities and services
│   │   ├── lottery/            # Lottery API and generator
│   │   ├── supabase/           # Supabase clients
│   │   └── openai.ts           # OpenAI integration
│   │
│   ├── actions/                # Server Actions
│   └── types/                  # TypeScript types
│
├── supabase-setup.sql          # Database setup script
└── env.example.md              # Environment variables template
```

## 🔧 Technology Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| Components | shadcn/ui |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Charts | Recharts |
| AI | OpenAI API (gpt-4o-mini) |

## 📊 Number Generation Algorithm

The algorithm generates numbers based on:

1. **Frequency Analysis**: Weights numbers by their historical frequency
2. **Odd/Even Balance**: Ensures 2-4 odd and 2-4 even numbers
3. **High/Low Balance**: Mix of numbers 1-30 and 31-60
4. **Sequential Avoidance**: Prevents more than 2 consecutive numbers
5. **Randomization**: Final shuffle for unpredictability

## 🔒 Security

- Row Level Security (RLS) ensures users only access their own data
- Server Actions for secure server-side operations
- Environment variables for sensitive credentials
- OAuth 2.0 for secure authentication

## 📝 API Data Source

Lottery data is fetched from the official **Caixa Econômica Federal API**:
- Endpoint: `https://servicebus2.caixa.gov.br/portaldeloterias/api/megasena`
- Data is cached for 5 minutes
- Includes jackpot values, draw dates, and historical results

## 🛠️ Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Run production server
npm start

# Lint code
npm run lint
```

## 📄 License

This project is for educational purposes only.

## 🙏 Acknowledgments

- [Caixa Econômica Federal](https://www.caixa.gov.br/) for the lottery API
- [shadcn/ui](https://ui.shadcn.com/) for the component library
- [Supabase](https://supabase.com/) for the backend infrastructure
