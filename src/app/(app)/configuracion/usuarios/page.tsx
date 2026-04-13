import { PageHeader } from "@/components/ui/page-header";
import { getCurrentUser, listUsers } from "./actions";
import { UserManager } from "./user-manager";

export default async function UsuariosPage() {
  const [currentUser, users] = await Promise.all([
    getCurrentUser(),
    listUsers(),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Usuarios"
        description="Administra los usuarios del sistema (maximo 3)"
        backHref="/configuracion"
      />
      <UserManager
        currentUserId={currentUser?.id ?? ""}
        currentEmail={currentUser?.email ?? ""}
        users={users.map((u) => ({
          id: u.id,
          email: u.email ?? "",
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at ?? null,
        }))}
      />
    </div>
  );
}
