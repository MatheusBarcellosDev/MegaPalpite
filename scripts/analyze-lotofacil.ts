
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

const PRIMES = new Set([2, 3, 5, 7, 11, 13, 17, 19, 23]);

async function analyze() {
  console.log("Fetching Lotofácil contests...");
  const contests = await prisma.contest.findMany({
    where: { lotteryType: "lotofacil" },
    select: { id: true, drawnNumbers: true },
  });

  console.log(`Analyzed ${contests.length} contests.`);

  if (contests.length === 0) {
    console.log("No data found. Please populate the database first.");
    return;
  }

  const stats = {
    primes: {} as Record<number, number>,
    oddEven: {} as Record<string, number>, // "odd-even" key
    maxSequence: {} as Record<number, number>,
  };

  for (const contest of contests) {
    const nums = contest.drawnNumbers.sort((a, b) => a - b);

    // 1. Primes
    const primeCount = nums.filter(n => PRIMES.has(n)).length;
    stats.primes[primeCount] = (stats.primes[primeCount] || 0) + 1;

    // 2. Odd/Even
    const oddCount = nums.filter(n => n % 2 !== 0).length;
    const evenCount = nums.length - oddCount;
    const key = `${oddCount}i-${evenCount}p`;
    stats.oddEven[key] = (stats.oddEven[key] || 0) + 1;

    // 3. Sequences
    let maxSeq = 1;
    let currentSeq = 1;
    for (let i = 1; i < nums.length; i++) {
        if (nums[i] === nums[i-1] + 1) {
            currentSeq++;
        } else {
            maxSeq = Math.max(maxSeq, currentSeq);
            currentSeq = 1;
        }
    }
    maxSeq = Math.max(maxSeq, currentSeq);
    stats.maxSequence[maxSeq] = (stats.maxSequence[maxSeq] || 0) + 1;
  }

  console.log("\n--- ANALYSIS RESULTS ---");

  console.log("\nPRIMES DISTRIBUTION:");
  Object.entries(stats.primes)
    .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
    .forEach(([count, freq]) => {
        const pct = ((freq / contests.length) * 100).toFixed(2);
        console.log(`${count} primes: ${freq} (${pct}%)`);
    });

  console.log("\nODD/EVEN DISTRIBUTION:");
  Object.entries(stats.oddEven)
    .sort((a, b) => b[1] - a[1]) // Sort by frequency
    .forEach(([key, freq]) => {
        const pct = ((freq / contests.length) * 100).toFixed(2);
        console.log(`${key}: ${freq} (${pct}%)`);
    });

  console.log("\nMAX SEQUENCE LENGTH:");
  Object.entries(stats.maxSequence)
    .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
    .forEach(([len, freq]) => {
        const pct = ((freq / contests.length) * 100).toFixed(2);
        console.log(`Max Seq ${len}: ${freq} (${pct}%)`);
    });
}

analyze()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
