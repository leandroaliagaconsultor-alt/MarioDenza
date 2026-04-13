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
