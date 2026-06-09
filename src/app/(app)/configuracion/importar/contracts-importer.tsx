"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, Upload, CheckCircle2, AlertTriangle, FileSpreadsheet, Phone } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { parseContractRow, dedupKey, type ParsedContract } from "@/lib/import/contracts";
import { commitContractsImport } from "./contratos-actions";
import { INDEX_TYPES } from "@/lib/types/enums";
import { formatCurrency, formatDate } from "@/lib/utils/format";

function findContractsSheet(wb: XLSX.WorkBook): string | null {
  const byName = wb.SheetNames.find((n) => n.trim().toLowerCase() === "contratos");
  if (byName) return byName;
  // Fallback: hoja cuyo encabezado tenga INQUILINO y PROPIETARIO
  for (const name of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[name], { header: 1, defval: "", raw: true });
    const header = (rows[0] ?? []).map((c) => String(c).toUpperCase());
    if (header.some((h) => h.includes("INQUILINO")) && header.some((h) => h.includes("PROPIETARIO"))) return name;
  }
  return null;
}

export function ContractsImporter() {
  const router = useRouter();
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [rows, setRows] = useState<ParsedContract[] | null>(null);
  const [fileName, setFileName] = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setParsing(true);
    setRows(null);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheetName = findContractsSheet(wb);
      if (!sheetName) {
        toast.error('No encontré una hoja "contratos" (ni con columnas INQUILINO/PROPIETARIO).');
        return;
      }
      const raw = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[sheetName], { header: 1, defval: "", raw: true });
      const todayISO = new Date().toISOString().slice(0, 10);
      const parsed: ParsedContract[] = [];
      // raw[0] = encabezado; el resto son filas
      for (let i = 1; i < raw.length; i++) {
        const r = raw[i];
        // Saltar filas totalmente vacías
        if (!r || r.every((c) => String(c ?? "").trim() === "")) continue;
        parsed.push(parseContractRow(r, i, { todayISO }));
      }
      if (parsed.length === 0) {
        toast.error("La hoja no tiene filas de datos.");
        return;
      }
      setFileName(`${file.name} · hoja "${sheetName}"`);
      setRows(parsed);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo leer el archivo");
    } finally {
      setParsing(false);
      e.target.value = "";
    }
  }

  async function handleImport() {
    if (!rows) return;
    setImporting(true);
    try {
      const summary = await commitContractsImport(rows);
      if (summary.errors.length > 0) {
        toast.warning(
          `Importado con avisos: ${summary.contractsCreated} contratos. ${summary.errors.length} error(es) — revisá la consola.`
        );
        console.warn("Errores de importación:", summary.errors);
      } else {
        toast.success(
          `Listo: ${summary.contractsCreated} contratos, ${summary.ownersCreated} dueños, ${summary.tenantsCreated} inquilinos, ${summary.propertiesCreated} propiedades.`
        );
      }
      setRows(null);
      setFileName("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al importar");
    } finally {
      setImporting(false);
    }
  }

  const valid = rows?.filter((r) => !r.skip) ?? [];
  const skipped = rows?.filter((r) => r.skip) ?? [];
  const withWarnings = valid.filter((r) => r.warnings.length > 0).length;
  const uniqueOwners = new Set(valid.map((r) => dedupKey(r.ownerName))).size;
  const uniqueTenants = new Set(valid.map((r) => dedupKey(r.tenantName))).size;
  const uniqueProps = new Set(valid.map((r) => `${dedupKey(r.address)}||${dedupKey(r.unit ?? "")}`)).size;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white/80 p-6 shadow-sm">
        <h2 className="flex items-center gap-2 font-semibold text-gray-900">
          <FileSpreadsheet className="h-5 w-5 text-teal-600" /> Importar contratos desde Excel
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Subí el Excel del cliente. Leo la hoja <span className="font-medium">contratos</span> (los de
          “no agregar” quedan afuera porque están en otra hoja). Vas a ver un preview con avisos antes de guardar nada.
        </p>
        <Separator className="my-4" />

        <label className="flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-teal-300 bg-teal-50 px-4 py-2 text-sm font-medium text-teal-700 hover:bg-teal-100">
          {parsing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {parsing ? "Leyendo…" : "Elegir archivo .xlsx"}
          <input type="file" accept=".xlsx,.xls" onChange={handleFile} className="hidden" disabled={parsing} />
        </label>
        {fileName && <p className="mt-2 text-xs text-gray-400">{fileName}</p>}
      </div>

      {rows && (
        <>
          {/* Resumen */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
              <CheckCircle2 className="h-4 w-4" /> {valid.length} contrato{valid.length === 1 ? "" : "s"} para importar
            </span>
            {skipped.length > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700">
                <AlertTriangle className="h-4 w-4" /> {skipped.length} se saltan (datos incompletos)
              </span>
            )}
            {withWarnings > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700">
                <AlertTriangle className="h-4 w-4" /> {withWarnings} con avisos
              </span>
            )}
            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
              {uniqueOwners} dueños · {uniqueTenants} inquilinos · {uniqueProps} propiedades
            </span>
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <Phone className="mt-0.5 h-4 w-4 shrink-0" />
            <span>La lista no trae teléfonos. Los contratos entran igual, pero los avisos por WhatsApp van a necesitar que cargues los teléfonos después.</span>
          </div>

          {/* Tabla preview */}
          <div className="max-h-[28rem] overflow-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-gray-50">
                <tr className="text-xs font-medium uppercase text-gray-500">
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">Inquilino / Dueño</th>
                  <th className="px-3 py-2">Dirección</th>
                  <th className="hidden px-3 py-2 md:table-cell">Índice / cada</th>
                  <th className="hidden px-3 py-2 sm:table-cell">Inicio</th>
                  <th className="hidden px-3 py-2 lg:table-cell">Próx. ajuste</th>
                  <th className="px-3 py-2 text-right">Actual</th>
                  <th className="px-3 py-2">Avisos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map((r) => (
                  <tr key={r.rowIndex} className={r.skip ? "bg-red-50/50 text-gray-400" : ""}>
                    <td className="px-3 py-2 text-gray-400">{r.rowIndex}</td>
                    <td className="px-3 py-2">
                      <div className="font-medium text-gray-900">{r.tenantName || "—"}</div>
                      <div className="text-xs text-gray-500">{r.ownerName || "—"}</div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="text-gray-900">{r.address}</div>
                      {r.unit && <div className="text-xs text-gray-500">{r.unit}</div>}
                    </td>
                    <td className="hidden px-3 py-2 md:table-cell">
                      {INDEX_TYPES[r.indexType as keyof typeof INDEX_TYPES] ?? r.indexType}
                      {r.frequencyMonths ? ` · ${r.frequencyMonths}m` : ""}
                    </td>
                    <td className="hidden px-3 py-2 text-gray-600 sm:table-cell">{r.startDate ? formatDate(r.startDate) : "—"}</td>
                    <td className="hidden px-3 py-2 text-gray-600 lg:table-cell">{r.nextAdjustmentDate ? formatDate(r.nextAdjustmentDate) : "—"}</td>
                    <td className="px-3 py-2 text-right font-medium text-gray-900">
                      {r.currentRent ? formatCurrency(r.currentRent, "ARS") : "—"}
                    </td>
                    <td className="px-3 py-2">
                      {r.warnings.length > 0 ? (
                        <span
                          className={`inline-flex cursor-help items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                            r.skip ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                          }`}
                          title={r.warnings.join("\n")}
                        >
                          <AlertTriangle className="h-3 w-3" /> {r.warnings.length}
                        </span>
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleImport} disabled={importing || valid.length === 0} className="bg-teal-600 hover:bg-teal-700">
              {importing ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-4 w-4" />}
              Importar {valid.length} contrato{valid.length === 1 ? "" : "s"}
            </Button>
            <Button onClick={() => { setRows(null); setFileName(""); }} variant="outline" disabled={importing}>
              Cancelar
            </Button>
          </div>
          <p className="text-xs text-gray-400">
            Pasá el cursor por el número de avisos para ver el detalle de cada fila.
          </p>
        </>
      )}
    </div>
  );
}
