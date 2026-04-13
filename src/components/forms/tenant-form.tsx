"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { tenantFormSchema, type TenantFormValues } from "@/lib/validators/tenant";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface TenantFormProps {
  defaultValues?: Partial<TenantFormValues>;
  onSubmit: (values: TenantFormValues) => Promise<void>;
  submitLabel?: string;
}

export function TenantForm({ defaultValues, onSubmit, submitLabel = "Guardar" }: TenantFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, control, formState: { errors } } = useForm<TenantFormValues>({
    resolver: zodResolver(tenantFormSchema),
    defaultValues: {
      full_name: "", dni: "", phone: "", email: "", notes: "", guarantors: [],
      ...defaultValues,
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "guarantors" });

  async function handleFormSubmit(values: TenantFormValues) {
    setLoading(true);
    try {
      await onSubmit(values);
      toast.success("Inquilino guardado correctamente");
      router.push("/inquilinos");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white/80 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Datos personales</h2>
        <Separator className="my-4" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="full_name">Nombre completo *</Label>
            <Input id="full_name" {...register("full_name")} className="mt-1" />
            {errors.full_name && <p className="mt-1 text-sm text-red-500">{errors.full_name.message}</p>}
          </div>
          <div>
            <Label htmlFor="dni">DNI</Label>
            <Input id="dni" {...register("dni")} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="phone">Telefono</Label>
            <Input id="phone" {...register("phone")} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register("email")} className="mt-1" />
            {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white/80 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Garantes</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ full_name: "", dni: "", phone: "", address: "" })}
          >
            <Plus className="mr-1 h-4 w-4" /> Agregar garante
          </Button>
        </div>
        <Separator className="my-4" />
        {fields.length === 0 ? (
          <p className="text-sm text-gray-400">Sin garantes registrados</p>
        ) : (
          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Garante {index + 1}</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <Label>Nombre *</Label>
                    <Input {...register(`guarantors.${index}.full_name`)} className="mt-1" />
                  </div>
                  <div>
                    <Label>DNI</Label>
                    <Input {...register(`guarantors.${index}.dni`)} className="mt-1" />
                  </div>
                  <div>
                    <Label>Telefono</Label>
                    <Input {...register(`guarantors.${index}.phone`)} className="mt-1" />
                  </div>
                  <div>
                    <Label>Direccion</Label>
                    <Input {...register(`guarantors.${index}.address`)} className="mt-1" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white/80 p-6 shadow-sm">
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
