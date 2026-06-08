"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";
import type { ContractFormValues } from "@/lib/validators/contract";
import type { ExtractedContractData } from "@/lib/ocr/extract-contract";
import type { TenantOption } from "./wizard-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { UserCheck, Check, Plus, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { createTenantInline } from "@/app/(app)/contratos/actions";

interface Props {
  tenants: TenantOption[];
  ocrData: ExtractedContractData | null;
  onTenantCreated: (t: TenantOption) => void;
}

export function StepTenant({ tenants, ocrData, onTenantCreated }: Props) {
  const { setValue, watch, formState: { errors } } = useFormContext<ContractFormValues>();
  const selectedId = watch("tenant_id");
  const coTenantIds = (watch("co_tenant_ids") as string[] | undefined) ?? [];

  function toggleCoTenant(id: string) {
    const next = coTenantIds.includes(id)
      ? coTenantIds.filter((x) => x !== id)
      : [...coTenantIds, id];
    setValue("co_tenant_ids", next, { shouldValidate: true });
  }

  // Sugerencia anti-duplicado: ¿el inquilino del OCR ya está cargado? (match por DNI o nombre)
  const ocrName = ocrData?.tenant_name?.toLowerCase().trim();
  const ocrDni = ocrData?.tenant_dni?.replace(/\D/g, "");
  const tenantMatches = !selectedId && (ocrName || ocrDni)
    ? tenants
        .filter((t) => {
          const tDni = (t.dni ?? "").replace(/\D/g, "");
          return (ocrDni && tDni && tDni === ocrDni) || (!!ocrName && t.full_name.toLowerCase().includes(ocrName));
        })
        .slice(0, 5)
    : [];

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState(ocrData?.tenant_name ?? "");
  const [newDni, setNewDni] = useState(ocrData?.tenant_dni ?? "");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");

  async function handleCreate() {
    if (!newName) { toast.error("Ingresa el nombre del inquilino"); return; }
    setCreating(true);
    try {
      const tenant = await createTenantInline({
        full_name: newName,
        dni: newDni,
        phone: newPhone,
        email: newEmail,
      });
      onTenantCreated(tenant);
      setShowCreate(false);
      toast.success(`Inquilino "${tenant.full_name}" creado y seleccionado`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al crear inquilino");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* OCR suggestion (solo si no encontramos coincidencias ya cargadas) */}
      {ocrData?.tenant_name && !selectedId && tenantMatches.length === 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
          <div className="flex items-center gap-1.5 font-medium text-amber-700">
            <Sparkles className="h-4 w-4" /> La IA detecto este inquilino:
          </div>
          <p className="mt-1 text-amber-800">
            {ocrData.tenant_name}
            {ocrData.tenant_dni && <span className="text-amber-600"> (DNI: {ocrData.tenant_dni})</span>}
          </p>
          <p className="mt-1 text-xs text-amber-600">Seleccionalo abajo si ya existe, o crealo nuevo.</p>
        </div>
      )}

      {/* Anti-duplicado: el inquilino ya podría estar cargado */}
      {tenantMatches.length > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm">
          <div className="flex items-center gap-1.5 font-medium text-amber-700">
            <Sparkles className="h-4 w-4" /> Este inquilino podría ya estar cargado:
          </div>
          <div className="mt-2 space-y-1.5">
            {tenantMatches.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-2">
                <span className="text-amber-800">{t.full_name}{t.dni ? ` · ${t.dni}` : ""}</span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="border-amber-300 text-amber-800 hover:bg-amber-100"
                  onClick={() => setValue("tenant_id", t.id, { shouldValidate: true })}
                >
                  Usar este
                </Button>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-amber-600">O creá uno nuevo si no es ninguno.</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <Label>Inquilino principal *</Label>
        <Button type="button" variant="outline" size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="mr-1 h-3.5 w-3.5" /> Crear nuevo
        </Button>
      </div>

      {errors.tenant_id && (
        <p className="text-sm text-red-500">{errors.tenant_id.message}</p>
      )}

      {/* Create new tenant inline */}
      {showCreate && (
        <div className="rounded-lg border border-teal-200 bg-teal-50/50 p-4 space-y-3">
          <h4 className="text-sm font-semibold text-gray-700">Nuevo inquilino</h4>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label>Nombre completo *</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>DNI</Label>
              <Input value={newDni} onChange={(e) => setNewDni(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Telefono</Label>
              <Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="mt-1" type="email" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={handleCreate} disabled={creating} className="bg-teal-600 hover:bg-teal-700">
              {creating && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
              Crear inquilino
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setShowCreate(false)}>Cancelar</Button>
          </div>
        </div>
      )}

      {/* Existing tenants */}
      {tenants.length === 0 && !showCreate ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          No hay inquilinos registrados. Crea uno nuevo con el boton de arriba.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {tenants.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setValue("tenant_id", t.id, { shouldValidate: true });
                setValue("co_tenant_ids", coTenantIds.filter((x) => x !== t.id), { shouldValidate: true });
              }}
              className={`flex items-start gap-3 rounded-lg border p-4 text-left transition ${
                selectedId === t.id
                  ? "border-teal-500 bg-teal-50 ring-2 ring-teal-500/20"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <UserCheck className={`mt-0.5 h-5 w-5 shrink-0 ${selectedId === t.id ? "text-teal-600" : "text-gray-400"}`} />
              <div className="flex-1">
                <p className="font-medium text-gray-900">{t.full_name}</p>
                {t.dni && <p className="mt-0.5 text-sm text-gray-500">DNI: {t.dni}</p>}
              </div>
              {selectedId === t.id && <Check className="h-5 w-5 text-teal-600" />}
            </button>
          ))}
        </div>
      )}

      {/* Co-inquilinos (opcional) */}
      {selectedId && tenants.filter((t) => t.id !== selectedId).length > 0 && (
        <div className="space-y-2 border-t border-gray-100 pt-4">
          <Label>Co-inquilinos (opcional)</Label>
          <p className="text-xs text-gray-500">Marcá otros inquilinos que firman el mismo contrato.</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {tenants.filter((t) => t.id !== selectedId).map((t) => {
              const checked = coTenantIds.includes(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggleCoTenant(t.id)}
                  className={`flex items-center gap-2 rounded-lg border p-3 text-left text-sm transition ${
                    checked
                      ? "border-teal-500 bg-teal-50 ring-2 ring-teal-500/20"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${checked ? "border-teal-600 bg-teal-600 text-white" : "border-gray-300"}`}>
                    {checked && <Check className="h-3 w-3" />}
                  </span>
                  <span className="flex-1">
                    <span className="font-medium text-gray-900">{t.full_name}</span>
                    {t.dni && <span className="text-gray-500"> · {t.dni}</span>}
                  </span>
                </button>
              );
            })}
          </div>
          {coTenantIds.length > 0 && (
            <p className="text-xs text-teal-700">
              {coTenantIds.length} co-inquilino{coTenantIds.length > 1 ? "s" : ""} seleccionado{coTenantIds.length > 1 ? "s" : ""}.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
