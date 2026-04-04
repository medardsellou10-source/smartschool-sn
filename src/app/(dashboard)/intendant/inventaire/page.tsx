'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { isDemoMode, DEMO_INVENTAIRE } from '@/lib/demo-data'

const ACCENT = '#00BCD4'
function fmt(v: number) { return new Intl.NumberFormat('fr-FR').format(v) + ' FCFA' }

type Article = typeof DEMO_INVENTAIRE[0]

const ETAT_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  bon:    { bg: 'rgba(0,230,118,0.15)', color: '#00E676', label: 'Bon état' },
  moyen:  { bg: 'rgba(255,214,0,0.15)', color: '#FFD600', label: 'État moyen' },
  mauvais:{ bg: 'rgba(255,23,68,0.15)', color: '#FF1744', label: 'Mauvais état' },
}

export default function InventairePage() {
  const { user, loading: userLoading } = useUser()
  const supabase = createClient()
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [categorie, setCategorie] = useState<string>('Toutes')
  const [toast, setToast] = useState<string | null>(null)

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3000) }

  useEffect(() => {
    if (!isDemoMode() || !user) return
    setArticles(DEMO_INVENTAIRE)
    setLoading(false)
  }, [user])

  useEffect(() => {
    if (isDemoMode() || !user) return
    async function load() {
      const { data } = await (supabase.from('inventaire') as any)
        .select('*')
        .eq('ecole_id', (user as any).ecole_id)
        .order('designation')
      setArticles(data || [])
      setLoading(false)
    }
    load()
  }, [user])

  const categories = ['Toutes', ...Array.from(new Set(articles.map(a => a.categorie)))]
  const filtered = categorie === 'Toutes' ? articles : articles.filter(a => a.categorie === categorie)
  const valeurTotale = articles.reduce((s, a) => s + a.valeur_unitaire * a.quantite, 0)

  if (userLoading || loading) return <div className="p-6 animate-pulse space-y-4">{[...Array(6)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-white/5" />)}</div>

  return (
    <div className="space-y-6 pb-24 lg:pb-6 animate-fade-in">
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-5 py-3 rounded-2xl text-sm font-semibold text-white shadow-xl"
          style={{ background: 'rgba(2,6,23,0.96)', border: `1px solid ${ACCENT}60`, backdropFilter: 'blur(24px)', maxWidth: '340px' }}>
          <span style={{ color: ACCENT }}>ℹ️</span> {toast}
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span style={{ color: ACCENT }}>📦</span> Inventaire Matériel
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {articles.length} références · Valeur totale : {fmt(valeurTotale)}
          </p>
        </div>
        <button className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: ACCENT }}
          onClick={() => showToast('Mode démo — Ajout d\'article disponible avec la base de données.')}>
          + Ajouter article
        </button>
      </div>

      {/* Filtres catégories */}
      <div className="flex gap-2 flex-wrap">
        {categories.map(c => (
          <button key={c} onClick={() => setCategorie(c)}
            className="px-3 py-1.5 rounded-xl text-sm font-semibold transition-all"
            style={categorie === c ? { background: ACCENT, color: 'white' } : { background: 'rgba(255,255,255,0.05)', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.1)' }}>
            {c}
          </button>
        ))}
      </div>

      {/* Liste */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(2,6,23,0.82)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.12)' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                {['Désignation', 'Catégorie', 'Quantité', 'Valeur unit.', 'Valeur totale', 'État', 'Localisation'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((art, i) => {
                const e = ETAT_STYLE[art.etat] || ETAT_STYLE.bon
                return (
                  <tr key={art.id} className="hover:bg-white/5 transition-colors"
                    style={i < filtered.length - 1 ? { borderBottom: '1px solid rgba(255,255,255,0.04)' } : {}}>
                    <td className="px-4 py-3 text-sm font-semibold text-white">{art.designation}</td>
                    <td className="px-4 py-3 text-sm text-slate-400">{art.categorie}</td>
                    <td className="px-4 py-3 text-sm font-bold text-white">{art.quantite}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">{fmt(art.valeur_unitaire)}</td>
                    <td className="px-4 py-3 text-sm font-semibold" style={{ color: ACCENT }}>{fmt(art.valeur_unitaire * art.quantite)}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-lg text-xs font-semibold" style={{ background: e.bg, color: e.color }}>{e.label}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{art.localisation}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
