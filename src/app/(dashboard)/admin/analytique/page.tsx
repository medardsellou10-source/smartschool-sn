'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { StatCard } from '@/components/dashboard/StatCard'

interface EleveRisque {
  id: string
  nom: string
  prenom: string
  classe_nom: string
  moyenne: number | null
  nb_absences: number
  nb_absences_non_justifiees: number
  tendance_notes: 'baisse' | 'stable' | 'hausse'
  score_risque: number // 0-100
  niveau_risque: 'faible' | 'moyen' | 'eleve' | 'critique'
}

interface StatsGlobales {
  total_eleves: number
  eleves_a_risque: number
  moyenne_generale: number
  taux_assiduite: number
}

export default function AnalytiquePage() {
  const [eleves, setEleves] = useState<EleveRisque[]>([])
  const [stats, setStats] = useState<StatsGlobales>({ total_eleves: 0, eleves_a_risque: 0, moyenne_generale: 0, taux_assiduite: 0 })
  const [loading, setLoading] = useState(true)
  const [filtreRisque, setFiltreRisque] = useState<string>('tous')
  const [tri, setTri] = useState<'risque' | 'moyenne' | 'absences'>('risque')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)

    // 1. Charger tous les élèves avec leurs classes
    const { data: elevesData } = await (supabase.from('eleves') as any)
      .select('id, nom, prenom, classe_id, classes(nom)')
      .eq('actif', true)

    if (!elevesData || elevesData.length === 0) {
      setLoading(false)
      return
    }

    const eleveIds = elevesData.map((e: any) => e.id)

    // 2. Charger les moyennes (v_moyennes_generales)
    const { data: moyennes } = await (supabase.from('v_moyennes_generales') as any)
      .select('eleve_id, trimestre, moyenne_generale')
      .in('eleve_id', eleveIds)
      .order('trimestre', { ascending: true })

    // 3. Charger les absences (mois en cours + mois précédent)
    const debutMoisPrec = new Date()
    debutMoisPrec.setMonth(debutMoisPrec.getMonth() - 1)
    debutMoisPrec.setDate(1)

    const { data: absences } = await (supabase.from('absences_eleves') as any)
      .select('eleve_id, date_absence, type, justifiee')
      .in('eleve_id', eleveIds)
      .gte('date_absence', debutMoisPrec.toISOString().split('T')[0])

    // 4. Charger les notes récentes pour tendance
    const { data: notesRecentes } = await (supabase.from('notes') as any)
      .select('eleve_id, valeur, created_at')
      .in('eleve_id', eleveIds)
      .order('created_at', { ascending: true })

    // 5. Calculer le score de risque pour chaque élève
    const elevesRisque: EleveRisque[] = elevesData.map((eleve: any) => {
      // Moyenne la plus récente
      const moyennesEleve = (moyennes || []).filter((m: any) => m.eleve_id === eleve.id)
      const derniereMoyenne = moyennesEleve.length > 0
        ? moyennesEleve[moyennesEleve.length - 1].moyenne_generale
        : null

      // Absences
      const absencesEleve = (absences || []).filter((a: any) => a.eleve_id === eleve.id)
      const nbAbsences = absencesEleve.filter((a: any) => a.type === 'absence').length
      const nbNonJustifiees = absencesEleve.filter((a: any) => !a.justifiee).length

      // Tendance des notes
      const notesEleve = (notesRecentes || []).filter((n: any) => n.eleve_id === eleve.id)
      let tendance: 'baisse' | 'stable' | 'hausse' = 'stable'
      if (notesEleve.length >= 3) {
        const moitieLongueur = Math.floor(notesEleve.length / 2)
        const premiereMoitie = notesEleve.slice(0, moitieLongueur)
        const deuxiemeMoitie = notesEleve.slice(moitieLongueur)
        const moyPremiere = premiereMoitie.reduce((s: number, n: any) => s + (n.valeur || 0), 0) / premiereMoitie.length
        const moyDeuxieme = deuxiemeMoitie.reduce((s: number, n: any) => s + (n.valeur || 0), 0) / deuxiemeMoitie.length
        if (moyDeuxieme < moyPremiere - 1) tendance = 'baisse'
        else if (moyDeuxieme > moyPremiere + 1) tendance = 'hausse'
      }

      // Score de risque (0-100)
      let score = 0

      // Facteur 1: Moyenne basse (max 40 points)
      if (derniereMoyenne !== null) {
        if (derniereMoyenne < 5) score += 40
        else if (derniereMoyenne < 8) score += 30
        else if (derniereMoyenne < 10) score += 20
        else if (derniereMoyenne < 12) score += 10
      } else {
        score += 15 // pas de moyenne = alerte modérée
      }

      // Facteur 2: Absences non justifiées (max 30 points)
      score += Math.min(nbNonJustifiees * 5, 30)

      // Facteur 3: Nombre total d'absences (max 15 points)
      score += Math.min(nbAbsences * 3, 15)

      // Facteur 4: Tendance des notes en baisse (max 15 points)
      if (tendance === 'baisse') score += 15
      else if (tendance === 'hausse') score -= 5

      score = Math.max(0, Math.min(100, score))

      let niveauRisque: 'faible' | 'moyen' | 'eleve' | 'critique' = 'faible'
      if (score >= 70) niveauRisque = 'critique'
      else if (score >= 45) niveauRisque = 'eleve'
      else if (score >= 25) niveauRisque = 'moyen'

      return {
        id: eleve.id,
        nom: eleve.nom,
        prenom: eleve.prenom,
        classe_nom: eleve.classes?.nom || '—',
        moyenne: derniereMoyenne ? Number(Number(derniereMoyenne).toFixed(2)) : null,
        nb_absences: nbAbsences,
        nb_absences_non_justifiees: nbNonJustifiees,
        tendance_notes: tendance,
        score_risque: score,
        niveau_risque: niveauRisque,
      }
    })

    // Trier par score de risque décroissant
    elevesRisque.sort((a, b) => b.score_risque - a.score_risque)

    // Stats globales
    const moyennesValides = elevesRisque.filter(e => e.moyenne !== null)
    const moyenneGenerale = moyennesValides.length > 0
      ? moyennesValides.reduce((s, e) => s + (e.moyenne || 0), 0) / moyennesValides.length
      : 0

    const totalAbsencesPossibles = elevesRisque.length * 30 // approximation
    const totalAbsences = elevesRisque.reduce((s, e) => s + e.nb_absences, 0)
    const tauxAssiduite = totalAbsencesPossibles > 0
      ? ((totalAbsencesPossibles - totalAbsences) / totalAbsencesPossibles) * 100
      : 100

    setStats({
      total_eleves: elevesRisque.length,
      eleves_a_risque: elevesRisque.filter(e => e.niveau_risque === 'eleve' || e.niveau_risque === 'critique').length,
      moyenne_generale: Number(moyenneGenerale.toFixed(2)),
      taux_assiduite: Number(tauxAssiduite.toFixed(1)),
    })

    setEleves(elevesRisque)
    setLoading(false)
  }

  const elevesFiltres = eleves
    .filter(e => filtreRisque === 'tous' || e.niveau_risque === filtreRisque)
    .sort((a, b) => {
      if (tri === 'risque') return b.score_risque - a.score_risque
      if (tri === 'moyenne') return (a.moyenne || 0) - (b.moyenne || 0)
      return b.nb_absences - a.nb_absences
    })

  const niveauColors = {
    faible: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Faible' },
    moyen: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Moyen' },
    eleve: { bg: 'bg-orange-500/20', text: 'text-orange-400', label: 'Élevé' },
    critique: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Critique' },
  }

  const tendanceIcons = {
    baisse: { icon: '📉', color: 'text-red-400' },
    stable: { icon: '➡️', color: 'text-ss-text-secondary' },
    hausse: { icon: '📈', color: 'text-green-400' },
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold text-ss-text">📊 Analytique prédictif</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-ss-bg-secondary rounded-xl p-5 h-[120px] ss-shimmer" />
          ))}
        </div>
        <div className="bg-ss-bg-secondary rounded-xl p-6 h-[400px] ss-shimmer" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-ss-text">📊 Analytique prédictif</h1>
        <p className="text-ss-text-secondary text-sm mt-1">
          Identification des élèves à risque de décrochage scolaire
        </p>
        {/* Bande tricolore */}
        <div className="flex h-1 rounded-full overflow-hidden mt-3 max-w-xs">
          <div className="flex-1 bg-[#00853F]" />
          <div className="flex-1 bg-[#FDEF42]" />
          <div className="flex-1 bg-[#E31B23]" />
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Élèves suivis"
          value={stats.total_eleves}
          icon="🎓"
          color="sn-green"
        />
        <StatCard
          title="Élèves à risque"
          value={stats.eleves_a_risque}
          icon="⚠️"
          subtitle={`${stats.total_eleves > 0 ? ((stats.eleves_a_risque / stats.total_eleves) * 100).toFixed(0) : 0}% des élèves`}
          color="sn-red"
        />
        <StatCard
          title="Moyenne générale"
          value={`${stats.moyenne_generale}/20`}
          icon="📝"
          color={stats.moyenne_generale >= 10 ? 'sn-green' : 'sn-red'}
        />
        <StatCard
          title="Taux d'assiduité"
          value={`${stats.taux_assiduite}%`}
          icon="📋"
          color={stats.taux_assiduite >= 90 ? 'sn-green' : 'sn-yellow'}
        />
      </div>

      {/* Jauge de risque global */}
      <div className="bg-ss-bg-secondary rounded-xl p-5">
        <h3 className="text-sm font-semibold text-ss-text-secondary mb-3">Répartition des niveaux de risque</h3>
        <div className="flex h-8 rounded-lg overflow-hidden">
          {(['faible', 'moyen', 'eleve', 'critique'] as const).map(niveau => {
            const count = eleves.filter(e => e.niveau_risque === niveau).length
            const pct = eleves.length > 0 ? (count / eleves.length) * 100 : 0
            if (pct === 0) return null
            const colors = {
              faible: 'bg-green-500',
              moyen: 'bg-yellow-500',
              eleve: 'bg-orange-500',
              critique: 'bg-red-500',
            }
            return (
              <div
                key={niveau}
                className={`${colors[niveau]} flex items-center justify-center text-xs font-bold text-white`}
                style={{ width: `${pct}%` }}
                title={`${niveauColors[niveau].label}: ${count} élèves (${pct.toFixed(0)}%)`}
              >
                {pct >= 10 && `${count}`}
              </div>
            )
          })}
        </div>
        <div className="flex gap-4 mt-2 text-xs text-ss-text-muted">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500 inline-block" /> Faible ({eleves.filter(e => e.niveau_risque === 'faible').length})</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-500 inline-block" /> Moyen ({eleves.filter(e => e.niveau_risque === 'moyen').length})</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-500 inline-block" /> Élevé ({eleves.filter(e => e.niveau_risque === 'eleve').length})</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500 inline-block" /> Critique ({eleves.filter(e => e.niveau_risque === 'critique').length})</span>
        </div>
      </div>

      {/* Filtres et tri */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-1 bg-ss-bg-secondary rounded-lg p-1">
          {[
            { val: 'tous', label: 'Tous' },
            { val: 'critique', label: '🔴 Critique' },
            { val: 'eleve', label: '🟠 Élevé' },
            { val: 'moyen', label: '🟡 Moyen' },
            { val: 'faible', label: '🟢 Faible' },
          ].map(f => (
            <button
              key={f.val}
              onClick={() => setFiltreRisque(f.val)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filtreRisque === f.val
                  ? 'bg-[#00853F] text-white'
                  : 'text-ss-text-secondary hover:text-ss-text'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <select
          value={tri}
          onChange={(e) => setTri(e.target.value as any)}
          className="bg-ss-bg-secondary text-ss-text border border-ss-border rounded-lg px-3 py-1.5 text-sm"
        >
          <option value="risque">Trier par risque</option>
          <option value="moyenne">Trier par moyenne</option>
          <option value="absences">Trier par absences</option>
        </select>

        <span className="text-sm text-ss-text-muted ml-auto">
          {elevesFiltres.length} élève{elevesFiltres.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Tableau des élèves */}
      <div className="bg-ss-bg-secondary rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-ss-text-muted uppercase border-b border-ss-border">
                <th className="p-3">Score</th>
                <th className="p-3">Élève</th>
                <th className="p-3">Classe</th>
                <th className="p-3">Moyenne</th>
                <th className="p-3">Absences</th>
                <th className="p-3">Tendance</th>
                <th className="p-3">Risque</th>
              </tr>
            </thead>
            <tbody>
              {elevesFiltres.map((eleve) => {
                const niveau = niveauColors[eleve.niveau_risque]
                const tendance = tendanceIcons[eleve.tendance_notes]
                return (
                  <tr key={eleve.id} className="border-b border-ss-border/50 hover:bg-ss-bg-card/50">
                    {/* Score barre */}
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-2 bg-ss-bg-card rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              eleve.score_risque >= 70 ? 'bg-red-500' :
                              eleve.score_risque >= 45 ? 'bg-orange-500' :
                              eleve.score_risque >= 25 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${eleve.score_risque}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono text-ss-text-muted">{eleve.score_risque}</span>
                      </div>
                    </td>

                    {/* Nom */}
                    <td className="p-3 font-medium text-ss-text">
                      {eleve.prenom} {eleve.nom}
                    </td>

                    {/* Classe */}
                    <td className="p-3 text-ss-text-secondary text-sm">
                      {eleve.classe_nom}
                    </td>

                    {/* Moyenne */}
                    <td className="p-3">
                      {eleve.moyenne !== null ? (
                        <span className={`font-semibold ${eleve.moyenne >= 10 ? 'text-green-400' : 'text-red-400'}`}>
                          {eleve.moyenne}/20
                        </span>
                      ) : (
                        <span className="text-ss-text-muted text-sm">—</span>
                      )}
                    </td>

                    {/* Absences */}
                    <td className="p-3">
                      <span className="text-ss-text">{eleve.nb_absences}</span>
                      {eleve.nb_absences_non_justifiees > 0 && (
                        <span className="text-red-400 text-xs ml-1">
                          ({eleve.nb_absences_non_justifiees} nj)
                        </span>
                      )}
                    </td>

                    {/* Tendance */}
                    <td className="p-3">
                      <span className={tendance.color}>{tendance.icon}</span>
                    </td>

                    {/* Badge risque */}
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${niveau.bg} ${niveau.text}`}>
                        {niveau.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {elevesFiltres.length === 0 && (
          <div className="p-8 text-center text-ss-text-muted">
            <p className="text-4xl mb-3">✅</p>
            <p>Aucun élève ne correspond à ce filtre</p>
          </div>
        )}
      </div>

      {/* Légende algorithme */}
      <div className="bg-ss-bg-secondary rounded-xl p-5">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🧠</span>
          <div>
            <p className="font-medium text-ss-text">Algorithme de détection</p>
            <p className="text-sm text-ss-text-secondary mt-1">
              Le score de risque (0-100) est calculé à partir de 4 facteurs :
            </p>
            <ul className="text-xs text-ss-text-muted mt-2 space-y-1">
              <li>📝 <strong>Moyenne générale</strong> — plus la moyenne est basse, plus le risque augmente (40 pts max)</li>
              <li>❌ <strong>Absences non justifiées</strong> — chaque absence non justifiée ajoute 5 points (30 pts max)</li>
              <li>📋 <strong>Absences totales</strong> — volume global d'absences (15 pts max)</li>
              <li>📉 <strong>Tendance des notes</strong> — une baisse constante ajoute 15 points</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
