import { Sidebar } from "@/components/sidebar/Sidebar"
import { Navbar }  from "@/components/navbar/Navbar"

export default function AlertsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#0B0F1A]">
      <Sidebar />
      <div className="ml-[240px]">
        <Navbar />
        <main className="pt-16 min-h-screen">{children}</main>
      </div>
    </div>
  )
}