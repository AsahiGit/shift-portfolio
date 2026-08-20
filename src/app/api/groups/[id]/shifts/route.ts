import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Aggregated confirmed shifts across all group members — times/workplace only, no wage data.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id: groupId } = await params;
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: session.user.id } },
  });
  if (!membership) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const memberIds = (
    await prisma.groupMember.findMany({ where: { groupId }, select: { userId: true } })
  ).map((m) => m.userId);

  const shifts = await prisma.shift.findMany({
    where: {
      userId: { in: memberIds },
      status: { in: ["CONFIRMED", "DONE"] },
      ...(from && to ? { date: { gte: new Date(from), lte: new Date(to) } } : {}),
    },
    select: {
      id: true,
      date: true,
      startTime: true,
      endTime: true,
      user: { select: { id: true, name: true, avatarColor: true } },
      workplace: { select: { name: true, color: true } },
    },
    orderBy: { date: "asc" },
  });

  return NextResponse.json(shifts);
}
