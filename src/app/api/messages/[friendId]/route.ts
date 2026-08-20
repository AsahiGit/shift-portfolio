import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function assertFriendship(userId: string, friendId: string) {
  const friendship = await prisma.friendship.findFirst({
    where: {
      status: "ACCEPTED",
      OR: [
        { requesterId: userId, addresseeId: friendId },
        { requesterId: friendId, addresseeId: userId },
      ],
    },
  });
  return !!friendship;
}

export async function GET(_req: Request, { params }: { params: Promise<{ friendId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { friendId } = await params;
  if (!(await assertFriendship(session.user.id, friendId))) {
    return NextResponse.json({ error: "フレンドではありません" }, { status: 403 });
  }

  const friend = await prisma.user.findUnique({
    where: { id: friendId },
    select: { id: true, name: true, avatarColor: true },
  });
  if (!friend) return NextResponse.json({ error: "not found" }, { status: 404 });

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: session.user.id, receiverId: friendId },
        { senderId: friendId, receiverId: session.user.id },
      ],
    },
    orderBy: { createdAt: "asc" },
  });

  await prisma.message.updateMany({
    where: { senderId: friendId, receiverId: session.user.id, readAt: null },
    data: { readAt: new Date() },
  });

  return NextResponse.json({ friend, messages });
}

export async function POST(req: Request, { params }: { params: Promise<{ friendId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { friendId } = await params;
  if (!(await assertFriendship(session.user.id, friendId))) {
    return NextResponse.json({ error: "フレンドではありません" }, { status: 403 });
  }

  const { content } = await req.json();
  if (!content || !String(content).trim()) {
    return NextResponse.json({ error: "メッセージを入力してください" }, { status: 400 });
  }

  const message = await prisma.message.create({
    data: {
      senderId: session.user.id,
      receiverId: friendId,
      content: String(content).trim().slice(0, 2000),
    },
  });
  return NextResponse.json(message, { status: 201 });
}
