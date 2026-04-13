import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen lg:ml-60">
      <Sidebar />
      <Header />
      <main className="p-4 pt-16 lg:p-6 lg:pt-6">{children}</main>
    </div>
  );
}
