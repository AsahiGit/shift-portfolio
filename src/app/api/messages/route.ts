import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Lists one conversation summary per accepted friend: last message + unread count.
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const friendships = await prisma.friendship.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ requesterId: session.user.id }, { addresseeId: session.user.id }],
    },
    include: {
      requester: { select: { id: true, name: true, avatarColor: true } },
      addressee: { select: { id: true, name: true, avatarColor: true } },
    },
  });

  const friends = friendships.map((f) =>
    f.requesterId === session.user.id ? f.addressee : f.requester
  );

  const conversations = await Promise.all(
    friends.map(async (friend) => {
      const [lastMessage, unreadCount] = await Promise.all([
        prisma.message.findFirst({
          where: {
            OR: [
              { senderId: session.user.id, receiverId: friend.id },
              { senderId: friend.id, receiverId: session.user.id },
            ],
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.message.count({
          where: { senderId: friend.id, receiverId: session.user.id, readAt: null },
        }),
      ]);
      return { friend, lastMessage, unreadCount };
    })
  );

  conversations.sort((a, b) => {
    const aTime = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
    const bTime = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
    return bTime - aTime;
  });

  return NextResponse.json(conversations);
}
