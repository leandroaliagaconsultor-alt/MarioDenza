"use client";

import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contractFormSchema, contractDefaults, type ContractFormValues } from "@/lib/validators/contract";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { toast } from "sonner";
import { createContract } from "@/app/(app)/contratos/actions";
import { StepUploadPdf } from "./step-upload-pdf";
import { StepProperty } from "./step-property";
import { StepTenant } from "./step-tenant";
import { StepEconomic } from "./step-economic";
import { StepAdjustments } from "./step-adjustments";
import { StepConfirmation } from "./step-confirmation";
import type { ExtractedContractData } from "@/lib/ocr/extract-contract";

export interface PropertyOption {
  id: string;
  address: string;
  unit: string | null;
  status: string;
  owner: { full_name: string } | null;
}

export interface TenantOption {
  id: string;
  full_name: string;
  dni: string | null;
}

interface WizardShellProps {
  properties: PropertyOption[];
  tenants: TenantOption[];
  prefill?: Partial<ContractFormValues>;
}

const STEPS = [
  { title: "Subir contrato", fields: [] },
  { title: "Propiedad", fields: ["property_id"] },
  { title: "Inquilino", fields: ["tenant_id"] },
  { title: "Datos economicos", fields: ["start_date", "end_date", "base_rent", "payment_day"] },
  { title: "Aumentos", fields: [] },
  { title: "Confirmacion", fields: [] },
] as const;

export function WizardShell({ properties: initialProperties, tenants: initialTenants, prefill }: WizardShellProps) {
  // If prefill (renewal), skip to economic data step (step 3)
  const [step, setStep] = useState(prefill ? 3 : 0);
  const [loading, setLoading] = useState(false);
  const [ocrData, setOcrData] = useState<ExtractedContractData | null>(null);
  // Mutable lists — grow when user creates inline
  const [properties, setProperties] = useState(initialProperties);
  const [tenants, setTenants] = useState(initialTenants);
  const router = useRouter();

  const methods = useForm<ContractFormValues>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: { ...contractDefaults, ...prefill },
    mode: "onTouched",
  });

  const { trigger } = methods;

  const addProperty = useCallback((p: PropertyOption) => {
    setProperties((prev) => [p, ...prev]);
    methods.setValue("property_id", p.id);
  }, [methods]);

  const addTenant = useCallback((t: TenantOption) => {
    setTenants((prev) => [t, ...prev]);
    methods.setValue("tenant_id", t.id);
  }, [methods]);

  async function goNext() {
    const fieldsToValidate = STEPS[step].fields as unknown as (keyof ContractFormValues)[];
    if (fieldsToValidate.length > 0) {
      const valid = await trigger(fieldsToValidate);
      if (!valid) return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 0));
  }

  async function onSubmit() {
    const valid = await trigger();
    if (!valid) {
      toast.error("Revisa los campos obligatorios en los pasos anteriores");
      return;
    }
    const values = methods.getValues();
    setLoading(true);
    try {
      const contractId = await createContract(values);
      toast.success("Contrato creado correctamente");
      router.push(`/contratos/${contractId}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al crear contrato");
    } finally {
      setLoading(false);
    }
  }

  return (
    <FormProvider {...methods}>
      {/* Step indicator */}
      <div className="mb-8 flex items-center justify-center gap-2">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => i < step && setStep(i)}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition ${
                i === step
                  ? "bg-teal-600 text-white"
                  : i < step
                  ? "bg-teal-100 text-teal-700 hover:bg-teal-200"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </button>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 w-6 ${i < step ? "bg-teal-300" : "bg-gray-200"}`} />
            )}
          </div>
        ))}
      </div>

      <div className="text-center mb-6">
        <h2 className="text-lg font-semibold text-gray-900">{STEPS[step].title}</h2>
      </div>

      <div>
        <div className="rounded-xl border border-gray-200 bg-white/80 p-6 shadow-sm backdrop-blur-sm">
          {step === 0 && (
            <StepUploadPdf
              properties={properties}
              tenants={tenants}
              onExtracted={setOcrData}
              onSkip={goNext}
            />
          )}
          {step === 1 && (
            <StepProperty
              properties={properties}
              ocrData={ocrData}
              onPropertyCreated={addProperty}
            />
          )}
          {step === 2 && (
            <StepTenant
              tenants={tenants}
              ocrData={ocrData}
              onTenantCreated={addTenant}
            />
          )}
          {step === 3 && <StepEconomic />}
          {step === 4 && <StepAdjustments />}
          {step === 5 && <StepConfirmation properties={properties} tenants={tenants} />}
        </div>

        <div className="mt-6 flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={step === 0 ? () => router.push("/contratos") : goBack}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            {step === 0 ? "Cancelar" : "Anterior"}
          </Button>

          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={goNext} className="bg-teal-600 hover:bg-teal-700">
              {step === 0 ? "Omitir" : "Siguiente"}
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button type="button" onClick={onSubmit} disabled={loading} className="bg-teal-600 hover:bg-teal-700">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear contrato
            </Button>
          )}
        </div>
      </div>
    </FormProvider>
  );
}
