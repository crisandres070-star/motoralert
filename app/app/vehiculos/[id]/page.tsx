"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";

/* =========================================
   TYPES (Reutilizamos y agregamos Mantencion)
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
    fecha: string;  // YYYY-MM-DD
    kilometraje: number;
    costo: number;
    notas?: string;
    createdAt: number;
};

const LS_KEY_VEHICULOS = "motoralert_vehiculos_v1";
const LS_KEY_MANTENCIONES = "motoralert_mantenciones_v1";

function uid() {
    return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function formatMoney(amount: number) {
    return "$" + amount.toLocaleString("es-CL");
}

function formatKm(n?: number) {
    if (n === undefined) return "—";
    return n.toLocaleString("es-CL") + " km";
}

export default function DetalleVehiculoPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string; // El ID del vehículo desde la URL

    // Estados
    const [vehiculo, setVehiculo] = useState<Vehiculo | null>(null);
    const [mantenciones, setMantenciones] = useState<Mantencion[]>([]);
    const [loading, setLoading] = useState(true);

    // Estado Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form, setForm] = useState({
        titulo: "",
        fecha: new Date().toISOString().split("T")[0], // Hoy
        kilometraje: "",
        costo: "",
        notas: "",
    });

    // Cargar datos iniciales
    useEffect(() => {
        if (!id) return;

        // 1. Cargar Vehículos y buscar el actual
        const rawVehiculos = localStorage.getItem(LS_KEY_VEHICULOS);
        if (rawVehiculos) {
            const allVehiculos: Vehiculo[] = JSON.parse(rawVehiculos);
            const found = allVehiculos.find((v) => v.id === id);
            if (found) {
                setVehiculo(found);
            } else {
                // Si no existe el auto, volver al inicio
                router.push("/vehiculos");
                return;
            }
        }

        // 2. Cargar Mantenciones y filtrar por este vehiculo
        const rawMantenciones = localStorage.getItem(LS_KEY_MANTENCIONES);
        if (rawMantenciones) {
            const allMantenciones: Mantencion[] = JSON.parse(rawMantenciones);
            // Filtramos solo las que pertenecen a este auto (Relación 1:N)
            const filtered = allMantenciones
                .filter((m) => m.vehiculoId === id)
                .sort((a, b) => b.createdAt - a.createdAt); // Ordenar por fecha de creación descendente
            setMantenciones(filtered);
        }

        setLoading(false);
    }, [id, router]);

    // Guardar Mantenciones cuando cambie el estado
    // Nota: Leemos todo el LS, filtramos los de OTROS autos, y agregamos los nuestros actualizados
    function persistirMantenciones(nuevasMantencionesDelAuto: Mantencion[]) {
        const rawAll = localStorage.getItem(LS_KEY_MANTENCIONES);
        let others: Mantencion[] = [];

        if (rawAll) {
            const allParsed: Mantencion[] = JSON.parse(rawAll);
            others = allParsed.filter((m) => m.vehiculoId !== id);
        }

        const toSave = [...others, ...nuevasMantencionesDelAuto];
        localStorage.setItem(LS_KEY_MANTENCIONES, JSON.stringify(toSave));
        setMantenciones(nuevasMantencionesDelAuto);
    }

    // --- Handlers ---

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const agregarMantencion = () => {
        if (!form.titulo || !form.costo || !form.kilometraje) return;

        const nueva: Mantencion = {
            id: uid(),
            vehiculoId: id,
            titulo: form.titulo,
            fecha: form.fecha,
            kilometraje: Number(form.kilometraje.replace(/[^\d]/g, "")),
            costo: Number(form.costo.replace(/[^\d]/g, "")),
            notas: form.notas,
            createdAt: Date.now(),
        };

        const updated = [nueva, ...mantenciones];
        persistirMantenciones(updated);

        setIsModalOpen(false);
        setForm({
            titulo: "",
            fecha: new Date().toISOString().split("T")[0],
            kilometraje: "",
            costo: "",
            notas: "",
        });
    };

    const eliminarMantencion = (mantencionId: string) => {
        const updated = mantenciones.filter((m) => m.id !== mantencionId);
        persistirMantenciones(updated);
    };

    const totalGastado = useMemo(() => {
        return mantenciones.reduce((acc, curr) => acc + curr.costo, 0);
    }, [mantenciones]);

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
                            <h1 className="text-3xl font-bold text-white">{vehiculo.marca} {vehiculo.modelo}</h1>
                            <span className="rounded-md border border-gray-600 bg-gray-800 px-2 py-1 text-xs font-mono text-gray-300">
                                {vehiculo.patente}
                            </span>
                        </div>
                        <p className="mt-2 text-gray-400">
                            Año {vehiculo.anio || "—"} • {formatKm(vehiculo.kilometraje)}
                            {vehiculo.vin && <span className="block sm:inline sm:ml-3 text-xs opacity-60">VIN: {vehiculo.vin}</span>}
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
                        onClick={() => setIsModalOpen(true)}
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
                            <div key={m.id} className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-gray-800 bg-[#0b1220] p-4 hover:border-gray-600 transition">
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

            {/* Modal Nueva Mantención */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-[#0b1220] p-6 shadow-2xl">
                        <h2 className="text-xl font-bold mb-4">Registrar Mantención</h2>

                        <div className="space-y-3">
                            <input
                                name="titulo"
                                value={form.titulo}
                                onChange={handleInputChange}
                                placeholder="Título (ej: Cambio de aceite)"
                                className="w-full rounded-lg border border-gray-700 bg-white/5 px-3 py-2 text-sm outline-none focus:border-orange-500"
                                autoFocus
                            />

                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    name="costo"
                                    type="number"
                                    value={form.costo}
                                    onChange={handleInputChange}
                                    placeholder="Costo ($)"
                                    className="w-full rounded-lg border border-gray-700 bg-white/5 px-3 py-2 text-sm outline-none focus:border-orange-500"
                                />
                                <input
                                    name="kilometraje"
                                    type="number"
                                    value={form.kilometraje}
                                    onChange={handleInputChange}
                                    placeholder="Km actuales"
                                    className="w-full rounded-lg border border-gray-700 bg-white/5 px-3 py-2 text-sm outline-none focus:border-orange-500"
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
                                className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 transition"
                            >
                                Guardar Registro
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}