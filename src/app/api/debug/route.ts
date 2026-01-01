import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const latestContest = await prisma.contest.findFirst({
      orderBy: { id: "desc" },
    });

    if (!latestContest) {
      return NextResponse.json({ error: "No contests in database" });
    }

    return NextResponse.json({
      contestNumber: latestContest.id,
      drawDate: latestContest.drawDate,
      jackpotValue: Number(latestContest.jackpotValue),
      nextJackpot: latestContest.nextJackpot ? Number(latestContest.nextJackpot) : null,
      isAccumulated: latestContest.isAccumulated,
      drawnNumbers: latestContest.drawnNumbers,
      totalContests: await prisma.contest.count(),
    });
  } catch (error) {
    console.error("Debug error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
