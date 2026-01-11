/**
 * Script para popular o banco com contests históricos da Lotofácil e Quina
 * 
 * A API da Caixa permite buscar contests específicos passando o número:
 * https://servicebus2.caixa.gov.br/portaldeloterias/api/lotofacil/3000
 * 
 * Execute: npx tsx scripts/populate-historical.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Carrega variáveis de ambiente do .env.local
config({ path: resolve(process.cwd(), '.env.local') });

import { prisma } from '../src/lib/prisma';

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
    console.error(`Erro ao buscar contest ${contestNumber} de ${lotteryType}:`, e);
  }
  return null;
}

async function populateHistorical(lotteryType: LotteryType, startContest: number, endContest: number) {
  console.log(`\n🚀 Populando ${lotteryType} - contests ${startContest} a ${endContest}\n`);

  let success = 0;
  let skipped = 0;
  let errors = 0;

  for (let contestNumber = startContest; contestNumber <= endContest; contestNumber++) {
    try {
      // Verifica se já existe
      const existing = await prisma.contest.findUnique({
        where: { id: contestNumber },
      });

      if (existing && existing.lotteryType === lotteryType) {
        console.log(`⏭️  Contest ${contestNumber} já existe`);
        skipped++;
        continue;
      }

      // Busca da API
      console.log(`📡 Buscando contest ${contestNumber}...`);
      const data = await fetchContest(lotteryType, contestNumber);

      if (!data) {
        console.log(`❌ Falhou - contest ${contestNumber}`);
        errors++;
        continue;
      }

      // Salva no banco
      const drawnNumbers = data.listaDezenas.map(n => parseInt(n, 10));

      await prisma.contest.create({
        data: {
          id: contestNumber,
          lotteryType,
          drawDate: parseDate(data.dataApuracao),
          nextDrawDate: data.dataProximoConcurso ? parseDate(data.dataProximoConcurso) : null,
          drawnNumbers,
          jackpotValue: data.valorAcumuladoProximoConcurso || data.valorEstimadoProximoConcurso,
          isAccumulated: data.acumulado,
          nextJackpot: data.valorEstimadoProximoConcurso,
          winnersData: (data.listaRateioPremio || []) as any,
        },
      });

      console.log(`✅ Contest ${contestNumber} salvo!`);
      success++;

      // Delay para não sobrecarregar a API
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (e) {
      console.error(`❌ Erro no contest ${contestNumber}:`, e);
      errors++;
    }
  }

  console.log(`\n📊 Resultado final ${lotteryType}:`);
  console.log(`   ✅ Sucesso: ${success}`);  
  console.log(`   ⏭️  Pulados: ${skipped}`);
  console.log(`   ❌ Erros: ${errors}\n`);
}

async function main() {
  console.log("🎲 Populando dados históricos das loterias...\n");

  // Lotofácil - contests mais recentes (últimos 100)
  // Contest atual ~3600, então pega de 3500 a 3600
  await populateHistorical('lotofacil', 3500, 3600);

  // Quina - contests mais recentes (últimos 100)
  // Contest atual ~6920, então pega de 6820 a 6920
  await populateHistorical('quina', 6820, 6920);

  console.log("✅ Script concluído!");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("Erro fatal:", e);
  process.exit(1);
});
