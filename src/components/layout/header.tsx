import { Suspense } from "react";
import { Bell } from "lucide-react";
import { NotificationBell } from "./notification-bell";
import { UserMenu } from "./user-menu";

export function Header() {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-gray-200 bg-white/80 px-6 backdrop-blur-sm">
      <div />
      <div className="flex items-center gap-3">
        <Suspense fallback={
          <div className="rounded-lg p-2 text-gray-400"><Bell className="h-5 w-5" /></div>
        }>
          <NotificationBell />
        </Suspense>
        <UserMenu />
      </div>
    </header>
  );
}
