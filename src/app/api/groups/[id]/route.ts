import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const group = await prisma.group.findUnique({
    where: { id },
    include: {
      members: { include: { user: { select: { id: true, name: true, avatarColor: true } } } },
    },
  });
  if (!group || !group.members.some((m) => m.userId === session.user.id)) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: group.id,
    name: group.name,
    color: group.color,
    ownerId: group.ownerId,
    isOwner: group.ownerId === session.user.id,
    members: group.members.map((m) => m.user),
  });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const group = await prisma.group.findUnique({ where: { id } });
  if (!group || group.ownerId !== session.user.id) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  await prisma.group.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
