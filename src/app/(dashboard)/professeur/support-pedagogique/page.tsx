'use client'

import { useState, useMemo } from 'react'
import { useUser } from '@/hooks/useUser'
import { toast } from 'react-hot-toast'
import { StatCard } from '@/components/dashboard/StatCard'
import {
  GRILLES_HORAIRES, PROGRAMMES, PLANNING_SEMESTRIEL,
  NIVEAUX_COLLEGE, NIVEAUX_LYCEE, SERIES_LYCEE,
  getProgressionHebdo, getRessources,
  type ProgrammeMatiere, type Module, type Lecon, type GrilleHoraire, type RessourceEnLigne
} from '@/lib/curriculum-senegal'
import { ANNALES, type AnnaleDoc } from '@/lib/annales-sn'
import { CONTENU_NATIF } from '@/lib/contenu-pedagogique'

// ── Couleurs par matière ──
const MATIERE_COLORS: Record<string, string> = {
  'Mathématiques': '#00E5FF',
  'Français': '#FFD600',
  'Anglais': '#FF6D00',
  'Sciences Physiques': '#00E676',
  'SVT': '#76FF03',
  'Histoire-Géographie': '#D500F9',
  'Philosophie': '#448AFF',
  'Éducation Physique': '#FF1744',
  'Éducation Civique': '#00BCD4',
  'LV2': '#FF9100',
  'Espagnol / Arabe': '#FF9100',
  'Dessin / Art Plastique': '#E040FB',
  'Musique': '#7C4DFF',
}

const TYPE_ICONS: Record<string, string> = {
  cours: '📖', tp: '🔬', td: '📝', revision: '🔄', evaluation: '📋',
}

const TYPE_COLORS: Record<string, string> = {
  cours: '#00E676', tp: '#00E5FF', td: '#FFD600', revision: '#FF6D00', evaluation: '#FF1744',
}

type TabId = 'grille' | 'planning' | 'modules' | 'suivi' | 'semestre' | 'semaine' | 'ressources'

const RESSOURCE_ICONS: Record<string, string> = {
  annale: '📄', video: '▶️', tp_virtuel: '🔬', exercice: '✏️', resume: '📋', tutorat: '🤝',
}
const RESSOURCE_COLORS: Record<string, string> = {
  annale: '#FF6D00', video: '#FF1744', tp_virtuel: '#00E5FF', exercice: '#7C4DFF', resume: '#00E676', tutorat: '#FFD600',
}
const RESSOURCE_LABELS: Record<string, string> = {
  annale: 'Annale', video: 'Vidéo', tp_virtuel: 'TP Virtuel', exercice: 'Exercice', resume: 'Fiche', tutorat: 'Tutorat',
}

export default function SupportPedagogiquePage() {
  const { user, loading: userLoading } = useUser()
  const [activeTab, setActiveTab] = useState<TabId>('semaine')
  const [selectedNiveau, setSelectedNiveau] = useState('Terminale')
  const [selectedSerie, setSelectedSerie] = useState('S1')
  const [selectedMatiere, setSelectedMatiere] = useState('Mathématiques')

  // ── Suivi des leçons (localStorage) ──
  const [leconsValidees, setLeconsValidees] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set()
    try {
      const saved = localStorage.getItem('smartschool_lecons_validees')
      return saved ? new Set(JSON.parse(saved)) : new Set()
    } catch { return new Set() }
  })

  const toggleLecon = (leconId: string) => {
    setLeconsValidees(prev => {
      const next = new Set(prev)
      if (next.has(leconId)) next.delete(leconId)
      else next.add(leconId)
      try { localStorage.setItem('smartschool_lecons_validees', JSON.stringify([...next])) } catch {}
      return next
    })
  }

  // ── Données calculées ──
  const grille = useMemo<GrilleHoraire | undefined>(() => {
    return GRILLES_HORAIRES.find(g =>
      g.niveau === selectedNiveau &&
      (NIVEAUX_LYCEE.includes(selectedNiveau) && selectedNiveau !== 'Seconde' ? g.serie === selectedSerie : !g.serie || g.serie === selectedSerie)
    )
  }, [selectedNiveau, selectedSerie])

  const programme = useMemo<ProgrammeMatiere | undefined>(() => {
    return PROGRAMMES.find(p =>
      p.matiere === selectedMatiere && p.niveau === selectedNiveau &&
      (p.serie ? p.serie === selectedSerie : true)
    )
  }, [selectedMatiere, selectedNiveau, selectedSerie])

  const allProgrammes = useMemo(() => {
    return PROGRAMMES.filter(p =>
      p.niveau === selectedNiveau &&
      (p.serie ? p.serie === selectedSerie : true)
    )
  }, [selectedNiveau, selectedSerie])

  // ── Stats du suivi ──
  const suiviStats = useMemo(() => {
    if (!programme) return { total: 0, fait: 0, heuresFaites: 0, heuresTotal: 0, progression: 0 }
    let total = 0, fait = 0, heuresFaites = 0, heuresTotal = 0
    for (const mod of programme.modules) {
      for (const lecon of mod.lecons) {
        total++
        heuresTotal += lecon.duree_heures
        if (leconsValidees.has(lecon.id)) {
          fait++
          heuresFaites += lecon.duree_heures
        }
      }
    }
    return { total, fait, heuresFaites, heuresTotal, progression: total > 0 ? Math.round((fait / total) * 100) : 0 }
  }, [programme, leconsValidees])

  // ── Calcul semaine actuelle ──
  const semaineActuelle = useMemo(() => {
    const now = new Date()
    const debut = new Date('2025-10-06')
    const diff = Math.floor((now.getTime() - debut.getTime()) / (7 * 24 * 60 * 60 * 1000))
    return Math.max(1, Math.min(diff + 1, 36))
  }, [])

  // ── Alerte retard programme ──
  const alerteRetard = useMemo(() => {
    if (!programme) return null
    const heuresAttendues = semaineActuelle * programme.heures_hebdo
    const ratio = suiviStats.heuresTotal > 0 ? suiviStats.heuresFaites / heuresAttendues : 0
    if (ratio < 0.7) return { type: 'danger' as const, msg: `Retard important : ${suiviStats.heuresFaites}h / ${Math.round(heuresAttendues)}h attendues` }
    if (ratio < 0.9) return { type: 'warning' as const, msg: `Léger retard : ${suiviStats.heuresFaites}h / ${Math.round(heuresAttendues)}h attendues` }
    return { type: 'ok' as const, msg: `En avance ou dans les temps : ${suiviStats.heuresFaites}h effectuées` }
  }, [programme, semaineActuelle, suiviStats])

  // ── Planning de la semaine courante (toutes matières) ──
  const planningDeLaSemaine = useMemo(() => {
    return allProgrammes.map(prog => {
      const progression = getProgressionHebdo(prog, semaineActuelle)
      const heuresFaites = prog.modules.flatMap(m => m.lecons)
        .filter(l => leconsValidees.has(l.id))
        .reduce((s, l) => s + l.duree_heures, 0)
      const totalHeures = prog.heures_annuelles
      const pct = totalHeures > 0 ? Math.round((heuresFaites / totalHeures) * 100) : 0
      const heuresAttendues = semaineActuelle * prog.heures_hebdo
      const retard = heuresFaites < heuresAttendues * 0.7 ? 'danger' : heuresFaites < heuresAttendues * 0.9 ? 'warning' : 'ok'
      return { prog, progression, heuresFaites, pct, retard }
    })
  }, [allProgrammes, semaineActuelle, leconsValidees])

  // ── Ressources en ligne ──
  const [filtreTypeRes, setFiltreTypeRes] = useState<RessourceEnLigne['type'] | 'all'>('all')

  const ressources = useMemo(() => {
    const filters: Parameters<typeof getRessources>[0] = {
      niveau: selectedNiveau,
    }
    if (NIVEAUX_LYCEE.includes(selectedNiveau) && selectedNiveau !== 'Seconde' && selectedSerie) {
      filters.serie = selectedSerie
    }
    if (filtreTypeRes !== 'all') filters.type = filtreTypeRes
    return getRessources(filters)
  }, [selectedNiveau, selectedSerie, filtreTypeRes])

  const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: 'semaine', label: 'Ma Semaine', icon: '🗓️' },
    { id: 'grille', label: 'Grille Horaire', icon: '📅' },
    { id: 'planning', label: 'Planning Annuel', icon: '📆' },
    { id: 'modules', label: 'Modules & Leçons', icon: '📚' },
    { id: 'suivi', label: 'Suivi des Cours', icon: '✅' },
    { id: 'semestre', label: 'Planning Semestriel', icon: '📊' },
    { id: 'ressources', label: 'Ressources', icon: '🌐' },
  ]

  // ── Helpers ressources ──
  function getResourceUrl(res: RessourceEnLigne): string | null {
    if (res.url) return res.url
    switch (res.type) {
      case 'tp_virtuel':
        if (res.titre.toLowerCase().includes('chute') || res.titre.toLowerCase().includes('projectile'))
          return 'https://phet.colorado.edu/sims/html/projectile-motion/latest/projectile-motion_fr.html'
        if (res.titre.toLowerCase().includes('rlc') || res.titre.toLowerCase().includes('circuit'))
          return 'https://phet.colorado.edu/sims/html/circuit-construction-kit-ac/latest/circuit-construction-kit-ac_fr.html'
        if (res.titre.toLowerCase().includes('dosage') || res.titre.toLowerCase().includes('acido'))
          return 'https://phet.colorado.edu/sims/html/acid-base-solutions/latest/acid-base-solutions_fr.html'
        if (res.titre.toLowerCase().includes('diffraction') || res.titre.toLowerCase().includes('lumière'))
          return 'https://phet.colorado.edu/sims/html/wave-interference/latest/wave-interference_fr.html'
        if (res.titre.toLowerCase().includes('cellule') || res.titre.toLowerCase().includes('microscope'))
          return 'https://phet.colorado.edu/sims/html/gene-expression-essentials/latest/gene-expression-essentials_fr.html'
        if (res.titre.toLowerCase().includes('immunodiffusion') || res.titre.toLowerCase().includes('anticorps'))
          return 'https://phet.colorado.edu/sims/html/natural-selection/latest/natural-selection_fr.html'
        if (res.titre.toLowerCase().includes('roche') || res.titre.toLowerCase().includes('tectonique'))
          return 'https://phet.colorado.edu/sims/html/plate-tectonics/latest/plate-tectonics_fr.html'
        return 'https://phet.colorado.edu/fr/simulations'
      case 'video':
        return `https://www.youtube.com/results?search_query=${encodeURIComponent(res.titre + ' cours terminale sénégal')}`
      case 'annale':
        return 'https://www.senexam.sn'
      case 'tutorat':
        return `https://www.youtube.com/results?search_query=${encodeURIComponent(res.matiere + ' cours terminale sénégal')}`
      default:
        return null
    }
  }

  function ouvrirFiche(res: RessourceEnLigne) {
    const color = RESSOURCE_COLORS[res.type] || '#00E5FF'
    const pts = res.description.split(' — ').map(s => `<li>${s.trim()}</li>`).join('')
    const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<title>${res.titre}</title>
<style>
  *{box-sizing:border-box}body{font-family:'Segoe UI',Arial,sans-serif;max-width:780px;margin:0 auto;padding:28px 32px;color:#1a1a2e;background:#fff}
  .header{border-left:5px solid ${color};padding:10px 16px;background:#f8f9ff;margin-bottom:20px}
  h1{margin:0 0 6px;font-size:1.3em;color:#1a1a2e}
  .badges{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}
  .badge{padding:3px 10px;border-radius:10px;font-size:0.78em;font-weight:700;background:#e8eaf6;color:#3949ab}
  .section{margin:18px 0}
  h2{font-size:1em;color:#1a3a5c;border-bottom:2px solid #e0e0e0;padding-bottom:4px;margin-bottom:10px}
  p{line-height:1.75;font-size:0.93em;color:#333}
  ul{padding-left:20px;margin:8px 0}
  li{line-height:1.8;font-size:0.92em;color:#333;margin-bottom:2px}
  .formule{background:#f0f4ff;border-left:4px solid ${color};padding:10px 14px;border-radius:4px;font-family:monospace;font-size:0.95em;margin:10px 0}
  .footer{border-top:1px solid #eee;margin-top:24px;padding-top:10px;font-size:0.78em;color:#888;display:flex;justify-content:space-between;align-items:center}
  .btn{background:${color};color:#fff;border:none;padding:8px 18px;border-radius:6px;cursor:pointer;font-size:0.88em;font-weight:600}
  @media print{.btn{display:none}@page{margin:15mm;size:A4}}
</style></head><body>
<button class="btn" onclick="window.print()">🖨️ Imprimer / PDF</button>
<div class="header">
  <h1>${res.titre}</h1>
  <div class="badges">
    <span class="badge">${res.matiere}</span>
    <span class="badge">${res.niveau}</span>
    ${res.serie ? `<span class="badge">Série ${res.serie}</span>` : ''}
    ${res.annee ? `<span class="badge">${res.annee}</span>` : ''}
    <span class="badge" style="background:#e8f5e9;color:#2e7d32">${RESSOURCE_LABELS[res.type]}</span>
  </div>
</div>
<div class="section">
  <h2>📋 Résumé du contenu</h2>
  <p>${res.description}</p>
</div>
<div class="section">
  <h2>🔑 Points clés</h2>
  <ul>${pts || `<li>${res.description}</li>`}</ul>
</div>
<div class="section">
  <h2>📌 Conseils pour réviser</h2>
  <ul>
    <li>Lire attentivement le cours et noter les définitions importantes</li>
    <li>Faire des exercices d'application immédiatement après chaque leçon</li>
    <li>Revoir les annales pour identifier les types de questions fréquents au BAC</li>
    <li>Utiliser les TP virtuels pour visualiser les phénomènes abstraits</li>
    <li>Rejoindre les forums de tutorat pour poser vos questions</li>
  </ul>
</div>
<div class="footer">
  <span>Source : ${res.source || 'SmartSchool SN'}</span>
  <span>SmartSchool SN © ${new Date().getFullYear()} — Curriculum MEN Sénégal</span>
</div>
</body></html>`
    const win = window.open('', '_blank', 'width=900,height=720')
    if (!win) { toast.error('Autorisez les popups pour afficher la fiche.'); return }
    win.document.write(html)
    win.document.close()
  }

  function ouvrirQuiz(res: RessourceEnLigne) {
    const questions: { q: string; c: string[]; a: number }[] = res.titre.toLowerCase().includes('suite') ? [
      { q: 'Une suite arithmétique a u₁=5 et r=3. Quelle est la valeur de u₄?', c: ['14', '11', '17', '20'], a: 0 },
      { q: 'Pour une suite géométrique de raison q=2, u₁=1. Quel est u₅?', c: ['16', '8', '32', '10'], a: 0 },
      { q: 'La suite (uₙ) définie par uₙ=2n+1 est :', c: ['Arithmétique de raison 2', 'Géométrique de raison 2', 'Ni arithmétique ni géométrique', 'Arithmétique de raison 1'], a: 0 },
      { q: 'Si uₙ₊₁/uₙ = constante, la suite est :', c: ['Géométrique', 'Arithmétique', 'Convergente', 'Divergente'], a: 0 },
      { q: 'La somme des 5 premiers termes de la suite géométrique q=2, u₁=1 vaut :', c: ['31', '15', '63', '16'], a: 0 },
    ] : res.titre.toLowerCase().includes('intégr') ? [
      { q: 'Quelle est la primitive de f(x)=3x²?', c: ['x³+C', '6x+C', 'x³/3+C', '3x³+C'], a: 0 },
      { q: '∫₀² x dx vaut :', c: ['2', '4', '1', '3'], a: 0 },
      { q: 'La primitive de f(x)=cos(x) est :', c: ['sin(x)+C', '-sin(x)+C', 'cos(x)+C', 'tan(x)+C'], a: 0 },
      { q: '∫ eˣ dx est égal à :', c: ['eˣ+C', 'eˣ⁺¹+C', 'xeˣ+C', '(x+1)eˣ+C'], a: 0 },
      { q: 'Pour calculer ∫ u·v′ dx on utilise :', c: ['Intégration par parties', 'Le changement de variable', 'La formule de Taylor', 'La dérivation composée'], a: 0 },
    ] : res.titre.toLowerCase().includes('complexe') ? [
      { q: 'Le module de z = 3+4i est :', c: ['5', '7', '25', '1'], a: 0 },
      { q: 'L\'argument de z = i est :', c: ['π/2', '0', 'π', '-π/2'], a: 0 },
      { q: 'Le conjugué de 2+3i est :', c: ['2-3i', '-2-3i', '2+3i', '-2+3i'], a: 0 },
      { q: '(1+i)² est égal à :', c: ['2i', '2', '1+2i', '0'], a: 0 },
      { q: 'La forme trigonométrique de z=1+i est :', c: ['√2(cos π/4 + i sin π/4)', '√2(cos π/3 + i sin π/3)', '2(cos π/4 + i sin π/4)', '√3(cos π/6 + i sin π/6)'], a: 0 },
    ] : res.titre.toLowerCase().includes('newton') || res.titre.toLowerCase().includes('mécan') ? [
      { q: 'La 2ème loi de Newton s\'écrit :', c: ['ΣF = ma', 'ΣF = mv', 'ΣF = m/a', 'ΣF = pa'], a: 0 },
      { q: 'Un objet de masse 5 kg soumis à une force de 20 N a une accélération de :', c: ['4 m/s²', '100 m/s²', '0.25 m/s²', '25 m/s²'], a: 0 },
      { q: 'L\'énergie cinétique s\'exprime par :', c: ['½mv²', 'mv²', '2mv', 'mv²/2g'], a: 0 },
      { q: 'Le principe d\'inertie (1ère loi de Newton) stipule qu\'un objet non soumis à une force :', c: ['Reste immobile ou en MRU', 'Accélère', 'Décélère', 'Suit un cercle'], a: 0 },
      { q: 'L\'unité du poids est :', c: ['Newton (N)', 'Kilogramme (kg)', 'Pascal (Pa)', 'Joule (J)'], a: 0 },
    ] : res.titre.toLowerCase().includes('génét') ? [
      { q: 'La méiose produit combien de cellules filles?', c: ['4', '2', '8', '1'], a: 0 },
      { q: 'Un individu de génotype Aa est :', c: ['Hétérozygote', 'Homozygote dominant', 'Homozygote récessif', 'Impossible'], a: 0 },
      { q: 'Le crossing-over a lieu pendant :', c: ['Méiose I (prophase I)', 'Méiose II', 'Mitose', 'Interphase'], a: 0 },
      { q: 'Si A est dominant sur a, le phénotype de [AA] et [Aa] est :', c: ['Identique', 'Différent', 'Dépend de l\'environnement', 'Mixte'], a: 0 },
      { q: 'Une mutation est :', c: ['Une modification de la séquence d\'ADN', 'Une division cellulaire', 'Un type de reproduction', 'Une hormone'], a: 0 },
    ] : [
      { q: `Dans le chapitre "${res.matiere}", quelle affirmation est correcte?`, c: ['La définition rigoureuse est essentielle', 'Les exemples ne sont pas nécessaires', 'La pratique n\'aide pas à retenir', 'Les formules sont inutiles'], a: 0 },
      { q: 'Pour réussir au BAC, il est conseillé de :', c: ['Refaire les annales des années précédentes', 'Mémoriser sans comprendre', 'Éviter les exercices difficiles', 'Ne pas réviser les définitions'], a: 0 },
      { q: 'La meilleure stratégie de révision est :', c: ['Espacer les révisions dans le temps', 'Tout réviser la veille', 'Lire sans exercices', 'Copier le cours sans relire'], a: 0 },
      { q: 'Pour comprendre un cours, il faut :', c: ['Chercher les exemples concrets et les appliquer', 'Mémoriser sans faire d\'exercices', 'Attendre le dernier moment', 'Copier le cours de quelqu\'un d\'autre'], a: 0 },
      { q: 'Les annales du BAC permettent de :', c: ['Identifier les types de questions fréquents', 'Remplacer le cours', 'Éviter de faire des exercices', 'Rien d\'utile'], a: 0 },
    ]

    const questionsJson = JSON.stringify(questions)
    const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<title>Quiz — ${res.titre}</title>
<style>
  *{box-sizing:border-box}body{font-family:'Segoe UI',Arial,sans-serif;max-width:700px;margin:0 auto;padding:24px;color:#1a1a2e;background:#f8f9ff}
  h1{font-size:1.2em;color:#1a3a5c;border-bottom:3px solid #7C4DFF;padding-bottom:8px}
  .badge{display:inline-block;padding:3px 10px;border-radius:10px;font-size:0.78em;font-weight:700;background:#ede7f6;color:#512da8;margin-right:8px}
  .question{background:#fff;border-radius:12px;padding:16px 20px;margin:16px 0;box-shadow:0 2px 8px rgba(0,0,0,0.07);border:2px solid transparent;transition:border .2s}
  .question.correct{border-color:#4caf50;background:#f1f8e9}
  .question.wrong{border-color:#f44336;background:#fce4ec}
  .q-num{font-size:0.78em;color:#9575cd;font-weight:700;margin-bottom:6px}
  .q-text{font-weight:600;margin-bottom:12px;font-size:0.95em;line-height:1.5}
  .choices{display:grid;grid-template-columns:1fr 1fr;gap:8px}
  .choice{padding:8px 12px;border-radius:8px;border:1.5px solid #e0e0e0;cursor:pointer;font-size:0.88em;background:#f9f9f9;transition:all .15s;text-align:left}
  .choice:hover:not(:disabled){border-color:#7C4DFF;background:#ede7f6}
  .choice.selected-correct{background:#c8e6c9;border-color:#43a047;color:#1b5e20;font-weight:700}
  .choice.selected-wrong{background:#ffcdd2;border-color:#e53935;color:#b71c1c;font-weight:700}
  .choice.reveal-correct{background:#c8e6c9;border-color:#43a047}
  .feedback{font-size:0.82em;margin-top:8px;font-weight:600}
  .feedback.ok{color:#2e7d32}
  .feedback.ko{color:#c62828}
  #score-box{display:none;text-align:center;background:#fff;border-radius:16px;padding:24px;margin-top:20px;box-shadow:0 4px 16px rgba(0,0,0,0.1)}
  #score-box h2{font-size:1.4em;color:#1a3a5c}
  .score-big{font-size:3em;font-weight:700;color:#7C4DFF}
  .btn{background:#7C4DFF;color:#fff;border:none;padding:10px 24px;border-radius:8px;cursor:pointer;font-size:0.92em;font-weight:700;margin-top:16px}
  .btn:hover{background:#6200ea}
</style></head><body>
<h1>✏️ ${res.titre}</h1>
<p style="font-size:0.85em;color:#666"><span class="badge">${res.matiere}</span><span class="badge">${res.niveau}${res.serie ? ' ' + res.serie : ''}</span>${questions.length} questions — cliquez sur la bonne réponse</p>
<div id="quiz"></div>
<div id="score-box">
  <h2>🎉 Quiz terminé !</h2>
  <div class="score-big" id="score-val"></div>
  <p id="score-msg"></p>
  <button class="btn" onclick="location.reload()">🔄 Recommencer</button>
</div>
<script>
const qs=${questionsJson};
let answered=0;let correct=0;
const quiz=document.getElementById('quiz');
qs.forEach((q,i)=>{
  const div=document.createElement('div');div.className='question';div.id='q'+i;
  div.innerHTML='<div class="q-num">Question '+(i+1)+'/'+qs.length+'</div>'
    +'<div class="q-text">'+q.q+'</div>'
    +'<div class="choices">'+q.c.map((c,j)=>'<button class="choice" id="c'+i+'_'+j+'" onclick="answer('+i+','+j+')">'+c+'</button>').join('')+'</div>'
    +'<div class="feedback" id="fb'+i+'"></div>';
  quiz.appendChild(div);
});
function answer(qi,ci){
  const q=qs[qi];
  const isRight=ci===q.a;
  if(isRight)correct++;
  answered++;
  document.querySelectorAll('#q'+qi+' .choice').forEach((b,j)=>{
    b.disabled=true;
    if(j===q.a)b.classList.add('reveal-correct');
    if(j===ci&&!isRight)b.classList.add('selected-wrong');
    if(j===ci&&isRight)b.classList.add('selected-correct');
  });
  const fb=document.getElementById('fb'+qi);
  fb.textContent=isRight?'✅ Bonne réponse !':'❌ Mauvaise réponse. La bonne réponse était : '+q.c[q.a];
  fb.className='feedback '+(isRight?'ok':'ko');
  if(answered===qs.length){
    document.getElementById('score-box').style.display='block';
    document.getElementById('score-val').textContent=correct+'/'+qs.length;
    const pct=Math.round(correct/qs.length*100);
    document.getElementById('score-msg').textContent=pct>=80?'Excellent ! Continuez comme ça 🌟':pct>=60?'Bien ! Encore quelques révisions 📚':'Révisez ce chapitre et réessayez 💪';
  }
}
</script></body></html>`
    const win = window.open('', '_blank', 'width=740,height=700')
    if (!win) { toast.error('Autorisez les popups pour afficher le quiz.'); return }
    win.document.write(html)
    win.document.close()
  }

  function ouvrirAnnale(res: RessourceEnLigne) {
    // Chercher dans la base d'annales intégrée
    const annale: AnnaleDoc | undefined = ANNALES.find(a =>
      a.matiere === res.matiere &&
      (res.serie ? a.serie === res.serie : true) &&
      (res.annee ? a.annee === res.annee : true) &&
      a.niveau === res.niveau
    )
    if (!annale) {
      // Fallback : ouvrir senexam.sn
      window.open('https://www.senexam.sn', '_blank', 'noopener,noreferrer')
      return
    }
    const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<title>${annale.titre}</title>
<style>
  *{box-sizing:border-box}body{font-family:'Segoe UI',Arial,sans-serif;max-width:860px;margin:0 auto;padding:28px 32px;color:#1a1a2e;background:#fff;font-size:14px}
  .entete{text-align:center;border:2px solid #1a3a5c;padding:16px;margin-bottom:24px;background:#f8f9ff}
  .entete h1{font-size:1.1em;color:#1a3a5c;margin:4px 0}
  .entete .meta{display:flex;justify-content:center;gap:20px;margin-top:8px;font-size:0.85em}
  .badge{padding:3px 10px;border-radius:10px;background:#e8eaf6;color:#3949ab;font-weight:700;font-size:0.78em}
  .section{margin:20px 0}
  h3{color:#1a3a5c;border-bottom:2px solid #e0e0e0;padding-bottom:6px;font-size:1em;margin-top:24px}
  h4{color:#3949ab;margin:16px 0 8px;font-size:0.93em}
  ol,ul{padding-left:20px;line-height:1.9}
  li{margin-bottom:4px}
  blockquote{border-left:4px solid #7986cb;padding:12px 16px;background:#f3f4ff;margin:12px 0;font-style:italic;color:#444}
  table{border-collapse:collapse;width:100%;margin:12px 0}
  th,td{border:1px solid #ccc;padding:6px 10px;font-size:0.88em}
  th{background:#e8eaf6;color:#1a3a5c;font-weight:700}
  .correction-section{display:none;background:#f1f8e9;border:2px solid #4caf50;padding:16px;margin-top:16px;border-radius:8px}
  .correction-section.visible{display:block}
  .correction-section h3{color:#2e7d32}
  .btn-bar{position:sticky;top:0;background:#fff;padding:10px 0;z-index:100;display:flex;gap:10px;border-bottom:1px solid #eee;margin-bottom:16px}
  .btn{padding:8px 18px;border-radius:6px;cursor:pointer;font-size:0.88em;font-weight:700;border:none}
  .btn-print{background:#1a3a5c;color:#fff}
  .btn-corr{background:#2e7d32;color:#fff}
  .btn-corr.active{background:#c62828}
  .footer{border-top:1px solid #eee;margin-top:24px;padding-top:10px;font-size:0.78em;color:#888;display:flex;justify-content:space-between}
  @media print{.btn-bar{display:none}.correction-section{display:block!important}@page{margin:15mm;size:A4}}
</style></head><body>
<div class="btn-bar">
  <button class="btn btn-print" onclick="window.print()">🖨️ Imprimer / PDF</button>
  <button class="btn btn-corr" id="btnCorr" onclick="toggleCorr()">✅ Voir le corrigé</button>
  <button class="btn" style="background:#ff6d00;color:#fff" onclick="window.open('https://www.senexam.sn','_blank')">🔗 senexam.sn</button>
</div>
<div class="entete">
  <h1>${annale.examen} ${annale.annee} — ${annale.matiere}${annale.serie ? ' (Série ' + annale.serie + ')' : ''}</h1>
  <h1>${annale.niveau}</h1>
  <div class="meta">
    <span class="badge">⏱ Durée : ${annale.duree}</span>
    <span class="badge">Coefficient : ${annale.coefficient}</span>
    <span class="badge">Sénégal — MEN / Office du BAC</span>
  </div>
</div>
<div class="section">${annale.sujet_html}</div>
<div class="correction-section" id="corrDiv">
  <h3>✅ CORRIGÉ OFFICIEL</h3>
  ${annale.correction_html}
</div>
<div class="footer">
  <span>SmartSchool SN — Annales officielles MEN Sénégal</span>
  <span>${annale.examen} ${annale.annee}</span>
</div>
<script>
function toggleCorr(){
  const d=document.getElementById('corrDiv');
  const b=document.getElementById('btnCorr');
  d.classList.toggle('visible');
  b.textContent=d.classList.contains('visible')?'🚫 Cacher le corrigé':'✅ Voir le corrigé';
  b.classList.toggle('active');
}
</script></body></html>`
    const win = window.open('', '_blank', 'width=960,height=750')
    if (!win) { toast.error('Autorisez les popups pour afficher l\'annale.'); return }
    win.document.write(html)
    win.document.close()
  }

  function ouvrirContenuNatif(res: RessourceEnLigne) {
    const contenu = CONTENU_NATIF[res.id]
    if (!contenu) return false
    const win = window.open('', '_blank', 'width=960,height=800')
    if (!win) { toast.error('Autorisez les popups pour afficher le cours.'); return true }
    win.document.write(contenu.html)
    win.document.close()
    return true
  }

  function handleOuvrirRessource(res: RessourceEnLigne) {
    if (CONTENU_NATIF[res.id]) { ouvrirContenuNatif(res); return }
    if (res.type === 'resume') { ouvrirFiche(res); return }
    if (res.type === 'exercice') { ouvrirQuiz(res); return }
    if (res.type === 'annale') { ouvrirAnnale(res); return }
    const url = getResourceUrl(res)
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
    else toast.error('Cette ressource sera disponible très prochainement.')
  }

  function handleApercu(res: RessourceEnLigne) {
    if (CONTENU_NATIF[res.id]) { ouvrirContenuNatif(res); return }
    if (res.type === 'resume') { ouvrirFiche(res); return }
    if (res.type === 'exercice') { ouvrirQuiz(res); return }
    if (res.type === 'annale') { ouvrirAnnale(res); return }
    const url = getResourceUrl(res)
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
    else toast.error('Aperçu non disponible pour cette ressource.')
  }

  if (userLoading) {
    return <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-2xl ss-shimmer" style={{ background: 'rgba(255,255,255,0.03)' }} />)}</div>
  }

  return (
    <div className="space-y-5 pb-24 lg:pb-6 animate-fade-in">

      {/* ── Bannière ── */}
      <div className="relative rounded-2xl overflow-hidden min-h-[130px]">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(2,6,23,0.98) 0%, rgba(0,30,60,0.9) 50%, rgba(2,6,23,0.98) 100%)' }} />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 50px, rgba(0,229,255,0.1) 50px, rgba(0,229,255,0.1) 51px), repeating-linear-gradient(0deg, transparent, transparent 50px, rgba(0,229,255,0.1) 50px, rgba(0,229,255,0.1) 51px)' }} />
        <div className="relative px-6 py-5">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-[#00E5FF] animate-pulse" />
            <span className="text-[#94A3B8] text-xs font-semibold tracking-wider uppercase">Support Pedagogique</span>
          </div>
          <h1 className="text-2xl font-black text-white">Programme Officiel MEN</h1>
          <p className="text-sm mt-1" style={{ color: '#94A3B8' }}>
            Curriculum conforme au Ministere de l&apos;Education Nationale du Senegal
          </p>
        </div>
      </div>

      {/* ── Sélecteurs ── */}
      <div className="flex flex-wrap gap-3">
        <select value={selectedNiveau} onChange={e => setSelectedNiveau(e.target.value)}
          className="px-3 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.3)', outline: 'none' }}>
          <optgroup label="College">
            {NIVEAUX_COLLEGE.map(n => <option key={n} value={n}>{n}</option>)}
          </optgroup>
          <optgroup label="Lycee">
            {NIVEAUX_LYCEE.map(n => <option key={n} value={n}>{n}</option>)}
          </optgroup>
        </select>

        {NIVEAUX_LYCEE.includes(selectedNiveau) && selectedNiveau !== 'Seconde' && (
          <select value={selectedSerie} onChange={e => setSelectedSerie(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'rgba(213,0,249,0.1)', border: '1px solid rgba(213,0,249,0.3)', outline: 'none' }}>
            {SERIES_LYCEE.map(s => <option key={s} value={s}>Serie {s}</option>)}
          </select>
        )}

        {(activeTab === 'modules' || activeTab === 'suivi') && (
          <select value={selectedMatiere} onChange={e => setSelectedMatiere(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.3)', outline: 'none' }}>
            {grille?.matieres.map(m => <option key={m.matiere} value={m.matiere}>{m.matiere}</option>) || <option>--</option>}
          </select>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-200"
            style={activeTab === tab.id
              ? { background: 'rgba(0,229,255,0.15)', color: '#00E5FF', border: '1px solid rgba(0,229,255,0.3)' }
              : { background: 'rgba(255,255,255,0.03)', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.07)' }}>
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* TAB: Grille Horaire Hebdomadaire                         */}
      {/* ══════════════════════════════════════════════════════════ */}
      {activeTab === 'grille' && grille && (
        <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h2 className="text-sm font-bold text-[#94A3B8] uppercase tracking-wider mb-4">
            Grille Horaire — {grille.niveau}{grille.serie ? ` ${grille.serie}` : ''}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className="text-left py-3 px-4 font-bold text-[#94A3B8] text-xs uppercase tracking-wider" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Matiere</th>
                  <th className="text-center py-3 px-4 font-bold text-[#94A3B8] text-xs uppercase tracking-wider" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Heures/Sem</th>
                  <th className="text-center py-3 px-4 font-bold text-[#94A3B8] text-xs uppercase tracking-wider" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Coeff</th>
                  <th className="text-center py-3 px-4 font-bold text-[#94A3B8] text-xs uppercase tracking-wider" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Heures/An</th>
                </tr>
              </thead>
              <tbody>
                {grille.matieres.map((m, idx) => {
                  const color = MATIERE_COLORS[m.matiere] || '#00E5FF'
                  return (
                    <tr key={m.matiere} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                      className="transition-colors duration-150 hover:bg-white/[0.02]">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-1.5 h-8 rounded-full shrink-0" style={{ background: color }} />
                          <span className="font-semibold text-white">{m.matiere}</span>
                        </div>
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className="font-black text-lg text-white">{m.heures_hebdo}h</span>
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold"
                          style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
                          x{m.coefficient}
                        </span>
                      </td>
                      <td className="text-center py-3 px-4 font-semibold" style={{ color: '#94A3B8' }}>
                        {m.heures_hebdo * 30}h
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '2px solid rgba(0,229,255,0.3)' }}>
                  <td className="py-3 px-4 font-black text-[#00E5FF]">TOTAL</td>
                  <td className="text-center py-3 px-4 font-black text-xl text-[#00E5FF]">{grille.total_heures}h</td>
                  <td className="text-center py-3 px-4 font-bold text-[#94A3B8]">
                    {grille.matieres.reduce((s, m) => s + m.coefficient, 0)}
                  </td>
                  <td className="text-center py-3 px-4 font-bold text-[#94A3B8]">{grille.total_heures * 30}h</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {!grille && activeTab === 'grille' && (
        <div className="rounded-2xl p-8 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-[#94A3B8]">Grille horaire non disponible pour cette selection</p>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* TAB: Planning Annuel & Modules                           */}
      {/* ══════════════════════════════════════════════════════════ */}
      {activeTab === 'planning' && (
        <div className="space-y-4">
          {/* Stats rapides */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard title="Programmes disponibles" value={allProgrammes.length} subtitle={`${selectedNiveau}${selectedSerie ? ` ${selectedSerie}` : ''}`} icon="📚" color="cyan" />
            <StatCard title="Modules totaux" value={allProgrammes.reduce((s, p) => s + p.modules.length, 0)} subtitle="Tous sujets" icon="📦" color="green" />
            <StatCard title="Heures annuelles" value={`${grille?.total_heures ? grille.total_heures * 30 : '--'}h`} subtitle="30 semaines" icon="⏰" color="gold" />
            <StatCard title="Semaine actuelle" value={`S${semaineActuelle}`} subtitle="Annee 2025-2026" icon="📅" color="purple" />
          </div>

          {/* Liste des programmes */}
          <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <h2 className="text-sm font-bold text-[#94A3B8] uppercase tracking-wider mb-4">
              Planning Annuel — {selectedNiveau}{selectedSerie ? ` ${selectedSerie}` : ''}
            </h2>

            {allProgrammes.length === 0 ? (
              <p className="text-[#94A3B8] text-center py-8">Aucun programme detaille disponible pour cette selection. Les programmes sont en cours d&apos;ajout.</p>
            ) : (
              <div className="space-y-4">
                {allProgrammes.map(prog => {
                  const color = MATIERE_COLORS[prog.matiere] || '#00E5FF'
                  return (
                    <div key={`${prog.matiere}-${prog.niveau}-${prog.serie}`} className="rounded-xl p-4"
                      style={{ background: `${color}06`, border: `1px solid ${color}15` }}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm"
                            style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
                            {prog.heures_hebdo}h
                          </div>
                          <div>
                            <h3 className="font-bold text-white">{prog.matiere}</h3>
                            <p className="text-xs" style={{ color: '#94A3B8' }}>Coeff {prog.coefficient} · {prog.heures_annuelles}h/an · {prog.modules.length} modules</p>
                          </div>
                        </div>
                      </div>

                      {/* Timeline modules */}
                      <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-1">
                        {prog.modules.map((mod, idx) => {
                          const width = Math.max(60, (mod.duree_heures / prog.heures_annuelles) * 100)
                          return (
                            <div key={mod.id} className="shrink-0 rounded-lg px-2 py-1.5 text-center"
                              style={{ width: `${width}%`, minWidth: '80px', background: `${color}${10 + idx * 5}`, border: `1px solid ${color}25` }}>
                              <p className="text-[9px] font-bold truncate" style={{ color }}>{mod.titre}</p>
                              <p className="text-[8px]" style={{ color: '#475569' }}>{mod.duree_heures}h</p>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* TAB: Modules Complets — Structure Détaillée              */}
      {/* ══════════════════════════════════════════════════════════ */}
      {activeTab === 'modules' && (
        <div className="space-y-4">
          {programme ? (
            <>
              {/* En-tête programme */}
              <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                    style={{ background: `${MATIERE_COLORS[programme.matiere] || '#00E5FF'}15`, border: `1px solid ${MATIERE_COLORS[programme.matiere] || '#00E5FF'}30` }}>
                    📖
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white">{programme.matiere}</h2>
                    <p className="text-sm" style={{ color: '#94A3B8' }}>
                      {programme.niveau}{programme.serie ? ` ${programme.serie}` : ''} · Coeff {programme.coefficient} · {programme.heures_hebdo}h/sem · {programme.heures_annuelles}h/an
                    </p>
                  </div>
                </div>
              </div>

              {/* Modules détaillés */}
              {programme.modules.map(mod => {
                const color = MATIERE_COLORS[programme.matiere] || '#00E5FF'
                const modLeconsFaites = mod.lecons.filter(l => leconsValidees.has(l.id)).length
                const modPct = Math.round((modLeconsFaites / mod.lecons.length) * 100)
                return (
                  <div key={mod.id} className="rounded-2xl overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    {/* Header module */}
                    <div className="p-4 flex items-center justify-between"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm"
                          style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
                          {mod.numero}
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-sm">{mod.titre}</h3>
                          <p className="text-xs" style={{ color: '#94A3B8' }}>{mod.duree_heures}h · {mod.lecons.length} lecons</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${modPct}%`, background: color }} />
                        </div>
                        <span className="text-xs font-bold" style={{ color }}>{modPct}%</span>
                      </div>
                    </div>

                    {/* Leçons */}
                    <div className="divide-y divide-white/[0.04]">
                      {mod.lecons.map(lecon => {
                        const typeColor = TYPE_COLORS[lecon.type] || '#00E5FF'
                        const done = leconsValidees.has(lecon.id)
                        return (
                          <div key={lecon.id} className="flex items-center gap-3 px-4 py-3 transition-all duration-150 hover:bg-white/[0.02]"
                            style={{ opacity: done ? 0.6 : 1 }}>
                            <button onClick={() => toggleLecon(lecon.id)}
                              className="w-6 h-6 rounded-md shrink-0 flex items-center justify-center transition-all duration-200"
                              style={done
                                ? { background: `${color}30`, border: `2px solid ${color}`, color }
                                : { background: 'transparent', border: '2px solid rgba(255,255,255,0.15)' }}>
                              {done && <span className="text-xs">&#10003;</span>}
                            </button>
                            <span className="text-lg shrink-0">{TYPE_ICONS[lecon.type] || '📖'}</span>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-semibold text-white ${done ? 'line-through' : ''}`}>{lecon.titre}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                                  style={{ background: `${typeColor}15`, color: typeColor }}>{lecon.type.toUpperCase()}</span>
                                <span className="text-[10px]" style={{ color: '#475569' }}>{lecon.duree_heures}h</span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </>
          ) : (
            <div className="rounded-2xl p-8 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3 text-3xl mx-auto"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>📭</div>
              <p className="text-[#94A3B8] text-sm">Programme detaille non encore disponible pour <strong className="text-white">{selectedMatiere}</strong> en {selectedNiveau}{selectedSerie ? ` ${selectedSerie}` : ''}.</p>
              <p className="text-[#475569] text-xs mt-2">Les programmes sont progressivement ajoutes pour toutes les matieres.</p>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* TAB: Suivi des Cours — Compteur d'heures & Alertes       */}
      {/* ══════════════════════════════════════════════════════════ */}
      {activeTab === 'suivi' && (
        <div className="space-y-4">
          {/* Stats du suivi */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard title="Lecons faites" value={`${suiviStats.fait}/${suiviStats.total}`} subtitle={selectedMatiere} icon="✅" color="green" />
            <StatCard title="Heures effectuees" value={`${suiviStats.heuresFaites}h`} subtitle={`sur ${suiviStats.heuresTotal}h`} icon="⏱" color="cyan" />
            <StatCard title="Progression" value={`${suiviStats.progression}%`} subtitle="Completion du programme" icon="📊" color={suiviStats.progression >= 80 ? 'green' : suiviStats.progression >= 50 ? 'gold' : 'red'} />
            <StatCard title="Semaine" value={`S${semaineActuelle}`} subtitle="Annee 2025-2026" icon="📅" color="purple" />
          </div>

          {/* Alerte retard */}
          {alerteRetard && programme && (
            <div className="rounded-xl p-4 flex items-center gap-3"
              style={{
                background: alerteRetard.type === 'danger' ? 'rgba(255,23,68,0.08)' : alerteRetard.type === 'warning' ? 'rgba(255,214,0,0.08)' : 'rgba(0,230,118,0.08)',
                border: `1px solid ${alerteRetard.type === 'danger' ? 'rgba(255,23,68,0.2)' : alerteRetard.type === 'warning' ? 'rgba(255,214,0,0.2)' : 'rgba(0,230,118,0.2)'}`,
              }}>
              <span className="text-2xl">{alerteRetard.type === 'danger' ? '🚨' : alerteRetard.type === 'warning' ? '⚠️' : '✅'}</span>
              <div>
                <p className="text-sm font-bold text-white">
                  {alerteRetard.type === 'danger' ? 'Alerte Retard' : alerteRetard.type === 'warning' ? 'Attention' : 'Dans les temps'}
                </p>
                <p className="text-xs" style={{ color: '#94A3B8' }}>{alerteRetard.msg}</p>
              </div>
            </div>
          )}

          {/* Barre de progression globale */}
          {programme && (
            <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <h2 className="text-sm font-bold text-[#94A3B8] uppercase tracking-wider mb-4">Progression par module</h2>
              <div className="space-y-3">
                {programme.modules.map(mod => {
                  const color = MATIERE_COLORS[programme.matiere] || '#00E5FF'
                  const modFait = mod.lecons.filter(l => leconsValidees.has(l.id)).length
                  const modPct = Math.round((modFait / mod.lecons.length) * 100)
                  return (
                    <div key={mod.id} className="flex items-center gap-3">
                      <div className="w-6 text-center font-black text-xs" style={{ color }}>{mod.numero}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-semibold text-white truncate">{mod.titre}</p>
                          <span className="text-[10px] font-bold" style={{ color: '#94A3B8' }}>{modFait}/{mod.lecons.length}</span>
                        </div>
                        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <div className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${modPct}%`, background: modPct === 100 ? '#00E676' : color }} />
                        </div>
                      </div>
                      <span className="text-xs font-bold w-10 text-right" style={{ color: modPct === 100 ? '#00E676' : '#94A3B8' }}>
                        {modPct}%
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {!programme && (
            <div className="rounded-2xl p-8 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-[#94A3B8]">Selectionnez une matiere dont le programme est disponible pour voir le suivi.</p>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* TAB: Planning Semestriel Détaillé                        */}
      {/* ══════════════════════════════════════════════════════════ */}
      {activeTab === 'semestre' && (
        <div className="space-y-4">
          {PLANNING_SEMESTRIEL.map(sem => (
            <div key={sem.semestre} className="rounded-2xl p-5"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-[#94A3B8] uppercase tracking-wider">
                  {sem.semestre === 1 ? '1er' : '2eme'} Semestre
                </h2>
                <div className="flex items-center gap-2 text-xs" style={{ color: '#475569' }}>
                  <span>{new Date(sem.debut).toLocaleDateString('fr-SN', { day: 'numeric', month: 'short' })}</span>
                  <span>→</span>
                  <span>{new Date(sem.fin).toLocaleDateString('fr-SN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  <span className="px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(0,229,255,0.1)', color: '#00E5FF' }}>
                    {sem.semaines} sem
                  </span>
                </div>
              </div>

              {/* Timeline visuelle */}
              <div className="space-y-2">
                {sem.periodes.map((p, idx) => {
                  const typeColor = p.type === 'cours' ? '#00E676' : p.type === 'evaluation' ? '#FF1744' : p.type === 'revision' ? '#FFD600' : '#94A3B8'
                  const typeIcon = p.type === 'cours' ? '📖' : p.type === 'evaluation' ? '📋' : p.type === 'revision' ? '🔄' : '🏖️'
                  const semCount = p.fin_semaine - p.debut_semaine + 1
                  const isCurrent = semaineActuelle >= (sem.semestre === 1 ? p.debut_semaine : p.debut_semaine + 18) &&
                                    semaineActuelle <= (sem.semestre === 1 ? p.fin_semaine : p.fin_semaine + 18)
                  return (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-xl transition-all duration-150"
                      style={{
                        background: isCurrent ? `${typeColor}10` : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${isCurrent ? typeColor + '30' : 'rgba(255,255,255,0.05)'}`,
                      }}>
                      <div className="w-1 h-10 rounded-full shrink-0" style={{ background: typeColor }} />
                      <span className="text-lg shrink-0">{typeIcon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white">{p.nom}</p>
                        <p className="text-xs" style={{ color: '#475569' }}>
                          Semaines {p.debut_semaine}–{p.fin_semaine} · {semCount} semaine{semCount > 1 ? 's' : ''}
                        </p>
                      </div>
                      {isCurrent && (
                        <span className="text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shrink-0"
                          style={{ background: `${typeColor}20`, color: typeColor, border: `1px solid ${typeColor}40` }}>
                          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: typeColor }} />
                          EN COURS
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Légende */}
          <div className="flex flex-wrap gap-3 px-1">
            {[
              { label: 'Cours', color: '#00E676', icon: '📖' },
              { label: 'Evaluation', color: '#FF1744', icon: '📋' },
              { label: 'Revision', color: '#FFD600', icon: '🔄' },
              { label: 'Vacances', color: '#94A3B8', icon: '🏖️' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5 text-xs" style={{ color: l.color }}>
                <span>{l.icon}</span>
                <span className="font-semibold">{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* TAB: Ma Semaine — Planning hebdomadaire toutes matières   */}
      {/* ══════════════════════════════════════════════════════════ */}
      {activeTab === 'semaine' && (
        <div className="space-y-4">

          {/* En-tête semaine */}
          <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, rgba(0,229,255,0.08) 0%, rgba(0,230,118,0.05) 100%)', border: '1px solid rgba(0,229,255,0.2)' }}>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-xl font-black text-white">
                  Semaine <span style={{ color: '#00E5FF' }}>S{semaineActuelle}</span> — Année 2025-2026
                </h2>
                <p className="text-sm mt-1" style={{ color: '#94A3B8' }}>
                  {selectedNiveau}{selectedSerie && NIVEAUX_LYCEE.includes(selectedNiveau) && selectedNiveau !== 'Seconde' ? ` Série ${selectedSerie}` : ''} · {allProgrammes.length} matière{allProgrammes.length > 1 ? 's' : ''} disponibles
                </p>
              </div>
              <div className="flex gap-2">
                <div className="px-3 py-1.5 rounded-xl text-xs font-bold" style={{ background: 'rgba(0,229,255,0.12)', color: '#00E5FF', border: '1px solid rgba(0,229,255,0.25)' }}>
                  Sem {semaineActuelle}/36
                </div>
              </div>
            </div>
          </div>

          {allProgrammes.length === 0 ? (
            <div className="rounded-2xl p-10 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-[#94A3B8]">Aucun programme disponible pour cette selection.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {planningDeLaSemaine.map(({ prog, progression, heuresFaites, pct, retard }) => {
                const color = MATIERE_COLORS[prog.matiere] || '#00E5FF'
                const alertColor = retard === 'danger' ? '#FF1744' : retard === 'warning' ? '#FFD600' : '#00E676'
                const alertIcon = retard === 'danger' ? '🚨' : retard === 'warning' ? '⚠️' : '✅'
                return (
                  <div key={`${prog.matiere}-${prog.serie}`} className="rounded-2xl overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${color}18` }}>

                    {/* Header matière */}
                    <div className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: `${color}06` }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0"
                        style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
                        {prog.heures_hebdo}h
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white text-sm truncate">{prog.matiere}</h3>
                        <p className="text-[10px]" style={{ color: '#94A3B8' }}>
                          Coeff {prog.coefficient} · {heuresFaites}h/{prog.heures_annuelles}h · {pct}%
                        </p>
                      </div>
                      <span className="text-base shrink-0">{alertIcon}</span>
                    </div>

                    {/* Progression bar */}
                    <div className="px-4 pt-3">
                      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, background: pct >= 90 ? '#00E676' : pct >= 60 ? color : alertColor }} />
                      </div>
                    </div>

                    {/* Leçon de la semaine */}
                    <div className="p-4">
                      {progression ? (
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: '#475569' }}>
                            Leçon prévue cette semaine
                          </p>
                          <div className="rounded-xl p-3" style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
                            <div className="flex items-start gap-2">
                              <span className="text-lg shrink-0">{TYPE_ICONS[progression.lecon.type] || '📖'}</span>
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-white leading-snug">{progression.lecon.titre}</p>
                                <p className="text-[10px] mt-1" style={{ color }}>
                                  {progression.module.titre} · Module {progression.module.numero}
                                </p>
                                <div className="flex items-center gap-2 mt-1.5">
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                                    style={{ background: `${TYPE_COLORS[progression.lecon.type] || color}15`, color: TYPE_COLORS[progression.lecon.type] || color }}>
                                    {progression.lecon.type.toUpperCase()}
                                  </span>
                                  <span className="text-[10px]" style={{ color: '#475569' }}>{progression.lecon.duree_heures}h</span>
                                </div>
                              </div>
                            </div>
                            {/* Objectifs */}
                            {progression.lecon.objectifs.length > 0 && (
                              <div className="mt-2 space-y-0.5">
                                {progression.lecon.objectifs.slice(0, 2).map((obj, i) => (
                                  <div key={i} className="flex items-start gap-1.5">
                                    <span className="text-[8px] mt-1 shrink-0" style={{ color }}>▶</span>
                                    <p className="text-[10px]" style={{ color: '#94A3B8' }}>{obj}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-2">
                          <p className="text-xs font-bold" style={{ color: '#00E676' }}>
                            ✅ Programme terminé — Révisions BAC
                          </p>
                        </div>
                      )}

                      {/* Alerte retard */}
                      {retard !== 'ok' && (
                        <div className="mt-3 rounded-lg px-3 py-2 flex items-center gap-2"
                          style={{ background: `${alertColor}08`, border: `1px solid ${alertColor}20` }}>
                          <span className="text-sm">{alertIcon}</span>
                          <p className="text-[10px] font-semibold" style={{ color: alertColor }}>
                            {retard === 'danger' ? 'Retard important — accélérer le rythme' : 'Léger retard — surveiller'}
                          </p>
                        </div>
                      )}

                      {/* Bouton marquer fait */}
                      {progression && (
                        <button
                          onClick={() => toggleLecon(progression.lecon.id)}
                          className="mt-3 w-full py-2 rounded-xl text-xs font-bold transition-all duration-200"
                          style={leconsValidees.has(progression.lecon.id)
                            ? { background: `${color}15`, color, border: `1px solid ${color}30` }
                            : { background: 'rgba(255,255,255,0.04)', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.08)' }}>
                          {leconsValidees.has(progression.lecon.id) ? '✓ Leçon validée' : 'Cocher comme fait'}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Résumé pour élèves — à communiquer  */}
          {allProgrammes.length > 0 && (
            <div className="rounded-2xl p-5" style={{ background: 'rgba(213,0,249,0.04)', border: '1px solid rgba(213,0,249,0.15)' }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                  style={{ background: 'rgba(213,0,249,0.12)', border: '1px solid rgba(213,0,249,0.25)' }}>📋</div>
                <div>
                  <h3 className="font-bold text-white text-sm">Résumé hebdomadaire pour les élèves</h3>
                  <p className="text-xs" style={{ color: '#94A3B8' }}>Partagez ce planning avec vos classes</p>
                </div>
              </div>
              <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', fontFamily: 'monospace' }}>
                <p className="text-xs font-bold text-white mb-2">
                  PLANNING SEMAINE S{semaineActuelle} — {selectedNiveau}{selectedSerie && NIVEAUX_LYCEE.includes(selectedNiveau) && selectedNiveau !== 'Seconde' ? ` Série ${selectedSerie}` : ''}
                </p>
                {planningDeLaSemaine.slice(0, 6).map(({ prog, progression }) => (
                  <div key={prog.matiere} className="flex items-start gap-2 mb-1">
                    <span className="text-[10px] font-bold w-32 shrink-0" style={{ color: MATIERE_COLORS[prog.matiere] || '#00E5FF' }}>
                      {prog.matiere.substring(0, 14).padEnd(14)}
                    </span>
                    <span className="text-[10px]" style={{ color: '#94A3B8' }}>
                      {progression ? `→ ${progression.lecon.titre}` : '→ Révisions finales'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* TAB: Ressources Élèves & Annales BAC/BFEM                */}
      {/* ══════════════════════════════════════════════════════════ */}
      {activeTab === 'ressources' && (
        <div className="space-y-4">

          {/* KPIs */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {(['all', 'annale', 'video', 'exercice', 'resume', 'tp_virtuel'] as const).map(t => {
              const count = t === 'all'
                ? getRessources({ niveau: selectedNiveau, serie: NIVEAUX_LYCEE.includes(selectedNiveau) && selectedNiveau !== 'Seconde' ? selectedSerie : undefined }).length
                : getRessources({ niveau: selectedNiveau, type: t, serie: NIVEAUX_LYCEE.includes(selectedNiveau) && selectedNiveau !== 'Seconde' ? selectedSerie : undefined }).length
              const color = t === 'all' ? '#00E5FF' : RESSOURCE_COLORS[t]
              const icon = t === 'all' ? '🌐' : RESSOURCE_ICONS[t]
              const label = t === 'all' ? 'Tout' : RESSOURCE_LABELS[t]
              return (
                <button
                  key={t}
                  onClick={() => setFiltreTypeRes(t)}
                  className="rounded-xl p-3 text-center transition-all duration-200"
                  style={{
                    background: filtreTypeRes === t ? `${color}15` : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${filtreTypeRes === t ? color + '40' : 'rgba(255,255,255,0.07)'}`,
                  }}>
                  <span className="text-lg block">{icon}</span>
                  <span className="text-xs font-bold block mt-1" style={{ color: filtreTypeRes === t ? color : '#94A3B8' }}>
                    {label}
                  </span>
                  <span className="text-[10px] font-black" style={{ color: filtreTypeRes === t ? color : '#475569' }}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Liste ressources */}
          {ressources.length === 0 ? (
            <div className="rounded-2xl p-10 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <span className="text-3xl block mb-3">📭</span>
              <p className="text-[#94A3B8] text-sm">Aucune ressource disponible pour cette sélection.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ressources.map(res => {
                const color = RESSOURCE_COLORS[res.type] || '#00E5FF'
                const icon = RESSOURCE_ICONS[res.type] || '📄'
                const label = RESSOURCE_LABELS[res.type] || res.type
                const matiereColor = MATIERE_COLORS[res.matiere] || '#00E5FF'
                return (
                  <div key={res.id} className="rounded-xl overflow-hidden transition-all duration-200 hover:scale-[1.01]"
                    style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${color}18` }}>
                    <div className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: `1px solid ${color}10`, background: `${color}05` }}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                        style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                        {icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white leading-snug truncate">{res.titre}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{ background: `${color}15`, color }}>{label}</span>
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                            style={{ background: `${matiereColor}10`, color: matiereColor }}>{res.matiere}</span>
                          {res.annee && (
                            <span className="text-[10px]" style={{ color: '#475569' }}>{res.annee}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="px-4 py-3">
                      <p className="text-xs text-[#94A3B8] leading-relaxed">{res.description}</p>
                      {res.source && (
                        <p className="text-[10px] mt-2 font-semibold" style={{ color: '#475569' }}>
                          Source : {res.source}
                        </p>
                      )}
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => handleOuvrirRessource(res)}
                          className="flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-200 hover:opacity-80 active:scale-95 cursor-pointer"
                          style={{ background: `${color}18`, color, border: `1px solid ${color}35` }}>
                          {res.type === 'video' ? '▶ Regarder' : res.type === 'tp_virtuel' ? '🔬 Démarrer le TP' : res.type === 'tutorat' ? '💬 Rejoindre' : res.type === 'exercice' ? '✏️ Faire le quiz' : res.type === 'resume' ? '📄 Ouvrir la fiche' : '📥 Voir les annales'}
                        </button>
                        <button
                          onClick={() => handleApercu(res)}
                          className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-200 hover:opacity-80 active:scale-95 cursor-pointer"
                          style={{ background: 'rgba(255,255,255,0.06)', color: '#CBD5E1', border: '1px solid rgba(255,255,255,0.1)' }}>
                          👁 Aperçu
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Bannière info */}
          <div className="rounded-2xl p-4 flex items-start gap-3"
            style={{ background: 'rgba(0,229,255,0.05)', border: '1px solid rgba(0,229,255,0.15)' }}>
            <span className="text-xl shrink-0 mt-0.5">💡</span>
            <div>
              <p className="text-sm font-bold text-white">Ressources accessibles aux élèves</p>
              <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>
                Ces ressources (annales, fiches de révision, exercices interactifs et TP virtuels) sont également
                disponibles dans l&apos;espace élève sous &ldquo;E-learning&rdquo;. Encouragez vos élèves à les utiliser
                pour réviser et s&apos;entraîner au BAC / BFEM.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
