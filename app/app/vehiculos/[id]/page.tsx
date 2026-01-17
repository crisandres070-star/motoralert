"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

/* =========================================
   TYPES
========================================= */

type Vehiculo = {
    id: string;
    patente: string;
    marca: string;
    modelo: string;
    anio?: number;
    kilometraje?: number;
    vin?: string;
    createdAt: number;
};

type Mantencion = {
    id: string;
    vehiculoId: string;
    titulo: string; // ej: "Cambio de Aceite"
    fecha: string; // YYYY-MM-DD
    kilometraje: number;
    costo: number;
    notas?: string;
    createdAt: number;
};

type HistEventType = "VEHICULO_VISTO" | "MANTENCION_CREADA" | "MANTENCION_ELIMINADA";

type HistEvent = {
    id: string;
    vehiculoId: string;
    type: HistEventType;
    message: string;
    at: number;
};

/* =========================================
   CONSTS
========================================= */

const LS_KEY_VEHICULOS = "motoralert_vehiculos_v1";
const LS_KEY_MANTENCIONES = "motoralert_mantenciones_v1";
const LS_KEY_HISTORIAL = "motoralert_historial_v1";

/* =========================================
   HELPERS
========================================= */

function uid() {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        // @ts-ignore
        return crypto.randomUUID();
    }
    return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function safeJson<T>(raw: string | null, fallback: T): T {
    if (!raw) return fallback;
    try {
        return JSON.parse(raw) as T;
    } catch {
        return fallback;
    }
}

function todayISO() {
    return new Date().toISOString().split("T")[0];
}

function onlyDigits(v: string) {
    return v.replace(/[^\d]/g, "");
}

function formatMoney(amount: number) {
    const n = Number.isFinite(amount) ? amount : 0;
    return "$" + n.toLocaleString("es-CL");
}

function formatKm(n?: number) {
    if (n === undefined) return "—";
    return n.toLocaleString("es-CL") + " km";
}

/* =========================================
   PAGE
========================================= */

export default function DetalleVehiculoPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;

    // Data
    const [vehiculo, setVehiculo] = useState<Vehiculo | null>(null);
    const [mantenciones, setMantenciones] = useState<Mantencion[]>([]);
    const [historial, setHistorial] = useState<HistEvent[]>([]);
    const [loading, setLoading] = useState(true);

    // UI
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [toast, setToast] = useState<string | null>(null);

    // Evitar duplicado del evento "visto"
    const [viewLogged, setViewLogged] = useState(false);

    // Form
    const [form, setForm] = useState({
        titulo: "",
        fecha: todayISO(),
        kilometraje: "",
        costo: "",
        notas: "",
    });

    // Reset viewLogged si cambia el auto
    useEffect(() => {
        setViewLogged(false);
    }, [id]);

    // Toast auto-hide
    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 2200);
        return () => clearTimeout(t);
    }, [toast]);

    function showToast(msg: string) {
        setToast(msg);
    }

    // ESC cierra modal
    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape" && isModalOpen) setIsModalOpen(false);
        }
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [isModalOpen]);

    /* =========================================
       LOAD INITIAL
    ========================================= */

    useEffect(() => {
        if (!id) return;

        // 1) Vehículo
        const allVehiculos = safeJson<Vehiculo[]>(localStorage.getItem(LS_KEY_VEHICULOS), []);
        const found = allVehiculos.find((v) => v.id === id);

        if (!found) {
            router.push("/app/vehiculos");
            return;
        }

        setVehiculo(found);

        // 2) Mantenciones
        const allMantenciones = safeJson<Mantencion[]>(localStorage.getItem(LS_KEY_MANTENCIONES), []);
        const mine = allMantenciones
            .filter((m) => m.vehiculoId === id)
            .sort((a, b) => b.createdAt - a.createdAt);
        setMantenciones(mine);

        // 3) Historial
        const allHist = safeJson<HistEvent[]>(localStorage.getItem(LS_KEY_HISTORIAL), []);
        const mineHist = allHist
            .filter((h) => h.vehiculoId === id)
            .sort((a, b) => b.at - a.at);
        setHistorial(mineHist);

        // Evento "visto" SOLO 1 vez
        if (!viewLogged) {
            pushHist("VEHICULO_VISTO", `Abriste el detalle del vehículo (${found.patente})`, mineHist);
            setViewLogged(true);
        }

        setLoading(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    /* =========================================
       HISTORIAL PERSIST
    ========================================= */

    function persistirHistorial(nuevosDelAuto: HistEvent[]) {
        const all = safeJson<HistEvent[]>(localStorage.getItem(LS_KEY_HISTORIAL), []);
        const others = all.filter((h) => h.vehiculoId !== id);
        const toSave = [...others, ...nuevosDelAuto];
        localStorage.setItem(LS_KEY_HISTORIAL, JSON.stringify(toSave));
        setHistorial(nuevosDelAuto);
    }

    function pushHist(type: HistEventType, message: string, base?: HistEvent[]) {
        const ev: HistEvent = {
            id: uid(),
            vehiculoId: id,
            type,
            message,
            at: Date.now(),
        };

        const prev = base ?? historial;
        const updated = [ev, ...prev].slice(0, 80);
        persistirHistorial(updated);
    }

    /* =========================================
       MANTENCIONES PERSIST
    ========================================= */

    function persistirMantenciones(nuevasDelAuto: Mantencion[]) {
        const all = safeJson<Mantencion[]>(localStorage.getItem(LS_KEY_MANTENCIONES), []);
        const others = all.filter((m) => m.vehiculoId !== id);
        const toSave = [...others, ...nuevasDelAuto];
        localStorage.setItem(LS_KEY_MANTENCIONES, JSON.stringify(toSave));
        setMantenciones(nuevasDelAuto);
    }

    /* =========================================
       FORM
    ========================================= */

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        if (name === "kilometraje" || name === "costo") {
            setForm((prev) => ({ ...prev, [name]: onlyDigits(value) }));
            return;
        }

        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const tituloOk = useMemo(() => form.titulo.trim().length >= 3, [form.titulo]);
    const kmNum = useMemo(() => Number(onlyDigits(form.kilometraje || "0")) || 0, [form.kilometraje]);
    const costoNum = useMemo(() => Number(onlyDigits(form.costo || "0")) || 0, [form.costo]);

    const kmOk = useMemo(() => kmNum >= 0 && kmNum <= 2_000_000, [kmNum]);
    const costoOk = useMemo(() => costoNum >= 0 && costoNum <= 100_000_000, [costoNum]);

    const puedeGuardarMantencion = useMemo(() => tituloOk && kmOk && costoOk, [tituloOk, kmOk, costoOk]);

    function resetForm() {
        setForm({
            titulo: "",
            fecha: todayISO(),
            kilometraje: "",
            costo: "",
            notas: "",
        });
    }

    /* =========================================
       ACTIONS
    ========================================= */

    const agregarMantencion = () => {
        if (!puedeGuardarMantencion) {
            showToast("⚠️ Revisa los campos");
            return;
        }

        const nueva: Mantencion = {
            id: uid(),
            vehiculoId: id,
            titulo: form.titulo.trim(),
            fecha: form.fecha,
            kilometraje: kmNum,
            costo: costoNum,
            notas: form.notas?.trim() ? form.notas.trim() : undefined,
            createdAt: Date.now(),
        };

        const updated = [nueva, ...mantenciones].sort((a, b) => b.createdAt - a.createdAt);
        persistirMantenciones(updated);

        pushHist("MANTENCION_CREADA", `Registraste "${nueva.titulo}" (${formatKm(nueva.kilometraje)})`);
        showToast("✅ Mantención guardada");

        setIsModalOpen(false);
        resetForm();
    };

    const eliminarMantencion = (mantencionId: string) => {
        const m = mantenciones.find((x) => x.id === mantencionId);
        if (!m) return;

        if (!confirm("¿Seguro que quieres eliminar esta mantención?")) return;

        const updated = mantenciones.filter((x) => x.id !== mantencionId);
        persistirMantenciones(updated);

        pushHist("MANTENCION_ELIMINADA", `Eliminaste "${m.titulo}"`);
        showToast("🗑️ Mantención eliminada");
    };

    const totalGastado = useMemo(() => {
        return mantenciones.reduce((acc, curr) => acc + (Number.isFinite(curr.costo) ? curr.costo : 0), 0);
    }, [mantenciones]);

    /* =========================================
       RENDER
    ========================================= */

    if (loading) return <div className="p-10 text-gray-500">Cargando detalles...</div>;
    if (!vehiculo) return null;

    return (
        <main className="mx-auto max-w-4xl px-6 py-10">
            {/* Botón Volver */}
            <button
                onClick={() => router.back()}
                className="mb-6 flex items-center gap-2 text-sm text-gray-400 hover:text-white transition"
            >
                ← Volver a mis vehículos
            </button>

            {/* Tarjeta del Vehículo (Hero) */}
            <div className="rounded-2xl border border-gray-800 bg-gradient-to-br from-[#0b1220] to-[#1a2333] p-6 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold text-white">
                                {vehiculo.marca} {vehiculo.modelo}
                            </h1>
                            <span className="rounded-md border border-gray-600 bg-gray-800 px-2 py-1 text-xs font-mono text-gray-300">
                                {vehiculo.patente}
                            </span>
                        </div>
                        <p className="mt-2 text-gray-400">
                            Año {vehiculo.anio || "—"} • {formatKm(vehiculo.kilometraje)}
                            {vehiculo.vin && (
                                <span className="block sm:inline sm:ml-3 text-xs opacity-60">VIN: {vehiculo.vin}</span>
                            )}
                        </p>
                    </div>

                    <div className="text-right">
                        <p className="text-sm text-gray-400">Total invertido</p>
                        <p className="text-2xl font-bold text-green-400">{formatMoney(totalGastado)}</p>
                    </div>
                </div>
            </div>

            {/* Sección Mantenciones */}
            <div className="mt-10">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold">Historial de Mantenciones</h2>
                    <button
                        onClick={() => {
                            resetForm();
                            setIsModalOpen(true);
                        }}
                        className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold hover:bg-orange-700 transition text-white"
                    >
                        + Nueva Mantención
                    </button>
                </div>

                {mantenciones.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-800 bg-white/5 p-8 text-center">
                        <p className="text-gray-400">No hay registros de mantenimiento para este vehículo.</p>
                        <p className="text-sm text-gray-600 mt-1">Agrega cambios de aceite, revisiones, reparaciones, etc.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {mantenciones.map((m) => (
                            <div
                                key={m.id}
                                className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-gray-800 bg-[#0b1220] p-4 hover:border-gray-600 transition"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                        <h3 className="font-bold text-lg text-gray-200">{m.titulo}</h3>
                                        <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded">{m.fecha}</span>
                                    </div>
                                    <p className="text-sm text-gray-400 mt-1">
                                        Realizado a los <span className="text-gray-300">{formatKm(m.kilometraje)}</span>
                                    </p>
                                    {m.notas && <p className="text-sm text-gray-500 mt-2 italic">"{m.notas}"</p>}
                                </div>

                                <div className="flex items-center gap-4">
                                    <span className="font-mono text-lg font-medium text-green-400">{formatMoney(m.costo)}</span>
                                    <button
                                        onClick={() => eliminarMantencion(m.id)}
                                        className="p-2 text-gray-600 hover:text-red-400 transition rounded-lg hover:bg-white/5"
                                        title="Eliminar registro"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Historial */}
            <div className="mt-10">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Historial</h2>
                    <span className="text-xs text-gray-500">Últimos eventos</span>
                </div>

                {historial.length === 0 ? (
                    <div className="rounded-xl border border-gray-800 bg-white/5 p-6 text-gray-400">Aún no hay eventos.</div>
                ) : (
                    <div className="space-y-3">
                        {historial.slice(0, 15).map((h) => (
                            <div key={h.id} className="rounded-xl border border-gray-800 bg-[#0b1220] p-4">
                                <p className="text-sm text-gray-200">{h.message}</p>
                                <p className="mt-1 text-xs text-gray-500">{new Date(h.at).toLocaleString("es-CL")}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal Nueva Mantención */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
                    onMouseDown={() => setIsModalOpen(false)}
                >
                    <div
                        className="w-full max-w-md rounded-2xl border border-gray-800 bg-[#0b1220] p-6 shadow-2xl"
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-xl font-bold mb-4">Registrar Mantención</h2>

                        <div className="space-y-3">
                            <input
                                name="titulo"
                                value={form.titulo}
                                onChange={handleInputChange}
                                placeholder="Título (ej: Cambio de aceite)"
                                className={`w-full rounded-lg border bg-white/5 px-3 py-2 text-sm outline-none transition-colors ${form.titulo.length === 0 ? "border-gray-700" : tituloOk ? "border-green-600/60" : "border-red-500/70"
                                    }`}
                                autoFocus
                            />

                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    name="costo"
                                    inputMode="numeric"
                                    value={form.costo}
                                    onChange={handleInputChange}
                                    placeholder="Costo ($)"
                                    className={`w-full rounded-lg border bg-white/5 px-3 py-2 text-sm outline-none transition-colors ${form.costo.length === 0 ? "border-gray-700" : costoOk ? "border-green-600/60" : "border-red-500/70"
                                        }`}
                                />
                                <input
                                    name="kilometraje"
                                    inputMode="numeric"
                                    value={form.kilometraje}
                                    onChange={handleInputChange}
                                    placeholder="Km actuales"
                                    className={`w-full rounded-lg border bg-white/5 px-3 py-2 text-sm outline-none transition-colors ${form.kilometraje.length === 0 ? "border-gray-700" : kmOk ? "border-green-600/60" : "border-red-500/70"
                                        }`}
                                />
                            </div>

                            <input
                                name="fecha"
                                type="date"
                                value={form.fecha}
                                onChange={handleInputChange}
                                className="w-full rounded-lg border border-gray-700 bg-white/5 px-3 py-2 text-sm outline-none focus:border-orange-500 text-gray-300"
                            />

                            <textarea
                                name="notas"
                                value={form.notas}
                                onChange={handleInputChange}
                                placeholder="Notas adicionales (opcional)..."
                                rows={3}
                                className="w-full rounded-lg border border-gray-700 bg-white/5 px-3 py-2 text-sm outline-none focus:border-orange-500 resize-none"
                            />
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={agregarMantencion}
                                disabled={!puedeGuardarMantencion}
                                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${puedeGuardarMantencion ? "bg-orange-600 hover:bg-orange-700 text-white" : "bg-gray-800 text-gray-500"
                                    }`}
                            >
                                Guardar Registro
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* TOAST */}
            {toast && (
                <div className="fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-xl border border-gray-800 bg-[#0b1220] px-4 py-3 text-sm font-medium shadow-2xl animate-in fade-in slide-in-from-bottom-5">
                    {toast}
                </div>
            )}
        </main>
    );
}
