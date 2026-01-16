export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white px-6">
      <h1 className="text-4xl font-bold">MotorAlert</h1>
      <p className="mt-4 text-gray-400 text-center max-w-md">
        Plataforma de alertas, mantenimiento y control para vehículos,
        talleres y automotoras.
      </p>

      <div className="mt-8 flex gap-4">
        <a
          href="/login"
          className="px-6 py-3 rounded-lg bg-orange-600 hover:bg-orange-700 transition"
        >
          Iniciar sesión
        </a>

        <a
          href="/register"
          className="px-6 py-3 rounded-lg border border-gray-700 hover:bg-gray-800 transition"
        >
          Crear cuenta
        </a>
      </div>
    </main>
  );
}
