import { Navbar } from "@/components/navbar";
import { Disclaimer } from "@/components/disclaimer";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Disclaimer variant="footer" />
    </div>
  );
}
