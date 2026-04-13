"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, User, Trash2, Plus, Key, Mail, Check } from "lucide-react";
import { updateMyEmail, updateMyPassword, createUser, deleteUser } from "./actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils/format";

interface UserInfo {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
}

interface Props {
  currentUserId: string;
  currentEmail: string;
  users: UserInfo[];
}

export function UserManager({ currentUserId, currentEmail, users }: Props) {
  const router = useRouter();

  // My profile
  const [newEmail, setNewEmail] = useState(currentEmail);
  const [newPassword, setNewPassword] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [emailSaved, setEmailSaved] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);

  // New user
  const [showNewUser, setShowNewUser] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [creatingUser, setCreatingUser] = useState(false);

  async function handleUpdateEmail() {
    if (!newEmail || newEmail === currentEmail) return;
    setSavingEmail(true);
    try {
      await updateMyEmail(newEmail);
      setEmailSaved(true);
      toast.success("Email actualizado. Revisa tu casilla para confirmar el cambio.");
      setTimeout(() => setEmailSaved(false), 3000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setSavingEmail(false);
    }
  }

  async function handleUpdatePassword() {
    if (!newPassword) return;
    setSavingPassword(true);
    try {
      await updateMyPassword(newPassword);
      setNewPassword("");
      setPasswordSaved(true);
      toast.success("Contraseña actualizada");
      setTimeout(() => setPasswordSaved(false), 3000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleCreateUser() {
    if (!newUserEmail || !newUserPassword) {
      toast.error("Completa email y contraseña");
      return;
    }
    setCreatingUser(true);
    try {
      await createUser(newUserEmail, newUserPassword);
      setNewUserEmail("");
      setNewUserPassword("");
      setShowNewUser(false);
      toast.success("Usuario creado");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setCreatingUser(false);
    }
  }

  async function handleDeleteUser(userId: string, email: string) {
    if (!confirm(`Eliminar al usuario "${email}"?`)) return;
    try {
      await deleteUser(userId);
      toast.success("Usuario eliminado");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    }
  }

  const canAddMore = users.length < 3;

  return (
    <div className="space-y-6">
      {/* My profile */}
      <div className="rounded-xl border border-gray-200 bg-white/80 p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <User className="h-5 w-5 text-gray-400" /> Mi cuenta
        </h2>
        <Separator className="my-4" />

        <div className="space-y-4">
          <div>
            <Label>Email</Label>
            <div className="mt-1 flex gap-2">
              <Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} type="email" className="flex-1" />
              <Button onClick={handleUpdateEmail} disabled={savingEmail || newEmail === currentEmail} variant="outline">
                {savingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : emailSaved ? <Check className="h-4 w-4 text-green-600" /> : <Mail className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div>
            <Label>Nueva contraseña</Label>
            <div className="mt-1 flex gap-2">
              <Input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="password" placeholder="Minimo 6 caracteres" className="flex-1" />
              <Button onClick={handleUpdatePassword} disabled={savingPassword || !newPassword} variant="outline">
                {savingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : passwordSaved ? <Check className="h-4 w-4 text-green-600" /> : <Key className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Users list */}
      <div className="rounded-xl border border-gray-200 bg-white/80 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Usuarios ({users.length}/3)</h2>
          {canAddMore && (
            <Button variant="outline" size="sm" onClick={() => setShowNewUser(!showNewUser)}>
              <Plus className="mr-1 h-4 w-4" /> Agregar usuario
            </Button>
          )}
        </div>
        <Separator className="my-4" />

        {/* New user form */}
        {showNewUser && (
          <div className="mb-4 rounded-lg border border-teal-200 bg-teal-50/50 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Nuevo usuario</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label>Email</Label>
                <Input value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} type="email" className="mt-1" placeholder="email@ejemplo.com" />
              </div>
              <div>
                <Label>Contraseña</Label>
                <Input value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} type="password" className="mt-1" placeholder="Min 6 caracteres" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateUser} disabled={creatingUser} size="sm" className="bg-teal-600 hover:bg-teal-700">
                {creatingUser && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                Crear usuario
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowNewUser(false)}>Cancelar</Button>
            </div>
          </div>
        )}

        {/* User list */}
        <div className="space-y-3">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {u.email}
                  {u.id === currentUserId && (
                    <span className="ml-2 inline-flex items-center rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-700">Vos</span>
                  )}
                </p>
                <p className="text-xs text-gray-400">
                  Creado: {formatDate(u.created_at)}
                  {u.last_sign_in_at && ` — Ultimo acceso: ${formatDate(u.last_sign_in_at)}`}
                </p>
              </div>
              {u.id !== currentUserId && (
                <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(u.id, u.email)}>
                  <Trash2 className="h-4 w-4 text-red-400" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {!canAddMore && (
          <p className="mt-3 text-xs text-gray-400">Se alcanzo el maximo de 3 usuarios.</p>
        )}
      </div>
    </div>
  );
}
