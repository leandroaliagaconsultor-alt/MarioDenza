"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";
import type { ContractFormValues } from "@/lib/validators/contract";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, FileUp, Sparkles, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import type { ExtractedContractData } from "@/lib/ocr/extract-contract";

export function OcrUpload() {
  const { setValue } = useFormContext<ContractFormValues>();
  const [file, setFile] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedContractData | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleExtract() {
    if (!file) return;
    setExtracting(true);
    setError(null);
    setExtracted(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/ocr", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Error al procesar");
      }

      const data = json.data as ExtractedContractData;
      setExtracted(data);

      // Pre-fill form fields
      if (data.start_date) setValue("start_date", data.start_date);
      if (data.end_date) setValue("end_date", data.end_date);
      if (data.rent_amount) setValue("base_rent", data.rent_amount);
      if (data.rent_currency) setValue("currency", data.rent_currency);
      if (data.payment_day) setValue("payment_day", data.payment_day);
      if (data.adjustment_frequency_months) setValue("adjustment_frequency_months", data.adjustment_frequency_months);
      if (data.notes) setValue("notes", data.notes);

      // Map adjustment type
      if (data.adjustment_type) {
        const typeMap: Record<string, ContractFormValues["adjustment_index_type"]> = {
          "IPC": "IPC", "ICL": "ICL", "casa propia": "casa_propia",
        };
        const mapped = typeMap[data.adjustment_type.toUpperCase()] || typeMap[data.adjustment_type.toLowerCase()];
        if (mapped) setValue("adjustment_index_type", mapped);
      }

      toast.success(`Datos extraidos (confianza: ${data.confidence}). Revisa antes de continuar.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al extraer datos");
      toast.error("No se pudieron extraer los datos del PDF");
    } finally {
      setExtracting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-gray-700">Asistente OCR (opcional)</p>
        <p className="mt-1 text-xs text-gray-500">
          Subi el PDF del contrato firmado y el sistema intentara extraer los datos automaticamente.
          Siempre revisa los datos antes de confirmar.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="file"
          accept=".pdf"
          onChange={(e) => { setFile(e.target.files?.[0] ?? null); setExtracted(null); setError(null); }}
          className="block text-sm text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-teal-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-teal-700 hover:file:bg-teal-100"
        />
        {file && (
          <Button
            type="button"
            onClick={handleExtract}
            disabled={extracting}
            variant="outline"
            size="sm"
          >
            {extracting ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-1.5 h-4 w-4 text-amber-500" />
            )}
            {extracting ? "Extrayendo..." : "Extraer datos"}
          </Button>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mr-1.5 inline h-4 w-4" /> {error}
        </div>
      )}

      {extracted && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-green-700">
            <Check className="h-4 w-4" />
            Datos extraidos — confianza: {extracted.confidence}
          </div>
          <Separator className="my-3 bg-green-200" />
          <div className="grid grid-cols-2 gap-2 text-xs">
            {extracted.tenant_name && (
              <div><span className="text-gray-500">Inquilino:</span> <span className="font-medium">{extracted.tenant_name}</span></div>
            )}
            {extracted.owner_name && (
              <div><span className="text-gray-500">Propietario:</span> <span className="font-medium">{extracted.owner_name}</span></div>
            )}
            {extracted.property_address && (
              <div><span className="text-gray-500">Direccion:</span> <span className="font-medium">{extracted.property_address}</span></div>
            )}
            {extracted.start_date && (
              <div><span className="text-gray-500">Inicio:</span> <span className="font-medium">{extracted.start_date}</span></div>
            )}
            {extracted.end_date && (
              <div><span className="text-gray-500">Fin:</span> <span className="font-medium">{extracted.end_date}</span></div>
            )}
            {extracted.rent_amount && (
              <div><span className="text-gray-500">Alquiler:</span> <span className="font-medium">{extracted.rent_currency} {extracted.rent_amount}</span></div>
            )}
            {extracted.payment_day && (
              <div><span className="text-gray-500">Dia pago:</span> <span className="font-medium">{extracted.payment_day}</span></div>
            )}
            {extracted.adjustment_type && (
              <div><span className="text-gray-500">Ajuste:</span> <span className="font-medium">{extracted.adjustment_type} c/{extracted.adjustment_frequency_months}m</span></div>
            )}
          </div>
          <p className="mt-3 text-xs text-green-600">
            Los campos extraidos se pre-llenaron en el formulario. Revisa en los pasos anteriores.
          </p>
        </div>
      )}
    </div>
  );
}
