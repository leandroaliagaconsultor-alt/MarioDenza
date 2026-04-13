"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

const MAX_USERS = 3;

export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function listUsers() {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.listUsers();
  if (error) throw error;
  return data.users;
}

export async function updateMyEmail(newEmail: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ email: newEmail });
  if (error) throw error;
  revalidatePath("/configuracion/usuarios");
}

export async function updateMyPassword(newPassword: string) {
  if (newPassword.length < 6) throw new Error("La contraseña debe tener al menos 6 caracteres");
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

export async function uploadAvatar(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const file = formData.get("avatar") as File;
  if (!file) throw new Error("No se recibio archivo");
  if (!file.type.startsWith("image/")) throw new Error("Solo se permiten imagenes");
  if (file.size > 2 * 1024 * 1024) throw new Error("La imagen no puede superar 2MB");

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
  const path = `avatars/${user.id}.${ext}`;

  const { error: uploadErr } = await supabase.storage
    .from("documents")
    .upload(path, file, { contentType: file.type, upsert: true });
  if (uploadErr) throw uploadErr;

  const { data: { publicUrl } } = supabase.storage
    .from("documents")
    .getPublicUrl(path);

  const { error: updateErr } = await supabase.auth.updateUser({
    data: { avatar_url: publicUrl + "?t=" + Date.now() },
  });
  if (updateErr) throw updateErr;

  revalidatePath("/configuracion/usuarios");
  revalidatePath("/dashboard");
  return publicUrl;
}

export async function createUser(email: string, password: string) {
  const admin = createAdminClient();

  // Check max users
  const { data } = await admin.auth.admin.listUsers();
  if (data.users.length >= MAX_USERS) {
    throw new Error(`Maximo ${MAX_USERS} usuarios permitidos`);
  }

  if (password.length < 6) throw new Error("La contraseña debe tener al menos 6 caracteres");

  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  revalidatePath("/configuracion/usuarios");
}

export async function deleteUser(userId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user?.id === userId) {
    throw new Error("No podes eliminar tu propio usuario");
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) throw error;
  revalidatePath("/configuracion/usuarios");
}
