import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const handler = NextAuth({
    session: { strategy: "jwt" },
    secret: process.env.NEXTAUTH_SECRET,

    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID ?? "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        }),

        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                const email = credentials?.email?.trim().toLowerCase();
                const password = credentials?.password ?? "";

                if (!email || !password) return null;

                const user = await prisma.user.findUnique({ where: { email } });
                if (!user) return null;
                if (!user.passwordHash) return null; // cuenta creada con Google

                const ok = await bcrypt.compare(password, user.passwordHash);
                if (!ok) return null;

                return {
                    id: user.id,
                    name: user.name ?? user.email,
                    email: user.email,
                    image: user.image ?? null,
                };
            },
        }),
    ],

    callbacks: {
        async signIn({ user, account }) {
            // Si entra con Google: crea usuario si no existe
            if (account?.provider === "google") {
                const email = user.email?.toLowerCase();
                if (!email) return false;

                const exists = await prisma.user.findUnique({ where: { email } });
                if (!exists) {
                    await prisma.user.create({
                        data: {
                            email,
                            name: user.name ?? null,
                            image: user.image ?? null,
                            provider: "google",
                        },
                    });
                }
            }
            return true;
        },

        async jwt({ token }) {
            // asegura que tengamos el userId real desde DB
            if (token.email) {
                const dbUser = await prisma.user.findUnique({
                    where: { email: String(token.email).toLowerCase() },
                });
                if (dbUser) token.sub = dbUser.id;
            }
            return token;
        },

        async session({ session, token }) {
            if (session.user && token?.sub) {
                (session.user as any).id = token.sub;
            }
            return session;
        },
    },

    pages: {
        signIn: "/login",
    },
});

export { handler as GET, handler as POST };
