"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
// Importamos los íconos PRO
import { Car, Wallet, Bell, Wrench, ChevronRight, TrendingUp } from "lucide-react";

/* =========================================
   TYPES & UTILS
========================================= */

type Vehiculo = { id: string; patente: string; anio?: number; marca: string; modelo: string };
type Mantencion = { id: string; costo: number; };

const LS_KEY_VEHICULOS = "motoralert_vehiculos_v1";
const LS_KEY_MANTENCIONES = "motoralert_mantenciones_v1";

function formatMoney(amount: number) { return "$" + amount.toLocaleString("es-CL"); }

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

function getSaludo() {
    const hora = new Date().getHours();
    if (hora < 12) return "Buenos días";
    if (hora < 20) return "Buenas tardes";
    return "Buenas noches";
}

export default function DashboardPage() {
    const [stats, setStats] = useState({ totalVehiculos: 0, totalInvertido: 0, alertasActivas: 0 });
    const [recentVehiculo, setRecentVehiculo] = useState<Vehiculo | null>(null);
    const [loading, setLoading] = useState(true);
    const [saludo, setSaludo] = useState("");

    useEffect(() => {
        setSaludo(getSaludo());
        const rawVehiculos = localStorage.getItem(LS_KEY_VEHICULOS);
        const vehiculos: Vehiculo[] = rawVehiculos ? JSON.parse(rawVehiculos) : [];
        const rawMantenciones = localStorage.getItem(LS_KEY_MANTENCIONES);
        const mantenciones: Mantencion[] = rawMantenciones ? JSON.parse(rawMantenciones) : [];

        const totalDinero = mantenciones.reduce((acc, m) => acc + (m.costo || 0), 0);
        let alertas = 0;
        vehiculos.forEach((v) => {
            const estado = getEstadoRevision(v.patente || "", v.anio);
            if (estado === "vencida" || estado === "toca_ahora") alertas++;
        });

        setStats({ totalVehiculos: vehiculos.length, totalInvertido: totalDinero, alertasActivas: alertas });
        setRecentVehiculo(vehiculos[0] || null); // Guardamos el primer auto para acceso rápido
        setLoading(false);
    }, []);

    if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500 bg-[#0b1220]">Cargando motores...</div>;

    return (
        <main className="mx-auto max-w-5xl px-6 py-10">

            {/* Header con Gradiente */}
            <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <span className="text-sm font-medium text-orange-500 tracking-wider uppercase mb-1 block">Panel de Control</span>
                    <h1 className="text-4xl font-extrabold text-white">
                        {saludo}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-200">Conductor</span>
                    </h1>
                    <p className="text-gray-400 mt-2 text-lg">
                        Todo bajo control hoy.
                    </p>
                </div>

                {/* Botón de acción rápida flotante */}
                <Link
                    href="/app/vehiculos"
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/10 px-5 py-3 rounded-full transition-all backdrop-blur-md"
                >
                    <Wrench size={18} className="text-orange-400" />
                    <span className="text-sm font-medium">Gestionar Flota</span>
                </Link>
            </div>

            {/* Grid de Resumen (GLASSMORPHISM) */}
            <div className="grid gap-6 sm:grid-cols-3">

                {/* Card 1: Vehículos */}
                <Link
                    href="/app/vehiculos"
                    className="group relative overflow-hidden rounded-3xl border border-gray-800 bg-gradient-to-b from-[#1a2333] to-[#0b1220] p-6 transition-all hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)]"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Car size={80} />
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400">
                            <Car size={24} />
                        </div>
                        <span className="text-sm text-gray-400 font-medium">Vehículos</span>
                    </div>
                    <p className="text-4xl font-bold text-white tracking-tight">
                        {stats.totalVehiculos}
                    </p>
                    <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
                        <span className="flex items-center text-green-400 gap-1 bg-green-400/10 px-2 py-0.5 rounded-full">
                            Activos
                        </span>
                    </div>
                </Link>

                {/* Card 2: Dinero Gastado */}
                <div className="group relative overflow-hidden rounded-3xl border border-gray-800 bg-gradient-to-b from-[#1a2333] to-[#0b1220] p-6 transition-all hover:border-gray-700">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <TrendingUp size={80} />
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 rounded-2xl bg-green-500/10 text-green-400">
                            <Wallet size={24} />
                        </div>
                        <span className="text-sm text-gray-400 font-medium">Inversión Total</span>
                    </div>
                    <p className="text-3xl font-bold text-white tracking-tight">
                        {formatMoney(stats.totalInvertido)}
                    </p>
                    <div className="mt-4 text-xs text-gray-500">
                        Acumulado histórico
                    </div>
                </div>

                {/* Card 3: Alertas */}
                <Link
                    href="/app/vehiculos"
                    className={`group relative overflow-hidden rounded-3xl border p-6 transition-all hover:-translate-y-1 ${stats.alertasActivas > 0
                            ? "border-red-500/30 bg-gradient-to-b from-red-900/10 to-[#0b1220] hover:shadow-[0_0_30px_-10px_rgba(239,68,68,0.3)]"
                            : "border-gray-800 bg-gradient-to-b from-[#1a2333] to-[#0b1220]"
                        }`}
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Bell size={80} />
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`p-3 rounded-2xl ${stats.alertasActivas > 0 ? "bg-red-500/20 text-red-400" : "bg-gray-700/20 text-gray-400"}`}>
                            <Bell size={24} />
                        </div>
                        <span className={`text-sm font-medium ${stats.alertasActivas > 0 ? "text-red-300" : "text-gray-400"}`}>Alertas</span>
                    </div>
                    <p className={`text-4xl font-bold tracking-tight ${stats.alertasActivas > 0 ? "text-red-400" : "text-white"}`}>
                        {stats.alertasActivas}
                    </p>
                    <div className="mt-4 text-xs text-gray-500">
                        {stats.alertasActivas > 0 ? "Requieren tu atención inmediata" : "Todo está en orden"}
                    </div>
                </Link>
            </div>

            {/* Sección: Acceso Rápido al último vehículo */}
            {recentVehiculo && (
                <div className="mt-8">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        Tu vehículo principal
                    </h2>
                    <Link
                        href={`/app/vehiculos/${recentVehiculo.id}`}
                        className="flex items-center justify-between p-5 rounded-2xl border border-gray-800 bg-white/5 hover:bg-white/10 hover:border-gray-700 transition-all group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                                {recentVehiculo.marca[0]}
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-white group-hover:text-orange-400 transition-colors">
                                    {recentVehiculo.marca} {recentVehiculo.modelo}
                                </h3>
                                <p className="text-sm text-gray-400 font-mono bg-black/30 inline-block px-2 py-0.5 rounded">
                                    {recentVehiculo.patente}
                                </p>
                            </div>
                        </div>
                        <div className="bg-white/5 p-2 rounded-full text-gray-400 group-hover:bg-orange-500 group-hover:text-white transition-all">
                            <ChevronRight size={20} />
                        </div>
                    </Link>
                </div>
            )}

            {/* Footer minimalista */}
            <div className="mt-12 border-t border-gray-800 pt-6 flex justify-between items-center text-xs text-gray-600">
                <p>MotorAlert 2026</p>
                <p>Drive safe 🚦</p>
            </div>
        </main>
    );
}