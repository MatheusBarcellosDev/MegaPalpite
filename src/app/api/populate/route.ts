import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const CAIXA_API_BASE = "https://servicebus2.caixa.gov.br/portaldeloterias/api";

type LotteryType = 'lotofacil' | 'quina';

interface ContestData {
  numero: number;
  dataApuracao: string;
  dataProximoConcurso?: string;
  listaDezenas: string[];
  valorAcumuladoProximoConcurso: number;
  valorEstimadoProximoConcurso: number;
  acumulado: boolean;
  listaRateioPremio?: any[];
}

function parseDate(dateStr: string): Date {
  const parts = dateStr.split("/");
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

async function fetchContest(lotteryType: LotteryType, contestNumber: number): Promise<ContestData | null> {
  try {
    const response = await fetch(`${CAIXA_API_BASE}/${lotteryType}/${contestNumber}`, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0",
        "Accept-Language": "pt-BR",
        "Referer": "https://loterias.caixa.gov.br/",
      },
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (e) {
    console.error(`Erro buscar contest ${contestNumber}:`, e);
  }
  return null;
}

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutos para processar tudo

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lottery = searchParams.get("lottery") as LotteryType | null;
  const startStr = searchParams.get("start");
  const endStr = searchParams.get("end");

  // Validações
  if (!lottery || !['lotofacil', 'quina'].includes(lottery)) {
    return NextResponse.json(
      { error: "Parâmetro 'lottery' inválido. Use: lotofacil ou quina" },
      { status: 400 }
    );
  }

  const start = startStr ? parseInt(startStr) : (lottery === 'lotofacil' ? 3500 : 6820);
  const end = endStr ? parseInt(endStr) : (lottery === 'lotofacil' ? 3600 : 6920);

  console.log(`🚀 Populando ${lottery} - contests ${start} a ${end}`);

  const results = {
    lottery,
    start,
    end,
    success: 0,
    skipped: 0,
    errors: 0,
    details: [] as string[],
  };

  for (let contestNumber = start; contestNumber <= end; contestNumber++) {
    try {
      // Verifica se já existe
      const existing = await prisma.contest.findUnique({
        where: { id: contestNumber },
      });

      if (existing && existing.lotteryType === lottery) {
        results.skipped++;
        results.details.push(`⏭️ Contest ${contestNumber} já existe`);
        continue;
      }

      // Busca da API
      const data = await fetchContest(lottery, contestNumber);

      if (!data) {
        results.errors++;
        results.details.push(`❌ Falha contest ${contestNumber}`);
        continue;
      }

      // Salva no banco
      const drawnNumbers = data.listaDezenas.map(n => parseInt(n, 10));

      await prisma.contest.create({
        data: {
          id: contestNumber,
          lotteryType: lottery,
          drawDate: parseDate(data.dataApuracao),
          nextDrawDate: data.dataProximoConcurso ? parseDate(data.dataProximoConcurso) : null,
          drawnNumbers,
          jackpotValue: data.valorAcumuladoProximoConcurso || data.valorEstimadoProximoConcurso,
          isAccumulated: data.acumulado,
          nextJackpot: data.valorEstimadoProximoConcurso,
          winnersData: (data.listaRateioPremio || []) as any,
        },
      });

      results.success++;
      results.details.push(`✅ Contest ${contestNumber} salvo`);

      // Delay para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (e: any) {
      results.errors++;
      results.details.push(`❌ Erro contest ${contestNumber}: ${e.message}`);
    }
  }

  return NextResponse.json({
    message: `Processamento concluído para ${lottery}`,
    ...results,
  });
}
