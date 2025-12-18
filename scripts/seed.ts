/**
 * Seed Script - Popula o banco com todos os concursos históricos da Mega-Sena
 * Execução: npx ts-node scripts/seed.ts
 */

const CAIXA_API_URL = "https://servicebus2.caixa.gov.br/portaldeloterias/api/megasena";

interface LotteryContest {
  numero: number;
  dataApuracao: string;
  listaDezenas: string[];
  valorAcumuladoProximoConcurso: number;
  valorEstimadoProximoConcurso: number;
  acumulado: boolean;
  listaRateioPremio?: Array<{
    faixa: number;
    numeroDeGanhadores: number;
    valorPremio: number;
    descricaoFaixa: string;
  }>;
}

async function fetchContest(contestNumber: number): Promise<LotteryContest | null> {
  try {
    const response = await fetch(`${CAIXA_API_URL}/${contestNumber}`, {
      headers: { Accept: "application/json" },
    });
    
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

async function getLatestContestNumber(): Promise<number> {
  const response = await fetch(CAIXA_API_URL, {
    headers: { Accept: "application/json" },
  });
  const data: LotteryContest = await response.json();
  return data.numero;
}

function parseDate(dateStr: string): Date {
  // Format: dd/mm/yyyy
  const [day, month, year] = dateStr.split("/").map(Number);
  return new Date(year, month - 1, day);
}

async function seed() {
  console.log("🎲 Iniciando seed do banco de dados...\n");

  // Dynamic import for Prisma (ESM compatibility)
  const { PrismaClient } = await import("@prisma/client");
  const { PrismaPg } = await import("@prisma/adapter-pg");
  const pg = await import("pg");
  
  const pool = new pg.Pool({
    connectionString: "postgresql://postgres.vhzpmcdpmmlftkdrgaak:45Rf66rf66rf%40@aws-1-us-east-2.pooler.supabase.com:5432/postgres",
  });
  
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    // Get latest contest number
    const latestNumber = await getLatestContestNumber();
    console.log(`📊 Último concurso: ${latestNumber}`);

    // Check what we already have
    const existingContests = await prisma.contest.findMany({
      select: { id: true },
      orderBy: { id: "desc" },
    });
    
    const existingIds = new Set(existingContests.map((c) => c.id));
    console.log(`💾 Concursos já salvos: ${existingIds.size}`);

    // Find missing contests
    const missingNumbers: number[] = [];
    for (let i = 1; i <= latestNumber; i++) {
      if (!existingIds.has(i)) {
        missingNumbers.push(i);
      }
    }

    if (missingNumbers.length === 0) {
      console.log("✅ Banco já está atualizado!");
      return;
    }

    console.log(`📥 Buscando ${missingNumbers.length} concursos...\n`);

    // Fetch in batches to avoid overwhelming the API
    const BATCH_SIZE = 20;
    let saved = 0;
    let errors = 0;

    for (let i = 0; i < missingNumbers.length; i += BATCH_SIZE) {
      const batch = missingNumbers.slice(i, i + BATCH_SIZE);
      
      const results = await Promise.all(
        batch.map(async (num) => {
          const contest = await fetchContest(num);
          if (!contest) return null;
          
          return {
            id: contest.numero,
            drawDate: parseDate(contest.dataApuracao),
            drawnNumbers: contest.listaDezenas.map((n) => parseInt(n, 10)),
            jackpotValue: contest.valorAcumuladoProximoConcurso || contest.valorEstimadoProximoConcurso,
            isAccumulated: contest.acumulado,
            nextJackpot: contest.valorEstimadoProximoConcurso,
            winnersData: contest.listaRateioPremio || [],
          };
        })
      );

      // Filter out nulls and save
      const validResults = results.filter((r) => r !== null);
      
      if (validResults.length > 0) {
        await prisma.contest.createMany({
          data: validResults,
          skipDuplicates: true,
        });
        saved += validResults.length;
      }
      
      errors += batch.length - validResults.length;

      // Progress
      const progress = Math.round(((i + batch.length) / missingNumbers.length) * 100);
      console.log(`  [${progress}%] Salvos: ${saved} | Erros: ${errors}`);

      // Small delay to be nice to the API
      await new Promise((r) => setTimeout(r, 500));
    }

    console.log(`\n✅ Seed concluído!`);
    console.log(`   - Salvos: ${saved}`);
    console.log(`   - Erros: ${errors}`);
    
  } catch (error) {
    console.error("❌ Erro no seed:", error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

seed();
