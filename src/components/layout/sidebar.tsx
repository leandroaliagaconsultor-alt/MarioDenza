"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Building2, Users, UserCheck, FileText,
  CreditCard, BarChart3, Settings, ChevronLeft, ChevronRight, Menu, X,
} from "lucide-react";
import { useState, useEffect } from "react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Propiedades", href: "/propiedades", icon: Building2 },
  { name: "Duenos", href: "/duenos", icon: Users },
  { name: "Inquilinos", href: "/inquilinos", icon: UserCheck },
  { name: "Contratos", href: "/contratos", icon: FileText },
  { name: "Pagos", href: "/pagos", icon: CreditCard },
  { name: "Reportes", href: "/reportes", icon: BarChart3 },
  { name: "Configuracion", href: "/configuracion", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
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
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-gray-900 transition-all duration-300
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
          ${collapsed ? "lg:w-[68px]" : "lg:w-60"}
          w-60
        `}
      >
        {/* Logo + close on mobile */}
        <div className={`flex items-center justify-between border-b border-gray-800 px-4 ${collapsed ? "h-16" : "h-20"}`}>
          <div className="flex items-center">
            {collapsed ? (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#7ab929] text-white font-bold text-sm">
                MD
              </div>
            ) : (
              <img src="/logo.png" alt="Mario Denza Propiedades" className="h-14 w-auto brightness-0 invert" />
            )}
          </div>
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
                title={collapsed ? item.name : undefined}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-teal-600/20 text-teal-400"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }`}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle - desktop only */}
        <div className="hidden border-t border-gray-800 px-3 py-3 lg:block">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex w-full items-center justify-center rounded-lg px-3 py-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <>
                <ChevronLeft className="h-5 w-5" />
                <span className="ml-2 text-sm">Colapsar</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
