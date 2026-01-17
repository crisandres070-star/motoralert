"use client";

import { Suspense, useMemo, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginInner() {
    const searchParams = useSearchParams();
    const callbackUrl = useMemo(
        () => searchParams.get("callbackUrl") || "/app",
        [searchParams]
    );

    const [loading, setLoading] = useState(false);

    const handleGoogle = async () => {
        setLoading(true);
        await signIn("google", { callbackUrl });
    };

    return (
        <main className="min-h-screen flex items-center justify-center bg-gray-950 text-white px-6">
            <div className="w-full max-w-md bg-gray-900 p-6 rounded-xl border border-gray-800">
                <h1 className="text-2xl font-bold mb-1">Iniciar sesión</h1>
                <p className="text-sm text-gray-400 mb-5">
                    Elige Google o entra con tu correo y contraseña.
                </p>

                {/* Google */}
                <button
                    onClick={handleGoogle}
                    disabled={loading}
                    className="w-full bg-white text-black hover:bg-gray-200 p-3 rounded-lg font-semibold"
                >
                    {loading ? "Conectando..." : "Continuar con Google"}
                </button>

                <div className="my-4 flex items-center gap-3">
                    <div className="h-px flex-1 bg-gray-800" />
                    <span className="text-xs text-gray-500">o</span>
                    <div className="h-px flex-1 bg-gray-800" />
                </div>

                {/* Email/Password (por ahora UI) */}
                <input
                    type="email"
                    placeholder="Correo"
                    className="w-full mb-3 p-3 rounded bg-gray-800 border border-gray-700"
                />
                <input
                    type="password"
                    placeholder="Contraseña"
                    className="w-full mb-4 p-3 rounded bg-gray-800 border border-gray-700"
                />

                <button className="w-full bg-orange-600 hover:bg-orange-700 p-3 rounded-lg">
                    Entrar
                </button>

                <p className="mt-4 text-xs text-gray-400">
                    ¿No tienes cuenta?{" "}
                    <Link href="/register" className="text-orange-400 hover:underline">
                        Regístrate
                    </Link>
                </p>
            </div>
        </main>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-950" />}>
            <LoginInner />
        </Suspense>
    );
}
