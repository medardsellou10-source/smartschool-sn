import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: '#020617' }}>
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
        style={{ background: 'linear-gradient(135deg, #00853F, #FDEF42, #E31B23)' }}>
        <span className="text-white font-black text-xl">SS</span>
      </div>
      <h1 className="text-7xl font-black mb-2" style={{ color: '#00E676' }}>404</h1>
      <h2 className="text-xl font-bold text-white mb-2">Page introuvable</h2>
      <p className="text-white/40 text-sm mb-8 text-center max-w-md">
        La page que vous cherchez n'existe pas ou a été déplacée.
      </p>
      <div className="flex gap-3">
        <Link href="/"
          className="px-6 py-3 rounded-xl font-bold text-sm text-[#020617] hover:scale-105 transition-transform"
          style={{ background: 'linear-gradient(135deg, #00E676, #00BCD4)' }}>
          Retour à l'accueil
        </Link>
        <Link href="/login"
          className="px-6 py-3 rounded-xl font-bold text-sm text-white hover:scale-105 transition-transform"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
          Se connecter
        </Link>
      </div>
    </div>
  )
}
