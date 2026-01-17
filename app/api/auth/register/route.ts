import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    const body = await req.json().catch(() => null);
    const name = (body?.name ?? "").trim();
    const email = (body?.email ?? "").trim().toLowerCase();
    const password = body?.password ?? "";

    if (!email || !password || password.length < 6) {
        return NextResponse.json(
            { ok: false, message: "Email y contraseña (mín 6) son requeridos." },
            { status: 400 }
        );
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
        return NextResponse.json(
            { ok: false, message: "Ese correo ya está registrado." },
            { status: 409 }
        );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.create({
        data: {
            name: name || null,
            email,
            passwordHash,
            provider: "credentials",
        },
    });

    return NextResponse.json({ ok: true });
}
