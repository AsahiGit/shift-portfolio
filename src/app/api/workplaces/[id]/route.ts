import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function assertOwnership(userId: string, id: string) {
  const workplace = await prisma.workplace.findUnique({ where: { id } });
  return workplace && workplace.userId === userId ? workplace : null;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const owned = await assertOwnership(session.user.id, id);
  if (!owned) return NextResponse.json({ error: "not found" }, { status: 404 });

  const body = await req.json();
  const { name, hourlyWage, color, closingDay, nightRate, overtimeRate } = body;

  const workplace = await prisma.workplace.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(hourlyWage !== undefined && { hourlyWage: Number(hourlyWage) }),
      ...(color !== undefined && { color }),
      ...(closingDay !== undefined && { closingDay: Number(closingDay) }),
      ...(nightRate !== undefined && { nightRate: Number(nightRate) }),
      ...(overtimeRate !== undefined && { overtimeRate: Number(overtimeRate) }),
    },
  });
  return NextResponse.json(workplace);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const owned = await assertOwnership(session.user.id, id);
  if (!owned) return NextResponse.json({ error: "not found" }, { status: 404 });

  await prisma.workplace.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
