'use client'

import { useState, useMemo } from 'react'
import { useUser } from '@/hooks/useUser'
import { StatCard } from '@/components/dashboard/StatCard'
import {
  RESSOURCES_EN_LIGNE, PROGRAMMES, GRILLES_HORAIRES,
  NIVEAUX_COLLEGE, NIVEAUX_LYCEE, SERIES_LYCEE, TOUTES_MATIERES,
  type RessourceEnLigne, type ProgrammeMatiere
} from '@/lib/curriculum-senegal'
import { ANNALES, type AnnaleDoc } from '@/lib/annales-sn'

const TYPE_META: Record<RessourceEnLigne['type'], { icon: string; label: string; color: string; description: string }> = {
  annale:      { icon: '📝', label: 'Annales BAC',          color: '#FF1744', description: 'Sujets corriges de 2010 a 2024 par serie et matiere' },
  video:       { icon: '🎥', label: 'Cours Video',          color: '#00E5FF', description: 'Lecons video par des enseignants certifies' },
  tp_virtuel:  { icon: '🔬', label: 'TP Virtuels',          color: '#00E676', description: 'Travaux pratiques interactifs avec simulation' },
  exercice:    { icon: '📊', label: 'Exercices Interactifs', color: '#FFD600', description: 'Quiz et exercices autocorriges avec score instantane' },
  resume:      { icon: '📚', label: 'Resumes de Cours',     color: '#D500F9', description: 'Fiches synthese disponibles apres validation par le professeur' },
  tutorat:     { icon: '🤝', label: 'Tutorat en Ligne',     color: '#448AFF', description: 'Forum Q&A et sessions de tutorat avec des eleves tuteurs certifies' },
}

const ALL_TYPES = Object.keys(TYPE_META) as RessourceEnLigne['type'][]

export default function RessourcesElevePage() {
  const { user, loading: userLoading } = useUser()
  const [selectedType, setSelectedType] = useState<RessourceEnLigne['type'] | 'all'>('all')
  const [selectedMatiere, setSelectedMatiere] = useState<string>('all')
  const [selectedNiveau, setSelectedNiveau] = useState<string>('Terminale')
  const [selectedSerie, setSelectedSerie] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeSection, setActiveSection] = useState<'catalogue' | 'programme'>('catalogue')

  const filteredRessources = useMemo(() => {
    return RESSOURCES_EN_LIGNE.filter(r => {
      if (selectedType !== 'all' && r.type !== selectedType) return false
      if (selectedMatiere !== 'all' && r.matiere !== selectedMatiere) return false
      if (selectedNiveau !== 'all' && r.niveau !== selectedNiveau) return false
      if (selectedSerie !== 'all' && r.serie !== selectedSerie) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return r.titre.toLowerCase().includes(q) || r.description.toLowerCase().includes(q) || r.matiere.toLowerCase().includes(q)
      }
      return true
    })
  }, [selectedType, selectedMatiere, selectedNiveau, selectedSerie, searchQuery])

  const stats = useMemo(() => {
    const byType: Record<string, number> = {}
    for (const r of RESSOURCES_EN_LIGNE) {
      byType[r.type] = (byType[r.type] || 0) + 1
    }
    return byType
  }, [])

  const programmes = useMemo(() => {
    return PROGRAMMES.filter(p => {
      if (selectedNiveau !== 'all' && p.niveau !== selectedNiveau) return false
      if (selectedSerie !== 'all' && p.serie !== selectedSerie) return false
      return true
    })
  }, [selectedNiveau, selectedSerie])

  // Matières uniques dans les ressources
  const matieresDisponibles = useMemo(() => {
    const set = new Set(RESSOURCES_EN_LIGNE.map(r => r.matiere))
    return [...set].sort()
  }, [])

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
    const meta = TYPE_META[res.type]
    const color = meta?.color || '#D500F9'
    const pts = res.description.split(' — ').map((s: string) => `<li>${s.trim()}</li>`).join('')
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
  </div>
</div>
<div class="section"><h2>📋 Résumé</h2><p>${res.description}</p></div>
<div class="section"><h2>🔑 Points clés</h2><ul>${pts || `<li>${res.description}</li>`}</ul></div>
<div class="section"><h2>📌 Conseils de révision</h2>
<ul>
  <li>Lire et relire la fiche jusqu&apos;à maîtriser toutes les définitions</li>
  <li>Faire des exercices d&apos;application après chaque point clé</li>
  <li>Consulter les annales BAC pour voir comment ces notions sont évaluées</li>
  <li>Utiliser les TP virtuels pour visualiser les expériences</li>
</ul></div>
<div class="footer">
  <span>Source : ${res.source || 'SmartSchool SN'}</span>
  <span>SmartSchool SN © ${new Date().getFullYear()} — Curriculum MEN Sénégal</span>
</div>
</body></html>`
    const win = window.open('', '_blank', 'width=900,height=720')
    if (!win) { alert('Autorisez les popups pour afficher la fiche.'); return }
    win.document.write(html)
    win.document.close()
  }

  function ouvrirQuiz(res: RessourceEnLigne) {
    const questions: { q: string; c: string[]; a: number }[] = res.titre.toLowerCase().includes('suite') ? [
      { q: 'Une suite arithmétique a u₁=5 et r=3. Quelle est la valeur de u₄?', c: ['14', '11', '17', '20'], a: 0 },
      { q: 'Pour une suite géométrique q=2, u₁=1. Quel est u₅?', c: ['16', '8', '32', '10'], a: 0 },
      { q: 'La suite uₙ=2n+1 est :', c: ['Arithmétique de raison 2', 'Géométrique de raison 2', 'Ni l\'un ni l\'autre', 'Les deux à la fois'], a: 0 },
      { q: 'Si uₙ₊₁ − uₙ = constante, la suite est :', c: ['Arithmétique', 'Géométrique', 'Convergente', 'Divergente'], a: 0 },
      { q: 'Somme des 5 premiers termes : suite géo q=2, u₁=1 ?', c: ['31', '15', '63', '16'], a: 0 },
    ] : res.titre.toLowerCase().includes('newton') || res.titre.toLowerCase().includes('mécan') ? [
      { q: 'La 2ème loi de Newton s\'écrit :', c: ['ΣF = ma', 'ΣF = mv', 'ΣF = m/a', 'F = pa'], a: 0 },
      { q: 'Masse 5 kg, force 20 N → accélération?', c: ['4 m/s²', '100 m/s²', '0.25 m/s²', '25 m/s²'], a: 0 },
      { q: 'L\'énergie cinétique s\'exprime par :', c: ['½mv²', 'mv²', '2mv', 'mv/2g'], a: 0 },
      { q: 'La 1ère loi de Newton dit qu\'un objet sans force :', c: ['Reste immobile ou en MRU', 'Accélère toujours', 'Décélère', 'Tourne en cercle'], a: 0 },
      { q: 'L\'unité du poids est :', c: ['Newton (N)', 'Kilogramme (kg)', 'Pascal (Pa)', 'Joule (J)'], a: 0 },
    ] : res.titre.toLowerCase().includes('génét') ? [
      { q: 'La méiose produit combien de cellules filles?', c: ['4', '2', '8', '1'], a: 0 },
      { q: 'Un individu de génotype Aa est :', c: ['Hétérozygote', 'Homozygote dominant', 'Homozygote récessif', 'Impossible à dire'], a: 0 },
      { q: 'Le crossing-over a lieu pendant :', c: ['Méiose I (prophase I)', 'Méiose II', 'Mitose', 'Interphase'], a: 0 },
      { q: 'Si A domine a, [AA] et [Aa] ont :', c: ['Le même phénotype', 'Des phénotypes différents', 'Dépend du milieu', 'Un phénotype intermédiaire'], a: 0 },
      { q: 'Une mutation est :', c: ['Une modification de l\'ADN', 'Une division cellulaire', 'Un type de reproduction', 'Une hormone'], a: 0 },
    ] : [
      { q: `Le meilleur outil pour préparer le BAC en ${res.matiere} est :`, c: ['Les annales corrigées', 'Apprendre par cœur sans comprendre', 'Éviter les exercices difficiles', 'Ne pas réviser les formules'], a: 0 },
      { q: 'La stratégie de révision la plus efficace est :', c: ['Espacer les révisions dans le temps', 'Tout réviser la veille', 'Lire sans faire d\'exercices', 'Copier sans relire'], a: 0 },
      { q: 'Pour maîtriser un chapitre, il faut :', c: ['Comprendre puis appliquer', 'Mémoriser sans comprendre', 'Attendre le dernier moment', 'Copier sur un camarade'], a: 0 },
      { q: 'Les TP virtuels permettent de :', c: ['Visualiser et comprendre les expériences', 'Remplacer totalement le cours', 'Éviter les examens', 'Obtenir des notes automatiquement'], a: 0 },
      { q: 'Les annales du BAC servent principalement à :', c: ['Identifier les types de questions fréquents', 'Remplacer le cours magistral', 'Éviter les exercices', 'Rien d\'utile'], a: 0 },
    ]
    const questionsJson = JSON.stringify(questions)
    const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<title>Quiz — ${res.titre}</title>
<style>
  *{box-sizing:border-box}body{font-family:'Segoe UI',Arial,sans-serif;max-width:700px;margin:0 auto;padding:24px;color:#1a1a2e;background:#f8f9ff}
  h1{font-size:1.2em;color:#1a3a5c;border-bottom:3px solid #D500F9;padding-bottom:8px}
  .badge{display:inline-block;padding:3px 10px;border-radius:10px;font-size:0.78em;font-weight:700;background:#ede7f6;color:#512da8;margin-right:8px}
  .question{background:#fff;border-radius:12px;padding:16px 20px;margin:16px 0;box-shadow:0 2px 8px rgba(0,0,0,0.07);border:2px solid transparent}
  .q-num{font-size:0.78em;color:#9575cd;font-weight:700;margin-bottom:6px}
  .q-text{font-weight:600;margin-bottom:12px;font-size:0.95em;line-height:1.5}
  .choices{display:grid;grid-template-columns:1fr 1fr;gap:8px}
  .choice{padding:8px 12px;border-radius:8px;border:1.5px solid #e0e0e0;cursor:pointer;font-size:0.88em;background:#f9f9f9;transition:all .15s;text-align:left}
  .choice:hover:not(:disabled){border-color:#D500F9;background:#fce4ec}
  .selected-correct{background:#c8e6c9!important;border-color:#43a047!important;color:#1b5e20;font-weight:700}
  .selected-wrong{background:#ffcdd2!important;border-color:#e53935!important;color:#b71c1c;font-weight:700}
  .reveal-correct{background:#c8e6c9!important;border-color:#43a047!important}
  .feedback{font-size:0.82em;margin-top:8px;font-weight:600}
  .feedback.ok{color:#2e7d32}.feedback.ko{color:#c62828}
  #score-box{display:none;text-align:center;background:#fff;border-radius:16px;padding:24px;margin-top:20px;box-shadow:0 4px 16px rgba(0,0,0,0.1)}
  .score-big{font-size:3em;font-weight:700;color:#D500F9}
  .btn{background:#D500F9;color:#fff;border:none;padding:10px 24px;border-radius:8px;cursor:pointer;font-size:0.92em;font-weight:700;margin-top:16px}
</style></head><body>
<h1>📊 ${res.titre}</h1>
<p style="font-size:0.85em;color:#666"><span class="badge">${res.matiere}</span><span class="badge">${res.niveau}${res.serie ? ' ' + res.serie : ''}</span>${questions.length} questions — cliquez sur la bonne réponse</p>
<div id="quiz"></div>
<div id="score-box">
  <h2>🎉 Quiz terminé !</h2>
  <div class="score-big" id="score-val"></div>
  <p id="score-msg"></p>
  <button class="btn" onclick="location.reload()">🔄 Recommencer</button>
</div>
<script>
const qs=${questionsJson};let answered=0;let correct=0;
const quiz=document.getElementById('quiz');
qs.forEach((q,i)=>{
  const div=document.createElement('div');div.className='question';div.id='q'+i;
  div.innerHTML='<div class="q-num">Question '+(i+1)+'/'+qs.length+'</div><div class="q-text">'+q.q+'</div>'
    +'<div class="choices">'+q.c.map((c,j)=>'<button class="choice" id="c'+i+'_'+j+'" onclick="answer('+i+','+j+')">'+c+'</button>').join('')+'</div>'
    +'<div class="feedback" id="fb'+i+'"></div>';
  quiz.appendChild(div);
});
function answer(qi,ci){
  const q=qs[qi];const isRight=ci===q.a;
  if(isRight)correct++;answered++;
  document.querySelectorAll('#q'+qi+' .choice').forEach((b,j)=>{
    b.disabled=true;
    if(j===q.a)b.classList.add('reveal-correct');
    if(j===ci&&!isRight)b.classList.add('selected-wrong');
    if(j===ci&&isRight)b.classList.add('selected-correct');
  });
  const fb=document.getElementById('fb'+qi);
  fb.textContent=isRight?'✅ Bonne réponse !':'❌ Mauvaise réponse. Bonne réponse : '+q.c[q.a];
  fb.className='feedback '+(isRight?'ok':'ko');
  if(answered===qs.length){
    document.getElementById('score-box').style.display='block';
    document.getElementById('score-val').textContent=correct+'/'+qs.length;
    const pct=Math.round(correct/qs.length*100);
    document.getElementById('score-msg').textContent=pct>=80?'Excellent ! 🌟 Tu es prêt(e) pour le BAC !':pct>=60?'Bien ! 📚 Encore quelques révisions...':'💪 Révise ce chapitre et réessaie !';
  }
}
</script></body></html>`
    const win = window.open('', '_blank', 'width=740,height=700')
    if (!win) { alert('Autorisez les popups pour afficher le quiz.'); return }
    win.document.write(html)
    win.document.close()
  }

  function ouvrirAnnale(res: RessourceEnLigne) {
    const annale: AnnaleDoc | undefined = ANNALES.find(a =>
      a.matiere === res.matiere &&
      (res.serie ? a.serie === res.serie : true) &&
      (res.annee ? a.annee === res.annee : true) &&
      a.niveau === res.niveau
    )
    if (!annale) {
      window.open('https://www.senexam.sn', '_blank', 'noopener,noreferrer')
      return
    }
    const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<title>${annale.titre}</title>
<style>
  *{box-sizing:border-box}body{font-family:'Segoe UI',Arial,sans-serif;max-width:860px;margin:0 auto;padding:28px 32px;color:#1a1a2e;background:#fff;font-size:14px}
  .entete{text-align:center;border:2px solid #1a3a5c;padding:16px;margin-bottom:24px;background:#f8f9ff}
  .entete h1{font-size:1.1em;color:#1a3a5c;margin:4px 0}
  .meta{display:flex;justify-content:center;gap:16px;margin-top:8px;flex-wrap:wrap}
  .badge{padding:3px 10px;border-radius:10px;background:#e8eaf6;color:#3949ab;font-weight:700;font-size:0.78em}
  h3{color:#1a3a5c;border-bottom:2px solid #e0e0e0;padding-bottom:6px;font-size:1em;margin-top:24px}
  h4{color:#3949ab;margin:16px 0 8px;font-size:0.93em}
  ol,ul{padding-left:20px;line-height:1.9}
  blockquote{border-left:4px solid #7986cb;padding:12px 16px;background:#f3f4ff;margin:12px 0;font-style:italic;color:#444}
  table{border-collapse:collapse;width:100%;margin:12px 0}
  th,td{border:1px solid #ccc;padding:6px 10px;font-size:0.88em}
  th{background:#e8eaf6;font-weight:700}
  .correction-section{display:none;background:#f1f8e9;border:2px solid #4caf50;padding:16px;margin-top:16px;border-radius:8px}
  .correction-section.visible{display:block}
  .btn-bar{position:sticky;top:0;background:#fff;padding:10px 0;z-index:100;display:flex;gap:10px;border-bottom:1px solid #eee;margin-bottom:16px;flex-wrap:wrap}
  .btn{padding:8px 18px;border-radius:6px;cursor:pointer;font-size:0.88em;font-weight:700;border:none}
  @media print{.btn-bar{display:none}@page{margin:15mm;size:A4}}
</style></head><body>
<div class="btn-bar">
  <button class="btn" style="background:#1a3a5c;color:#fff" onclick="window.print()">🖨️ Imprimer / PDF</button>
  <button class="btn" id="btnCorr" style="background:#2e7d32;color:#fff" onclick="toggleCorr()">✅ Voir le corrigé</button>
  <button class="btn" style="background:#ff6d00;color:#fff" onclick="window.open('https://www.senexam.sn','_blank')">🔗 senexam.sn</button>
</div>
<div class="entete">
  <h1>${annale.examen} ${annale.annee} — ${annale.matiere}${annale.serie ? ' Série ' + annale.serie : ''}</h1>
  <h1>${annale.niveau}</h1>
  <div class="meta">
    <span class="badge">⏱ ${annale.duree}</span>
    <span class="badge">Coefficient ${annale.coefficient}</span>
    <span class="badge">Sénégal — Office du BAC</span>
  </div>
</div>
<div>${annale.sujet_html}</div>
<div class="correction-section" id="corrDiv">
  <h3>✅ CORRIGÉ</h3>${annale.correction_html}
</div>
<script>function toggleCorr(){const d=document.getElementById('corrDiv');const b=document.getElementById('btnCorr');d.classList.toggle('visible');b.textContent=d.classList.contains('visible')?'🚫 Cacher':'✅ Voir le corrigé';}</script>
</body></html>`
    const win = window.open('', '_blank', 'width=960,height=750')
    if (!win) { alert('Autorisez les popups pour afficher l\'annale.'); return }
    win.document.write(html)
    win.document.close()
  }

  function handleOuvrirRessource(res: RessourceEnLigne) {
    if (res.type === 'resume') { ouvrirFiche(res); return }
    if (res.type === 'exercice') { ouvrirQuiz(res); return }
    if (res.type === 'annale') { ouvrirAnnale(res); return }
    const url = getResourceUrl(res)
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
    else alert('Cette ressource sera disponible très prochainement.')
  }

  if (userLoading) {
    return <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-2xl ss-shimmer" style={{ background: 'rgba(255,255,255,0.03)' }} />)}</div>
  }

  return (
    <div className="space-y-5 pb-24 lg:pb-6 animate-fade-in">

      {/* ── Bannière ── */}
      <div className="relative rounded-2xl overflow-hidden min-h-[160px]">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(2,6,23,0.98) 0%, rgba(40,0,60,0.9) 50%, rgba(2,6,23,0.98) 100%)' }} />
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(213,0,249,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(0,229,255,0.3) 0%, transparent 50%)' }} />
        <div className="relative px-6 py-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-[#D500F9] animate-pulse" />
            <span className="text-[#94A3B8] text-xs font-semibold tracking-wider uppercase">Espace Ressources</span>
          </div>
          <h1 className="text-2xl font-black text-white">Ressources en Ligne</h1>
          <p className="text-sm mt-1 max-w-xl" style={{ color: '#94A3B8' }}>
            Annales BAC, cours video, TP virtuels, exercices interactifs, fiches de revision et tutorat.
            Tout pour reussir au Senegal.
          </p>

          {/* Compteurs rapides */}
          <div className="flex flex-wrap gap-3 mt-4">
            {ALL_TYPES.map(type => {
              const meta = TYPE_META[type]
              return (
                <button key={type} onClick={() => { setSelectedType(type); setActiveSection('catalogue') }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 hover:scale-105"
                  style={{ background: `${meta.color}12`, color: meta.color, border: `1px solid ${meta.color}25` }}>
                  <span>{meta.icon}</span>
                  <span>{meta.label}</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] ml-1" style={{ background: `${meta.color}20` }}>
                    {stats[type] || 0}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Toggle Catalogue / Programme ── */}
      <div className="flex gap-2">
        <button onClick={() => setActiveSection('catalogue')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200"
          style={activeSection === 'catalogue'
            ? { background: 'rgba(213,0,249,0.15)', color: '#D500F9', border: '1px solid rgba(213,0,249,0.3)' }
            : { background: 'rgba(255,255,255,0.03)', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.07)' }}>
          📚 Catalogue de Ressources
        </button>
        <button onClick={() => setActiveSection('programme')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200"
          style={activeSection === 'programme'
            ? { background: 'rgba(0,229,255,0.15)', color: '#00E5FF', border: '1px solid rgba(0,229,255,0.3)' }
            : { background: 'rgba(255,255,255,0.03)', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.07)' }}>
          📖 Mon Programme
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* SECTION: Catalogue de Ressources                         */}
      {/* ══════════════════════════════════════════════════════════ */}
      {activeSection === 'catalogue' && (
        <div className="space-y-4">
          {/* Filtres + Recherche */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <input type="text" placeholder="Rechercher une ressource..."
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2.5 pl-10 rounded-xl text-sm text-white placeholder-[#475569]"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', outline: 'none' }} />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">🔍</span>
            </div>
            <select value={selectedType} onChange={e => setSelectedType(e.target.value as any)}
              className="px-3 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'rgba(213,0,249,0.1)', border: '1px solid rgba(213,0,249,0.3)', outline: 'none' }}>
              <option value="all">Tous les types</option>
              {ALL_TYPES.map(t => <option key={t} value={t}>{TYPE_META[t].icon} {TYPE_META[t].label}</option>)}
            </select>
            <select value={selectedMatiere} onChange={e => setSelectedMatiere(e.target.value)}
              className="px-3 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.3)', outline: 'none' }}>
              <option value="all">Toutes matieres</option>
              {matieresDisponibles.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select value={selectedNiveau} onChange={e => setSelectedNiveau(e.target.value)}
              className="px-3 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.3)', outline: 'none' }}>
              <option value="all">Tous niveaux</option>
              {[...NIVEAUX_COLLEGE, ...NIVEAUX_LYCEE].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <select value={selectedSerie} onChange={e => setSelectedSerie(e.target.value)}
              className="px-3 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'rgba(255,214,0,0.1)', border: '1px solid rgba(255,214,0,0.3)', outline: 'none' }}>
              <option value="all">Toutes series</option>
              {SERIES_LYCEE.map(s => <option key={s} value={s}>Serie {s}</option>)}
            </select>
          </div>

          {/* Résultats stats */}
          <div className="flex items-center justify-between px-1">
            <p className="text-sm font-semibold text-[#94A3B8]">
              {filteredRessources.length} ressource{filteredRessources.length > 1 ? 's' : ''} trouvee{filteredRessources.length > 1 ? 's' : ''}
            </p>
            {selectedType !== 'all' && (
              <button onClick={() => setSelectedType('all')} className="text-xs font-bold text-[#D500F9] hover:underline">
                Effacer les filtres
              </button>
            )}
          </div>

          {/* Grille de ressources par type */}
          {ALL_TYPES.filter(t => selectedType === 'all' || t === selectedType).map(type => {
            const meta = TYPE_META[type]
            const items = filteredRessources.filter(r => r.type === type)
            if (items.length === 0) return null
            return (
              <div key={type} className="rounded-2xl p-5"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                    style={{ background: `${meta.color}15`, border: `1px solid ${meta.color}30` }}>
                    {meta.icon}
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">{meta.label}</h2>
                    <p className="text-xs" style={{ color: '#94A3B8' }}>{meta.description}</p>
                  </div>
                  <span className="ml-auto px-2.5 py-1 rounded-full text-xs font-bold"
                    style={{ background: `${meta.color}15`, color: meta.color }}>
                    {items.length}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {items.map(res => (
                    <div key={res.id} className="rounded-xl p-4 transition-all duration-200 hover:scale-[1.02] group flex flex-col"
                      style={{ background: `${meta.color}06`, border: `1px solid ${meta.color}18` }}>
                      <div className="flex items-start gap-3 flex-1">
                        <span className="text-2xl shrink-0 mt-0.5">{meta.icon}</span>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-bold text-white group-hover:opacity-80 transition-colors line-clamp-2">{res.titre}</h3>
                          <p className="text-xs mt-1 line-clamp-2" style={{ color: '#94A3B8' }}>{res.description}</p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                              style={{ background: 'rgba(0,229,255,0.1)', color: '#00E5FF' }}>{res.matiere}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                              style={{ background: 'rgba(255,255,255,0.05)', color: '#475569' }}>{res.niveau}</span>
                            {res.serie && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                                style={{ background: 'rgba(213,0,249,0.1)', color: '#D500F9' }}>{res.serie}</span>
                            )}
                            {res.annee && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                                style={{ background: 'rgba(255,214,0,0.1)', color: '#FFD600' }}>{res.annee}</span>
                            )}
                          </div>
                          {res.source && (
                            <p className="text-[10px] mt-1.5" style={{ color: '#475569' }}>Source : {res.source}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleOuvrirRessource(res)}
                        className="mt-3 w-full py-1.5 rounded-lg text-[11px] font-bold transition-all duration-200 hover:opacity-80 active:scale-95 cursor-pointer"
                        style={{ background: `${meta.color}18`, color: meta.color, border: `1px solid ${meta.color}30` }}>
                        {res.type === 'video' ? '▶ Regarder la vidéo' : res.type === 'tp_virtuel' ? '🔬 Démarrer le TP' : res.type === 'annale' ? '📝 Ouvrir l\'annale' : res.type === 'exercice' ? '✏️ Faire le quiz' : res.type === 'resume' ? '📄 Ouvrir la fiche' : '💬 Rejoindre'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

          {filteredRessources.length === 0 && (
            <div className="rounded-2xl p-12 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3 text-3xl mx-auto"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>🔍</div>
              <p className="text-[#94A3B8] text-sm font-semibold">Aucune ressource trouvee</p>
              <p className="text-[#475569] text-xs mt-1">Essayez de modifier vos filtres ou votre recherche.</p>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* SECTION: Mon Programme — Résumés par module              */}
      {/* ══════════════════════════════════════════════════════════ */}
      {activeSection === 'programme' && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard title="Programmes" value={programmes.length} subtitle={`${selectedNiveau !== 'all' ? selectedNiveau : 'Tous niveaux'}`} icon="📖" color="cyan" />
            <StatCard title="Modules" value={programmes.reduce((s, p) => s + p.modules.length, 0)} subtitle="Total" icon="📦" color="green" />
            <StatCard title="Annales" value={stats.annale || 0} subtitle="BAC & BFEM" icon="📝" color="red" />
            <StatCard title="Exercices" value={stats.exercice || 0} subtitle="Quiz interactifs" icon="📊" color="gold" />
          </div>

          {/* Filtres niveau */}
          <div className="flex flex-wrap gap-2">
            <select value={selectedNiveau} onChange={e => setSelectedNiveau(e.target.value)}
              className="px-3 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.3)', outline: 'none' }}>
              <option value="all">Tous niveaux</option>
              {[...NIVEAUX_COLLEGE, ...NIVEAUX_LYCEE].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            {NIVEAUX_LYCEE.includes(selectedNiveau) && selectedNiveau !== 'Seconde' && (
              <select value={selectedSerie} onChange={e => setSelectedSerie(e.target.value)}
                className="px-3 py-2 rounded-xl text-sm font-semibold text-white"
                style={{ background: 'rgba(213,0,249,0.1)', border: '1px solid rgba(213,0,249,0.3)', outline: 'none' }}>
                <option value="all">Toutes series</option>
                {SERIES_LYCEE.map(s => <option key={s} value={s}>Serie {s}</option>)}
              </select>
            )}
          </div>

          {/* Programme détaillé avec résumés */}
          {programmes.length > 0 ? programmes.map(prog => {
            const colors: Record<string, string> = {
              'Mathématiques': '#00E5FF', 'Sciences Physiques': '#00E676', 'SVT': '#76FF03',
              'Philosophie': '#448AFF', 'Français': '#FFD600', 'Histoire-Géographie': '#D500F9',
              'Anglais': '#FF6D00',
            }
            const color = colors[prog.matiere] || '#00E5FF'
            const resCount = RESSOURCES_EN_LIGNE.filter(r =>
              r.matiere === prog.matiere && (r.niveau === prog.niveau || !r.niveau)
            ).length

            return (
              <div key={`${prog.matiere}-${prog.niveau}-${prog.serie}`} className="rounded-2xl overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                {/* Header */}
                <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm"
                      style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
                      {prog.heures_hebdo}h
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{prog.matiere}</h3>
                      <p className="text-xs" style={{ color: '#94A3B8' }}>
                        {prog.niveau}{prog.serie ? ` ${prog.serie}` : ''} · {prog.modules.length} modules · {prog.heures_annuelles}h
                      </p>
                    </div>
                  </div>
                  {resCount > 0 && (
                    <span className="text-[10px] font-bold px-2 py-1 rounded-full"
                      style={{ background: `${color}15`, color }}>
                      {resCount} ressources
                    </span>
                  )}
                </div>

                {/* Modules en accordéon simple */}
                <div className="divide-y divide-white/[0.04]">
                  {prog.modules.map(mod => (
                    <div key={mod.id} className="px-4 py-3">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-6 h-6 rounded-md flex items-center justify-center font-black text-xs"
                          style={{ background: `${color}15`, color }}>
                          {mod.numero}
                        </div>
                        <p className="text-sm font-semibold text-white flex-1">{mod.titre}</p>
                        <span className="text-xs" style={{ color: '#475569' }}>{mod.duree_heures}h · {mod.lecons.length} lecons</span>
                      </div>
                      {/* Mini liste leçons */}
                      <div className="ml-9 space-y-1">
                        {mod.lecons.slice(0, 4).map(l => (
                          <div key={l.id} className="flex items-center gap-2">
                            <span className="w-1 h-1 rounded-full shrink-0" style={{ background: color }} />
                            <p className="text-xs text-[#94A3B8] truncate">{l.titre}</p>
                            <span className="text-[9px] ml-auto shrink-0" style={{ color: '#475569' }}>{l.duree_heures}h</span>
                          </div>
                        ))}
                        {mod.lecons.length > 4 && (
                          <p className="text-[10px] font-semibold" style={{ color }}>+{mod.lecons.length - 4} autres lecons...</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          }) : (
            <div className="rounded-2xl p-8 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-[#94A3B8]">Aucun programme detaille pour cette selection.</p>
            </div>
          )}
        </div>
      )}

    </div>
  )
}
