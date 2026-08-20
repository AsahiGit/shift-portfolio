import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const groups = await prisma.group.findMany({
    where: { members: { some: { userId: session.user.id } } },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, avatarColor: true } } },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const result = groups.map((g) => ({
    id: g.id,
    name: g.name,
    color: g.color,
    ownerId: g.ownerId,
    isOwner: g.ownerId === session.user.id,
    members: g.members.map((m) => m.user),
  }));

  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { name, color } = await req.json();
  if (!name || !String(name).trim()) {
    return NextResponse.json({ error: "グループ名を入力してください" }, { status: 400 });
  }

  const group = await prisma.group.create({
    data: {
      name: String(name).trim(),
      color: color || "#0071e3",
      ownerId: session.user.id,
      members: { create: { userId: session.user.id } },
    },
    include: {
      members: { include: { user: { select: { id: true, name: true, avatarColor: true } } } },
    },
  });

  return NextResponse.json(
    {
      id: group.id,
      name: group.name,
      color: group.color,
      ownerId: group.ownerId,
      isOwner: true,
      members: group.members.map((m) => m.user),
    },
    { status: 201 }
  );
}
