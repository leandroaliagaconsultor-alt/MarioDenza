"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { propertyFormSchema, type PropertyFormValues } from "@/lib/validators/property";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { PROPERTY_TYPES, PROPERTY_STATUSES } from "@/lib/types/enums";

interface PropertyFormProps {
  owners: { id: string; full_name: string }[];
  defaultValues?: Partial<PropertyFormValues>;
  onSubmit: (values: PropertyFormValues) => Promise<void>;
  submitLabel?: string;
}

export function PropertyForm({ owners, defaultValues, onSubmit, submitLabel = "Guardar" }: PropertyFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<PropertyFormValues>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: {
      address: "", unit: "", city: "Mercedes", province: "Buenos Aires",
      type: "residencial", owner_id: "", status: "disponible", notes: "",
      ...defaultValues,
    },
  });

  async function handleFormSubmit(values: PropertyFormValues) {
    setLoading(true);
    try {
      await onSubmit(values);
      toast.success("Propiedad guardada correctamente");
      router.push("/propiedades");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white/80 p-6 shadow-sm backdrop-blur-sm">
        <h2 className="text-lg font-semibold text-gray-900">Ubicacion</h2>
        <Separator className="my-4" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="address">Direccion *</Label>
            <Input id="address" {...register("address")} className="mt-1" />
            {errors.address && <p className="mt-1 text-sm text-red-500">{errors.address.message}</p>}
          </div>
          <div>
            <Label htmlFor="unit">Unidad (depto/piso)</Label>
            <Input id="unit" {...register("unit")} className="mt-1" placeholder="Ej: Depto A, PB" />
          </div>
          <div>
            <Label htmlFor="city">Ciudad</Label>
            <Input id="city" {...register("city")} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="province">Provincia</Label>
            <Input id="province" {...register("province")} className="mt-1" />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white/80 p-6 shadow-sm backdrop-blur-sm">
        <h2 className="text-lg font-semibold text-gray-900">Detalles</h2>
        <Separator className="my-4" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="type">Tipo</Label>
            <select
              id="type"
              {...register("type")}
              className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              {Object.entries(PROPERTY_TYPES).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="status">Estado</Label>
            <select
              id="status"
              {...register("status")}
              className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              {Object.entries(PROPERTY_STATUSES).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="owner_id">Propietario *</Label>
            <select
              id="owner_id"
              {...register("owner_id")}
              className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              <option value="">Seleccionar propietario...</option>
              {owners.map((owner) => (
                <option key={owner.id} value={owner.id}>{owner.full_name}</option>
              ))}
            </select>
            {errors.owner_id && <p className="mt-1 text-sm text-red-500">{errors.owner_id.message}</p>}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white/80 p-6 shadow-sm backdrop-blur-sm">
        <h2 className="text-lg font-semibold text-gray-900">Notas</h2>
        <Separator className="my-4" />
        <Textarea {...register("notes")} placeholder="Notas internas..." rows={3} />
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
        <Button type="submit" disabled={loading} className="bg-teal-600 hover:bg-teal-700">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
