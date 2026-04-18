import { Sidebar } from '@/components/layout/Sidebar'
import { Navbar } from '@/components/layout/Navbar'
import { BottomNav } from '@/components/layout/BottomNav'
import { RealtimeNotif } from '@/components/dashboard/RealtimeNotif'
import { RegisterSW } from '@/components/pwa/RegisterSW'
import ChatWidget from '@/components/chat/ChatWidget'

// Pas de force-dynamic : le shell du dashboard est statique, seul le contenu est dynamique
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-dashboard className="flex h-screen bg-ss-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-20 lg:pb-6 overscroll-contain">
          {children}
        </main>
        <BottomNav />
      </div>
      <RealtimeNotif />
      <RegisterSW />
      <ChatWidget />
    </div>
  )
}
