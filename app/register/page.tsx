"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
    const router = useRouter();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setMsg(null);
        setLoading(true);

        const res = await fetch("/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password }),
        });

        setLoading(false);

        if (!res.ok) {
            const data = await res.json().catch(() => null);
            setMsg(data?.message || "No se pudo registrar.");
            return;
        }

        router.push("/login");
    }

    return (
        <main className="min-h-screen flex items-center justify-center bg-gray-950 text-white px-6">
            <div className="w-full max-w-md bg-gray-900 p-6 rounded-xl border border-gray-800">
                <h1 className="text-2xl font-bold mb-2">Crear cuenta</h1>
                <p className="text-sm text-gray-400 mb-5">
                    Regístrate con correo y contraseña (mínimo 6 caracteres).
                </p>

                <form onSubmit={handleSubmit}>
                    <input
                        placeholder="Nombre (opcional)"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full mb-3 p-3 rounded bg-gray-800 border border-gray-700 outline-none"
                    />

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
                        disabled={loading}
                        className="w-full bg-orange-600 hover:bg-orange-700 p-3 rounded-lg disabled:opacity-60"
                    >
                        {loading ? "Creando..." : "Crear cuenta"}
                    </button>
                </form>

                {msg && <p className="mt-4 text-sm text-red-400">{msg}</p>}

                <p className="mt-5 text-sm text-gray-400">
                    ¿Ya tienes cuenta?{" "}
                    <Link className="text-orange-400 hover:underline" href="/login">
                        Iniciar sesión
                    </Link>
                </p>
            </div>
        </main>
    );
}


