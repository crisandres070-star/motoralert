"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

/* =========================================
   TYPES & UTILS
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

const LS_KEY = "motoralert_vehiculos_v1";

// --- Helpers ---

function uid() {
    return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function formatKm(n?: number) {
    if (n === undefined) return "—";
    return n.toLocaleString("es-CL");
}

function normalizePatente(input: string) {
    return input.toUpperCase().replace(/[^A-Z0-9]/g, "").trim();
}

// Lógica de Revisión Técnica Chile
function getEstadoRevision(patente: string, anio?: number) {
    if (!anio) return "unknown";

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth(); // 0 = Enero, 1 = Febrero...

    if (currentYear - anio < 3) return "ok";

    const match = patente.match(/\d$/);
    if (!match) return "unknown";

    const lastDigit = parseInt(match[0], 10);

    const calendario: Record<number, number> = {
        9: 0, 0: 1, 1: 3, 2: 4, 3: 5, 4: 6, 5: 7, 6: 8, 7: 9, 8: 10
    };

    const mesToca = calendario[lastDigit];

    if (mesToca === undefined) return "ok";

    if (currentMonth > mesToca) return "vencida";
    if (currentMonth === mesToca) return "toca_ahora";
    return "ok";
}

function toIntOrUndefined(v: string) { const t = v.trim(); if (!t) return undefined; const n = Number(t); if (!Number.isFinite(n)) return undefined; return Math.trunc(n); }
function toNumberOrUndefined(v: unknown): number | undefined { if (typeof v === "number" && Number.isFinite(v)) return v; if (typeof v === "string") { const t = v.trim(); if (!t) return undefined; const n = Number(t); if (!Number.isFinite(n)) return undefined; return Math.trunc(n); } return undefined; }
function safeParseVehicles(raw: string | null): Vehiculo[] { if (!raw) return []; try { const data = JSON.parse(raw); if (!Array.isArray(data)) return []; return data.map((v: any) => ({ id: String(v.id ?? uid()), patente: String(v.patente ?? ""), marca: String(v.marca ?? ""), modelo: String(v.modelo ?? ""), anio: toNumberOrUndefined(v.anio), kilometraje: toNumberOrUndefined(v.kilometraje), vin: typeof v.vin === "string" ? v.vin : undefined, createdAt: toNumberOrUndefined(v.createdAt) ?? Date.now(), })).filter((v: Vehiculo) => v.patente); } catch { return []; } }
function patenteEsValida(p: string) { const x = normalizePatente(p); const r1 = /^[A-Z]{2}[0-9]{4}$/; const r2 = /^[A-Z]{4}[0-9]{2}$/; const r3 = /^[A-Z]{2}[0-9]{2}[A-Z]{2}$/; return r1.test(x) || r2.test(x) || r3.test(x); }
function normalizeVIN(input: string) { return input.toUpperCase().replace(/[^A-Z0-9]/g, "").trim(); }
function isVINFormatValid(vin: string) { const v = normalizeVIN(vin); if (v.length !== 17) return false; if (/[IOQ]/.test(v)) return false; return /^[A-HJ-NPR-Z0-9]{17}$/.test(v); }
const VIN_TRANSLITERATION: Record<string, number> = { A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9, S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9, };
const VIN_WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];
function vinCharValue(ch: string) { if (ch >= "0" && ch <= "9") return Number(ch); return VIN_TRANSLITERATION[ch] ?? -1; }
function isVINChecksumValid(vin: string) { const v = normalizeVIN(vin); if (!isVINFormatValid(v)) return false; const checkChar = v[8]; let sum = 0; for (let i = 0; i < 17; i++) { const val = vinCharValue(v[i]); if (val < 0) return false; sum += val * VIN_WEIGHTS[i]; } const remainder = sum % 11; const expected = remainder === 10 ? "X" : String(remainder); return checkChar === expected; }
function isVINValid(vin: string) { const v = normalizeVIN(vin); if (!v) return true; if (!isVINFormatValid(v)) return false; return isVINChecksumValid(v); }

/* =========================================
   COMPONENTE PRINCIPAL
========================================= */

type Mode = "create" | "edit";

const INITIAL_FORM = {
    patente: "",
    marca: "",
    modelo: "",
    anio: "",
    kilometraje: "",
    vin: "",
};

export default function VehiculosPage() {
    const router = useRouter();
    const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
    const [loaded, setLoaded] = useState(false);

    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState<Mode>("create");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState(INITIAL_FORM);
    const [toast, setToast] = useState<string | null>(null);

    useEffect(() => {
        const raw = localStorage.getItem(LS_KEY);
        const parsed = safeParseVehicles(raw);
        setVehiculos(parsed);
        setLoaded(true);
    }, []);

    useEffect(() => {
        if (!loaded) return;
        localStorage.setItem(LS_KEY, JSON.stringify(vehiculos));
    }, [vehiculos, loaded]);

    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 2200);
        return () => clearTimeout(t);
    }, [toast]);

    function showToast(msg: string) {
        setToast(msg);
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === "anio" || name === "kilometraje") {
            setForm((prev) => ({ ...prev, [name]: value.replace(/[^\d]/g, "") }));
        } else {
            setForm((prev) => ({ ...prev, [name]: value }));
        }
    };

    function limpiarForm() {
        setForm(INITIAL_FORM);
    }

    function closeModal() {
        setOpen(false);
        setMode("create");
        setEditingId(null);
        limpiarForm();
    }

    function openCreate() {
        setMode("create");
        setEditingId(null);
        limpiarForm();
        setOpen(true);
    }

    function openEdit(v: Vehiculo) {
        setMode("edit");
        setEditingId(v.id);
        setForm({
            patente: v.patente ?? "",
            marca: v.marca ?? "",
            modelo: v.modelo ?? "",
            anio: v.anio ? String(v.anio) : "",
            kilometraje: v.kilometraje ? String(v.kilometraje) : "",
            vin: v.vin ?? "",
        });
        setOpen(true);
    }

    const patenteNorm = useMemo(() => normalizePatente(form.patente), [form.patente]);

    const patenteValida = useMemo(
        () => (patenteNorm ? patenteEsValida(patenteNorm) : false),
        [patenteNorm]
    );

    const duplicada = useMemo(() => {
        if (!patenteNorm) return false;
        return vehiculos.some((v) => {
            const samePat = normalizePatente(v.patente) === patenteNorm;
            if (!samePat) return false;
            if (mode === "edit" && editingId && v.id === editingId) return false;
            return true;
        });
    }, [vehiculos, patenteNorm, mode, editingId]);

    const marcaOk = useMemo(() => form.marca.trim().length >= 2, [form.marca]);
    const modeloOk = useMemo(() => form.modelo.trim().length >= 2, [form.modelo]);
    const anioNum = useMemo(() => toIntOrUndefined(form.anio), [form.anio]);
    const kmNum = useMemo(() => toIntOrUndefined(form.kilometraje), [form.kilometraje]);
    const anioOk = useMemo(() => {
        if (anioNum === undefined) return false;
        const actual = new Date().getFullYear();
        return anioNum >= 1950 && anioNum <= actual + 1;
    }, [anioNum]);
    const kmOk = useMemo(() => {
        if (kmNum === undefined) return false;
        return kmNum >= 0 && kmNum <= 2_000_000;
    }, [kmNum]);
    const vinNorm = useMemo(() => normalizeVIN(form.vin), [form.vin]);
    const vinOk = useMemo(() => isVINValid(vinNorm), [vinNorm]);

    const puedeGuardar = useMemo(() => {
        return (patenteValida && !duplicada && marcaOk && modeloOk && anioOk && kmOk && vinOk);
    }, [patenteValida, duplicada, marcaOk, modeloOk, anioOk, kmOk, vinOk]);

    function guardar() {
        if (!puedeGuardar) return;
        if (mode === "create") {
            const nuevo: Vehiculo = {
                id: uid(),
                patente: patenteNorm,
                marca: form.marca.trim(),
                modelo: form.modelo.trim(),
                anio: anioNum,
                kilometraje: kmNum,
                vin: vinNorm ? vinNorm : undefined,
                createdAt: Date.now(),
            };
            setVehiculos((prev) => [nuevo, ...prev]);
            showToast("✅ Vehículo guardado");
            closeModal();
            return;
        }
        if (!editingId) return;
        setVehiculos((prev) =>
            prev.map((v) => {
                if (v.id !== editingId) return v;
                return {
                    ...v,
                    patente: patenteNorm,
                    marca: form.marca.trim(),
                    modelo: form.modelo.trim(),
                    anio: anioNum,
                    kilometraje: kmNum,
                    vin: vinNorm ? vinNorm : undefined,
                };
            })
        );
        showToast("✅ Cambios guardados");
        closeModal();
    }

    function eliminarVehiculo(id: string) {
        if (!confirm("¿Seguro que quieres eliminar este vehículo?")) return;
        setVehiculos((prev) => prev.filter((v) => v.id !== id));
        showToast("🗑️ Vehículo eliminado");
    }

    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape" && open) closeModal();
        }
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open]);

    if (!loaded) {
        return <div className="p-10 text-center text-gray-500">Cargando...</div>;
    }

    return (
        <main className="mx-auto max-w-5xl px-6 py-10">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Mis vehículos</h1>
                    <p className="mt-1 text-sm text-gray-400">
                        Administra tus vehículos y revisa sus alertas.
                    </p>
                </div>

                <button
                    onClick={openCreate}
                    className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold hover:bg-orange-700 transition"
                >
                    + Agregar
                </button>
            </div>

            <section className="mt-6">
                {vehiculos.length === 0 ? (
                    <div className="rounded-xl border border-gray-800 bg-white/5 p-6 text-center sm:text-left">
                        <h2 className="text-lg font-semibold">Aún no tienes vehículos</h2>
                        <p className="mt-2 text-sm text-gray-400">
                            Agrega tu primer vehículo para comenzar.
                        </p>
                        <div className="mt-4">
                            <button
                                onClick={openCreate}
                                className="rounded-lg border border-gray-700 px-4 py-2 text-sm hover:bg-white/5 transition"
                            >
                                Agregar mi primer vehículo
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {vehiculos.map((v) => {
                            // Calculamos el estado de la Revisión Técnica
                            const estadoRT = getEstadoRevision(v.patente, v.anio);

                            // Definimos colores según el estado
                            let borderClass = "border-gray-800 hover:border-gray-600";
                            let badge = null;

                            if (estadoRT === "vencida") {
                                borderClass = "border-red-500/50 hover:border-red-500 shadow-[0_0_15px_-3px_rgba(239,68,68,0.2)]";
                                badge = <span className="absolute top-3 right-3 rounded bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-400 uppercase tracking-wide">Revisión Vencida</span>;
                            } else if (estadoRT === "toca_ahora") {
                                borderClass = "border-yellow-500/50 hover:border-yellow-500 shadow-[0_0_15px_-3px_rgba(234,179,8,0.2)]";
                                badge = <span className="absolute top-3 right-3 rounded bg-yellow-500/20 px-2 py-0.5 text-[10px] font-bold text-yellow-400 uppercase tracking-wide">Toca este mes</span>;
                            }

                            return (
                                <button
                                    key={v.id}
                                    type="button"
                                    onClick={() => router.push(`/app/vehiculos/${v.id}`)}
                                    className={`text-left group relative rounded-xl border bg-white/5 p-5 transition-all w-full ${borderClass}`}
                                >
                                    {badge}

                                    <div className="flex items-start justify-between gap-3 mt-2">
                                        <div>
                                            <p className="text-xs text-gray-400 uppercase font-semibold">Patente</p>
                                            <p className="text-lg font-bold tracking-wide text-white">
                                                {v.patente}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-3 text-sm">
                                        <p className="text-gray-200 font-medium text-lg">
                                            {v.marca} {v.modelo}
                                        </p>

                                        <p className="mt-1 text-xs text-gray-400">
                                            Año: {typeof v.anio === "number" ? v.anio : "—"} · Km:{" "}
                                            {typeof v.kilometraje === "number"
                                                ? formatKm(v.kilometraje)
                                                : "—"}
                                        </p>

                                        <div className="mt-4 flex gap-2">
                                            <div
                                                role="button"
                                                tabIndex={0}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openEdit(v);
                                                }}
                                                className="rounded-md border border-gray-700 px-3 py-1.5 text-xs text-gray-300 hover:bg-white/10 hover:text-white transition z-10"
                                            >
                                                ✏️ Editar
                                            </div>

                                            <div
                                                role="button"
                                                tabIndex={0}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    eliminarVehiculo(v.id);
                                                }}
                                                className="rounded-md border border-gray-700 px-3 py-1.5 text-xs text-gray-300 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/50 transition z-10"
                                            >
                                                🗑️ Eliminar
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </section>

            {open && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
                    onMouseDown={closeModal}
                >
                    <div
                        className="w-full max-w-md rounded-2xl border border-gray-800 bg-[#0b1220] p-6 shadow-2xl"
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <div className="mb-4">
                            <h2 className="text-xl font-bold">
                                {mode === "create" ? "Agregar vehículo" : "Editar vehículo"}
                            </h2>
                            <p className="mt-1 text-sm text-gray-400">
                                {mode === "create" ? "Datos principales." : "Modifica los datos."}
                            </p>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <input
                                    name="patente"
                                    value={form.patente}
                                    onChange={handleChange}
                                    placeholder="Patente (ej: AB1234 / ABCD12)"
                                    className={`w-full rounded-lg border bg-white/5 px-3 py-2 text-sm outline-none transition-colors ${form.patente.length === 0 ? "border-gray-700" : patenteValida && !duplicada ? "border-green-600/60" : "border-red-500/70"
                                        }`}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <input name="marca" value={form.marca} onChange={handleChange} placeholder="Marca" className="w-full rounded-lg border border-gray-700 bg-white/5 px-3 py-2 text-sm outline-none" />
                                <input name="modelo" value={form.modelo} onChange={handleChange} placeholder="Modelo" className="w-full rounded-lg border border-gray-700 bg-white/5 px-3 py-2 text-sm outline-none" />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <input name="anio" value={form.anio} onChange={handleChange} placeholder="Año" maxLength={4} className="w-full rounded-lg border border-gray-700 bg-white/5 px-3 py-2 text-sm outline-none" />
                                <input name="kilometraje" value={form.kilometraje} onChange={handleChange} placeholder="Km" className="w-full rounded-lg border border-gray-700 bg-white/5 px-3 py-2 text-sm outline-none" />
                            </div>

                            <input name="vin" value={form.vin} onChange={handleChange} placeholder="VIN (Opcional)" maxLength={17} className="w-full rounded-lg border border-gray-700 bg-white/5 px-3 py-2 text-sm outline-none" />

                            <div className="mt-6 flex justify-end gap-3">
                                <button onClick={closeModal} className="rounded-lg border border-gray-700 px-4 py-2 text-sm hover:bg-white/5">Cancelar</button>
                                <button onClick={guardar} disabled={!puedeGuardar} className={`rounded-lg px-4 py-2 text-sm font-semibold ${puedeGuardar ? "bg-orange-600 hover:bg-orange-700 text-white" : "bg-gray-800 text-gray-500"}`}>{mode === "create" ? "Guardar" : "Guardar cambios"}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {toast && (
                <div className="fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-xl border border-gray-800 bg-[#0b1220] px-4 py-3 text-sm font-medium shadow-2xl animate-in fade-in slide-in-from-bottom-5">
                    {toast}
                </div>
            )}
        </main>
    );
}