import Link from "next/link";
import { Settings, TrendingUp, Upload } from "lucide-react";

const sections = [
  {
    title: "Indices ICL / IPC",
    description: "Carga y consulta valores de indices para calcular aumentos de alquiler",
    href: "/configuracion/indices",
    icon: TrendingUp,
  },
  {
    title: "Importar datos",
    description: "Importa duenos, inquilinos, propiedades y contratos desde CSV",
    href: "/configuracion/importar",
    icon: Upload,
  },
];

export default function ConfiguracionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuracion</h1>
        <p className="mt-1 text-sm text-gray-500">Ajustes generales del sistema</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="group rounded-xl border border-gray-200 bg-white/80 p-6 shadow-sm backdrop-blur-sm transition hover:border-teal-300 hover:shadow-md"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600 group-hover:bg-teal-100">
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{s.title}</h3>
                <p className="mt-1 text-sm text-gray-500">{s.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
