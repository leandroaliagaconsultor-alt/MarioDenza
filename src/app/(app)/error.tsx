"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-amber-500" />
        <h2 className="mt-4 text-lg font-semibold text-gray-900">Algo salio mal</h2>
        <p className="mt-2 max-w-md text-sm text-gray-500">
          {error.message || "Ocurrio un error inesperado. Intenta de nuevo."}
        </p>
        <Button onClick={reset} className="mt-6" variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" /> Reintentar
        </Button>
      </div>
    </div>
  );
}
