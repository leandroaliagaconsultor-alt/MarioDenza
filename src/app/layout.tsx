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
  title: "Gestion Inmobiliaria",
  description: "Sistema de gestion para inmobiliaria",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={cn("h-full antialiased", inter.variable)}>
      <body className="h-full font-sans">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
