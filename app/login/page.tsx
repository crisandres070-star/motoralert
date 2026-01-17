"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import Link from "next/link";

export default function LoginPage() {
    const router = useRouter();
    const sp = useSearchParams();

    const callbackUrl = useMemo(() => sp.get("callbackUrl") || "/app", [sp]);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loadingGoogle, setLoadingGoogle] = useState(false);
    const [loadingCreds, setLoadingCreds] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);

    async function handleGoogle() {
        setMsg(null);
        setLoadingGoogle(true);
        await signIn("google", { callbackUrl });
        setLoadingGoogle(false);
    }

    async function handleCredentials(e: React.FormEvent) {
        e.preventDefault();
        setMsg(null);
        setLoadingCreds(true);

        const res = await signIn("credentials", {
            redirect: false,
            email,
            password,
            callbackUrl,
        });

        setLoadingCreds(false);

        if (!res || res.error) {
            setMsg("Correo o contraseña incorrectos (o cuenta es solo Google).");
            return;
        }

        router.push(callbackUrl);
    }

    return (
        <main className="min-h-screen flex items-center justify-center bg-gray-950 text-white px-6">
            <div className="w-full max-w-md bg-gray-900 p-6 rounded-xl border border-gray-800">
                <h1 className="text-2xl font-bold mb-2">Iniciar sesión</h1>
                <p className="text-sm text-gray-400 mb-5">
                    Elige Google o entra con tu correo y contraseña.
                </p>

                {/* Google */}
                <button
                    onClick={handleGoogle}
                    disabled={loadingGoogle}
                    className="w-full bg-white text-black font-semibold p-3 rounded-lg hover:opacity-90 disabled:opacity-60"
                >
                    {loadingGoogle ? "Conectando con Google..." : "Continuar con Google"}
                </button>

                <div className="my-5 flex items-center gap-3 text-gray-500 text-xs">
                    <div className="h-px bg-gray-800 flex-1" />
                    O
                    <div className="h-px bg-gray-800 flex-1" />
                </div>

                {/* Credenciales */}
                <form onSubmit={handleCredentials}>
                    <input
                        type="email"
                        placeholder="Correo"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full mb-3 p-3 rounded bg-gray-800 border border-gray-700 outline-none"
                    />

                    <input
                        type="password"
                        placeholder="Contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full mb-4 p-3 rounded bg-gray-800 border border-gray-700 outline-none"
                    />

                    <button
                        disabled={loadingCreds}
                        className="w-full bg-orange-600 hover:bg-orange-700 p-3 rounded-lg disabled:opacity-60"
                    >
                        {loadingCreds ? "Entrando..." : "Entrar"}
                    </button>
                </form>

                {msg && <p className="mt-4 text-sm text-red-400">{msg}</p>}

                <p className="mt-5 text-sm text-gray-400">
                    ¿No tienes cuenta?{" "}
                    <Link className="text-orange-400 hover:underline" href="/register">
                        Regístrate
                    </Link>
                </p>
            </div>
        </main>
    );
}
