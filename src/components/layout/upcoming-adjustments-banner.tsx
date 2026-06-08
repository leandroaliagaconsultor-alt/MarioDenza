"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TrendingUp, X } from "lucide-react";

const KEY = "aumentos-banner-dismissed";

export function UpcomingAdjustmentsBanner({ count }: { count: number }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Se muestra una vez por sesión (vuelve a aparecer al iniciar sesión de nuevo)
    if (count > 0 && sessionStorage.getItem(KEY) !== "1") {
      setShow(true);
    }
  }, [count]);

  function dismiss() {
    sessionStorage.setItem(KEY, "1");
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="mb-4 flex items-center gap-3 rounded-xl border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm">
      <TrendingUp className="h-5 w-5 shrink-0 text-yellow-600" />
      <div className="flex-1">
        <span className="font-medium text-yellow-800">
          {count} {count === 1 ? "propiedad tiene" : "propiedades tienen"} aumento próximo
        </span>
        <span className="text-yellow-700"> — revisá y aplicá los ajustes.</span>
      </div>
      <Link
        href="/aumentos"
        onClick={dismiss}
        className="shrink-0 rounded-lg bg-yellow-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-yellow-700"
      >
        Ver aumentos
      </Link>
      <button onClick={dismiss} className="shrink-0 text-yellow-500 hover:text-yellow-700" aria-label="Cerrar">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
