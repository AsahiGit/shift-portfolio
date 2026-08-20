import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Owner can remove any member; a member can remove themself (leave the group).
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id: groupId, userId: targetUserId } = await params;
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) return NextResponse.json({ error: "not found" }, { status: 404 });

  const isOwner = group.ownerId === session.user.id;
  const isSelf = targetUserId === session.user.id;
  if (!isOwner && !isSelf) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (targetUserId === group.ownerId) {
    return NextResponse.json({ error: "オーナーは退出できません。グループを削除してください" }, { status: 400 });
  }

  await prisma.groupMember.deleteMany({ where: { groupId, userId: targetUserId } });
  return NextResponse.json({ ok: true });
}
