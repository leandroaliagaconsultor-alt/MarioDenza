import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-[#1a2744]">
          <span className="text-2xl font-bold text-[#7ab929]">MD</span>
        </div>
        <h1 className="mt-4 text-4xl font-bold text-gray-900">404</h1>
        <p className="mt-2 text-sm text-gray-500">Pagina no encontrada</p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex items-center rounded-lg bg-[#1a2744] px-4 py-2 text-sm font-semibold text-white hover:bg-[#243456]"
        >
          Ir al dashboard
        </Link>
      </div>
    </div>
  );
}
