"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { LogOut, User } from "lucide-react";
import { useState } from "react";

export function UserMenu() {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-600 text-white transition-colors hover:bg-teal-700"
      >
        <User className="h-4 w-4" />
      </button>
      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
          <div className="absolute right-0 z-50 mt-2 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
            <button onClick={handleSignOut} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
              <LogOut className="h-4 w-4" /> Cerrar sesion
            </button>
          </div>
        </>
      )}
    </div>
  );
}
