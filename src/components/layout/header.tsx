import { Suspense } from "react";
import { Bell } from "lucide-react";
import { NotificationBell } from "./notification-bell";
import { UserMenu } from "./user-menu";
import { createClient } from "@/lib/supabase/server";

export async function Header() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const avatarUrl = (user?.user_metadata?.avatar_url as string) ?? null;
  const email = user?.email ?? "";

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-gray-200 bg-white/80 px-6">
      <div />
      <div className="flex items-center gap-3">
        <Suspense fallback={
          <div className="rounded-lg p-2 text-gray-400"><Bell className="h-5 w-5" /></div>
        }>
          <NotificationBell />
        </Suspense>
        <UserMenu avatarUrl={avatarUrl} email={email} />
      </div>
    </header>
  );
}
