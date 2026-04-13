import Link from "next/link";
import { BarChart3, DollarSign, Users, AlertTriangle, Building2, TrendingUp } from "lucide-react";

const reports = [
  { title: "Comisiones", description: "Ingresos por comisiones por periodo", href: "/reportes/comisiones", icon: DollarSign },
  { title: "Resumen por dueno", description: "Resumen anual de pagos por propietario", href: "/reportes/resumen-dueno", icon: Users },
  { title: "Morosidad", description: "Pagos vencidos y parciales", href: "/reportes/morosidad", icon: AlertTriangle },
  { title: "Ocupacion", description: "Estado de propiedades", href: "/reportes/ocupacion", icon: Building2 },
];

export default function ReportesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
        <p className="mt-1 text-sm text-gray-500">Informes y estadisticas de la inmobiliaria</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {reports.map((r) => (
          <Link key={r.href} href={r.href} className="group rounded-xl border border-gray-200 bg-white/80 p-6 shadow-sm backdrop-blur-sm transition hover:border-teal-300 hover:shadow-md">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600 group-hover:bg-teal-100">
                <r.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{r.title}</h3>
                <p className="mt-1 text-sm text-gray-500">{r.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
