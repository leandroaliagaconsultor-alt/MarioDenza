import {
  Building2,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  Home,
  FileText,
} from "lucide-react";

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white/80 p-5 shadow-sm backdrop-blur-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="mt-1 text-xs text-gray-400">{subtitle}</p>
          )}
        </div>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}
        >
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Resumen general de la inmobiliaria
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <StatCard
          title="Propiedades"
          value="0"
          subtitle="0 ocupadas / 0 disponibles"
          icon={Building2}
          color="bg-teal-600"
        />
        <StatCard
          title="Contratos activos"
          value="0"
          subtitle="0 por vencer"
          icon={FileText}
          color="bg-blue-600"
        />
        <StatCard
          title="Comisiones del mes"
          value="$0"
          subtitle="Abril 2026"
          icon={TrendingUp}
          color="bg-emerald-600"
        />
        <StatCard
          title="Pagos vencidos"
          value="0"
          subtitle="Morosidad: $0"
          icon={AlertTriangle}
          color="bg-amber-500"
        />
      </div>

      {/* Placeholder sections */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white/80 p-6 shadow-sm backdrop-blur-sm">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <CreditCard className="h-5 w-5 text-gray-400" />
            Pagos recientes
          </h2>
          <div className="mt-6 flex items-center justify-center py-12 text-sm text-gray-400">
            Los pagos recientes apareceran aqui
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white/80 p-6 shadow-sm backdrop-blur-sm">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Home className="h-5 w-5 text-gray-400" />
            Contratos proximos a vencer
          </h2>
          <div className="mt-6 flex items-center justify-center py-12 text-sm text-gray-400">
            Los contratos por vencer apareceran aqui
          </div>
        </div>
      </div>
    </div>
  );
}
