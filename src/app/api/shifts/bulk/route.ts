import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    workplaceId,
    startDate,
    endDate,
    weekdays, // array of 0(Sun)-6(Sat)
    startTime,
    endTime,
    breakMinutes,
    status,
  } = body;

  if (!workplaceId || !startDate || !endDate || !startTime || !endTime || !Array.isArray(weekdays) || weekdays.length === 0) {
    return NextResponse.json({ error: "必須項目が不足しています" }, { status: 400 });
  }

  const workplace = await prisma.workplace.findUnique({ where: { id: workplaceId } });
  if (!workplace || workplace.userId !== session.user.id) {
    return NextResponse.json({ error: "invalid workplace" }, { status: 400 });
  }

  const from = new Date(startDate);
  const to = new Date(endDate);
  if (from > to) {
    return NextResponse.json({ error: "終了日は開始日以降にしてください" }, { status: 400 });
  }

  const weekdaySet = new Set<number>(weekdays.map(Number));
  const dates: Date[] = [];
  const cursor = new Date(from);
  while (cursor <= to) {
    if (weekdaySet.has(cursor.getDay())) dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  if (dates.length === 0) {
    return NextResponse.json({ error: "条件に一致する日付がありません" }, { status: 400 });
  }

  const created = await prisma.shift.createMany({
    data: dates.map((date) => ({
      date,
      startTime,
      endTime,
      breakMinutes: breakMinutes ? Number(breakMinutes) : 0,
      status: status || "PLANNED",
      workplaceId,
      userId: session.user.id,
    })),
  });

  return NextResponse.json({ count: created.count }, { status: 201 });
}
