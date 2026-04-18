// Skeleton affiché instantanément pendant la navigation entre pages dashboard.
// Next.js App Router crée un Suspense boundary ici : le shell (Sidebar/Navbar)
// reste visible, seul le contenu est remplacé par ce skeleton jusqu'à ce que
// la nouvelle page soit prête à rendre.
export default function DashboardLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* En-tête de page */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-56 rounded-lg bg-white/5" />
          <div className="h-4 w-80 rounded bg-white/[0.03]" />
        </div>
        <div className="h-9 w-28 rounded-xl bg-white/5" />
      </div>

      {/* Rangée de stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-2xl bg-white/[0.03]"
            style={{ border: '1px solid rgba(255,255,255,0.04)' }}
          />
        ))}
      </div>

      {/* Contenu principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div
          className="lg:col-span-2 h-72 rounded-2xl bg-white/[0.03]"
          style={{ border: '1px solid rgba(255,255,255,0.04)' }}
        />
        <div
          className="h-72 rounded-2xl bg-white/[0.03]"
          style={{ border: '1px solid rgba(255,255,255,0.04)' }}
        />
      </div>

      {/* Indicateur discret en bas */}
      <div className="flex items-center justify-center gap-2 pt-2 text-[11px] text-[#475569]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
        Chargement…
      </div>
    </div>
  )
}
