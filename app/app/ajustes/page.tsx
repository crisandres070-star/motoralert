"use client";

import React, { useEffect, useState } from "react";

const LS_KEY_VEHICULOS = "motoralert_vehiculos_v1";
const LS_KEY_MANTENCIONES = "motoralert_mantenciones_v1";
const LS_KEY_HISTORIAL = "motoralert_historial_v1";

function safeJson<T>(raw: string | null, fallback: T): T {
    if (!raw) return fallback;
    try {
        return JSON.parse(raw) as T;
    } catch {
        return fallback;
    }
}

export default function AjustesPage() {
    const [toast, setToast] = useState<string | null>(null);

    // ✅ Stats en state (evita leer localStorage durante render)
    const [stats, setStats] = useState({
        vehiculos: 0,
        mantenciones: 0,
        historial: 0,
    });

    function recomputeStats() {
        try {
            const vehiculos = safeJson<any[]>(localStorage.getItem(LS_KEY_VEHICULOS), []);
            const mantenciones = safeJson<any[]>(localStorage.getItem(LS_KEY_MANTENCIONES), []);
            const historial = safeJson<any[]>(localStorage.getItem(LS_KEY_HISTORIAL), []);

            setStats({
                vehiculos: Array.isArray(vehiculos) ? vehiculos.length : 0,
                mantenciones: Array.isArray(mantenciones) ? mantenciones.length : 0,
                historial: Array.isArray(historial) ? historial.length : 0,
            });
        } catch {
            // Si por alguna razón falla, no rompe la UI
            setStats({ vehiculos: 0, mantenciones: 0, historial: 0 });
        }
    }

    // Calcula stats al entrar a la página
    useEffect(() => {
        recomputeStats();
    }, []);

    // Toast auto-hide
    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 2200);
        return () => clearTimeout(t);
    }, [toast]);

    function showToast(msg: string) {
        setToast(msg);
    }

    function confirmReset(title: string, detail: string) {
        return confirm(`⚠️ ${title}\n\n${detail}\n\n¿Seguro que quieres continuar?`);
    }

    function resetHistorial() {
        const ok = confirmReset(
            "Vas a borrar el HISTORIAL",
            "Esto elimina los eventos (ej: 'Abriste el detalle...').\nNo borra vehículos ni mantenciones."
        );
        if (!ok) return;

        try {
            localStorage.removeItem(LS_KEY_HISTORIAL);
            recomputeStats();
            showToast("✅ Historial borrado");
        } catch {
            showToast("❌ No se pudo borrar historial");
        }
    }

    function resetMantenciones() {
        const ok = confirmReset(
            "Vas a borrar las MANTENCIONES",
            "Esto elimina registros de mantenimiento.\nNo borra vehículos.\nTip: si estás probando, también puedes borrar historial."
        );
        if (!ok) return;

        try {
            localStorage.removeItem(LS_KEY_MANTENCIONES);
            recomputeStats();
            showToast("✅ Mantenciones borradas");
        } catch {
            showToast("❌ No se pudo borrar mantenciones");
        }
    }

    function resetTodo() {
        const ok = confirmReset(
            "RESET TOTAL (MotorAlert)",
            "Esto borra TODO en este navegador:\n• Vehículos\n• Mantenciones\n• Historial\n\nTu código y deploy NO se afectan."
        );
        if (!ok) return;

        try {
            localStorage.removeItem(LS_KEY_VEHICULOS);
            localStorage.removeItem(LS_KEY_MANTENCIONES);
            localStorage.removeItem(LS_KEY_HISTORIAL);
            recomputeStats();
            showToast("✅ Reset total completado");
        } catch {
            showToast("❌ No se pudo hacer reset total");
        }
    }

    return (
        <main className="mx-auto max-w-5xl px-6 py-10">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Ajustes</h1>
                    <p className="mt-1 text-sm text-gray-400">Configura tu experiencia en MotorAlert.</p>
                </div>
            </div>

            <section className="mt-6 space-y-4">
                <div className="rounded-xl border border-gray-800 bg-white/5 p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-semibold text-white">Datos y pruebas</h2>
                            <p className="mt-2 text-sm text-gray-400">
                                Si estás probando la app y se te duplicó el historial o quieres partir desde cero,
                                aquí puedes reiniciar los datos guardados en este navegador.
                            </p>
                        </div>

                        {/* Mini stats */}
                        <div className="rounded-lg border border-gray-800 bg-black/20 px-4 py-3 text-xs text-gray-400">
                            <div className="flex gap-3">
                                <span>
                                    Vehículos: <b className="text-gray-200">{stats.vehiculos}</b>
                                </span>
                                <span>
                                    Mantenciones: <b className="text-gray-200">{stats.mantenciones}</b>
                                </span>
                                <span>
                                    Historial: <b className="text-gray-200">{stats.historial}</b>
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                        <button
                            onClick={resetHistorial}
                            className="rounded-lg border border-gray-700 bg-white/5 px-4 py-2 text-sm font-semibold text-gray-200 hover:bg-white/10 transition"
                        >
                            🧾 Reset Historial
                        </button>

                        <button
                            onClick={resetMantenciones}
                            className="rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-4 py-2 text-sm font-semibold text-yellow-200 hover:bg-yellow-500/20 hover:border-yellow-500/60 transition"
                        >
                            🧰 Reset Mantenciones
                        </button>

                        <button
                            onClick={resetTodo}
                            className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/20 hover:border-red-500/60 transition"
                        >
                            🧨 Reset Todo
                        </button>
                    </div>

                    <p className="mt-4 text-xs text-gray-500 leading-relaxed">
                        *Esto borra LocalStorage en ESTE navegador. No afecta tu código, tu repo ni tu deploy.
                    </p>
                </div>
            </section>

            {/* TOAST */}
            {toast && (
                <div className="fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-xl border border-gray-800 bg-[#0b1220] px-4 py-3 text-sm font-medium shadow-2xl animate-in fade-in slide-in-from-bottom-5">
                    {toast}
                </div>
            )}
        </main>
    );
}
