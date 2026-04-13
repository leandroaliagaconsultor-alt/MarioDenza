import { Bell, AlertTriangle, Calendar, TrendingUp } from "lucide-react";
import Link from "next/link";
import { getNotifications } from "@/app/(app)/dashboard/actions";

export async function NotificationBell() {
  const notifs = await getNotifications();

  return (
    <div className="group relative">
      <Link href="/dashboard" className="relative flex rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700">
        <Bell className="h-5 w-5" />
        {notifs.total > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {notifs.total}
          </span>
        )}
      </Link>
      {/* Hover dropdown */}
      <div className="invisible absolute right-0 z-50 mt-1 w-64 rounded-lg border border-gray-200 bg-white p-3 shadow-lg group-hover:visible">
        <p className="mb-2 text-xs font-semibold uppercase text-gray-400">Notificaciones</p>
        {notifs.total === 0 ? (
          <p className="py-2 text-sm text-gray-400">Todo al dia</p>
        ) : (
          <div className="space-y-2">
            {notifs.overdueCount > 0 && (
              <Link href="/pagos?status=vencido" className="flex items-center gap-2 rounded-md p-2 text-sm text-red-700 transition hover:bg-red-50">
                <AlertTriangle className="h-4 w-4" /> {notifs.overdueCount} pago{notifs.overdueCount > 1 ? "s" : ""} vencido{notifs.overdueCount > 1 ? "s" : ""}
              </Link>
            )}
            {notifs.expiringCount > 0 && (
              <Link href="/contratos?status=por_vencer" className="flex items-center gap-2 rounded-md p-2 text-sm text-amber-700 transition hover:bg-amber-50">
                <Calendar className="h-4 w-4" /> {notifs.expiringCount} contrato{notifs.expiringCount > 1 ? "s" : ""} por vencer
              </Link>
            )}
            {notifs.adjustmentCount > 0 && (
              <Link href="/dashboard" className="flex items-center gap-2 rounded-md p-2 text-sm text-teal-700 transition hover:bg-teal-50">
                <TrendingUp className="h-4 w-4" /> {notifs.adjustmentCount} aumento{notifs.adjustmentCount > 1 ? "s" : ""} pendiente{notifs.adjustmentCount > 1 ? "s" : ""}
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
