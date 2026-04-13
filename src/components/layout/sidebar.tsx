"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Building2, Users, UserCheck, FileText,
  CreditCard, BarChart3, Settings, Menu, X,
} from "lucide-react";
import { useState, useEffect } from "react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Propiedades", href: "/propiedades", icon: Building2 },
  { name: "Dueños", href: "/duenos", icon: Users },
  { name: "Inquilinos", href: "/inquilinos", icon: UserCheck },
  { name: "Contratos", href: "/contratos", icon: FileText },
  { name: "Pagos", href: "/pagos", icon: CreditCard },
  { name: "Reportes", href: "/reportes", icon: BarChart3 },
  { name: "Configuración", href: "/configuracion", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-lg bg-gray-900 text-white shadow-lg lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-60 flex-col bg-gray-900 transition-transform duration-300
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
        `}
      >
        {/* Logo + close on mobile */}
        <div className="flex h-20 items-center justify-between border-b border-gray-800 px-4">
          <img src="/logo.png" alt="Mario Denza Propiedades" className="h-14 w-auto brightness-0 invert" />
          <button
            onClick={() => setMobileOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                title={item.name}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-teal-600/20 text-teal-400"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }`}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>

      </aside>
    </>
  );
}
