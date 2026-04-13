"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, Upload, Download, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { parseCsv, csvToObjects } from "@/lib/import/parser";
import { IMPORT_TEMPLATES, generateTemplate, type ImportEntityType } from "@/lib/import/templates";
import { importOwners, importTenants, importProperties } from "./actions";
import { downloadCsv } from "@/lib/export/csv";

export function CsvImporter() {
  const router = useRouter();
  const [entityType, setEntityType] = useState<ImportEntityType>("owners");
  const [preview, setPreview] = useState<Record<string, string>[] | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<number | null>(null);

  function handleDownloadTemplate() {
    const csv = generateTemplate(entityType);
    downloadCsv(csv, `plantilla-${entityType}.csv`);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreview(null);
    setErrors([]);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCsv(text);

      if (rows.length < 2) {
        setErrors(["El archivo debe tener al menos un encabezado y una fila de datos"]);
        return;
      }

      setHeaders(rows[0]);
      const objects = csvToObjects(rows);

      // Validate required fields
      const tmpl = IMPORT_TEMPLATES[entityType];
      const required = tmpl.headers[0]; // first field is always required (name)
      const validationErrors: string[] = [];

      objects.forEach((obj, i) => {
        if (!obj[required]) {
          validationErrors.push(`Fila ${i + 2}: falta "${required}"`);
        }
      });

      setErrors(validationErrors);
      setPreview(objects);
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    if (!preview || preview.length === 0) return;
    setImporting(true);

    try {
      let count = 0;
      if (entityType === "owners") count = await importOwners(preview);
      else if (entityType === "tenants") count = await importTenants(preview);
      else if (entityType === "properties") count = await importProperties(preview);

      setResult(count);
      toast.success(`${count} registros importados correctamente`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al importar");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Entity selector + template download */}
      <div className="rounded-xl border border-gray-200 bg-white/80 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">1. Selecciona tipo y descarga plantilla</h2>
        <Separator className="my-4" />
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Tipo de entidad</label>
            <select
              value={entityType}
              onChange={(e) => { setEntityType(e.target.value as ImportEntityType); setPreview(null); setResult(null); }}
              className="block rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              {Object.entries(IMPORT_TEMPLATES).map(([key, tmpl]) => (
                <option key={key} value={key}>{tmpl.label}</option>
              ))}
            </select>
          </div>
          <Button variant="outline" onClick={handleDownloadTemplate}>
            <Download className="mr-1.5 h-4 w-4" /> Descargar plantilla
          </Button>
        </div>
      </div>

      {/* File upload */}
      <div className="rounded-xl border border-gray-200 bg-white/80 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">2. Subi el archivo CSV</h2>
        <Separator className="my-4" />
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-teal-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-teal-700 hover:file:bg-teal-100"
        />
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-red-700">
            <AlertCircle className="h-4 w-4" /> {errors.length} error{errors.length > 1 ? "es" : ""} encontrado{errors.length > 1 ? "s" : ""}
          </div>
          <ul className="mt-2 space-y-1 text-sm text-red-600">
            {errors.slice(0, 10).map((e, i) => <li key={i}>{e}</li>)}
            {errors.length > 10 && <li>...y {errors.length - 10} mas</li>}
          </ul>
        </div>
      )}

      {/* Preview */}
      {preview && preview.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white/80 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">3. Preview ({preview.length} filas)</h2>
            {result === null && (
              <Button onClick={handleImport} disabled={importing || errors.length > 0} className="bg-teal-600 hover:bg-teal-700">
                {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                Importar {preview.length} registros
              </Button>
            )}
            {result !== null && (
              <div className="flex items-center gap-2 text-sm font-medium text-green-700">
                <Check className="h-4 w-4" /> {result} importados
              </div>
            )}
          </div>
          <Separator className="my-4" />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs font-medium uppercase text-gray-500">
                  <th className="pb-2 pr-3">#</th>
                  {headers.map((h) => <th key={h} className="pb-2 pr-3">{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {preview.slice(0, 20).map((row, i) => (
                  <tr key={i}>
                    <td className="py-1.5 pr-3 text-gray-400">{i + 1}</td>
                    {headers.map((h) => (
                      <td key={h} className="py-1.5 pr-3 text-gray-700">{row[h.toLowerCase().replace(/\s+/g, "_")] || <span className="text-gray-300">—</span>}</td>
                    ))}
                  </tr>
                ))}
                {preview.length > 20 && <tr><td colSpan={headers.length + 1} className="py-2 text-center text-gray-400">...{preview.length - 20} filas mas</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
