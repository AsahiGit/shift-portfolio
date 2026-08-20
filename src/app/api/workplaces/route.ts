import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type WageRuleBody = { label: string; startTime: string; endTime: string; rate: number };

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const workplaces = await prisma.workplace.findMany({
    where: { userId: session.user.id },
    include: { wageRules: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(workplaces);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, hourlyWage, color, closingDay, payDay, nightRate, overtimeRate, wageRules } = body;

  if (!name || !hourlyWage) {
    return NextResponse.json({ error: "名前と時給は必須です" }, { status: 400 });
  }

  const rules: WageRuleBody[] = Array.isArray(wageRules) ? wageRules : [];

  const workplace = await prisma.workplace.create({
    data: {
      name,
      hourlyWage: Number(hourlyWage),
      color: color || "#3b82f6",
      closingDay: closingDay ? Number(closingDay) : 31,
      payDay: payDay ? Number(payDay) : 25,
      nightRate: nightRate ? Number(nightRate) : 1.25,
      overtimeRate: overtimeRate ? Number(overtimeRate) : 1.25,
      userId: session.user.id,
      wageRules: {
        create: rules.map((r) => ({
          label: r.label,
          startTime: r.startTime,
          endTime: r.endTime,
          rate: Number(r.rate),
        })),
      },
    },
    include: { wageRules: true },
  });
  return NextResponse.json(workplace, { status: 201 });
}
