import Link from 'next/link'
import { Home, LogIn } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-ss-bg flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-[200px] pointer-events-none"
        style={{ background: 'rgba(34, 197, 94, 0.06)' }} />

      <div className="relative z-10 flex flex-col items-center">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-8"
          style={{ background: 'linear-gradient(135deg, #00853F, #FDEF42, #E31B23)' }}>
          <span className="text-white font-extrabold text-lg">SS</span>
        </div>

        <h1 className="text-8xl font-extrabold text-ss-green mb-2 tracking-tight">404</h1>
        <h2 className="text-xl font-bold text-ss-text mb-2">Page introuvable</h2>
        <p className="text-ss-text-secondary text-sm mb-10 text-center max-w-md">
          La page que vous cherchez n&apos;existe pas ou a été déplacée.
        </p>

        <div className="flex gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-[#020617] bg-ss-green hover:bg-[#16A34A] hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Home size={16} />
            Retour à l&apos;accueil
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-ss-text glass hover:bg-white/8 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <LogIn size={16} />
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  )
}
