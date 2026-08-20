import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id: groupId } = await params;
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group || group.ownerId !== session.user.id) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

  const friendship = await prisma.friendship.findFirst({
    where: {
      status: "ACCEPTED",
      OR: [
        { requesterId: session.user.id, addresseeId: userId },
        { requesterId: userId, addresseeId: session.user.id },
      ],
    },
  });
  if (!friendship) {
    return NextResponse.json({ error: "フレンドのみ追加できます" }, { status: 400 });
  }

  const existing = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  if (existing) {
    return NextResponse.json({ error: "既にメンバーです" }, { status: 409 });
  }

  await prisma.groupMember.create({ data: { groupId, userId } });
  return NextResponse.json({ ok: true }, { status: 201 });
}
