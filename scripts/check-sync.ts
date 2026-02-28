import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('--- Ultimos Concursos ---')
  const lastContests = await prisma.contest.findMany({
    orderBy: { fetchedAt: 'desc' },
    take: 5
  })
  
  lastContests.forEach(c => {
    console.log(`Lottery: ${c.lotteryType}, ID: ${c.id}, Draw Date: ${c.drawDate.toISOString()}, Fetched At: ${c.fetchedAt.toISOString()}`)
  })
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
