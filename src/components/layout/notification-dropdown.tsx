"use client";

import { Bell, AlertTriangle, Calendar, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface Props {
  notifs: {
    overdueCount: number;
    expiringCount: number;
    adjustmentCount: number;
    total: number;
  };
}

export function NotificationDropdown({ notifs }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative flex rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
      >
        <Bell className="h-5 w-5" />
        {notifs.total > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {notifs.total}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-1 w-72 rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
            <p className="mb-2 text-xs font-semibold uppercase text-gray-400">Notificaciones</p>
            {notifs.total === 0 ? (
              <p className="py-2 text-sm text-gray-400">Todo al dia</p>
            ) : (
              <div className="space-y-1">
                {notifs.overdueCount > 0 && (
                  <Link
                    href="/pagos?status=vencido"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 rounded-md p-2.5 text-sm text-red-700 transition hover:bg-red-50"
                  >
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>{notifs.overdueCount} pago{notifs.overdueCount > 1 ? "s" : ""} vencido{notifs.overdueCount > 1 ? "s" : ""}</span>
                  </Link>
                )}
                {notifs.expiringCount > 0 && (
                  <Link
                    href="/contratos?status=por_vencer"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 rounded-md p-2.5 text-sm text-amber-700 transition hover:bg-amber-50"
                  >
                    <Calendar className="h-4 w-4 shrink-0" />
                    <span>{notifs.expiringCount} contrato{notifs.expiringCount > 1 ? "s" : ""} por vencer</span>
                  </Link>
                )}
                {notifs.adjustmentCount > 0 && (
                  <Link
                    href="/dashboard"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 rounded-md p-2.5 text-sm text-teal-700 transition hover:bg-teal-50"
                  >
                    <TrendingUp className="h-4 w-4 shrink-0" />
                    <span>{notifs.adjustmentCount} aumento{notifs.adjustmentCount > 1 ? "s" : ""} pendiente{notifs.adjustmentCount > 1 ? "s" : ""}</span>
                  </Link>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
