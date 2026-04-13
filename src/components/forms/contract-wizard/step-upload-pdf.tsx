"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";
import type { ContractFormValues } from "@/lib/validators/contract";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, FileUp, Sparkles, Check, AlertCircle, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import type { ExtractedContractData } from "@/lib/ocr/extract-contract";

interface Props {
  properties: { id: string; address: string; unit: string | null; owner: { full_name: string } | null }[];
  tenants: { id: string; full_name: string; dni: string | null }[];
  onExtracted: (data: ExtractedContractData) => void;
  onSkip: () => void;
}

export function StepUploadPdf({ properties, tenants, onExtracted, onSkip }: Props) {
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

      const res = await fetch("/api/ocr", { method: "POST", body: formData });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error || "Error al procesar");

      const data = json.data as ExtractedContractData;
      setExtracted(data);
      prefillForm(data);
      onExtracted(data);

      toast.success(`Datos extraidos (confianza: ${data.confidence}). Revisa en los siguientes pasos.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al extraer datos");
    } finally {
      setExtracting(false);
    }
  }

  function prefillForm(data: ExtractedContractData) {
    // Dates
    if (data.start_date) setValue("start_date", data.start_date);
    if (data.end_date) setValue("end_date", data.end_date);

    // Economic
    if (data.rent_amount) setValue("base_rent", data.rent_amount);
    if (data.rent_currency) setValue("currency", data.rent_currency);
    if (data.payment_day) setValue("payment_day", data.payment_day);

    // Adjustments
    if (data.adjustment_frequency_months) setValue("adjustment_frequency_months", data.adjustment_frequency_months);
    if (data.adjustment_type) {
      const map: Record<string, ContractFormValues["adjustment_index_type"]> = {
        ipc: "IPC", icl: "ICL", "casa propia": "casa_propia",
        "porcentaje fijo": "fixed_percentage", "percentage": "fixed_percentage",
      };
      const mapped = map[data.adjustment_type.toLowerCase()];
      if (mapped) setValue("adjustment_index_type", mapped);
    }

    // Notes
    if (data.notes) setValue("notes", data.notes);

    // Try to match property by address
    if (data.property_address) {
      const addr = data.property_address.toLowerCase();
      const match = properties.find((p) =>
        addr.includes(p.address.toLowerCase()) ||
        p.address.toLowerCase().includes(addr.substring(0, 20))
      );
      if (match) setValue("property_id", match.id);
    }

    // Try to match tenant by name or DNI
    if (data.tenant_name || data.tenant_dni) {
      const name = (data.tenant_name || "").toLowerCase();
      const dni = data.tenant_dni || "";
      const match = tenants.find((t) =>
        (name && t.full_name.toLowerCase().includes(name.split(" ")[0])) ||
        (dni && t.dni === dni)
      );
      if (match) setValue("tenant_id", match.id);
    }
  }

  return (
    <div className="space-y-5">
      <div className="text-center">
        <FileUp className="mx-auto h-12 w-12 text-gray-300" />
        <h3 className="mt-3 text-sm font-semibold text-gray-900">Subi el PDF del contrato firmado</h3>
        <p className="mt-1 text-sm text-gray-500">
          La IA va a analizar el documento y pre-llenar los datos automaticamente.
          <br />
          Despues podes revisar y corregir todo antes de confirmar.
        </p>
      </div>

      <div className="flex flex-col items-center gap-4">
        <input
          type="file"
          accept=".pdf"
          onChange={(e) => { setFile(e.target.files?.[0] ?? null); setExtracted(null); setError(null); }}
          className="block text-sm text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-teal-50 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-teal-700 hover:file:bg-teal-100"
        />

        {file && !extracted && (
          <Button
            type="button"
            onClick={handleExtract}
            disabled={extracting}
            className="bg-teal-600 hover:bg-teal-700"
          >
            {extracting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            {extracting ? "Analizando contrato..." : "Analizar con IA"}
          </Button>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mr-1.5 inline h-4 w-4" /> {error}
        </div>
      )}

      {extracted && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-green-700">
            <Check className="h-4 w-4" /> Datos extraidos — confianza: {extracted.confidence}
          </div>
          <Separator className="my-3 bg-green-200" />
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {extracted.owner_name && (
              <div><span className="text-gray-500">Propietario:</span> <span className="font-medium">{extracted.owner_name}</span></div>
            )}
            {extracted.tenant_name && (
              <div><span className="text-gray-500">Inquilino:</span> <span className="font-medium">{extracted.tenant_name}</span></div>
            )}
            {extracted.property_address && (
              <div><span className="text-gray-500">Direccion:</span> <span className="font-medium">{extracted.property_address}{extracted.property_unit ? ` - ${extracted.property_unit}` : ""}</span></div>
            )}
            {extracted.start_date && extracted.end_date && (
              <div><span className="text-gray-500">Periodo:</span> <span className="font-medium">{extracted.start_date} al {extracted.end_date}</span></div>
            )}
            {extracted.rent_amount && (
              <div><span className="text-gray-500">Alquiler:</span> <span className="font-medium">{extracted.rent_currency} {extracted.rent_amount}</span></div>
            )}
            {extracted.payment_day && (
              <div><span className="text-gray-500">Dia de pago:</span> <span className="font-medium">{extracted.payment_day}</span></div>
            )}
            {extracted.adjustment_type && (
              <div><span className="text-gray-500">Ajuste:</span> <span className="font-medium">{extracted.adjustment_type} c/{extracted.adjustment_frequency_months}m</span></div>
            )}
            {extracted.guarantor_name && (
              <div><span className="text-gray-500">Garante:</span> <span className="font-medium">{extracted.guarantor_name}</span></div>
            )}
          </div>
          <p className="mt-4 text-xs text-green-600">
            Los campos se pre-llenaron en el formulario. Avanza al siguiente paso para revisar.
          </p>

          <div className="mt-4 flex justify-center">
            <Button type="button" onClick={onSkip} className="bg-teal-600 hover:bg-teal-700">
              Continuar con los datos extraidos
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {!file && !extracted && (
        <p className="text-center text-xs text-gray-400">
          No tenes el PDF? Podes omitir este paso y cargar los datos manualmente.
        </p>
      )}
    </div>
  );
}
