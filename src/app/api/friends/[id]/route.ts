import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// PATCH: accept a pending incoming request. DELETE: decline/cancel a request or unfriend.

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const friendship = await prisma.friendship.findUnique({ where: { id } });
  if (!friendship || friendship.addresseeId !== session.user.id) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  if (friendship.status !== "PENDING") {
    return NextResponse.json({ error: "既に処理済みです" }, { status: 409 });
  }

  const { action } = await req.json();
  if (action === "accept") {
    const updated = await prisma.friendship.update({
      where: { id },
      data: { status: "ACCEPTED" },
    });
    return NextResponse.json(updated);
  }

  await prisma.friendship.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const friendship = await prisma.friendship.findUnique({ where: { id } });
  if (
    !friendship ||
    (friendship.requesterId !== session.user.id && friendship.addresseeId !== session.user.id)
  ) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  await prisma.friendship.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
