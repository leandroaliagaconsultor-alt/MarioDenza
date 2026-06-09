"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, Plus, Trash2, Upload, CheckCircle2, AlertTriangle } from "lucide-react";
import { saveIndexValue, deleteIndexValue, bulkSaveIndices, type BulkIndexRow } from "./actions";
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

const MONTHS: Record<string, number> = {
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
  julio: 7, agosto: 8, septiembre: 9, setiembre: 9, octubre: 10,
  noviembre: 11, diciembre: 12,
};

function parseMonth(raw: string): number | null {
  const s = raw.trim().toLowerCase();
  if (/^\d{1,2}$/.test(s)) { const n = Number(s); return n >= 1 && n <= 12 ? n : null; }
  return MONTHS[s] ?? null;
}

function parseNum(raw: string): number | null {
  let t = raw.trim().replace(/\s/g, "");
  if (!t) return null;
  if (t.includes(",") && t.includes(".")) t = t.replace(/\./g, "").replace(",", ".");
  else if (t.includes(",")) t = t.replace(",", ".");
  const n = Number(t);
  return Number.isFinite(n) && n > 0 ? n : null;
}

interface BulkPreviewRow extends BulkIndexRow {
  label: string; // "2024 enero"
  error?: string;
}

/** Parsea texto pegado desde Excel (TAB) o con ; — columnas: Año, Mes, ICL, IPC, Casa Propia. */
function parseBulk(text: string): BulkPreviewRow[] {
  const out: BulkPreviewRow[] = [];
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    const cols = (line.includes("\t") ? line.split("\t") : line.split(";")).map((c) => c.trim());
    if (cols.length < 2) continue;
    const year = Number(cols[0]);
    const month = parseMonth(cols[1] ?? "");
    // Saltar fila de encabezado (Año, Mes, ...) u otras sin año/mes válidos
    if (!Number.isInteger(year) || year < 2000 || year > 2100 || month == null) continue;
    const icl = parseNum(cols[2] ?? "");
    const ipc = parseNum(cols[3] ?? "");
    const casa_propia = parseNum(cols[4] ?? "");
    const period = `${year}-${String(month).padStart(2, "0")}`;
    const row: BulkPreviewRow = {
      period,
      label: `${year} ${cols[1].trim().toLowerCase()}`,
      icl, ipc, casa_propia,
    };
    if (icl == null && ipc == null && casa_propia == null) row.error = "Sin valores";
    out.push(row);
  }
  return out;
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

  // Manual entry (un mes)
  const [manualType, setManualType] = useState<"ICL" | "IPC" | "casa_propia">("ICL");

  // Carga masiva
  const [bulkText, setBulkText] = useState("");
  const [bulkPreview, setBulkPreview] = useState<BulkPreviewRow[] | null>(null);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [manualPeriod, setManualPeriod] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [manualValue, setManualValue] = useState("");
  const [savingManual, setSavingManual] = useState(false);

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

  function handleBulkPreview() {
    const rows = parseBulk(bulkText);
    if (rows.length === 0) {
      toast.error("No se detectaron filas válidas. Pegá desde Excel: Año, Mes, ICL, IPC, Casa Propia.");
      return;
    }
    setBulkPreview(rows);
  }

  async function handleBulkSave() {
    if (!bulkPreview) return;
    const valid = bulkPreview.filter((r) => !r.error);
    if (valid.length === 0) {
      toast.error("No hay filas con valores para guardar");
      return;
    }
    setBulkSaving(true);
    try {
      const { saved } = await bulkSaveIndices(
        valid.map(({ period, icl, ipc, casa_propia }) => ({ period, icl, ipc, casa_propia }))
      );
      toast.success(`${saved} valor${saved === 1 ? "" : "es"} de índice guardado${saved === 1 ? "" : "s"}`);
      setBulkText("");
      setBulkPreview(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar los índices");
    } finally {
      setBulkSaving(false);
    }
  }

  const iclEntries = entries.filter((e) => e.index_type === "ICL");
  const ipcEntries = entries.filter((e) => e.index_type === "IPC");
  const casaEntries = entries.filter((e) => e.index_type === "casa_propia");

  const bulkCount = bulkPreview ? bulkPreview.filter((r) => !r.error).length : 0;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 text-sm text-blue-800">
        Los índices se cargan a mano. Cargá el <span className="font-medium">coeficiente mensual</span> de cada mes tal como viene en el
        Excel: un mes con +4,2% de variación va como <span className="font-mono">1.042</span> (o <span className="font-mono">1042</span>) — el
        sistema entiende las dos formas. Después compone los meses del ciclo de cada contrato para sugerir el aumento.
      </div>

      {/* IPC table */}
      <IndexTable title="IPC — Ultimos 12 meses" entries={ipcEntries} maxRows={12} onDelete={handleDelete} />

      {/* ICL table */}
      <IndexTable title="ICL — Ultimos 12 meses" entries={iclEntries} maxRows={12} onDelete={handleDelete} />

      {/* Casa Propia table */}
      <IndexTable title="Casa Propia — Ultimos 12 meses" entries={casaEntries} maxRows={12} onDelete={handleDelete} />

      {/* Carga masiva (pegar desde Excel) */}
      <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Upload className="h-4 w-4 text-amber-600" /> Carga masiva — ICL / IPC / Casa Propia
        </h2>
        <p className="mt-1 text-xs text-gray-500">
          Copiá desde el Excel las columnas <span className="font-medium">Año · Mes · ICL · IPC · Casa Propia</span> y pegalas acá.
          Podés incluir el encabezado (se ignora). Las celdas vacías se saltean.
        </p>
        <Separator className="my-3" />

        {!bulkPreview ? (
          <div className="space-y-3">
            <textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              rows={6}
              placeholder={"2024\tenero\t1074\t1200\t1068\n2024\tfebrero\t1081\t1130\t1078"}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 font-mono text-xs shadow-sm focus:border-amber-400 focus:outline-none"
            />
            <Button onClick={handleBulkPreview} disabled={!bulkText.trim()} variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-100">
              <Upload className="mr-1.5 h-4 w-4" /> Previsualizar
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-0.5 font-medium text-green-700">
                <CheckCircle2 className="h-3.5 w-3.5" /> {bulkCount} fila{bulkCount === 1 ? "" : "s"} para guardar
              </span>
              {bulkPreview.length - bulkCount > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 font-medium text-amber-700">
                  <AlertTriangle className="h-3.5 w-3.5" /> {bulkPreview.length - bulkCount} sin valores (se saltan)
                </span>
              )}
            </div>
            <div className="max-h-72 overflow-auto rounded-lg border border-gray-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-gray-50">
                  <tr className="text-xs font-medium uppercase text-gray-500">
                    <th className="px-3 py-2">Período</th>
                    <th className="px-3 py-2 text-right">ICL</th>
                    <th className="px-3 py-2 text-right">IPC</th>
                    <th className="px-3 py-2 text-right">Casa Propia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {bulkPreview.map((r, i) => (
                    <tr key={i} className={r.error ? "bg-amber-50/50 text-gray-400" : ""}>
                      <td className="px-3 py-1.5 font-medium text-gray-900">
                        {r.label} <span className="text-xs text-gray-400">({r.period})</span>
                      </td>
                      <td className="px-3 py-1.5 text-right font-mono">{r.icl ?? "—"}</td>
                      <td className="px-3 py-1.5 text-right font-mono">{r.ipc ?? "—"}</td>
                      <td className="px-3 py-1.5 text-right font-mono">{r.casa_propia ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleBulkSave} disabled={bulkSaving || bulkCount === 0} className="bg-amber-600 hover:bg-amber-700">
                {bulkSaving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-4 w-4" />}
                Guardar {bulkCount} fila{bulkCount === 1 ? "" : "s"}
              </Button>
              <Button onClick={() => setBulkPreview(null)} variant="outline" disabled={bulkSaving}>
                Volver a editar
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Manual fallback */}
      <div className="rounded-xl border border-gray-200 bg-white/80 p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-700">Carga manual (un mes)</h2>
        <Separator className="my-3" />
        <div className="flex items-end gap-3">
          <div>
            <Label>Indice</Label>
            <select value={manualType} onChange={(e) => setManualType(e.target.value as "ICL" | "IPC" | "casa_propia")}
              className="mt-1 block rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm">
              <option value="ICL">ICL</option>
              <option value="IPC">IPC</option>
              <option value="casa_propia">Casa Propia</option>
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
