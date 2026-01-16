export default function RegisterPage() {
    return (
        <main className="min-h-screen flex items-center justify-center bg-gray-950 text-white px-6">
            <div className="w-full max-w-md bg-gray-900 p-6 rounded-xl border border-gray-800">
                <h1 className="text-2xl font-bold mb-4">Crear cuenta</h1>

                <input
                    type="text"
                    placeholder="Nombre"
                    className="w-full mb-3 p-3 rounded bg-gray-800 border border-gray-700"
                />

                <input
                    type="email"
                    placeholder="Correo"
                    className="w-full mb-3 p-3 rounded bg-gray-800 border border-gray-700"
                />

                <input
                    type="password"
                    placeholder="Contraseña"
                    className="w-full mb-4 p-3 rounded bg-gray-800 border border-gray-700"
                />

                <button className="w-full bg-orange-600 hover:bg-orange-700 p-3 rounded-lg">
                    Registrarse
                </button>
            </div>
        </main>
    );
}
