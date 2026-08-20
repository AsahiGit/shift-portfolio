import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const shifts = await prisma.shift.findMany({
    where: {
      userId: session.user.id,
      ...(from && to ? { date: { gte: new Date(from), lte: new Date(to) } } : {}),
    },
    include: { workplace: { include: { wageRules: true } } },
    orderBy: { date: "asc" },
  });
  return NextResponse.json(shifts);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { date, startTime, endTime, breakMinutes, memo, status, workplaceId } = body;

  if (!date || !startTime || !endTime || !workplaceId) {
    return NextResponse.json({ error: "必須項目が不足しています" }, { status: 400 });
  }

  const workplace = await prisma.workplace.findUnique({ where: { id: workplaceId } });
  if (!workplace || workplace.userId !== session.user.id) {
    return NextResponse.json({ error: "invalid workplace" }, { status: 400 });
  }

  const shift = await prisma.shift.create({
    data: {
      date: new Date(date),
      startTime,
      endTime,
      breakMinutes: breakMinutes ? Number(breakMinutes) : 0,
      memo: memo || null,
      status: status || "CONFIRMED",
      workplaceId,
      userId: session.user.id,
    },
    include: { workplace: { include: { wageRules: true } } },
  });
  return NextResponse.json(shift, { status: 201 });
}
