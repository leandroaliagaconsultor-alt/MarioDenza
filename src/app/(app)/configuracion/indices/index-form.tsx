"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, Plus, Trash2, RefreshCw } from "lucide-react";
import { saveIndexValue, deleteIndexValue, syncFromIndec, syncFromBcra } from "./actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface IndexEntry {
  id: string;
  index_type: string;
  period: string;
  value: number;
  fetched_at: string;
}

interface Props {
  entries: IndexEntry[];
}

function IndexTable({ title, entries, maxRows, onDelete }: {
  title: string;
  entries: IndexEntry[];
  maxRows: number;
  onDelete: (id: string) => void;
}) {
  const visible = entries.slice(0, maxRows);

  return (
    <div className="rounded-xl border border-gray-200 bg-white/80 p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <Separator className="my-4" />
      {visible.length === 0 ? (
        <p className="text-sm text-gray-400">Sin valores cargados. Usa el boton de sincronizar.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs font-medium uppercase text-gray-500">
                <th className="pb-2 pr-4">Periodo</th>
                <th className="pb-2 pr-4">Valor</th>
                <th className="pb-2 pr-4">Cargado</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {visible.map((e) => (
                <tr key={e.id}>
                  <td className="py-2.5 pr-4 font-medium text-gray-900">{e.period.substring(0, 7)}</td>
                  <td className="py-2.5 pr-4 font-mono text-gray-900">{Number(e.value).toFixed(4)}</td>
                  <td className="py-2.5 pr-4 text-xs text-gray-400">{new Date(e.fetched_at).toLocaleDateString("es-AR")}</td>
                  <td className="py-2.5">
                    <Button variant="ghost" size="sm" onClick={() => onDelete(e.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-red-400" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function IndexManager({ entries }: Props) {
  const router = useRouter();
  const [syncingIpc, setSyncingIpc] = useState(false);
  const [syncingIcl, setSyncingIcl] = useState(false);

  // Manual entry (fallback)
  const [manualType, setManualType] = useState<"ICL" | "IPC">("ICL");
  const [manualPeriod, setManualPeriod] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [manualValue, setManualValue] = useState("");
  const [savingManual, setSavingManual] = useState(false);

  async function handleSyncIpc() {
    setSyncingIpc(true);
    try {
      const result = await syncFromIndec();
      if (result.inserted > 0) {
        toast.success(`IPC actualizado: ${result.inserted} mes${result.inserted > 1 ? "es" : ""} nuevo${result.inserted > 1 ? "s" : ""} (hasta ${result.latestPeriod})`);
      } else {
        toast.info(`IPC ya esta al dia (ultimo: ${result.latestPeriod} = ${result.latestValue})`);
      }
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al sincronizar IPC");
    } finally {
      setSyncingIpc(false);
    }
  }

  async function handleSyncIcl() {
    setSyncingIcl(true);
    try {
      const result = await syncFromBcra();
      if (result.inserted > 0) {
        toast.success(`ICL actualizado: ${result.inserted} mes${result.inserted > 1 ? "es" : ""} nuevo${result.inserted > 1 ? "s" : ""} (hasta ${result.latestPeriod} = ${result.latestValue})`);
      } else {
        toast.info(`ICL actualizado (ultimo: ${result.latestPeriod} = ${result.latestValue})`);
      }
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al sincronizar ICL");
    } finally {
      setSyncingIcl(false);
    }
  }

  async function handleSaveManual() {
    const numValue = parseFloat(manualValue);
    if (!manualPeriod || isNaN(numValue) || numValue <= 0) {
      toast.error("Completa el periodo y el valor");
      return;
    }
    setSavingManual(true);
    try {
      await saveIndexValue(manualType, manualPeriod, numValue);
      toast.success(`${manualType} ${manualPeriod} guardado: ${numValue}`);
      setManualValue("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSavingManual(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteIndexValue(id);
      toast.success("Valor eliminado");
      router.refresh();
    } catch {
      toast.error("Error al eliminar");
    }
  }

  const iclEntries = entries.filter((e) => e.index_type === "ICL");
  const ipcEntries = entries.filter((e) => e.index_type === "IPC");

  return (
    <div className="space-y-6">
      {/* Sync buttons */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900">IPC — INDEC</h2>
          <p className="mt-1 text-xs text-gray-500">Descarga del archivo oficial del INDEC</p>
          <Button onClick={handleSyncIpc} disabled={syncingIpc} className="mt-3 w-full bg-teal-600 hover:bg-teal-700">
            {syncingIpc ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            {syncingIpc ? "Sincronizando..." : "Sincronizar IPC"}
          </Button>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900">ICL — BCRA</h2>
          <p className="mt-1 text-xs text-gray-500">Descarga del archivo oficial del BCRA</p>
          <Button onClick={handleSyncIcl} disabled={syncingIcl} className="mt-3 w-full bg-blue-600 hover:bg-blue-700">
            {syncingIcl ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            {syncingIcl ? "Sincronizando..." : "Sincronizar ICL"}
          </Button>
        </div>
      </div>

      {/* IPC table */}
      <IndexTable title="IPC — Ultimos 12 meses" entries={ipcEntries} maxRows={12} onDelete={handleDelete} />

      {/* ICL table */}
      <IndexTable title="ICL — Ultimos 12 meses" entries={iclEntries} maxRows={12} onDelete={handleDelete} />

      {/* Manual fallback */}
      <div className="rounded-xl border border-gray-200 bg-white/80 p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-700">Carga manual (si la sincronizacion falla)</h2>
        <Separator className="my-3" />
        <div className="flex items-end gap-3">
          <div>
            <Label>Indice</Label>
            <select value={manualType} onChange={(e) => setManualType(e.target.value as "ICL" | "IPC")}
              className="mt-1 block rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm">
              <option value="ICL">ICL</option>
              <option value="IPC">IPC</option>
            </select>
          </div>
          <div>
            <Label>Mes</Label>
            <Input type="month" value={manualPeriod} onChange={(e) => setManualPeriod(e.target.value)} className="mt-1 w-40" />
          </div>
          <div>
            <Label>Valor</Label>
            <Input type="number" step="0.0001" value={manualValue} onChange={(e) => setManualValue(e.target.value)} className="mt-1 w-36" placeholder="Ej: 31.49" />
          </div>
          <Button onClick={handleSaveManual} disabled={savingManual} variant="outline">
            {savingManual ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Plus className="mr-1 h-4 w-4" />}
            Guardar
          </Button>
        </div>
      </div>
    </div>
  );
}
