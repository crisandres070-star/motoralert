"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AjustesPage() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    function borrarTodo() {
        if (confirm("¿ESTÁS SEGURO? \n\nSe borrarán todos los vehículos y mantenciones de este dispositivo. Esta acción no se puede deshacer.")) {
            // Borramos las claves específicas de la app
            localStorage.removeItem("motoralert_vehiculos_v1");
            localStorage.removeItem("motoralert_mantenciones_v1");

            alert("La aplicación se ha restablecido.");
            // Recargamos la página para limpiar estados
            window.location.href = "/app";
        }
    }

    if (!mounted) return null;

    return (
        <main className="mx-auto max-w-xl px-6 py-10">
            <h1 className="text-2xl font-bold mb-2">Ajustes</h1>
            <p className="text-gray-400 mb-8">Configuración de la aplicación.</p>

            <div className="space-y-6">
                {/* Sección: Información */}
                <section className="rounded-xl border border-gray-800 bg-[#0b1220] p-5">
                    <h2 className="text-lg font-semibold text-white">Acerca de MotorAlert</h2>
                    <div className="mt-4 space-y-2 text-sm text-gray-400">
                        <div className="flex justify-between border-b border-gray-800 pb-2">
                            <span>Versión</span>
                            <span className="text-white">1.0.0 (Beta)</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-800 pb-2">
                            <span>Desarrollador</span>
                            <span className="text-white">Tú (con IA)</span>
                        </div>
                        <div className="flex justify-between pt-1">
                            <span>Almacenamiento</span>
                            <span className="text-white">Local (Dispositivo)</span>
                        </div>
                    </div>
                </section>

                {/* Sección: Zona de Peligro */}
                <section className="rounded-xl border border-red-900/30 bg-red-900/5 p-5">
                    <h2 className="text-lg font-semibold text-red-400">Zona de Peligro</h2>
                    <p className="mt-1 text-xs text-gray-500">
                        Estas acciones son destructivas y no se pueden deshacer.
                    </p>

                    <button
                        onClick={borrarTodo}
                        className="mt-4 w-full rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-500 hover:text-white transition"
                    >
                        🗑️ Borrar todos los datos y reiniciar
                    </button>
                </section>
            </div>

            <p className="mt-10 text-center text-xs text-gray-600">
                MotorAlert v1.0 • Hecho en Chile 🇨🇱
            </p>
        </main>
    );
}