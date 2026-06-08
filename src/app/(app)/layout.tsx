import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { UpcomingAdjustmentsBanner } from "@/components/layout/upcoming-adjustments-banner";
import { getUpcomingAdjustmentsCount } from "./aumentos/actions";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const adjustmentsCount = await getUpcomingAdjustmentsCount().catch(() => 0);

  return (
    <div className="min-h-screen lg:ml-60">
      <Sidebar adjustmentsCount={adjustmentsCount} />
      <Header />
      <main className="p-4 pt-16 lg:p-6 lg:pt-6">
        <UpcomingAdjustmentsBanner count={adjustmentsCount} />
        {children}
      </main>
    </div>
  );
}
