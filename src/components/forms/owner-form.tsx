"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ownerFormSchema, type OwnerFormValues } from "@/lib/validators/owner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface OwnerFormProps {
  defaultValues?: Partial<OwnerFormValues>;
  onSubmit: (values: OwnerFormValues) => Promise<void>;
  submitLabel?: string;
}

export function OwnerForm({
  defaultValues,
  onSubmit,
  submitLabel = "Guardar",
}: OwnerFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OwnerFormValues>({
    resolver: zodResolver(ownerFormSchema),
    defaultValues: {
      full_name: "",
      dni_cuit: "",
      phone: "",
      email: "",
      address: "",
      bank_info: { cbu: "", banco: "", alias: "" },
      notes: "",
      ...defaultValues,
    },
  });

  async function handleFormSubmit(values: OwnerFormValues) {
    setLoading(true);
    try {
      await onSubmit(values);
      toast.success("Propietario guardado correctamente");
      router.push("/duenos");
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
            {errors.full_name && (
              <p className="mt-1 text-sm text-red-500">{errors.full_name.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="dni_cuit">DNI / CUIT</Label>
            <Input id="dni_cuit" {...register("dni_cuit")} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="phone">Telefono</Label>
            <Input id="phone" {...register("phone")} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register("email")} className="mt-1" />
            {errors.email && (
              <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="address">Direccion</Label>
            <Input id="address" {...register("address")} className="mt-1" />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white/80 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Datos bancarios</h2>
        <Separator className="my-4" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="bank_info.banco">Banco</Label>
            <Input id="bank_info.banco" {...register("bank_info.banco")} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="bank_info.cbu">CBU</Label>
            <Input id="bank_info.cbu" {...register("bank_info.cbu")} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="bank_info.alias">Alias</Label>
            <Input id="bank_info.alias" {...register("bank_info.alias")} className="mt-1" />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white/80 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Notas</h2>
        <Separator className="my-4" />
        <Textarea
          {...register("notes")}
          placeholder="Notas internas sobre el propietario..."
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading} className="bg-teal-600 hover:bg-teal-700">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
