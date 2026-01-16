"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
// Sin importaciones externas para evitar errores

/* =========================================
   TYPES & UTILS
========================================= */
type Vehiculo = { id: string; patente: string; anio?: number; marca: string; modelo: string };

const LS_KEY_VEHICULOS = "motoralert_vehiculos_v1";

// Lógica de revisión técnica
function getEstadoRevision(patente: string, anio?: number) {
    if (!anio) return "unknown";
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    if (currentYear - anio < 3) return "ok";
    const match = patente.match(/\d$/);
    if (!match) return "unknown";
    const lastDigit = parseInt(match[0], 10);
    const calendario: Record<number, number> = { 9: 0, 0: 1, 1: 3, 2: 4, 3: 5, 4: 6, 5: 7, 6: 8, 7: 9, 8: 10 };
    const mesToca = calendario[lastDigit];
    if (mesToca === undefined) return "ok";

    if (currentMonth > mesToca) return "vencida";
    if (currentMonth === mesToca) return "toca_ahora";
    return "ok";
}

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

export default function AlertasPage() {
    const [alertas, setAlertas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const raw = localStorage.getItem(LS_KEY_VEHICULOS);
        const vehiculos: Vehiculo[] = raw ? JSON.parse(raw) : [];

        const nuevasAlertas: any[] = [];

        vehiculos.forEach(v => {
            const estado = getEstadoRevision(v.patente, v.anio);

            if (estado === "vencida") {
                nuevasAlertas.push({
                    id: v.id,
                    tipo: "vencida",
                    titulo: "Revisión Vencida",
                    mensaje: `La patente de tu ${v.marca} ${v.modelo} terminó su periodo.`,
                    color: "red",
                    emoji: "🚨",
                    vehiculo: v
                });
            } else if (estado === "toca_ahora") {
                nuevasAlertas.push({
                    id: v.id,
                    tipo: "aviso",
                    titulo: "Toca Revisión Técnica",
                    mensaje: `A la patente terminada en ${v.patente.slice(-1)} le corresponde en ${MESES[new Date().getMonth()]}.`,
                    color: "yellow",
                    emoji: "📅",
                    vehiculo: v
                });
            }
        });

        setAlertas(nuevasAlertas);
        setLoading(false);
    }, []);

    if (loading) return null;

    return (
        <main className="mx-auto max-w-xl px-6 py-10">
            <h1 className="text-2xl font-bold mb-2 text-white">Centro de Alertas</h1>
            <p className="text-gray-400 mb-8">Avisos importantes de tu flota.</p>

            {alertas.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-800 bg-white/5 p-10 text-center">
                    <div className="mb-4 rounded-full bg-green-500/20 p-4 text-3xl">
                        ✅
                    </div>
                    <h2 className="text-lg font-bold text-white">Todo al día</h2>
                    <p className="mt-2 text-sm text-gray-400">
                        No tienes revisiones ni mantenciones pendientes. ¡Buen viaje!
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {alertas.map((alerta, idx) => (
                        <Link
                            key={idx}
                            href={`/app/vehiculos/${alerta.id}`}
                            className={`flex items-start gap-4 rounded-xl border p-5 transition-transform hover:scale-[1.02] ${alerta.color === "red"
                                ? "border-red-500/30 bg-red-900/10"
                                : "border-yellow-500/30 bg-yellow-900/10"
                                }`}
                        >
                            <div className={`mt-1 rounded-full p-2 text-xl ${alerta.color === "red" ? "bg-red-500/20" : "bg-yellow-500/20"
                                }`}>
                                {alerta.emoji}
                            </div>

                            <div>
                                <h3 className={`font-bold ${alerta.color === "red" ? "text-red-400" : "text-yellow-400"}`}>
                                    {alerta.titulo}
                                </h3>
                                <p className="text-sm text-gray-300 mt-1">
                                    {alerta.mensaje}
                                </p>
                                <p className="mt-2 text-xs font-mono text-gray-500 uppercase">
                                    {alerta.vehiculo.marca} • {alerta.vehiculo.patente}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </main>
    );
}