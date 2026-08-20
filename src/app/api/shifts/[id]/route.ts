import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function assertOwnership(userId: string, id: string) {
  const shift = await prisma.shift.findUnique({ where: { id } });
  return shift && shift.userId === userId ? shift : null;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const owned = await assertOwnership(session.user.id, id);
  if (!owned) return NextResponse.json({ error: "not found" }, { status: 404 });

  const body = await req.json();
  const { date, startTime, endTime, breakMinutes, memo, status, workplaceId } = body;

  const shift = await prisma.shift.update({
    where: { id },
    data: {
      ...(date !== undefined && { date: new Date(date) }),
      ...(startTime !== undefined && { startTime }),
      ...(endTime !== undefined && { endTime }),
      ...(breakMinutes !== undefined && { breakMinutes: Number(breakMinutes) }),
      ...(memo !== undefined && { memo }),
      ...(status !== undefined && { status }),
      ...(workplaceId !== undefined && { workplaceId }),
    },
    include: { workplace: { include: { wageRules: true } } },
  });
  return NextResponse.json(shift);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const owned = await assertOwnership(session.user.id, id);
  if (!owned) return NextResponse.json({ error: "not found" }, { status: 404 });

  await prisma.shift.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
