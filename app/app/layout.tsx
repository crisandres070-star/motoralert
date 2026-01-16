import Link from "next/link";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-gray-950 text-white">
            <div className="mx-auto max-w-3xl px-4 pt-6 pb-24">{children}</div>

            <nav className="fixed bottom-0 left-0 right-0 border-t border-gray-800 bg-gray-950/95 backdrop-blur">
                <div className="mx-auto max-w-3xl grid grid-cols-4 text-xs sm:text-sm">
                    <Link href="/app" className="py-3 text-center hover:bg-gray-900 transition">
                        Inicio
                    </Link>
                    <Link href="/app/vehiculos" className="py-3 text-center hover:bg-gray-900 transition">
                        Vehículos
                    </Link>
                    <Link href="/app/alertas" className="py-3 text-center hover:bg-gray-900 transition">
                        Alertas
                    </Link>
                    <Link href="/app/ajustes" className="py-3 text-center hover:bg-gray-900 transition">
                        Ajustes
                    </Link>
                </div>
            </nav>
        </div>
    );
}
