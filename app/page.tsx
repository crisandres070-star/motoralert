"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0b1220] px-6 text-center">

      {/* Efecto de fondo (Glow) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[300px] bg-orange-600/20 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-2xl space-y-8">

        {/* Logo / Icono */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-orange-500 to-red-600 text-4xl shadow-2xl shadow-orange-500/20">
          🚗
        </div>

        <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-7xl">
          Motor<span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400">Alert</span>
        </h1>

        <p className="text-lg text-gray-400 sm:text-xl leading-relaxed">
          La forma más inteligente de gestionar tu vehículo.
          Controla mantenciones, gastos y recibe alertas de revisión técnica
          directamente en tu dispositivo.
        </p>

        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center pt-4">
          <Link
            href="/app"
            className="w-full sm:w-auto rounded-full bg-white px-8 py-4 text-lg font-bold text-black transition-transform hover:scale-105 hover:shadow-xl active:scale-95"
          >
            🚀 Entrar a mi Taller
          </Link>

          <p className="text-xs text-gray-500 mt-2 sm:mt-0">
            * No requiere registro. Los datos se guardan en tu equipo.
          </p>
        </div>
      </div>

      <footer className="absolute bottom-6 text-xs text-gray-600">
        MotorAlert v1.0 • Creado por Cristóbal
      </footer>
    </main>
  );
}