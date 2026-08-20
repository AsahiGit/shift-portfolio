import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      bio: true,
      avatarColor: true,
      friendCode: true,
      createdAt: true,
    },
  });
  return NextResponse.json(user);
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { name, bio, avatarColor } = await req.json();
  if (name !== undefined && !String(name).trim()) {
    return NextResponse.json({ error: "名前は空にできません" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(name !== undefined && { name }),
      ...(bio !== undefined && { bio: bio || null }),
      ...(avatarColor !== undefined && { avatarColor }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      bio: true,
      avatarColor: true,
      friendCode: true,
      createdAt: true,
    },
  });
  return NextResponse.json(user);
}
