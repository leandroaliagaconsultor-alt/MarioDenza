"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";
import type { ContractFormValues } from "@/lib/validators/contract";
import type { ExtractedContractData } from "@/lib/ocr/extract-contract";
import type { PropertyOption } from "./wizard-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Building2, Check, Plus, Loader2, Sparkles, User } from "lucide-react";
import { toast } from "sonner";
import { createOwnerInline, createPropertyInline, getAllOwners } from "@/app/(app)/contratos/actions";

interface Props {
  properties: PropertyOption[];
  ocrData: ExtractedContractData | null;
  onPropertyCreated: (p: PropertyOption) => void;
}

export function StepProperty({ properties, ocrData, onPropertyCreated }: Props) {
  const { setValue, watch, formState: { errors } } = useFormContext<ContractFormValues>();
  const selectedId = watch("property_id");

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [owners, setOwners] = useState<{ id: string; full_name: string }[] | null>(null);
  const [showNewOwner, setShowNewOwner] = useState(false);

  // New property form
  const [newAddress, setNewAddress] = useState(ocrData?.property_address ?? "");
  const [newUnit, setNewUnit] = useState(ocrData?.property_unit ?? "");
  const [newCity, setNewCity] = useState("Mercedes");
  const [selectedOwnerId, setSelectedOwnerId] = useState("");

  // New owner form
  const [newOwnerName, setNewOwnerName] = useState(ocrData?.owner_name ?? "");
  const [newOwnerDni, setNewOwnerDni] = useState(ocrData?.owner_dni ?? "");
  const [newOwnerPhone, setNewOwnerPhone] = useState("");
  const [creatingOwner, setCreatingOwner] = useState(false);

  const available = properties.filter((p) => p.status === "disponible" || p.status === "en_mantenimiento");
  const occupied = properties.filter((p) => p.status === "ocupada");

  async function handleOpenCreate() {
    setShowCreate(true);
    if (!owners) {
      const data = await getAllOwners();
      setOwners(data);
    }
  }

  async function handleCreateOwner() {
    if (!newOwnerName) { toast.error("Ingresa el nombre del propietario"); return; }
    setCreatingOwner(true);
    try {
      const owner = await createOwnerInline({
        full_name: newOwnerName,
        dni_cuit: newOwnerDni,
        phone: newOwnerPhone,
      });
      setOwners((prev) => [owner, ...(prev || [])]);
      setSelectedOwnerId(owner.id);
      setShowNewOwner(false);
      toast.success(`Propietario "${owner.full_name}" creado`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al crear propietario");
    } finally {
      setCreatingOwner(false);
    }
  }

  async function handleCreateProperty() {
    if (!newAddress) { toast.error("Ingresa la direccion"); return; }
    if (!selectedOwnerId) { toast.error("Selecciona o crea un propietario"); return; }
    setCreating(true);
    try {
      const prop = await createPropertyInline({
        address: newAddress,
        unit: newUnit,
        city: newCity,
        owner_id: selectedOwnerId,
      });
      const ownerData = Array.isArray(prop.owner) ? prop.owner[0] : prop.owner;
      onPropertyCreated({
        id: prop.id,
        address: prop.address,
        unit: prop.unit,
        status: prop.status,
        owner: ownerData as { full_name: string } | null,
      });
      setShowCreate(false);
      toast.success("Propiedad creada y seleccionada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al crear propiedad");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* OCR suggestion */}
      {ocrData?.property_address && !selectedId && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
          <div className="flex items-center gap-1.5 font-medium text-amber-700">
            <Sparkles className="h-4 w-4" /> La IA detecto esta propiedad:
          </div>
          <p className="mt-1 text-amber-800">
            {ocrData.property_address}{ocrData.property_unit ? ` - ${ocrData.property_unit}` : ""}
            {ocrData.owner_name && <span className="text-amber-600"> (Dueno: {ocrData.owner_name})</span>}
          </p>
          <p className="mt-1 text-xs text-amber-600">Seleccionala abajo si ya existe, o creala nueva.</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <Label>Selecciona una propiedad *</Label>
        <Button type="button" variant="outline" size="sm" onClick={handleOpenCreate}>
          <Plus className="mr-1 h-3.5 w-3.5" /> Crear nueva
        </Button>
      </div>

      {errors.property_id && (
        <p className="text-sm text-red-500">{errors.property_id.message}</p>
      )}

      {/* Create new property inline */}
      {showCreate && (
        <div className="rounded-lg border border-teal-200 bg-teal-50/50 p-4 space-y-4">
          <h4 className="text-sm font-semibold text-gray-700">Nueva propiedad</h4>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <Label>Direccion *</Label>
              <Input value={newAddress} onChange={(e) => setNewAddress(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Unidad</Label>
              <Input value={newUnit} onChange={(e) => setNewUnit(e.target.value)} className="mt-1" placeholder="Depto/Piso" />
            </div>
            <div>
              <Label>Ciudad</Label>
              <Input value={newCity} onChange={(e) => setNewCity(e.target.value)} className="mt-1" />
            </div>
          </div>

          {/* Owner selection */}
          <div>
            <div className="flex items-center justify-between">
              <Label>Propietario *</Label>
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowNewOwner(!showNewOwner)}>
                <User className="mr-1 h-3.5 w-3.5" /> {showNewOwner ? "Seleccionar existente" : "Crear nuevo"}
              </Button>
            </div>

            {showNewOwner ? (
              <div className="mt-2 rounded-md border border-gray-200 bg-white p-3 space-y-3">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div>
                    <Label>Nombre *</Label>
                    <Input value={newOwnerName} onChange={(e) => setNewOwnerName(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label>DNI/CUIT</Label>
                    <Input value={newOwnerDni} onChange={(e) => setNewOwnerDni(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label>Telefono</Label>
                    <Input value={newOwnerPhone} onChange={(e) => setNewOwnerPhone(e.target.value)} className="mt-1" />
                  </div>
                </div>
                <Button type="button" size="sm" onClick={handleCreateOwner} disabled={creatingOwner}>
                  {creatingOwner && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
                  Crear propietario
                </Button>
              </div>
            ) : (
              <select
                value={selectedOwnerId}
                onChange={(e) => setSelectedOwnerId(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              >
                <option value="">Seleccionar propietario...</option>
                {(owners || []).map((o) => (
                  <option key={o.id} value={o.id}>{o.full_name}</option>
                ))}
              </select>
            )}
          </div>

          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={handleCreateProperty} disabled={creating} className="bg-teal-600 hover:bg-teal-700">
              {creating && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
              Crear propiedad
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setShowCreate(false)}>Cancelar</Button>
          </div>
        </div>
      )}

      {/* Existing properties */}
      {available.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {available.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setValue("property_id", p.id, { shouldValidate: true })}
              className={`flex items-start gap-3 rounded-lg border p-4 text-left transition ${
                selectedId === p.id
                  ? "border-teal-500 bg-teal-50 ring-2 ring-teal-500/20"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <Building2 className={`mt-0.5 h-5 w-5 shrink-0 ${selectedId === p.id ? "text-teal-600" : "text-gray-400"}`} />
              <div className="flex-1">
                <p className="font-medium text-gray-900">{p.address}{p.unit ? ` - ${p.unit}` : ""}</p>
                {p.owner && <p className="mt-0.5 text-sm text-gray-500">Dueno: {p.owner.full_name}</p>}
              </div>
              {selectedId === p.id && <Check className="h-5 w-5 text-teal-600" />}
            </button>
          ))}
        </div>
      )}

      {available.length === 0 && !showCreate && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          No hay propiedades disponibles. Crea una nueva con el boton de arriba.
        </div>
      )}

      {occupied.length > 0 && (
        <>
          <p className="mt-4 text-xs font-medium uppercase tracking-wider text-gray-400">Ocupadas</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {occupied.map((p) => (
              <div key={p.id} className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-4 opacity-50">
                <Building2 className="mt-0.5 h-5 w-5 text-gray-300" />
                <div>
                  <p className="font-medium text-gray-500">{p.address}{p.unit ? ` - ${p.unit}` : ""}</p>
                  {p.owner && <p className="mt-0.5 text-sm text-gray-400">Dueno: {p.owner.full_name}</p>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
