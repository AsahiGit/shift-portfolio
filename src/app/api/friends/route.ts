import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { friendCode: true },
  });

  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [{ requesterId: session.user.id }, { addresseeId: session.user.id }],
    },
    include: {
      requester: { select: { id: true, name: true, friendCode: true } },
      addressee: { select: { id: true, name: true, friendCode: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const friends = friendships
    .filter((f) => f.status === "ACCEPTED")
    .map((f) => ({
      friendshipId: f.id,
      ...(f.requesterId === session.user.id ? f.addressee : f.requester),
    }));

  const incomingRequests = friendships
    .filter((f) => f.status === "PENDING" && f.addresseeId === session.user.id)
    .map((f) => ({ id: f.id, from: f.requester }));

  const outgoingRequests = friendships
    .filter((f) => f.status === "PENDING" && f.requesterId === session.user.id)
    .map((f) => ({ id: f.id, to: f.addressee }));

  return NextResponse.json({
    friendCode: me?.friendCode,
    friends,
    incomingRequests,
    outgoingRequests,
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { friendCode } = await req.json();
  if (!friendCode) {
    return NextResponse.json({ error: "フレンドコードを入力してください" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { friendCode: String(friendCode).trim().toUpperCase() },
  });
  if (!target) {
    return NextResponse.json({ error: "そのコードのユーザーが見つかりません" }, { status: 404 });
  }
  if (target.id === session.user.id) {
    return NextResponse.json({ error: "自分自身は追加できません" }, { status: 400 });
  }

  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: session.user.id, addresseeId: target.id },
        { requesterId: target.id, addresseeId: session.user.id },
      ],
    },
  });
  if (existing) {
    return NextResponse.json(
      { error: existing.status === "ACCEPTED" ? "既にフレンドです" : "既に申請中です" },
      { status: 409 }
    );
  }

  const friendship = await prisma.friendship.create({
    data: { requesterId: session.user.id, addresseeId: target.id },
  });
  return NextResponse.json(friendship, { status: 201 });
}
