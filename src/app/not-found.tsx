import Link from "next/link";
import { Building2 } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <Building2 className="mx-auto h-16 w-16 text-gray-300" />
        <h1 className="mt-4 text-4xl font-bold text-gray-900">404</h1>
        <p className="mt-2 text-sm text-gray-500">Pagina no encontrada</p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex items-center rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
        >
          Ir al dashboard
        </Link>
      </div>
    </div>
  );
}
