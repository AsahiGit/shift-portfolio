import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Returns a friend's shift times only (no wage/hourly-rate fields) — friendship
// must be ACCEPTED in either direction before any data is shared.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id: friendUserId } = await params;

  const friendship = await prisma.friendship.findFirst({
    where: {
      status: "ACCEPTED",
      OR: [
        { requesterId: session.user.id, addresseeId: friendUserId },
        { requesterId: friendUserId, addresseeId: session.user.id },
      ],
    },
  });
  if (!friendship) {
    return NextResponse.json({ error: "フレンドではありません" }, { status: 403 });
  }

  const friend = await prisma.user.findUnique({
    where: { id: friendUserId },
    select: { id: true, name: true },
  });
  if (!friend) return NextResponse.json({ error: "not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const shifts = await prisma.shift.findMany({
    where: {
      userId: friendUserId,
      status: { in: ["CONFIRMED", "DONE"] },
      ...(from && to ? { date: { gte: new Date(from), lte: new Date(to) } } : {}),
    },
    select: {
      id: true,
      date: true,
      startTime: true,
      endTime: true,
      workplace: { select: { name: true, color: true } },
    },
    orderBy: { date: "asc" },
  });

  return NextResponse.json({ friend, shifts });
}
