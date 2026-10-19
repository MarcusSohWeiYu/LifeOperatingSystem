import { AppSidebar } from "@/components/app-sidebar";
import { MobileNav } from "@/components/mobile-nav";

export default function FinanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AppSidebar />
      <main className="md:pl-56 pb-16 md:pb-0 min-h-screen">
        <div className="container mx-auto px-4 py-6 max-w-5xl">
          {children}
        </div>
      </main>
      <MobileNav />
    </>
  );
}
