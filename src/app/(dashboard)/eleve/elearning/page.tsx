'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { Laptop, BookOpen, PenSquare, Video } from 'lucide-react'

interface Cours {
  id: string
  titre: string
  description: string
  type: string
  contenu: string | null
  fichier_url: string | null
  fichier_type: string | null
  created_at: string
  matieres: { nom: string } | null
}

interface Devoir {
  id: string
  titre: string
  description: string
  date_limite: string
  points_max: number
  fichier_url: string | null
  matieres: { nom: string } | null
  soumission?: { id: string; note: number | null; soumis_at: string; commentaire_prof: string | null } | null
}

interface ClasseVirtuelle {
  id: string
  titre: string
  description: string | null
  date_heure: string
  duree_minutes: number
  lien_reunion: string | null
  statut: string
  matieres: { nom: string } | null
  utilisateurs: { nom: string; prenom: string } | null
}

export default function EleveElearningPage() {
  const [tab, setTab] = useState<'cours' | 'devoirs' | 'classes'>('cours')
  const [cours, setCours] = useState<Cours[]>([])
  const [devoirs, setDevoirs] = useState<Devoir[]>([])
  const [classesVirt, setClassesVirt] = useState<ClasseVirtuelle[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCours, setSelectedCours] = useState<Cours | null>(null)
  const [showSoumission, setShowSoumission] = useState<string | null>(null)
  const [soumissionTexte, setSoumissionTexte] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    // Trouver le profil élève
    const { data: profil } = await (supabase.from('utilisateurs') as any)
      .select('id, ecole_id').eq('id', user.id).single()
    if (!profil) { setLoading(false); return }

    const { data: eleve } = await (supabase.from('eleves') as any)
      .select('id, classe_id').eq('ecole_id', profil.ecole_id).limit(1).single()
    if (!eleve) { setLoading(false); return }

    // Cours de ma classe
    const { data: coursData } = await (supabase.from('cours') as any)
      .select('id, titre, description, type, contenu, fichier_url, fichier_type, created_at, matieres(nom)')
      .eq('classe_id', eleve.classe_id).eq('visible', true)
      .order('created_at', { ascending: false })
    if (coursData) setCours(coursData)

    // Devoirs avec mes soumissions
    const { data: devoirsData } = await (supabase.from('devoirs') as any)
      .select('id, titre, description, date_limite, points_max, fichier_url, matieres(nom)')
      .eq('classe_id', eleve.classe_id).eq('actif', true)
      .order('date_limite', { ascending: true })

    if (devoirsData) {
      const devoirsAvecSoumissions = await Promise.all(
        devoirsData.map(async (d: any) => {
          const { data: soum } = await (supabase.from('soumissions_devoirs') as any)
            .select('id, note, soumis_at, commentaire_prof')
            .eq('devoir_id', d.id).eq('eleve_id', eleve.id).limit(1).single()
          return { ...d, soumission: soum }
        })
      )
      setDevoirs(devoirsAvecSoumissions)
    }

    // Classes virtuelles
    const { data: cvData } = await (supabase.from('classes_virtuelles') as any)
      .select('id, titre, description, date_heure, duree_minutes, lien_reunion, statut, matieres(nom), utilisateurs:prof_id(nom, prenom)')
      .eq('classe_id', eleve.classe_id)
      .gte('date_heure', new Date(Date.now() - 86400000).toISOString())
      .order('date_heure', { ascending: true })
    if (cvData) setClassesVirt(cvData)

    setLoading(false)
  }

  async function soumettre(devoirId: string) {
    if (!soumissionTexte.trim()) return
    setSubmitting(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSubmitting(false); return }
    const { data: profil } = await (supabase.from('utilisateurs') as any)
      .select('ecole_id').eq('id', user.id).single()
    const { data: eleve } = await (supabase.from('eleves') as any)
      .select('id').eq('ecole_id', profil.ecole_id).limit(1).single()

    await (supabase.from('soumissions_devoirs') as any).upsert({
      ecole_id: profil.ecole_id,
      devoir_id: devoirId,
      eleve_id: eleve.id,
      contenu: soumissionTexte,
    }, { onConflict: 'devoir_id,eleve_id' })

    setSoumissionTexte('')
    setShowSoumission(null)
    setSubmitting(false)
    loadData()
  }

  function tempsRestant(dateLimite: string): { texte: string; urgent: boolean } {
    const diff = new Date(dateLimite).getTime() - Date.now()
    if (diff < 0) return { texte: 'Expiré', urgent: true }
    const heures = Math.floor(diff / 3600000)
    const jours = Math.floor(heures / 24)
    if (jours > 3) return { texte: `${jours} jours`, urgent: false }
    if (jours > 0) return { texte: `${jours}j ${heures % 24}h`, urgent: true }
    return { texte: `${heures}h`, urgent: true }
  }

  const tabs = [
    { key: 'cours' as const, label: 'Cours', Icon: BookOpen, count: cours.length },
    { key: 'devoirs' as const, label: 'Devoirs', Icon: PenSquare, count: devoirs.length },
    { key: 'classes' as const, label: 'Classes virtuelles', Icon: Video, count: classesVirt.length },
  ]

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <PageHeader title="E-Learning" icon={Laptop} accent="info" />
        {[1, 2, 3].map(i => <div key={i} className="bg-ss-bg-secondary rounded-xl h-32 ss-shimmer" />)}
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="E-Learning"
        description="Cours, devoirs et classes virtuelles."
        icon={Laptop}
        accent="info"
      />

      {/* Tabs */}
      <div className="flex gap-1 bg-ss-bg-secondary rounded-lg p-1">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === t.key ? 'bg-[#00853F] text-white' : 'text-ss-text-secondary hover:text-ss-text'}`}>
            <t.Icon size={14} aria-hidden="true" /> {t.label} ({t.count})
          </button>
        ))}
      </div>

      {/* === COURS === */}
      {tab === 'cours' && (
        <div className="space-y-4">
          {selectedCours ? (
            <div className="bg-ss-bg-secondary rounded-xl p-6">
              <button onClick={() => setSelectedCours(null)} className="text-sm text-[#00853F] mb-4">← Retour aux cours</button>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-400">{selectedCours.matieres?.nom}</span>
                <span className="px-2 py-1 rounded text-xs bg-ss-bg-card text-ss-text-muted">{selectedCours.type}</span>
              </div>
              <h2 className="text-xl font-bold text-ss-text mb-4">{selectedCours.titre}</h2>
              <p className="text-ss-text-secondary mb-4">{selectedCours.description}</p>
              {selectedCours.contenu && (
                <div className="bg-ss-bg-card rounded-lg p-4 text-ss-text whitespace-pre-wrap">{selectedCours.contenu}</div>
              )}
              {selectedCours.fichier_url && (
                <a href={selectedCours.fichier_url} target="_blank" className="mt-4 inline-block px-4 py-2 bg-[#00853F] text-white rounded-lg">
                  📥 Télécharger le fichier ({selectedCours.fichier_type})
                </a>
              )}
            </div>
          ) : (
            <>
              {cours.length === 0 ? (
                <div className="text-center py-12 text-ss-text-muted">
                  <p className="text-4xl mb-3">📚</p><p>Aucun cours disponible pour le moment</p>
                </div>
              ) : cours.map(c => (
                <div key={c.id} onClick={() => setSelectedCours(c)}
                  className="bg-ss-bg-secondary rounded-xl p-4 cursor-pointer hover:bg-ss-bg-card transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{c.type === 'cours' ? '📖' : c.type === 'exercice' ? '✏️' : '📎'}</span>
                        <span className="px-2 py-0.5 rounded text-xs bg-blue-500/20 text-blue-400">{c.matieres?.nom}</span>
                      </div>
                      <h3 className="font-semibold text-ss-text">{c.titre}</h3>
                      <p className="text-sm text-ss-text-secondary mt-1">{c.description}</p>
                    </div>
                    <span className="text-ss-text-muted text-xs">{new Date(c.created_at).toLocaleDateString('fr-SN')}</span>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* === DEVOIRS === */}
      {tab === 'devoirs' && (
        <div className="space-y-4">
          {devoirs.length === 0 ? (
            <div className="text-center py-12 text-ss-text-muted">
              <p className="text-4xl mb-3">📝</p><p>Aucun devoir en cours</p>
            </div>
          ) : devoirs.map(d => {
            const temps = tempsRestant(d.date_limite)
            const soumis = !!d.soumission
            return (
              <div key={d.id} className="bg-ss-bg-secondary rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded text-xs bg-blue-500/20 text-blue-400">{d.matieres?.nom}</span>
                      <span className="text-xs text-ss-text-muted">/{d.points_max} pts</span>
                    </div>
                    <h3 className="font-semibold text-ss-text">{d.titre}</h3>
                    <p className="text-sm text-ss-text-secondary mt-1">{d.description}</p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <span className={`text-xs font-medium px-2 py-1 rounded ${temps.urgent ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                      ⏰ {temps.texte}
                    </span>
                  </div>
                </div>

                {soumis ? (
                  <div className="mt-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <p className="text-green-400 text-sm font-medium">✅ Soumis le {new Date(d.soumission!.soumis_at).toLocaleDateString('fr-SN')}</p>
                    {d.soumission!.note !== null && (
                      <p className="text-ss-text text-sm mt-1">Note: <strong>{d.soumission!.note}/{d.points_max}</strong></p>
                    )}
                    {d.soumission!.commentaire_prof && (
                      <p className="text-ss-text-secondary text-sm mt-1">💬 {d.soumission!.commentaire_prof}</p>
                    )}
                  </div>
                ) : showSoumission === d.id ? (
                  <div className="mt-3 space-y-2">
                    <textarea value={soumissionTexte} onChange={e => setSoumissionTexte(e.target.value)}
                      placeholder="Écrivez votre réponse ici..."
                      className="w-full bg-ss-bg-card border border-ss-border rounded-lg p-3 text-ss-text text-sm min-h-[100px]" />
                    <div className="flex gap-2">
                      <button onClick={() => soumettre(d.id)} disabled={submitting}
                        className="px-4 py-2 bg-[#00853F] text-white rounded-lg text-sm disabled:opacity-50">
                        {submitting ? '⏳ Envoi...' : '📤 Soumettre'}
                      </button>
                      <button onClick={() => { setShowSoumission(null); setSoumissionTexte('') }}
                        className="px-4 py-2 bg-ss-bg-card text-ss-text-secondary rounded-lg text-sm">Annuler</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setShowSoumission(d.id)}
                    className="mt-3 px-4 py-2 bg-[#FDEF42] text-black rounded-lg text-sm font-medium hover:bg-[#e5d63c]">
                    📤 Rendre le devoir
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* === CLASSES VIRTUELLES === */}
      {tab === 'classes' && (
        <div className="space-y-4">
          {classesVirt.length === 0 ? (
            <div className="text-center py-12 text-ss-text-muted">
              <p className="text-4xl mb-3">🎥</p><p>Aucune classe virtuelle prévue</p>
            </div>
          ) : classesVirt.map(cv => {
            const isNow = cv.statut === 'en_cours'
            const isPast = cv.statut === 'termine'
            const dateCV = new Date(cv.date_heure)
            return (
              <div key={cv.id} className={`bg-ss-bg-secondary rounded-xl p-4 ${isNow ? 'border border-green-500/50' : ''}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded text-xs bg-blue-500/20 text-blue-400">{cv.matieres?.nom}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        isNow ? 'bg-green-500/20 text-green-400 animate-pulse' :
                        isPast ? 'bg-gray-500/20 text-gray-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {isNow ? '🔴 En cours' : isPast ? 'Terminé' : '📅 Planifié'}
                      </span>
                    </div>
                    <h3 className="font-semibold text-ss-text">{cv.titre}</h3>
                    {cv.description && <p className="text-sm text-ss-text-secondary mt-1">{cv.description}</p>}
                    <p className="text-xs text-ss-text-muted mt-2">
                      👨‍🏫 {cv.utilisateurs?.prenom} {cv.utilisateurs?.nom} • {cv.duree_minutes} min
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-sm font-medium text-ss-text">{dateCV.toLocaleDateString('fr-SN')}</p>
                    <p className="text-xs text-ss-text-muted">{dateCV.toLocaleTimeString('fr-SN', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
                {(isNow || (!isPast && cv.lien_reunion)) && (
                  <a href={cv.lien_reunion || '#'} target="_blank" rel="noopener"
                    className={`mt-3 inline-block px-4 py-2 rounded-lg text-sm font-medium ${
                      isNow ? 'bg-[#00853F] text-white animate-pulse' : 'bg-[#00853F]/20 text-[#00853F]'
                    }`}>
                    {isNow ? '🎥 Rejoindre maintenant' : '🔗 Lien de la classe'}
                  </a>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
