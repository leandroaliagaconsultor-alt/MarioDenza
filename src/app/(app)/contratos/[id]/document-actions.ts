"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function uploadDocument(
  entityType: "property" | "contract" | "tenant" | "owner",
  entityId: string,
  category: "contrato" | "dni" | "garantia" | "recibo" | "foto" | "otro",
  formData: FormData
) {
  const supabase = await createClient();
  const file = formData.get("file") as File;
  if (!file) throw new Error("No se recibio archivo");

  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${entityType}/${entityId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(path, file, { contentType: file.type });
  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from("documents")
    .getPublicUrl(path);

  const { error: dbError } = await supabase.from("documents").insert({
    entity_type: entityType,
    entity_id: entityId,
    file_url: publicUrl,
    file_name: file.name,
    file_size: file.size,
    mime_type: file.type,
    category,
  });
  if (dbError) throw dbError;

  revalidatePath(`/contratos/${entityId}`);
  revalidatePath(`/propiedades/${entityId}`);
  revalidatePath(`/duenos/${entityId}`);
  revalidatePath(`/inquilinos/${entityId}`);
}

export async function getDocuments(entityType: string, entityId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function deleteDocument(id: string) {
  const supabase = await createClient();
  const { data: doc } = await supabase.from("documents").select("file_url").eq("id", id).single();

  if (doc?.file_url) {
    const path = doc.file_url.split("/documents/")[1];
    if (path) await supabase.storage.from("documents").remove([path]);
  }

  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) throw error;
}
