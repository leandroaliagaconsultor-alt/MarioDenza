import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Mario Denza Propiedades",
    template: "%s | Mario Denza Propiedades",
  },
  description: "Sistema de gestion — Mario Denza Propiedades, Mercedes, Buenos Aires",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={cn("antialiased", inter.variable)}>
      <body className="min-h-screen font-sans bg-gray-50">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
