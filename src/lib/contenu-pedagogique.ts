// ═══════════════════════════════════════════════════════════════════════════════
// CONTENU PÉDAGOGIQUE NATIF — SmartSchool SN
// ═══════════════════════════════════════════════════════════════════════════════
// Cours, exercices et fiches créés spécifiquement pour le programme sénégalais
// Tout le contenu est original et s'affiche nativement dans SmartSchool

export interface ContenuNatif {
  titre: string
  type: 'cours' | 'exercices' | 'fiche'
  html: string
}

// ── Helper pour générer un cours HTML complet ────────────────────────────────
function cours(titre: string, matiere: string, niveau: string, serie: string, sections: string): string {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<title>${titre}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Tahoma,sans-serif;max-width:860px;margin:0 auto;padding:28px 32px;color:#1a1a2e;background:#fff;font-size:15px;line-height:1.7}
.top-bar{position:sticky;top:0;background:#fff;padding:10px 0;z-index:100;display:flex;gap:10px;border-bottom:2px solid #e8eaf6;margin-bottom:20px;flex-wrap:wrap}
.btn{padding:8px 18px;border-radius:8px;cursor:pointer;font-size:0.85em;font-weight:700;border:none;transition:opacity .2s}
.btn:hover{opacity:.85}
.entete{text-align:center;background:linear-gradient(135deg,#1a237e,#283593);color:#fff;padding:24px;border-radius:12px;margin-bottom:24px}
.entete h1{font-size:1.4em;margin-bottom:6px}
.entete .meta{display:flex;justify-content:center;gap:12px;flex-wrap:wrap;margin-top:10px}
.entete .badge{padding:4px 12px;border-radius:20px;font-size:0.78em;font-weight:700;background:rgba(255,255,255,0.2);color:#fff}
.section{margin:24px 0}
h2{font-size:1.15em;color:#1a237e;border-left:4px solid #3949ab;padding-left:12px;margin-bottom:14px}
h3{font-size:1em;color:#283593;margin:16px 0 8px}
h4{font-size:0.93em;color:#3949ab;margin:12px 0 6px}
p{margin-bottom:10px}
.def{background:#e8eaf6;border-left:4px solid #3949ab;padding:12px 16px;border-radius:0 8px 8px 0;margin:12px 0;font-style:italic}
.formule{background:#fff3e0;border:2px solid #ff9800;padding:14px 18px;border-radius:10px;margin:14px 0;text-align:center;font-size:1.1em;font-weight:700;color:#e65100}
.exemple{background:#e8f5e9;border-left:4px solid #43a047;padding:14px 16px;border-radius:0 8px 8px 0;margin:14px 0}
.exemple-titre{font-weight:700;color:#2e7d32;margin-bottom:6px;font-size:0.9em}
.attention{background:#fff8e1;border-left:4px solid #f9a825;padding:12px 16px;border-radius:0 8px 8px 0;margin:12px 0}
.attention-titre{font-weight:700;color:#f57f17;margin-bottom:4px;font-size:0.88em}
.exo{background:#f3e5f5;border:2px dashed #9c27b0;padding:14px 16px;border-radius:10px;margin:16px 0}
.exo-titre{font-weight:700;color:#7b1fa2;margin-bottom:8px;font-size:0.9em}
.solution{display:none;background:#e8f5e9;padding:12px;border-radius:8px;margin-top:10px;border:1px solid #a5d6a7}
.btn-solution{background:#7b1fa2;color:#fff;border:none;padding:6px 14px;border-radius:6px;cursor:pointer;font-size:0.82em;font-weight:600;margin-top:8px}
.retenir{background:#e3f2fd;border:2px solid #1976d2;padding:16px;border-radius:10px;margin:20px 0}
.retenir h3{color:#1565c0;margin-bottom:8px}
ol,ul{padding-left:22px;margin:8px 0}
li{margin-bottom:4px}
table{border-collapse:collapse;width:100%;margin:12px 0}
th,td{border:1px solid #ccc;padding:8px 12px;font-size:0.9em}
th{background:#e8eaf6;font-weight:700;color:#1a237e}
.footer{border-top:2px solid #e8eaf6;margin-top:30px;padding-top:12px;font-size:0.78em;color:#888;text-align:center}
@media print{.top-bar,.btn-solution{display:none}.solution{display:block!important}@page{margin:15mm;size:A4}}
</style></head><body>
<div class="top-bar">
  <button class="btn" style="background:#1a237e;color:#fff" onclick="window.print()">&#128424; Imprimer / PDF</button>
  <button class="btn" style="background:#2e7d32;color:#fff" onclick="document.querySelectorAll('.solution').forEach(s=>s.style.display=s.style.display==='block'?'none':'block')">&#9989; Afficher toutes les solutions</button>
</div>
<div class="entete">
  <h1>${titre}</h1>
  <div class="meta">
    <span class="badge">${matiere}</span>
    <span class="badge">${niveau}</span>
    ${serie ? `<span class="badge">Serie ${serie}</span>` : ''}
    <span class="badge">Programme MEN Senegal</span>
  </div>
</div>
${sections}
<div class="footer">SmartSchool SN &copy; ${new Date().getFullYear()} &mdash; Contenu original conforme au programme officiel du Senegal</div>
<script>
document.querySelectorAll('.btn-solution').forEach(btn=>{
  btn.addEventListener('click',function(){
    const sol=this.nextElementSibling;
    sol.style.display=sol.style.display==='block'?'none':'block';
    this.textContent=sol.style.display==='block'?'Cacher la solution':'Voir la solution';
  });
});
</script>
</body></html>`
}

function exercices(titre: string, matiere: string, niveau: string, serie: string, questionsHtml: string): string {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<title>Exercices — ${titre}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Tahoma,sans-serif;max-width:800px;margin:0 auto;padding:24px 28px;color:#1a1a2e;background:#fff;font-size:15px;line-height:1.7}
h1{font-size:1.3em;color:#1a237e;border-bottom:3px solid #7b1fa2;padding-bottom:8px;margin-bottom:20px}
.badge{display:inline-block;padding:3px 10px;border-radius:10px;font-size:0.78em;font-weight:700;background:#f3e5f5;color:#7b1fa2;margin-right:6px;margin-bottom:12px}
.exo-block{background:#fafafa;border:2px solid #e0e0e0;border-radius:12px;padding:18px;margin:16px 0}
.exo-num{background:#7b1fa2;color:#fff;display:inline-block;padding:2px 10px;border-radius:6px;font-size:0.82em;font-weight:700;margin-bottom:8px}
.exo-text{font-size:0.95em;margin-bottom:10px}
.solution{display:none;background:#e8f5e9;padding:14px;border-radius:8px;margin-top:10px;border:1px solid #a5d6a7}
.sol-titre{font-weight:700;color:#2e7d32;margin-bottom:6px;font-size:0.88em}
.btn-sol{background:#7b1fa2;color:#fff;border:none;padding:6px 14px;border-radius:6px;cursor:pointer;font-size:0.82em;font-weight:600}
.btn{padding:8px 18px;border-radius:8px;cursor:pointer;font-size:0.85em;font-weight:700;border:none}
@media print{.btn,.btn-sol{display:none}.solution{display:block!important}@page{margin:15mm}}
</style></head><body>
<button class="btn" style="background:#1a237e;color:#fff;margin-bottom:16px" onclick="window.print()">&#128424; Imprimer / PDF</button>
<button class="btn" style="background:#2e7d32;color:#fff;margin-bottom:16px;margin-left:8px" onclick="document.querySelectorAll('.solution').forEach(s=>s.style.display=s.style.display==='block'?'none':'block')">&#9989; Toutes les solutions</button>
<h1>&#128221; ${titre}</h1>
<span class="badge">${matiere}</span><span class="badge">${niveau}${serie ? ' ' + serie : ''}</span>
${questionsHtml}
<script>
document.querySelectorAll('.btn-sol').forEach(btn=>{
  btn.addEventListener('click',function(){
    const sol=this.nextElementSibling;
    sol.style.display=sol.style.display==='block'?'none':'block';
    this.textContent=sol.style.display==='block'?'Cacher':'Voir la solution';
  });
});
</script>
</body></html>`
}

// ═══════════════════════════════════════════════════════════════════════════════
// BANQUE DE CONTENU NATIF — indexee par ID de ressource
// ═══════════════════════════════════════════════════════════════════════════════

export const CONTENU_NATIF: Record<string, ContenuNatif> = {

  // ┌─────────────────────────────────────────────────────────────────────────┐
  // │  MATHEMATIQUES — TERMINALE S1                                          │
  // └─────────────────────────────────────────────────────────────────────────┘

  'nat-maths-tle-s1-suites': {
    titre: 'Les Suites Numeriques — Cours Complet',
    type: 'cours',
    html: cours('Les Suites Numeriques', 'Mathematiques', 'Terminale', 'S1', `
<div class="section">
  <h2>I. Generalites sur les suites</h2>
  <div class="def">
    <strong>Definition :</strong> Une suite numerique est une application de N (ou une partie de N) dans R. On note (u<sub>n</sub>) la suite et u<sub>n</sub> son terme general.
  </div>
  <h3>1.1 Modes de definition</h3>
  <p>Une suite peut etre definie de plusieurs facons :</p>
  <ul>
    <li><strong>Par une formule explicite :</strong> u<sub>n</sub> = f(n). Exemple : u<sub>n</sub> = 2n + 3</li>
    <li><strong>Par une relation de recurrence :</strong> u<sub>n+1</sub> = f(u<sub>n</sub>) avec u<sub>0</sub> donne</li>
  </ul>
  <h3>1.2 Sens de variation</h3>
  <p>Pour etudier le sens de variation d'une suite :</p>
  <ul>
    <li>Calculer u<sub>n+1</sub> - u<sub>n</sub> : si &gt; 0 la suite est croissante, si &lt; 0 elle est decroissante</li>
    <li>Ou etudier le signe de u<sub>n+1</sub>/u<sub>n</sub> - 1 (si tous les termes sont positifs)</li>
  </ul>
</div>

<div class="section">
  <h2>II. Suites arithmetiques</h2>
  <div class="def">
    <strong>Definition :</strong> (u<sub>n</sub>) est arithmetique de raison r si pour tout n : u<sub>n+1</sub> = u<sub>n</sub> + r
  </div>
  <div class="formule">u<sub>n</sub> = u<sub>0</sub> + n &times; r &nbsp;&nbsp;&nbsp; ou &nbsp;&nbsp;&nbsp; u<sub>n</sub> = u<sub>p</sub> + (n - p) &times; r</div>
  <div class="formule">S = u<sub>0</sub> + u<sub>1</sub> + ... + u<sub>n</sub> = (n + 1)(u<sub>0</sub> + u<sub>n</sub>) / 2</div>
  <div class="attention">
    <div class="attention-titre">&#9888; Formule pratique</div>
    <p>Somme des n premiers entiers : 1 + 2 + 3 + ... + n = n(n+1)/2</p>
  </div>
  <div class="exemple">
    <div class="exemple-titre">Exemple</div>
    <p>Soit (u<sub>n</sub>) arithmetique avec u<sub>0</sub> = 5 et r = 3.</p>
    <p>u<sub>n</sub> = 5 + 3n. Donc u<sub>10</sub> = 5 + 30 = 35</p>
    <p>S = u<sub>0</sub> + u<sub>1</sub> + ... + u<sub>10</sub> = 11 &times; (5 + 35)/2 = 11 &times; 20 = 220</p>
  </div>
</div>

<div class="section">
  <h2>III. Suites geometriques</h2>
  <div class="def">
    <strong>Definition :</strong> (u<sub>n</sub>) est geometrique de raison q (q &ne; 0) si pour tout n : u<sub>n+1</sub> = u<sub>n</sub> &times; q
  </div>
  <div class="formule">u<sub>n</sub> = u<sub>0</sub> &times; q<sup>n</sup> &nbsp;&nbsp;&nbsp; ou &nbsp;&nbsp;&nbsp; u<sub>n</sub> = u<sub>p</sub> &times; q<sup>(n-p)</sup></div>
  <div class="formule">S = u<sub>0</sub> + u<sub>1</sub> + ... + u<sub>n</sub> = u<sub>0</sub> &times; (1 - q<sup>n+1</sup>) / (1 - q) &nbsp;&nbsp; (q &ne; 1)</div>
  <div class="exemple">
    <div class="exemple-titre">Exemple</div>
    <p>Soit (u<sub>n</sub>) geometrique avec u<sub>0</sub> = 2 et q = 3.</p>
    <p>u<sub>n</sub> = 2 &times; 3<sup>n</sup>. Donc u<sub>4</sub> = 2 &times; 81 = 162</p>
    <p>S = 2 + 6 + 18 + 54 + 162 = 2 &times; (1 - 3<sup>5</sup>)/(1 - 3) = 2 &times; (-242)/(-2) = 242</p>
  </div>
</div>

<div class="section">
  <h2>IV. Limites de suites</h2>
  <h3>4.1 Limites des suites de reference</h3>
  <table>
    <tr><th>Suite</th><th>Limite quand n &rarr; +&infin;</th></tr>
    <tr><td>n<sup>k</sup> (k &gt; 0)</td><td>+&infin;</td></tr>
    <tr><td>1/n<sup>k</sup> (k &gt; 0)</td><td>0</td></tr>
    <tr><td>q<sup>n</sup> avec |q| &lt; 1</td><td>0</td></tr>
    <tr><td>q<sup>n</sup> avec q &gt; 1</td><td>+&infin;</td></tr>
    <tr><td>(-1)<sup>n</sup></td><td>pas de limite</td></tr>
  </table>
  <h3>4.2 Theoremes importants</h3>
  <div class="def">
    <strong>Theoreme des gendarmes :</strong> Si pour tout n &ge; n<sub>0</sub>, a<sub>n</sub> &le; u<sub>n</sub> &le; b<sub>n</sub> et si lim a<sub>n</sub> = lim b<sub>n</sub> = L, alors lim u<sub>n</sub> = L.
  </div>
  <div class="def">
    <strong>Convergence suite arithmetique :</strong> diverge toujours (vers +&infin; si r &gt; 0, -&infin; si r &lt; 0).<br/>
    <strong>Convergence suite geometrique :</strong> converge vers 0 si |q| &lt; 1, diverge sinon (si u<sub>0</sub> &ne; 0).
  </div>
</div>

<div class="section">
  <h2>V. Raisonnement par recurrence</h2>
  <div class="def">
    Pour montrer qu'une propriete P(n) est vraie pour tout n &ge; n<sub>0</sub> :<br/>
    <strong>1. Initialisation :</strong> verifier P(n<sub>0</sub>)<br/>
    <strong>2. Heredite :</strong> supposer P(n) vraie et montrer P(n+1)<br/>
    <strong>3. Conclusion :</strong> par recurrence, P(n) vraie pour tout n &ge; n<sub>0</sub>
  </div>
  <div class="exemple">
    <div class="exemple-titre">Exemple : Montrer que pour tout n &ge; 1, 1 + 2 + ... + n = n(n+1)/2</div>
    <p><strong>Init :</strong> Pour n = 1 : 1 = 1 &times; 2/2 = 1 &#9989;</p>
    <p><strong>Heredite :</strong> On suppose 1 + 2 + ... + n = n(n+1)/2.</p>
    <p>Alors 1 + 2 + ... + n + (n+1) = n(n+1)/2 + (n+1) = (n+1)(n/2 + 1) = (n+1)(n+2)/2 &#9989;</p>
    <p><strong>Conclusion :</strong> La propriete est vraie pour tout n &ge; 1.</p>
  </div>
</div>

<div class="exo">
  <div class="exo-titre">Exercice d'application</div>
  <p>Soit (u<sub>n</sub>) definie par u<sub>0</sub> = 1 et u<sub>n+1</sub> = 2u<sub>n</sub> + 1.</p>
  <p>1) Calculer u<sub>1</sub>, u<sub>2</sub>, u<sub>3</sub>.</p>
  <p>2) On pose v<sub>n</sub> = u<sub>n</sub> + 1. Montrer que (v<sub>n</sub>) est geometrique.</p>
  <p>3) En deduire u<sub>n</sub> en fonction de n.</p>
  <button class="btn-solution">Voir la solution</button>
  <div class="solution">
    <div class="sol-titre">Solution</div>
    <p>1) u<sub>1</sub> = 2(1) + 1 = 3 ; u<sub>2</sub> = 2(3) + 1 = 7 ; u<sub>3</sub> = 2(7) + 1 = 15</p>
    <p>2) v<sub>n+1</sub> = u<sub>n+1</sub> + 1 = 2u<sub>n</sub> + 1 + 1 = 2(u<sub>n</sub> + 1) = 2v<sub>n</sub><br/>
    Donc (v<sub>n</sub>) est geometrique de raison q = 2 et de premier terme v<sub>0</sub> = u<sub>0</sub> + 1 = 2.</p>
    <p>3) v<sub>n</sub> = 2 &times; 2<sup>n</sup> = 2<sup>n+1</sup>, donc u<sub>n</sub> = v<sub>n</sub> - 1 = <strong>2<sup>n+1</sup> - 1</strong></p>
  </div>
</div>

<div class="retenir">
  <h3>&#128218; A retenir</h3>
  <ul>
    <li>Suite arithmetique : u<sub>n+1</sub> = u<sub>n</sub> + r &rarr; u<sub>n</sub> = u<sub>0</sub> + nr</li>
    <li>Suite geometrique : u<sub>n+1</sub> = q &times; u<sub>n</sub> &rarr; u<sub>n</sub> = u<sub>0</sub> &times; q<sup>n</sup></li>
    <li>Convergence : arithmetique diverge, geometrique converge ssi |q| &lt; 1</li>
    <li>Recurrence = Initialisation + Heredite + Conclusion</li>
  </ul>
</div>`)
  },

  'nat-maths-tle-s1-limites': {
    titre: 'Limites et Continuite — Cours Complet',
    type: 'cours',
    html: cours('Limites de Fonctions et Continuite', 'Mathematiques', 'Terminale', 'S1', `
<div class="section">
  <h2>I. Limites d'une fonction en un point</h2>
  <div class="def">
    <strong>Definition :</strong> On dit que f(x) tend vers L quand x tend vers a (note lim<sub>x&rarr;a</sub> f(x) = L) si f(x) peut etre rendu aussi proche de L qu'on veut, pourvu que x soit suffisamment proche de a.
  </div>
  <h3>1.1 Limites a gauche et a droite</h3>
  <ul>
    <li><strong>Limite a gauche :</strong> lim<sub>x&rarr;a<sup>-</sup></sub> f(x) (x &lt; a)</li>
    <li><strong>Limite a droite :</strong> lim<sub>x&rarr;a<sup>+</sup></sub> f(x) (x &gt; a)</li>
    <li>La limite existe en a ssi les limites a gauche et a droite existent et sont egales.</li>
  </ul>
  <h3>1.2 Operations sur les limites</h3>
  <table>
    <tr><th>Operation</th><th>lim f = L</th><th>lim g = M</th><th>lim (f op g)</th></tr>
    <tr><td>Somme</td><td>L</td><td>M</td><td>L + M</td></tr>
    <tr><td>Produit</td><td>L</td><td>M</td><td>L &times; M</td></tr>
    <tr><td>Quotient</td><td>L</td><td>M &ne; 0</td><td>L / M</td></tr>
  </table>
</div>

<div class="section">
  <h2>II. Formes indeterminees</h2>
  <div class="attention">
    <div class="attention-titre">&#9888; Les 4 formes indeterminees</div>
    <p>+&infin; - &infin; &nbsp;|&nbsp; 0 &times; &infin; &nbsp;|&nbsp; 0/0 &nbsp;|&nbsp; &infin;/&infin;</p>
    <p>Dans ces cas, il faut transformer l'expression (factoriser, multiplier par le conjugue, etc.)</p>
  </div>
  <h3>2.1 Lever une indetermination</h3>
  <div class="exemple">
    <div class="exemple-titre">Exemple : lim<sub>x&rarr;+&infin;</sub> (3x&sup2; - x + 1)/(2x&sup2; + 5)</div>
    <p>Forme &infin;/&infin;. On factorise par le terme de plus haut degre :</p>
    <p>= x&sup2;(3 - 1/x + 1/x&sup2;) / x&sup2;(2 + 5/x&sup2;) = (3 - 1/x + 1/x&sup2;) / (2 + 5/x&sup2;)</p>
    <p>Quand x &rarr; +&infin; : = 3/2</p>
  </div>
  <h3>2.2 Regle de l'Hospital (admise)</h3>
  <div class="formule">Si lim f/g = 0/0 ou &infin;/&infin;, alors lim f/g = lim f'/g' (si cette derniere existe)</div>
</div>

<div class="section">
  <h2>III. Asymptotes</h2>
  <div class="def">
    <strong>Asymptote horizontale :</strong> si lim<sub>x&rarr;&plusmn;&infin;</sub> f(x) = L, alors y = L est asymptote horizontale.<br/>
    <strong>Asymptote verticale :</strong> si lim<sub>x&rarr;a</sub> f(x) = &plusmn;&infin;, alors x = a est asymptote verticale.<br/>
    <strong>Asymptote oblique :</strong> si lim<sub>x&rarr;&plusmn;&infin;</sub> [f(x) - (ax+b)] = 0, alors y = ax+b est asymptote oblique.
  </div>
</div>

<div class="section">
  <h2>IV. Continuite</h2>
  <div class="def">
    <strong>Definition :</strong> f est continue en a si lim<sub>x&rarr;a</sub> f(x) = f(a). f est continue sur [a,b] si elle est continue en tout point de [a,b].
  </div>
  <div class="formule">Theoreme des Valeurs Intermediaires (TVI) :<br/>Si f est continue sur [a,b] et k est entre f(a) et f(b), alors il existe c dans [a,b] tel que f(c) = k.</div>
  <div class="exemple">
    <div class="exemple-titre">Application du TVI</div>
    <p>Soit f(x) = x&sup3; - x - 1. f(1) = -1 &lt; 0 et f(2) = 5 &gt; 0.</p>
    <p>f est continue (polynome), donc par le TVI, il existe c &isin; ]1, 2[ tel que f(c) = 0.</p>
    <p>L'equation x&sup3; - x - 1 = 0 admet au moins une solution entre 1 et 2.</p>
  </div>
</div>

<div class="exo">
  <div class="exo-titre">Exercices</div>
  <p>1) Calculer lim<sub>x&rarr;1</sub> (x&sup2; - 1)/(x - 1)</p>
  <p>2) Determiner les asymptotes de f(x) = (2x + 1)/(x - 3)</p>
  <button class="btn-solution">Voir la solution</button>
  <div class="solution">
    <p>1) Forme 0/0. On factorise : (x&sup2;-1)/(x-1) = (x-1)(x+1)/(x-1) = x+1 &rarr; <strong>2</strong></p>
    <p>2) AV : x = 3 (denominateur = 0). AH : lim<sub>&plusmn;&infin;</sub> f = 2/1 = 2, donc y = 2.</p>
  </div>
</div>

<div class="retenir">
  <h3>&#128218; A retenir</h3>
  <ul>
    <li>4 formes indeterminees : +&infin;-&infin;, 0&times;&infin;, 0/0, &infin;/&infin;</li>
    <li>Factoriser par le terme de plus haut degre pour les polynomes</li>
    <li>TVI : fonction continue + changement de signe = existence d'une racine</li>
    <li>3 types d'asymptotes : horizontale (y=L), verticale (x=a), oblique (y=ax+b)</li>
  </ul>
</div>`)
  },

  'nat-maths-tle-s1-integrales': {
    titre: 'Integrales et Primitives — Cours Complet',
    type: 'cours',
    html: cours('Integrales et Primitives', 'Mathematiques', 'Terminale', 'S1', `
<div class="section">
  <h2>I. Primitives</h2>
  <div class="def">
    <strong>Definition :</strong> F est une primitive de f sur I si pour tout x de I : F'(x) = f(x). Si F est une primitive de f, alors toutes les primitives de f sont de la forme F(x) + C (C constante).
  </div>
  <h3>1.1 Tableau des primitives usuelles</h3>
  <table>
    <tr><th>f(x)</th><th>F(x) (primitive)</th></tr>
    <tr><td>k (constante)</td><td>kx</td></tr>
    <tr><td>x<sup>n</sup> (n &ne; -1)</td><td>x<sup>n+1</sup>/(n+1)</td></tr>
    <tr><td>1/x (x &gt; 0)</td><td>ln(x)</td></tr>
    <tr><td>e<sup>x</sup></td><td>e<sup>x</sup></td></tr>
    <tr><td>cos(x)</td><td>sin(x)</td></tr>
    <tr><td>sin(x)</td><td>-cos(x)</td></tr>
    <tr><td>1/cos&sup2;(x)</td><td>tan(x)</td></tr>
  </table>
</div>

<div class="section">
  <h2>II. Integrale definie</h2>
  <div class="formule">&int;<sub>a</sub><sup>b</sup> f(x) dx = F(b) - F(a) = [F(x)]<sub>a</sub><sup>b</sup></div>
  <h3>2.1 Proprietes</h3>
  <ul>
    <li><strong>Linearite :</strong> &int;(af + bg) = a&int;f + b&int;g</li>
    <li><strong>Relation de Chasles :</strong> &int;<sub>a</sub><sup>b</sup>f + &int;<sub>b</sub><sup>c</sup>f = &int;<sub>a</sub><sup>c</sup>f</li>
    <li><strong>Positivite :</strong> si f &ge; 0 sur [a,b] alors &int;<sub>a</sub><sup>b</sup>f &ge; 0</li>
    <li>&int;<sub>a</sub><sup>a</sup>f = 0 et &int;<sub>a</sub><sup>b</sup>f = -&int;<sub>b</sub><sup>a</sup>f</li>
  </ul>
  <div class="def">
    <strong>Interpretation geometrique :</strong> Si f &ge; 0 sur [a,b], alors &int;<sub>a</sub><sup>b</sup>f(x)dx represente l'aire sous la courbe de f entre a et b.
  </div>
</div>

<div class="section">
  <h2>III. Techniques d'integration</h2>
  <h3>3.1 Integration par parties</h3>
  <div class="formule">&int;<sub>a</sub><sup>b</sup> u'v = [uv]<sub>a</sub><sup>b</sup> - &int;<sub>a</sub><sup>b</sup> uv'</div>
  <div class="exemple">
    <div class="exemple-titre">Exemple : Calculer &int;<sub>0</sub><sup>1</sup> x &times; e<sup>x</sup> dx</div>
    <p>On pose u' = e<sup>x</sup> &rarr; u = e<sup>x</sup> et v = x &rarr; v' = 1</p>
    <p>&int;<sub>0</sub><sup>1</sup> xe<sup>x</sup>dx = [xe<sup>x</sup>]<sub>0</sub><sup>1</sup> - &int;<sub>0</sub><sup>1</sup> e<sup>x</sup>dx = e - [e<sup>x</sup>]<sub>0</sub><sup>1</sup> = e - (e - 1) = <strong>1</strong></p>
  </div>
  <h3>3.2 Changement de variable</h3>
  <div class="exemple">
    <div class="exemple-titre">Forme f'(x)/f(x)</div>
    <p>&int; f'(x)/f(x) dx = ln|f(x)| + C</p>
    <p>Exemple : &int; 2x/(x&sup2;+1) dx = ln(x&sup2;+1) + C</p>
  </div>
</div>

<div class="exo">
  <div class="exo-titre">Exercice</div>
  <p>1) Calculer &int;<sub>1</sub><sup>2</sup> (3x&sup2; - 2x + 1) dx</p>
  <p>2) Calculer l'aire entre la courbe y = x&sup2; et l'axe des abscisses sur [0, 3].</p>
  <button class="btn-solution">Voir la solution</button>
  <div class="solution">
    <p>1) Primitive : F(x) = x&sup3; - x&sup2; + x. F(2) - F(1) = (8-4+2) - (1-1+1) = 6 - 1 = <strong>5</strong></p>
    <p>2) Aire = &int;<sub>0</sub><sup>3</sup> x&sup2;dx = [x&sup3;/3]<sub>0</sub><sup>3</sup> = 27/3 - 0 = <strong>9 unites d'aire</strong></p>
  </div>
</div>

<div class="retenir">
  <h3>&#128218; A retenir</h3>
  <ul>
    <li>Primitive de x<sup>n</sup> = x<sup>n+1</sup>/(n+1), de e<sup>x</sup> = e<sup>x</sup>, de 1/x = ln|x|</li>
    <li>&int;<sub>a</sub><sup>b</sup> f = F(b) - F(a)</li>
    <li>IPP : &int;u'v = [uv] - &int;uv' (utile pour xe<sup>x</sup>, xln(x), etc.)</li>
    <li>Aire sous la courbe = integrale (si f &ge; 0)</li>
  </ul>
</div>`)
  },

  'nat-maths-tle-s1-complexes': {
    titre: 'Nombres Complexes — Cours Complet',
    type: 'cours',
    html: cours('Les Nombres Complexes', 'Mathematiques', 'Terminale', 'S1', `
<div class="section">
  <h2>I. L'ensemble C des nombres complexes</h2>
  <div class="def">
    <strong>Definition :</strong> Un nombre complexe z s'ecrit z = a + bi ou a,b &isin; R et i&sup2; = -1.<br/>
    a = Re(z) est la partie reelle, b = Im(z) est la partie imaginaire.
  </div>
  <h3>1.1 Operations</h3>
  <ul>
    <li><strong>Addition :</strong> (a+bi) + (c+di) = (a+c) + (b+d)i</li>
    <li><strong>Multiplication :</strong> (a+bi)(c+di) = (ac-bd) + (ad+bc)i</li>
    <li><strong>Conjugue :</strong> si z = a+bi, alors z&#772; = a-bi</li>
  </ul>
  <div class="formule">z &times; z&#772; = a&sup2; + b&sup2; = |z|&sup2;</div>
</div>

<div class="section">
  <h2>II. Module et argument</h2>
  <div class="formule">|z| = &radic;(a&sup2; + b&sup2;) &nbsp;&nbsp;&nbsp; arg(z) = &theta; tel que z = |z|(cos&theta; + i&times;sin&theta;)</div>
  <h3>Proprietes du module</h3>
  <ul>
    <li>|z<sub>1</sub> &times; z<sub>2</sub>| = |z<sub>1</sub>| &times; |z<sub>2</sub>|</li>
    <li>|z<sub>1</sub>/z<sub>2</sub>| = |z<sub>1</sub>|/|z<sub>2</sub>|</li>
    <li>|z<sup>n</sup>| = |z|<sup>n</sup></li>
  </ul>
  <h3>Proprietes de l'argument</h3>
  <ul>
    <li>arg(z<sub>1</sub>z<sub>2</sub>) = arg(z<sub>1</sub>) + arg(z<sub>2</sub>) [2&pi;]</li>
    <li>arg(z<sub>1</sub>/z<sub>2</sub>) = arg(z<sub>1</sub>) - arg(z<sub>2</sub>) [2&pi;]</li>
  </ul>
</div>

<div class="section">
  <h2>III. Forme exponentielle</h2>
  <div class="formule">z = |z| &times; e<sup>i&theta;</sup> &nbsp;&nbsp; ou &nbsp;&nbsp; e<sup>i&theta;</sup> = cos&theta; + i&times;sin&theta; &nbsp;&nbsp; (formule d'Euler)</div>
  <div class="exemple">
    <div class="exemple-titre">Exemple</div>
    <p>z = 1 + i. |z| = &radic;2, arg(z) = &pi;/4. Donc z = &radic;2 &times; e<sup>i&pi;/4</sup></p>
  </div>
</div>

<div class="section">
  <h2>IV. Equations dans C</h2>
  <h3>4.1 Equation du second degre</h3>
  <div class="formule">az&sup2; + bz + c = 0 &nbsp;&nbsp; &Delta; = b&sup2; - 4ac</div>
  <ul>
    <li>&Delta; &gt; 0 : deux solutions reelles z = (-b &plusmn; &radic;&Delta;)/(2a)</li>
    <li>&Delta; = 0 : solution double z = -b/(2a)</li>
    <li>&Delta; &lt; 0 : deux solutions complexes conjuguees z = (-b &plusmn; i&radic;|&Delta;|)/(2a)</li>
  </ul>
  <div class="exemple">
    <div class="exemple-titre">Exemple : z&sup2; + 2z + 5 = 0</div>
    <p>&Delta; = 4 - 20 = -16 &lt; 0. &radic;|&Delta;| = 4</p>
    <p>z = (-2 &plusmn; 4i)/2 = <strong>-1 + 2i</strong> ou <strong>-1 - 2i</strong></p>
  </div>
</div>

<div class="exo">
  <div class="exo-titre">Exercice</div>
  <p>1) Mettre sous forme algebrique z = (2+3i)(1-i).</p>
  <p>2) Calculer le module et l'argument de z = -1 + i&radic;3.</p>
  <p>3) Resoudre z&sup2; - 4z + 13 = 0 dans C.</p>
  <button class="btn-solution">Voir la solution</button>
  <div class="solution">
    <p>1) z = 2-2i+3i-3i&sup2; = 2+i+3 = <strong>5+i</strong></p>
    <p>2) |z| = &radic;(1+3) = 2. arg(z) = &pi; - &pi;/3 = <strong>2&pi;/3</strong></p>
    <p>3) &Delta; = 16-52 = -36. z = (4 &plusmn; 6i)/2 = <strong>2+3i</strong> ou <strong>2-3i</strong></p>
  </div>
</div>`)
  },

  // ┌─────────────────────────────────────────────────────────────────────────┐
  // │  MATHEMATIQUES — TERMINALE S2                                          │
  // └─────────────────────────────────────────────────────────────────────────┘

  'nat-maths-tle-s2-stats': {
    titre: 'Statistiques et Probabilites — Cours Complet',
    type: 'cours',
    html: cours('Statistiques et Probabilites', 'Mathematiques', 'Terminale', 'S2', `
<div class="section">
  <h2>I. Statistiques descriptives</h2>
  <h3>1.1 Parametres de position</h3>
  <div class="formule">Moyenne : x&#772; = (1/n) &times; &Sigma; x<sub>i</sub>n<sub>i</sub> = &Sigma; x<sub>i</sub>f<sub>i</sub></div>
  <div class="def">
    <strong>Mediane :</strong> valeur qui partage la serie en deux parties egales (50% de chaque cote).<br/>
    <strong>Mode :</strong> valeur la plus frequente.
  </div>
  <h3>1.2 Parametres de dispersion</h3>
  <div class="formule">Variance : V = (1/n)&Sigma;n<sub>i</sub>(x<sub>i</sub> - x&#772;)&sup2; = (1/n)&Sigma;n<sub>i</sub>x<sub>i</sub>&sup2; - x&#772;&sup2;</div>
  <div class="formule">Ecart-type : &sigma; = &radic;V</div>
</div>

<div class="section">
  <h2>II. Probabilites</h2>
  <h3>2.1 Vocabulaire</h3>
  <ul>
    <li><strong>Experience aleatoire :</strong> experience dont on ne peut pas prevoir le resultat</li>
    <li><strong>Univers &Omega; :</strong> ensemble de tous les resultats possibles</li>
    <li><strong>Evenement :</strong> partie de &Omega;</li>
  </ul>
  <div class="formule">0 &le; P(A) &le; 1 &nbsp;&nbsp;&nbsp; P(&Omega;) = 1 &nbsp;&nbsp;&nbsp; P(A&#772;) = 1 - P(A)</div>
  <div class="formule">P(A &cup; B) = P(A) + P(B) - P(A &cap; B)</div>
  <h3>2.2 Probabilites conditionnelles</h3>
  <div class="formule">P(A|B) = P(A &cap; B) / P(B) &nbsp;&nbsp; (B non impossible)</div>
  <div class="formule">Formule des probabilites totales : P(A) = P(A|B)P(B) + P(A|B&#772;)P(B&#772;)</div>
</div>

<div class="section">
  <h2>III. Variables aleatoires</h2>
  <div class="def">
    <strong>Esperance :</strong> E(X) = &Sigma; x<sub>i</sub> &times; P(X = x<sub>i</sub>)<br/>
    <strong>Variance :</strong> V(X) = E(X&sup2;) - [E(X)]&sup2;
  </div>
  <h3>3.1 Loi binomiale</h3>
  <div class="formule">X suit B(n, p) : P(X = k) = C(n,k) &times; p<sup>k</sup> &times; (1-p)<sup>n-k</sup></div>
  <div class="formule">E(X) = np &nbsp;&nbsp;&nbsp; V(X) = np(1-p)</div>
  <div class="exemple">
    <div class="exemple-titre">Exemple</div>
    <p>On lance 10 fois un de equilibre. X = nombre de 6 obtenus. X suit B(10, 1/6).</p>
    <p>P(X = 2) = C(10,2) &times; (1/6)&sup2; &times; (5/6)<sup>8</sup> &asymp; 0,291</p>
    <p>E(X) = 10/6 &asymp; 1,67</p>
  </div>
</div>

<div class="exo">
  <div class="exo-titre">Exercice</div>
  <p>Dans un lycee, 60% des eleves pratiquent un sport (S) et 30% font partie d'un club culturel (C). 20% font les deux.</p>
  <p>1) Calculer P(S &cup; C). 2) Calculer P(C|S). 3) S et C sont-ils independants ?</p>
  <button class="btn-solution">Voir la solution</button>
  <div class="solution">
    <p>1) P(S&cup;C) = 0,6 + 0,3 - 0,2 = <strong>0,7</strong></p>
    <p>2) P(C|S) = P(C&cap;S)/P(S) = 0,2/0,6 = <strong>1/3 &asymp; 0,333</strong></p>
    <p>3) P(S)&times;P(C) = 0,6&times;0,3 = 0,18 &ne; 0,20 = P(S&cap;C). <strong>Non independants.</strong></p>
  </div>
</div>`)
  },

  // ┌─────────────────────────────────────────────────────────────────────────┐
  // │  PHYSIQUE-CHIMIE — TERMINALE S1                                        │
  // └─────────────────────────────────────────────────────────────────────────┘

  'nat-pc-tle-s1-mecanique': {
    titre: 'Mecanique de Newton — Cours Complet',
    type: 'cours',
    html: cours('Mecanique de Newton', 'Physique-Chimie', 'Terminale', 'S1', `
<div class="section">
  <h2>I. Les trois lois de Newton</h2>
  <h3>1.1 Premiere loi (Principe d'inertie)</h3>
  <div class="def">
    Dans un referentiel galileen, un corps isole (aucune force) ou pseudo-isole (somme des forces nulle) est en <strong>mouvement rectiligne uniforme</strong> (MRU) ou au repos.
  </div>
  <h3>1.2 Deuxieme loi (Principe fondamental de la dynamique)</h3>
  <div class="formule">&Sigma; F&#8407; = m &times; a&#8407;</div>
  <p>La somme des forces exterieures appliquees a un corps est egale au produit de sa masse par son acceleration.</p>
  <h3>1.3 Troisieme loi (Action-reaction)</h3>
  <div class="def">
    Si un corps A exerce une force F&#8407;<sub>A/B</sub> sur B, alors B exerce sur A une force F&#8407;<sub>B/A</sub> = -F&#8407;<sub>A/B</sub> (meme direction, meme intensite, sens oppose).
  </div>
</div>

<div class="section">
  <h2>II. Chute libre</h2>
  <div class="def">Un objet en chute libre n'est soumis qu'a son poids P&#8407; = m &times; g&#8407; (on neglige les frottements).</div>
  <div class="formule">a = g = 9,81 m/s&sup2; (au Senegal)</div>
  <h3>Equations horaires (chute libre verticale sans vitesse initiale)</h3>
  <table>
    <tr><th>Grandeur</th><th>Formule</th></tr>
    <tr><td>Acceleration</td><td>a = g</td></tr>
    <tr><td>Vitesse</td><td>v(t) = g &times; t</td></tr>
    <tr><td>Position</td><td>y(t) = &frac12; g t&sup2;</td></tr>
  </table>
  <div class="exemple">
    <div class="exemple-titre">Exemple</div>
    <p>Un objet est lache d'une hauteur de 20 m. Temps pour toucher le sol ?</p>
    <p>20 = &frac12; &times; 9,81 &times; t&sup2; &rarr; t&sup2; = 40/9,81 &rarr; t &asymp; <strong>2,02 s</strong></p>
    <p>Vitesse a l'arrivee : v = 9,81 &times; 2,02 &asymp; <strong>19,8 m/s</strong> soit 71 km/h</p>
  </div>
</div>

<div class="section">
  <h2>III. Mouvement d'un projectile</h2>
  <p>Lance avec une vitesse initiale v<sub>0</sub> et un angle &alpha; par rapport a l'horizontale :</p>
  <div class="formule">x(t) = v<sub>0</sub>cos(&alpha;) &times; t &nbsp;&nbsp;&nbsp; y(t) = v<sub>0</sub>sin(&alpha;) &times; t - &frac12;gt&sup2;</div>
  <p>La trajectoire est une <strong>parabole</strong>.</p>
  <div class="formule">Portee = v<sub>0</sub>&sup2; sin(2&alpha;) / g &nbsp;&nbsp;&nbsp; Hauteur max = v<sub>0</sub>&sup2; sin&sup2;(&alpha;) / (2g)</div>
</div>

<div class="section">
  <h2>IV. Travail et energie</h2>
  <div class="formule">W(F&#8407;) = F &times; d &times; cos(&alpha;) &nbsp;&nbsp; (en Joules)</div>
  <div class="formule">E<sub>c</sub> = &frac12;mv&sup2; &nbsp;&nbsp;&nbsp; E<sub>p</sub> = mgh &nbsp;&nbsp;&nbsp; E<sub>m</sub> = E<sub>c</sub> + E<sub>p</sub></div>
  <div class="def">
    <strong>Theoreme de l'energie cinetique :</strong> &Delta;E<sub>c</sub> = &Sigma;W(forces exterieures)<br/>
    <strong>Conservation de l'energie mecanique :</strong> si seules les forces conservatives travaillent, E<sub>m</sub> = constante.
  </div>
</div>

<div class="exo">
  <div class="exo-titre">Exercice</div>
  <p>Un corps de masse 2 kg glisse sur un plan incline de 30&deg; sans frottement.</p>
  <p>1) Calculer l'acceleration du corps. 2) Quelle est sa vitesse apres 3 s (depart arrete) ?</p>
  <button class="btn-solution">Voir la solution</button>
  <div class="solution">
    <p>1) Projection de &Sigma;F = ma sur l'axe du plan : mg sin(30&deg;) = ma</p>
    <p>a = g sin(30&deg;) = 9,81 &times; 0,5 = <strong>4,905 m/s&sup2;</strong></p>
    <p>2) v = at = 4,905 &times; 3 = <strong>14,7 m/s</strong></p>
  </div>
</div>`)
  },

  'nat-pc-tle-s1-ondes': {
    titre: 'Ondes Mecaniques et Lumineuses — Cours Complet',
    type: 'cours',
    html: cours('Les Ondes', 'Physique-Chimie', 'Terminale', 'S1', `
<div class="section">
  <h2>I. Generalites sur les ondes</h2>
  <div class="def">
    <strong>Onde :</strong> phenomene de propagation d'une perturbation sans transport de matiere.
  </div>
  <ul>
    <li><strong>Onde transversale :</strong> la perturbation est perpendiculaire a la direction de propagation (ex: corde)</li>
    <li><strong>Onde longitudinale :</strong> la perturbation est parallele a la propagation (ex: son)</li>
  </ul>
  <div class="formule">v = &lambda; / T = &lambda; &times; f &nbsp;&nbsp; ou &nbsp;&nbsp; v = d / &Delta;t</div>
  <p>v : celerite (m/s), &lambda; : longueur d'onde (m), T : periode (s), f : frequence (Hz)</p>
</div>

<div class="section">
  <h2>II. Son et acoustique</h2>
  <div class="formule">v<sub>son</sub> &asymp; 340 m/s dans l'air a 20&deg;C</div>
  <table>
    <tr><th>Grandeur</th><th>Plage audible</th></tr>
    <tr><td>Frequence</td><td>20 Hz a 20 000 Hz</td></tr>
    <tr><td>&lt; 20 Hz</td><td>Infrasons</td></tr>
    <tr><td>&gt; 20 kHz</td><td>Ultrasons</td></tr>
  </table>
  <div class="formule">Niveau sonore : L = 10 &times; log(I/I<sub>0</sub>) &nbsp;&nbsp; en dB &nbsp;&nbsp; (I<sub>0</sub> = 10<sup>-12</sup> W/m&sup2;)</div>
</div>

<div class="section">
  <h2>III. Lumiere et spectre electromagnetique</h2>
  <div class="formule">c = &lambda; &times; f = 3 &times; 10<sup>8</sup> m/s &nbsp;&nbsp; (vitesse de la lumiere dans le vide)</div>
  <p>Spectre visible : 400 nm (violet) a 800 nm (rouge)</p>
  <h3>Diffraction</h3>
  <div class="formule">&theta; = &lambda; / a &nbsp;&nbsp; (en radians, pour a la largeur de la fente)</div>
  <div class="attention">
    <div class="attention-titre">&#9888; Condition</div>
    <p>La diffraction est significative quand la taille de l'obstacle est du meme ordre que &lambda;.</p>
  </div>
</div>

<div class="exo">
  <div class="exo-titre">Exercice</div>
  <p>Un sonar emet un ultrason (f = 40 kHz) vers le fond marin. L'echo revient apres 0,6 s. Vitesse du son dans l'eau : 1500 m/s.</p>
  <p>1) Calculer la profondeur. 2) Calculer la longueur d'onde.</p>
  <button class="btn-solution">Voir la solution</button>
  <div class="solution">
    <p>1) L'onde fait l'aller-retour : d = v &times; t/2 = 1500 &times; 0,3 = <strong>450 m</strong></p>
    <p>2) &lambda; = v/f = 1500/40000 = <strong>0,0375 m = 3,75 cm</strong></p>
  </div>
</div>`)
  },

  // ┌─────────────────────────────────────────────────────────────────────────┐
  // │  SVT — TERMINALE S1                                                     │
  // └─────────────────────────────────────────────────────────────────────────┘

  'nat-svt-tle-s1-genetique': {
    titre: 'Genetique et Heredite — Cours Complet',
    type: 'cours',
    html: cours('Genetique et Heredite', 'SVT', 'Terminale', 'S1', `
<div class="section">
  <h2>I. Bases moleculaires de l'heredite</h2>
  <div class="def">
    <strong>ADN :</strong> Acide DesoxyriboNucleique, support de l'information genetique. Constitue d'une double helice de nucleotides (A-T, C-G).
  </div>
  <h3>1.1 Le gene</h3>
  <ul>
    <li>Un <strong>gene</strong> est un fragment d'ADN codant pour une proteine</li>
    <li>Un <strong>allele</strong> est une version d'un gene</li>
    <li>Le <strong>genotype</strong> est l'ensemble des alleles d'un individu</li>
    <li>Le <strong>phenotype</strong> est l'expression visible du genotype</li>
  </ul>
  <h3>1.2 Vocabulaire genetique</h3>
  <table>
    <tr><th>Terme</th><th>Definition</th></tr>
    <tr><td>Homozygote</td><td>Deux alleles identiques (AA ou aa)</td></tr>
    <tr><td>Heterozygote</td><td>Deux alleles differents (Aa)</td></tr>
    <tr><td>Dominant</td><td>Allele qui s'exprime chez l'heterozygote</td></tr>
    <tr><td>Recessif</td><td>Allele masque chez l'heterozygote</td></tr>
  </table>
</div>

<div class="section">
  <h2>II. Lois de Mendel</h2>
  <h3>2.1 Premiere loi : uniformite des hybrides F1</h3>
  <div class="def">
    Le croisement de deux individus de lignees pures differant par un seul caractere donne une F1 uniforme (tous identiques).
  </div>
  <h3>2.2 Deuxieme loi : segregation des alleles</h3>
  <div class="def">
    Les deux alleles d'un gene se separent lors de la formation des gametes. Chaque gamete ne contient qu'un seul allele de chaque gene.
  </div>
  <div class="exemple">
    <div class="exemple-titre">Exemple : Monohybridisme avec dominance</div>
    <p>Parents : AA (rouge) &times; aa (blanc)</p>
    <p>F1 : Aa (tous rouges) &rarr; 100% rouges</p>
    <p>F2 (F1 &times; F1) : AA, Aa, Aa, aa &rarr; <strong>3/4 rouges, 1/4 blancs</strong></p>
  </div>
</div>

<div class="section">
  <h2>III. Dihybridisme</h2>
  <div class="formule">Croisement AaBb &times; AaBb donne : 9/16 [AB] ; 3/16 [Ab] ; 3/16 [aB] ; 1/16 [ab]</div>
  <div class="attention">
    <div class="attention-titre">&#9888; Genes lies vs independants</div>
    <p>Si les genes sont sur des chromosomes differents : segregation independante (proportions 9:3:3:1).</p>
    <p>Si les genes sont lies (meme chromosome) : les proportions sont modifiees sauf crossing-over.</p>
  </div>
</div>

<div class="section">
  <h2>IV. Heredite liee au sexe</h2>
  <div class="def">
    Les genes portes par le chromosome X se transmettent differemment chez les garcons (XY) et les filles (XX).
    Un garcon XY n'a qu'un seul allele pour les genes du X &rarr; il exprime toujours l'allele present (hemizygote).
  </div>
  <div class="exemple">
    <div class="exemple-titre">Exemple : Daltonisme</div>
    <p>Gene recessif porte par X. Une femme X<sup>D</sup>X<sup>d</sup> est porteuse saine, un homme X<sup>d</sup>Y est daltonien.</p>
    <p>Croisement X<sup>D</sup>X<sup>d</sup> &times; X<sup>D</sup>Y : filles 50% porteuses, garcons 50% daltoniens.</p>
  </div>
</div>

<div class="exo">
  <div class="exo-titre">Exercice type BAC</div>
  <p>Chez une espece, la couleur du pelage est determinee par un gene autosomique. L'allele N (noir) domine l'allele b (blanc). On croise un male noir heterozygote avec une femelle blanche.</p>
  <p>1) Ecrire les genotypes des parents. 2) Faire l'echiquier de croisement. 3) Donner les proportions phenotypiques attendues.</p>
  <button class="btn-solution">Voir la solution</button>
  <div class="solution">
    <p>1) Male noir heterozygote : <strong>Nb</strong>. Femelle blanche : <strong>bb</strong>.</p>
    <p>2) Echiquier :</p>
    <table><tr><th></th><th>b</th><th>b</th></tr><tr><td><strong>N</strong></td><td>Nb</td><td>Nb</td></tr><tr><td><strong>b</strong></td><td>bb</td><td>bb</td></tr></table>
    <p>3) <strong>50% noirs (Nb)</strong> et <strong>50% blancs (bb)</strong> &rarr; proportion 1:1</p>
  </div>
</div>`)
  },

  // ┌─────────────────────────────────────────────────────────────────────────┐
  // │  PHILOSOPHIE — TERMINALE L                                              │
  // └─────────────────────────────────────────────────────────────────────────┘

  'nat-philo-tle-l-liberte': {
    titre: 'La Liberte — Cours Complet',
    type: 'cours',
    html: cours('La Liberte', 'Philosophie', 'Terminale', 'L', `
<div class="section">
  <h2>I. Qu'est-ce que la liberte ?</h2>
  <div class="def">
    <strong>Liberte :</strong> Capacite d'un sujet a agir selon sa propre volonte, sans contrainte exterieure ni interieure. La liberte suppose la possibilite de choix.
  </div>
  <h3>1.1 Les differentes formes de liberte</h3>
  <ul>
    <li><strong>Liberte physique :</strong> absence de contrainte corporelle (ne pas etre enchaine)</li>
    <li><strong>Liberte civile :</strong> droits garantis par la loi dans la societe</li>
    <li><strong>Liberte morale :</strong> capacite a agir selon la raison et la conscience</li>
    <li><strong>Libre arbitre :</strong> pouvoir de choisir entre le bien et le mal</li>
  </ul>
</div>

<div class="section">
  <h2>II. Les grands courants philosophiques</h2>
  <h3>2.1 Le determinisme</h3>
  <div class="def">
    Pour les <strong>deterministes</strong> (Spinoza), la liberte est une illusion. Nos choix sont determines par des causes anterieures (education, biologie, societe). "Les hommes se croient libres parce qu'ils sont conscients de leurs actions mais ignorants des causes qui les determinent."
  </div>
  <h3>2.2 L'existentialisme</h3>
  <div class="def">
    Pour <strong>Sartre</strong>, "l'existence precede l'essence" : l'homme n'a pas de nature predeterminee, il se definit par ses choix. "L'homme est condamne a etre libre." La liberte est absolue mais implique une <strong>responsabilite totale</strong>.
  </div>
  <h3>2.3 La liberte selon Kant</h3>
  <div class="def">
    Pour <strong>Kant</strong>, etre libre c'est obeir a la loi morale que l'on s'est soi-meme prescrite. L'<strong>autonomie</strong> = se donner a soi-meme sa propre loi. La liberte n'est pas faire ce qu'on veut, mais faire ce que la raison commande.
  </div>
  <h3>2.4 La liberte selon Rousseau</h3>
  <div class="def">
    Pour <strong>Rousseau</strong>, l'homme nait libre mais partout il est dans les fers. Le <strong>Contrat Social</strong> permet de retrouver une liberte civile : obeir a la loi qu'on s'est prescrite collectivement, c'est la liberte.
  </div>
</div>

<div class="section">
  <h2>III. Liberte et responsabilite</h2>
  <p>Si je suis libre, alors je suis <strong>responsable</strong> de mes actes. La liberte implique :</p>
  <ul>
    <li>Le devoir de rendre des comptes (responsabilite morale)</li>
    <li>L'angoisse du choix (Kierkegaard, Sartre)</li>
    <li>Le respect de la liberte d'autrui ("Ma liberte s'arrete ou commence celle des autres")</li>
  </ul>
</div>

<div class="section">
  <h2>IV. Methode de dissertation sur la liberte</h2>
  <div class="attention">
    <div class="attention-titre">Sujets types BAC</div>
    <ul>
      <li>"Etre libre, est-ce faire ce que l'on veut ?"</li>
      <li>"La liberte est-elle une illusion ?"</li>
      <li>"Peut-on etre libre sans etre responsable ?"</li>
    </ul>
  </div>
  <div class="exemple">
    <div class="exemple-titre">Plan type : "Etre libre, est-ce faire ce que l'on veut ?"</div>
    <p><strong>I. Oui, la liberte semble etre la possibilite de faire ce qu'on veut</strong><br/>
    - Liberte comme absence de contraintes (sens commun)<br/>
    - Le desir comme moteur de l'action libre</p>
    <p><strong>II. Non, faire ce qu'on veut n'est pas toujours etre libre</strong><br/>
    - On peut etre esclave de ses desirs (Spinoza)<br/>
    - La liberte totale aboutit au chaos (Hobbes)</p>
    <p><strong>III. La vraie liberte est l'autonomie rationnelle</strong><br/>
    - Etre libre c'est obeir a la raison (Kant)<br/>
    - La liberte s'exerce dans le cadre de la loi (Rousseau)</p>
  </div>
</div>`)
  },

  // ┌─────────────────────────────────────────────────────────────────────────┐
  // │  FRANCAIS — TERMINALE                                                   │
  // └─────────────────────────────────────────────────────────────────────────┘

  'nat-fr-tle-dissertation': {
    titre: 'Methodologie de la Dissertation — Cours Complet',
    type: 'cours',
    html: cours('La Dissertation Litteraire', 'Francais', 'Terminale', '', `
<div class="section">
  <h2>I. Comprendre le sujet</h2>
  <h3>1.1 Analyser les mots-cles</h3>
  <ul>
    <li><strong>Identifier la these :</strong> Quelle idee le sujet defend ou interroge ?</li>
    <li><strong>Reperer la consigne :</strong> "Discutez", "Commentez", "Dans quelle mesure..."</li>
    <li><strong>Definir les termes :</strong> chaque mot important doit etre defini</li>
  </ul>
  <h3>1.2 Types de sujets</h3>
  <table>
    <tr><th>Type</th><th>Plan adapte</th></tr>
    <tr><td>"Discutez cette affirmation"</td><td>These / Antithese / Synthese</td></tr>
    <tr><td>"Dans quelle mesure..."</td><td>These nuancee / Limites / Depassement</td></tr>
    <tr><td>"Pensez-vous que..."</td><td>Position argumentee en 3 parties</td></tr>
  </table>
</div>

<div class="section">
  <h2>II. Construire le plan</h2>
  <h3>2.1 Le plan dialectique (le plus courant au BAC)</h3>
  <ul>
    <li><strong>These :</strong> on defend l'idee du sujet avec 2-3 arguments + exemples</li>
    <li><strong>Antithese :</strong> on nuance ou contredit avec 2-3 arguments + exemples</li>
    <li><strong>Synthese :</strong> on depasse l'opposition en proposant une position originale</li>
  </ul>
  <div class="attention">
    <div class="attention-titre">&#9888; Erreurs a eviter</div>
    <ul>
      <li>Ne pas simplement dire "oui" puis "non" — chaque partie doit etre argumentee</li>
      <li>La synthese n'est PAS un resume des deux parties</li>
      <li>Chaque argument doit etre illustre par un exemple litteraire precis</li>
    </ul>
  </div>
</div>

<div class="section">
  <h2>III. Rediger l'introduction</h2>
  <div class="def">
    L'introduction comporte 4 etapes :<br/>
    <strong>1. Amorce :</strong> phrase d'accroche (citation, fait, question generale)<br/>
    <strong>2. Presentation du sujet :</strong> reformuler le sujet<br/>
    <strong>3. Problematique :</strong> la question que pose le sujet<br/>
    <strong>4. Annonce du plan :</strong> les 3 parties en une phrase
  </div>
  <div class="exemple">
    <div class="exemple-titre">Exemple d'introduction</div>
    <p><strong>Sujet :</strong> "La litterature peut-elle changer le monde ?"</p>
    <p><em>(Amorce)</em> Victor Hugo declarait que "le poete a une fonction serieuse" dans la societe. <em>(Sujet)</em> La question de la capacite de la litterature a transformer le reel se pose depuis l'Antiquite. <em>(Problematique)</em> Mais dans quelle mesure les mots peuvent-ils reellement agir sur le monde ? <em>(Plan)</em> Nous verrons d'abord que la litterature possede un pouvoir de denonciation, puis nous nuancerons cette capacite, avant de montrer que sa force reside dans la transformation des consciences.</p>
  </div>
</div>

<div class="section">
  <h2>IV. Rediger la conclusion</h2>
  <div class="def">
    La conclusion comporte 3 etapes :<br/>
    <strong>1. Bilan :</strong> reprendre les grandes idees de chaque partie<br/>
    <strong>2. Reponse :</strong> repondre clairement a la problematique<br/>
    <strong>3. Ouverture :</strong> elargir vers une question connexe
  </div>
</div>

<div class="section">
  <h2>V. Les connecteurs logiques</h2>
  <table>
    <tr><th>Fonction</th><th>Connecteurs</th></tr>
    <tr><td>Ajouter</td><td>De plus, en outre, par ailleurs, egalement</td></tr>
    <tr><td>Opposer</td><td>Cependant, toutefois, neanmoins, en revanche</td></tr>
    <tr><td>Illustrer</td><td>Par exemple, ainsi, notamment, tel que</td></tr>
    <tr><td>Conclure</td><td>En definitive, en somme, finalement, par consequent</td></tr>
    <tr><td>Causer</td><td>Car, en effet, puisque, parce que</td></tr>
  </table>
</div>`)
  },

  // ┌─────────────────────────────────────────────────────────────────────────┐
  // │  HISTOIRE-GEO — TERMINALE L                                            │
  // └─────────────────────────────────────────────────────────────────────────┘

  'nat-hg-tle-l-decolonisation': {
    titre: 'La Decolonisation en Afrique — Cours Complet',
    type: 'cours',
    html: cours('La Decolonisation en Afrique', 'Histoire-Geographie', 'Terminale', 'L', `
<div class="section">
  <h2>I. Le contexte de la decolonisation</h2>
  <h3>1.1 Facteurs internes</h3>
  <ul>
    <li>Montee des mouvements nationalistes africains</li>
    <li>Formation d'elites intellectuelles (Senghor, Nkrumah, Lumumba)</li>
    <li>Le mouvement de la <strong>Negritude</strong> (Senghor, Cesaire, Damas)</li>
    <li>Rejet de l'exploitation coloniale et des inegalites</li>
  </ul>
  <h3>1.2 Facteurs externes</h3>
  <ul>
    <li>Affaiblissement des puissances coloniales apres la 2nde Guerre mondiale</li>
    <li>Charte de l'ONU (1945) : droit des peuples a disposer d'eux-memes</li>
    <li>Pression des USA et de l'URSS (anticolonialistes pour des raisons differentes)</li>
    <li>Conference de Bandung (1955) : solidarite des peuples colonises</li>
  </ul>
</div>

<div class="section">
  <h2>II. L'independance du Senegal</h2>
  <div class="def">
    Le Senegal accede a l'independance le <strong>4 avril 1960</strong>. Leopold Sedar Senghor devient le premier president de la Republique du Senegal.
  </div>
  <h3>2.1 Les etapes</h3>
  <table>
    <tr><th>Date</th><th>Evenement</th></tr>
    <tr><td>1946</td><td>Senghor elu depute a l'Assemblee nationale francaise</td></tr>
    <tr><td>1958</td><td>Referendum : le Senegal dit OUI a la Communaute francaise</td></tr>
    <tr><td>1959</td><td>Federation du Mali (Senegal + Soudan francais)</td></tr>
    <tr><td>20 aout 1960</td><td>Eclatement de la Federation du Mali</td></tr>
    <tr><td>4 avril 1960</td><td>Independance du Senegal</td></tr>
  </table>
  <h3>2.2 Les acteurs</h3>
  <ul>
    <li><strong>L. S. Senghor :</strong> poete, homme d'Etat, premier president (1960-1980)</li>
    <li><strong>Mamadou Dia :</strong> president du Conseil (1960-1962)</li>
    <li><strong>Lamine Gueye :</strong> homme politique, depute a l'Assemblee nationale francaise</li>
  </ul>
</div>

<div class="section">
  <h2>III. Les differentes voies de decolonisation</h2>
  <table>
    <tr><th>Type</th><th>Caracteristiques</th><th>Exemples</th></tr>
    <tr><td>Pacifique / negociee</td><td>Transition par referendum, negociations</td><td>Senegal, Cote d'Ivoire, Tunisie</td></tr>
    <tr><td>Violente / armee</td><td>Guerre d'independance</td><td>Algerie (1954-62), Kenya (Mau Mau), Guinee-Bissau</td></tr>
    <tr><td>Mixte</td><td>Pressions + negociations + tensions</td><td>Cameroun, Madagascar</td></tr>
  </table>
</div>

<div class="section">
  <h2>IV. Defis post-independance</h2>
  <ul>
    <li><strong>Construction nationale :</strong> unifier des peuples divers dans des frontieres heritees de la colonisation</li>
    <li><strong>Developpement economique :</strong> dependance economique persistante (neocolonialisme)</li>
    <li><strong>Instabilite politique :</strong> coups d'Etat dans plusieurs pays (mais pas au Senegal)</li>
    <li><strong>Panafricanisme :</strong> creation de l'OUA en 1963 (devenue UA en 2002)</li>
  </ul>
</div>

<div class="exo">
  <div class="exo-titre">Sujet type BAC</div>
  <p>"La decolonisation en Afrique : un processus uniforme ou diversifie ?" Analysez en vous appuyant sur des exemples precis.</p>
  <button class="btn-solution">Voir la solution</button>
  <div class="solution">
    <p><strong>Plan suggere :</strong></p>
    <p>I. Un processus uniforme dans ses causes (exploitation coloniale, montee des nationalismes, contexte mondial favorable)</p>
    <p>II. Mais diversifie dans ses modalites (pacifique au Senegal, violente en Algerie, mixte au Cameroun)</p>
    <p>III. Et dans ses consequences (stabilite au Senegal, instabilite au Congo, modele ivoirien puis crise)</p>
  </div>
</div>`)
  },

  // ┌─────────────────────────────────────────────────────────────────────────┐
  // │  MATHEMATIQUES — 3EME (BFEM)                                           │
  // └─────────────────────────────────────────────────────────────────────────┘

  'nat-maths-3eme-thales': {
    titre: 'Theoreme de Thales — Cours Complet',
    type: 'cours',
    html: cours('Le Theoreme de Thales', 'Mathematiques', '3eme', '', `
<div class="section">
  <h2>I. Enonce du theoreme</h2>
  <div class="def">
    <strong>Theoreme de Thales :</strong> Soit un triangle ABC. Si M est un point de [AB] et N un point de [AC] tels que (MN) est parallele a (BC), alors :<br/>
    <strong>AM/AB = AN/AC = MN/BC</strong>
  </div>
  <div class="formule">Si (MN) // (BC) alors AM/AB = AN/AC = MN/BC</div>
  <div class="attention">
    <div class="attention-titre">&#9888; Attention a la configuration</div>
    <p>Il existe deux configurations : "papillon" (les droites se coupent entre les paralleles) et "triangle" (les droites se coupent a l'exterieur). Les proportions restent les memes.</p>
  </div>
</div>

<div class="section">
  <h2>II. Application directe — Calculer une longueur</h2>
  <div class="exemple">
    <div class="exemple-titre">Exemple</div>
    <p>Dans le triangle ABC, M &isin; [AB], N &isin; [AC], (MN) // (BC).</p>
    <p>AB = 6 cm, AM = 4 cm, AC = 9 cm. Calculer AN.</p>
    <p><strong>Solution :</strong> AM/AB = AN/AC &rarr; 4/6 = AN/9 &rarr; AN = 4 &times; 9 / 6 = <strong>6 cm</strong></p>
  </div>
</div>

<div class="section">
  <h2>III. Reciproque du theoreme de Thales</h2>
  <div class="def">
    Si dans un triangle ABC, M &isin; [AB] et N &isin; [AC] et si AM/AB = AN/AC, et si les points A, M, B d'une part et A, N, C d'autre part sont dans le meme ordre, alors <strong>(MN) // (BC)</strong>.
  </div>
  <div class="exemple">
    <div class="exemple-titre">Exemple</div>
    <p>AB = 8, AM = 4, AC = 10, AN = 5. A, M, B dans cet ordre et A, N, C dans cet ordre.</p>
    <p>AM/AB = 4/8 = 0,5 et AN/AC = 5/10 = 0,5. Les rapports sont egaux &rarr; <strong>(MN) // (BC)</strong></p>
  </div>
</div>

<div class="exo">
  <div class="exo-titre">Exercice type BFEM</div>
  <p>Dans un triangle RST, E &isin; [RS] et F &isin; [RT]. RE = 3 cm, ES = 5 cm, RF = 4,5 cm, FT = 7,5 cm.</p>
  <p>1) Calculer RE/RS et RF/RT. 2) (EF) est-elle parallele a (ST) ?</p>
  <button class="btn-solution">Voir la solution</button>
  <div class="solution">
    <p>1) RS = RE + ES = 3 + 5 = 8. RE/RS = 3/8 = 0,375</p>
    <p>RT = RF + FT = 4,5 + 7,5 = 12. RF/RT = 4,5/12 = 0,375</p>
    <p>2) RE/RS = RF/RT = 0,375 et les points sont dans le meme ordre. Par la reciproque de Thales, <strong>(EF) // (ST)</strong> &#9989;</p>
  </div>
</div>`)
  },

  'nat-maths-3eme-pythagore': {
    titre: 'Theoreme de Pythagore — Cours Complet',
    type: 'cours',
    html: cours('Le Theoreme de Pythagore', 'Mathematiques', '3eme', '', `
<div class="section">
  <h2>I. Enonce du theoreme</h2>
  <div class="def">
    <strong>Theoreme de Pythagore :</strong> Dans un triangle rectangle, le carre de l'hypotenuse est egal a la somme des carres des deux autres cotes.
  </div>
  <div class="formule">Si ABC est rectangle en C : AB&sup2; = AC&sup2; + BC&sup2;</div>
  <p>L'hypotenuse est le cote oppose a l'angle droit (le plus grand cote).</p>
</div>

<div class="section">
  <h2>II. Calculer une longueur</h2>
  <div class="exemple">
    <div class="exemple-titre">Exemple 1 : Calculer l'hypotenuse</div>
    <p>Triangle ABC rectangle en C avec AC = 3 cm et BC = 4 cm.</p>
    <p>AB&sup2; = 3&sup2; + 4&sup2; = 9 + 16 = 25 &rarr; AB = &radic;25 = <strong>5 cm</strong></p>
  </div>
  <div class="exemple">
    <div class="exemple-titre">Exemple 2 : Calculer un cote de l'angle droit</div>
    <p>Triangle rectangle en C avec AB = 13 cm et AC = 5 cm.</p>
    <p>BC&sup2; = AB&sup2; - AC&sup2; = 169 - 25 = 144 &rarr; BC = &radic;144 = <strong>12 cm</strong></p>
  </div>
</div>

<div class="section">
  <h2>III. Reciproque — Prouver qu'un triangle est rectangle</h2>
  <div class="def">
    Si dans un triangle ABC, AB&sup2; = AC&sup2; + BC&sup2; (ou le plus grand cote au carre = somme des carres des deux autres), alors le triangle est <strong>rectangle</strong> en C.
  </div>
  <div class="exemple">
    <div class="exemple-titre">Exemple</div>
    <p>Triangle EFG avec EF = 10, EG = 6, FG = 8.</p>
    <p>Plus grand cote : EF = 10. EF&sup2; = 100. EG&sup2; + FG&sup2; = 36 + 64 = 100.</p>
    <p>100 = 100 &rarr; le triangle est <strong>rectangle en G</strong>.</p>
  </div>
</div>

<div class="exo">
  <div class="exo-titre">Exercice type BFEM</div>
  <p>Un poteau de 8 m est soutenu par un hauban de 10 m fixe au sol.</p>
  <p>1) Calculer la distance entre le pied du poteau et le point de fixation au sol.</p>
  <p>2) On raccourcit le hauban a 9 m. Quelle est la nouvelle distance ?</p>
  <button class="btn-solution">Voir la solution</button>
  <div class="solution">
    <p>1) Le poteau, le sol et le hauban forment un triangle rectangle.</p>
    <p>d&sup2; = 10&sup2; - 8&sup2; = 100 - 64 = 36 &rarr; d = <strong>6 m</strong></p>
    <p>2) d&sup2; = 9&sup2; - 8&sup2; = 81 - 64 = 17 &rarr; d = &radic;17 &asymp; <strong>4,12 m</strong></p>
  </div>
</div>`)
  },

  // ┌─────────────────────────────────────────────────────────────────────────┐
  // │  MATHEMATIQUES — 6EME                                                   │
  // └─────────────────────────────────────────────────────────────────────────┘

  'nat-maths-6eme-fractions': {
    titre: 'Les Fractions — Cours Complet',
    type: 'cours',
    html: cours('Les Fractions', 'Mathematiques', '6eme', '', `
<div class="section">
  <h2>I. Qu'est-ce qu'une fraction ?</h2>
  <div class="def">
    Une <strong>fraction</strong> est le quotient de deux nombres entiers. On ecrit a/b ou a est le <strong>numerateur</strong> et b le <strong>denominateur</strong> (b &ne; 0).
  </div>
  <div class="exemple">
    <div class="exemple-titre">Exemples</div>
    <p>3/4 signifie "3 parts sur 4 parts egales" = 0,75</p>
    <p>1/2 signifie "la moitie" = 0,5</p>
    <p>5/5 = 1 (quand le numerateur est egal au denominateur, la fraction vaut 1)</p>
  </div>
</div>

<div class="section">
  <h2>II. Fractions egales</h2>
  <div class="formule">a/b = (a &times; k) / (b &times; k) &nbsp;&nbsp; (on multiplie en haut ET en bas par le meme nombre)</div>
  <div class="exemple">
    <div class="exemple-titre">Exemples</div>
    <p>1/2 = 2/4 = 3/6 = 4/8 = 5/10 (toutes ces fractions sont egales !)</p>
    <p>2/3 = 4/6 = 6/9 = 8/12</p>
  </div>
  <div class="def">
    <strong>Simplifier une fraction :</strong> diviser le numerateur et le denominateur par leur PGCD (plus grand diviseur commun).
  </div>
  <div class="exemple">
    <div class="exemple-titre">Exemple</div>
    <p>12/18 : PGCD(12, 18) = 6. Donc 12/18 = (12&div;6)/(18&div;6) = <strong>2/3</strong></p>
  </div>
</div>

<div class="section">
  <h2>III. Comparer des fractions</h2>
  <ul>
    <li><strong>Meme denominateur :</strong> comparer les numerateurs. 3/7 &lt; 5/7 car 3 &lt; 5</li>
    <li><strong>Meme numerateur :</strong> plus le denominateur est grand, plus la fraction est petite. 3/4 &gt; 3/5</li>
    <li><strong>Denominateurs differents :</strong> mettre au meme denominateur, puis comparer</li>
  </ul>
  <div class="exemple">
    <div class="exemple-titre">Comparer 2/3 et 3/4</div>
    <p>2/3 = 8/12 et 3/4 = 9/12. Comme 8 &lt; 9, on a <strong>2/3 &lt; 3/4</strong></p>
  </div>
</div>

<div class="section">
  <h2>IV. Addition et soustraction</h2>
  <div class="formule">a/b + c/b = (a + c) / b &nbsp;&nbsp; (meme denominateur : on additionne les numerateurs)</div>
  <div class="exemple">
    <div class="exemple-titre">Exemples</div>
    <p>2/5 + 1/5 = 3/5 &#9989;</p>
    <p>1/3 + 1/4 = 4/12 + 3/12 = 7/12 (on met d'abord au meme denominateur : 12)</p>
  </div>
</div>

<div class="exo">
  <div class="exo-titre">Exercices</div>
  <p>1) Simplifie : 15/20 et 24/36</p>
  <p>2) Calcule : 2/5 + 3/10</p>
  <p>3) Range dans l'ordre croissant : 1/2, 3/8, 5/6</p>
  <button class="btn-solution">Voir la solution</button>
  <div class="solution">
    <p>1) 15/20 = <strong>3/4</strong> (divise par 5) ; 24/36 = <strong>2/3</strong> (divise par 12)</p>
    <p>2) 2/5 = 4/10 ; 4/10 + 3/10 = <strong>7/10</strong></p>
    <p>3) 1/2 = 12/24, 3/8 = 9/24, 5/6 = 20/24. Ordre : <strong>3/8 &lt; 1/2 &lt; 5/6</strong></p>
  </div>
</div>`)
  },

  // ┌─────────────────────────────────────────────────────────────────────────┐
  // │  PHYSIQUE-CHIMIE — 3EME                                                │
  // └─────────────────────────────────────────────────────────────────────────┘

  'nat-pc-3eme-electricite': {
    titre: 'L\'Electricite — Cours Complet',
    type: 'cours',
    html: cours('Electricite : Tension, Intensite et Resistance', 'Physique-Chimie', '3eme', '', `
<div class="section">
  <h2>I. Grandeurs electriques</h2>
  <table>
    <tr><th>Grandeur</th><th>Symbole</th><th>Unite</th><th>Appareil de mesure</th></tr>
    <tr><td>Tension</td><td>U</td><td>Volt (V)</td><td>Voltmetre (en derivation)</td></tr>
    <tr><td>Intensite</td><td>I</td><td>Ampere (A)</td><td>Amperemetre (en serie)</td></tr>
    <tr><td>Resistance</td><td>R</td><td>Ohm (&Omega;)</td><td>Ohmmetre</td></tr>
  </table>
</div>

<div class="section">
  <h2>II. Loi d'Ohm</h2>
  <div class="formule">U = R &times; I</div>
  <p>U en Volts, R en Ohms, I en Amperes.</p>
  <div class="exemple">
    <div class="exemple-titre">Exemple</div>
    <p>Une resistance de 100 &Omega; est traversee par un courant de 0,2 A.</p>
    <p>U = 100 &times; 0,2 = <strong>20 V</strong></p>
  </div>
</div>

<div class="section">
  <h2>III. Circuits serie et derivation</h2>
  <h3>3.1 Circuit serie</h3>
  <ul>
    <li>L'intensite est la <strong>meme</strong> partout : I = I<sub>1</sub> = I<sub>2</sub></li>
    <li>La tension se <strong>partage</strong> : U = U<sub>1</sub> + U<sub>2</sub></li>
  </ul>
  <h3>3.2 Circuit en derivation</h3>
  <ul>
    <li>La tension est la <strong>meme</strong> aux bornes de chaque branche : U = U<sub>1</sub> = U<sub>2</sub></li>
    <li>L'intensite se <strong>partage</strong> : I = I<sub>1</sub> + I<sub>2</sub></li>
  </ul>
</div>

<div class="section">
  <h2>IV. Puissance et energie electrique</h2>
  <div class="formule">P = U &times; I &nbsp;&nbsp; (en Watts)</div>
  <div class="formule">E = P &times; t &nbsp;&nbsp; (en Joules si t en secondes, en kWh si t en heures)</div>
  <div class="exemple">
    <div class="exemple-titre">Exemple</div>
    <p>Une lampe de 60 W fonctionne pendant 5 heures.</p>
    <p>E = 60 &times; 5 = 300 Wh = <strong>0,3 kWh</strong></p>
    <p>Si 1 kWh coute 112 FCFA (tarif SENELEC), le cout est 0,3 &times; 112 = <strong>33,6 FCFA</strong></p>
  </div>
</div>

<div class="exo">
  <div class="exo-titre">Exercice type BFEM</div>
  <p>Deux resistances R<sub>1</sub> = 20 &Omega; et R<sub>2</sub> = 30 &Omega; sont montees en serie sous une tension de 10 V.</p>
  <p>1) Calculer la resistance totale. 2) Calculer l'intensite du courant. 3) Calculer la tension aux bornes de chaque resistance.</p>
  <button class="btn-solution">Voir la solution</button>
  <div class="solution">
    <p>1) En serie : R = R<sub>1</sub> + R<sub>2</sub> = 20 + 30 = <strong>50 &Omega;</strong></p>
    <p>2) I = U/R = 10/50 = <strong>0,2 A</strong></p>
    <p>3) U<sub>1</sub> = R<sub>1</sub> &times; I = 20 &times; 0,2 = <strong>4 V</strong> ; U<sub>2</sub> = 30 &times; 0,2 = <strong>6 V</strong></p>
    <p>Verification : 4 + 6 = 10 V &#9989;</p>
  </div>
</div>`)
  },

  // ┌─────────────────────────────────────────────────────────────────────────┐
  // │  EXERCICES SUPPLEMENTAIRES (banques de questions enrichies)             │
  // └─────────────────────────────────────────────────────────────────────────┘

  'nat-exo-maths-tle-s1': {
    titre: 'Exercices Corriges — Maths Terminale S1',
    type: 'exercices',
    html: exercices('Exercices Corriges — Mathematiques Terminale S1', 'Mathematiques', 'Terminale', 'S1', `
<div class="exo-block">
  <span class="exo-num">Exercice 1 — Suites</span>
  <div class="exo-text">
    <p>Soit (u<sub>n</sub>) definie par u<sub>0</sub> = 2 et u<sub>n+1</sub> = 3u<sub>n</sub> - 4.</p>
    <p>a) Calculer u<sub>1</sub>, u<sub>2</sub>, u<sub>3</sub>.</p>
    <p>b) On pose v<sub>n</sub> = u<sub>n</sub> - 2. Montrer que (v<sub>n</sub>) est geometrique. Preciser la raison et le premier terme.</p>
    <p>c) Exprimer v<sub>n</sub> puis u<sub>n</sub> en fonction de n.</p>
    <p>d) Etudier la convergence de (u<sub>n</sub>).</p>
  </div>
  <button class="btn-sol">Voir la solution</button>
  <div class="solution">
    <div class="sol-titre">Solution</div>
    <p>a) u<sub>1</sub> = 3(2) - 4 = 2 ; u<sub>2</sub> = 3(2) - 4 = 2 ; u<sub>3</sub> = 2. La suite est constante !</p>
    <p>b) v<sub>n+1</sub> = u<sub>n+1</sub> - 2 = 3u<sub>n</sub> - 4 - 2 = 3(u<sub>n</sub> - 2) = 3v<sub>n</sub>. Geometrique de raison q = 3, premier terme v<sub>0</sub> = u<sub>0</sub> - 2 = 0.</p>
    <p>c) v<sub>n</sub> = 0 &times; 3<sup>n</sup> = 0 pour tout n. Donc u<sub>n</sub> = v<sub>n</sub> + 2 = <strong>2 pour tout n</strong>.</p>
    <p>d) La suite converge vers 2 (elle est constante).</p>
  </div>
</div>

<div class="exo-block">
  <span class="exo-num">Exercice 2 — Limites</span>
  <div class="exo-text">
    <p>Calculer les limites suivantes :</p>
    <p>a) lim<sub>x&rarr;+&infin;</sub> (2x&sup3; - x + 5) / (x&sup3; + 3x&sup2;)</p>
    <p>b) lim<sub>x&rarr;0</sub> sin(3x) / x</p>
    <p>c) lim<sub>x&rarr;+&infin;</sub> (&radic;(x&sup2;+1) - x)</p>
  </div>
  <button class="btn-sol">Voir la solution</button>
  <div class="solution">
    <div class="sol-titre">Solution</div>
    <p>a) On factorise par x&sup3; : = (2 - 1/x&sup2; + 5/x&sup3;) / (1 + 3/x) &rarr; <strong>2</strong></p>
    <p>b) lim sin(3x)/x = lim 3 &times; sin(3x)/(3x) = 3 &times; 1 = <strong>3</strong></p>
    <p>c) On multiplie par le conjugue : (&radic;(x&sup2;+1)-x)(&radic;(x&sup2;+1)+x) / (&radic;(x&sup2;+1)+x) = 1/(&radic;(x&sup2;+1)+x) &rarr; <strong>0</strong></p>
  </div>
</div>

<div class="exo-block">
  <span class="exo-num">Exercice 3 — Integrales</span>
  <div class="exo-text">
    <p>a) Calculer &int;<sub>0</sub><sup>1</sup> (2x + e<sup>x</sup>) dx</p>
    <p>b) Calculer &int;<sub>1</sub><sup>e</sup> (1/x + x) dx</p>
    <p>c) Calculer par integration par parties : &int;<sub>0</sub><sup>1</sup> x &times; e<sup>2x</sup> dx</p>
  </div>
  <button class="btn-sol">Voir la solution</button>
  <div class="solution">
    <div class="sol-titre">Solution</div>
    <p>a) [x&sup2; + e<sup>x</sup>]<sub>0</sub><sup>1</sup> = (1 + e) - (0 + 1) = <strong>e</strong> &asymp; 2,718</p>
    <p>b) [ln(x) + x&sup2;/2]<sub>1</sub><sup>e</sup> = (1 + e&sup2;/2) - (0 + 1/2) = <strong>1/2 + e&sup2;/2</strong> &asymp; 4,19</p>
    <p>c) IPP : u' = e<sup>2x</sup> &rarr; u = e<sup>2x</sup>/2 ; v = x &rarr; v' = 1</p>
    <p>= [xe<sup>2x</sup>/2]<sub>0</sub><sup>1</sup> - &int;<sub>0</sub><sup>1</sup> e<sup>2x</sup>/2 dx = e&sup2;/2 - [e<sup>2x</sup>/4]<sub>0</sub><sup>1</sup> = e&sup2;/2 - e&sup2;/4 + 1/4 = <strong>(e&sup2; + 1)/4</strong> &asymp; 2,10</p>
  </div>
</div>

<div class="exo-block">
  <span class="exo-num">Exercice 4 — Nombres complexes</span>
  <div class="exo-text">
    <p>a) Mettre sous forme algebrique : z = (3 + i) / (1 - 2i)</p>
    <p>b) Resoudre dans C : z&sup2; + 6z + 13 = 0</p>
    <p>c) Donner la forme exponentielle de z = -2 + 2i</p>
  </div>
  <button class="btn-sol">Voir la solution</button>
  <div class="solution">
    <div class="sol-titre">Solution</div>
    <p>a) z = (3+i)(1+2i) / ((1-2i)(1+2i)) = (3+6i+i+2i&sup2;) / (1+4) = (1+7i)/5 = <strong>1/5 + 7i/5</strong></p>
    <p>b) &Delta; = 36 - 52 = -16. &radic;|&Delta;| = 4. z = (-6 &plusmn; 4i)/2 = <strong>-3 + 2i</strong> ou <strong>-3 - 2i</strong></p>
    <p>c) |z| = &radic;(4+4) = 2&radic;2. arg(z) = &pi; - &pi;/4 = 3&pi;/4. z = <strong>2&radic;2 &times; e<sup>i3&pi;/4</sup></strong></p>
  </div>
</div>`)
  },

  'nat-exo-maths-3eme': {
    titre: 'Exercices Corriges — Maths 3eme BFEM',
    type: 'exercices',
    html: exercices('Exercices Corriges — Mathematiques 3eme', 'Mathematiques', '3eme', '', `
<div class="exo-block">
  <span class="exo-num">Exercice 1 — Pythagore</span>
  <div class="exo-text">
    <p>Un terrain rectangulaire ABCD a pour longueur AB = 12 m et largeur BC = 5 m.</p>
    <p>a) Calculer la diagonale AC.</p>
    <p>b) Le proprietaire veut installer une cloture le long de la diagonale. Quel sera le cout si 1 m de cloture coute 2 500 FCFA ?</p>
  </div>
  <button class="btn-sol">Voir la solution</button>
  <div class="solution">
    <div class="sol-titre">Solution</div>
    <p>a) Le rectangle a un angle droit en B. AC&sup2; = AB&sup2; + BC&sup2; = 144 + 25 = 169. AC = <strong>13 m</strong></p>
    <p>b) Cout = 13 &times; 2500 = <strong>32 500 FCFA</strong></p>
  </div>
</div>

<div class="exo-block">
  <span class="exo-num">Exercice 2 — Thales</span>
  <div class="exo-text">
    <p>Pour mesurer la hauteur d'un baobab, Mamadou plante un baton vertical de 1,5 m. Le baton projette une ombre de 2 m et l'arbre projette une ombre de 16 m.</p>
    <p>Calculer la hauteur du baobab.</p>
  </div>
  <button class="btn-sol">Voir la solution</button>
  <div class="solution">
    <div class="sol-titre">Solution</div>
    <p>Les rayons du soleil sont paralleles, on peut appliquer Thales :</p>
    <p>H/1,5 = 16/2 &rarr; H = 1,5 &times; 16/2 = <strong>12 m</strong></p>
  </div>
</div>

<div class="exo-block">
  <span class="exo-num">Exercice 3 — Fonctions affines</span>
  <div class="exo-text">
    <p>Un artisan fabrique des masques en bois. Le cout total de fabrication est C(x) = 500x + 8000 FCFA pour x masques, et il les vend 1200 FCFA piece.</p>
    <p>a) Exprimer la recette R(x). b) Exprimer le benefice B(x). c) A partir de combien de masques est-il rentable ?</p>
  </div>
  <button class="btn-sol">Voir la solution</button>
  <div class="solution">
    <div class="sol-titre">Solution</div>
    <p>a) R(x) = 1200x</p>
    <p>b) B(x) = R(x) - C(x) = 1200x - 500x - 8000 = <strong>700x - 8000</strong></p>
    <p>c) B(x) &gt; 0 &rarr; 700x &gt; 8000 &rarr; x &gt; 11,4. Il faut vendre au minimum <strong>12 masques</strong>.</p>
  </div>
</div>

<div class="exo-block">
  <span class="exo-num">Exercice 4 — Equations</span>
  <div class="exo-text">
    <p>Resoudre les equations suivantes :</p>
    <p>a) 3x - 7 = 2x + 5</p>
    <p>b) (2x-1)(x+3) = 0</p>
    <p>c) x&sup2; - 5x + 6 = 0</p>
  </div>
  <button class="btn-sol">Voir la solution</button>
  <div class="solution">
    <div class="sol-titre">Solution</div>
    <p>a) 3x - 2x = 5 + 7 &rarr; <strong>x = 12</strong></p>
    <p>b) Produit nul : 2x-1 = 0 ou x+3 = 0 &rarr; <strong>x = 1/2 ou x = -3</strong></p>
    <p>c) &Delta; = 25-24 = 1. x = (5&plusmn;1)/2 &rarr; <strong>x = 3 ou x = 2</strong></p>
  </div>
</div>`)
  },

  // ┌─────────────────────────────────────────────────────────────────────────┐
  // │  MATHS — 2NDE                                                          │
  // └─────────────────────────────────────────────────────────────────────────┘

  'nat-maths-2nde-fonctions': {
    titre: 'Les Fonctions — Cours Complet',
    type: 'cours',
    html: cours('Generalites sur les Fonctions', 'Mathematiques', '2nde', '', `
<div class="section">
  <h2>I. Notion de fonction</h2>
  <div class="def">
    <strong>Definition :</strong> Une fonction f associe a chaque nombre x de son ensemble de definition D<sub>f</sub> un unique nombre reel f(x), appele image de x par f.
  </div>
  <ul>
    <li>x est l'<strong>antecedent</strong> (variable)</li>
    <li>f(x) est l'<strong>image</strong> de x</li>
    <li>D<sub>f</sub> est l'<strong>ensemble de definition</strong> (valeurs autorisees de x)</li>
  </ul>
  <div class="exemple">
    <div class="exemple-titre">Exemple</div>
    <p>f(x) = 2x&sup2; - 3x + 1. D<sub>f</sub> = R (tout reel est autorise).</p>
    <p>f(0) = 1, f(1) = 0, f(-1) = 6.</p>
  </div>
</div>

<div class="section">
  <h2>II. Courbe representative</h2>
  <div class="def">
    La courbe representative de f est l'ensemble des points M(x; f(x)) du plan. On la note C<sub>f</sub>.
  </div>
  <ul>
    <li>Un point M(a; b) est sur C<sub>f</sub> si et seulement si f(a) = b</li>
    <li>Lire graphiquement : image &rarr; tracer la verticale ; antecedent &rarr; tracer l'horizontale</li>
  </ul>
</div>

<div class="section">
  <h2>III. Variations d'une fonction</h2>
  <div class="def">
    f est <strong>croissante</strong> sur [a,b] si : pour tous x<sub>1</sub>, x<sub>2</sub> dans [a,b], x<sub>1</sub> &lt; x<sub>2</sub> &rArr; f(x<sub>1</sub>) &le; f(x<sub>2</sub>).<br/>
    f est <strong>decroissante</strong> sur [a,b] si : x<sub>1</sub> &lt; x<sub>2</sub> &rArr; f(x<sub>1</sub>) &ge; f(x<sub>2</sub>).
  </div>
  <h3>Tableau de variations</h3>
  <p>On resume les intervalles de croissance et decroissance dans un tableau avec des fleches.</p>
</div>

<div class="section">
  <h2>IV. Fonctions de reference</h2>
  <table>
    <tr><th>Fonction</th><th>Formule</th><th>Variations</th></tr>
    <tr><td>Affine</td><td>f(x) = ax + b</td><td>Croissante si a &gt; 0, decroissante si a &lt; 0</td></tr>
    <tr><td>Carre</td><td>f(x) = x&sup2;</td><td>Decroissante sur ]-&infin;;0], croissante sur [0;+&infin;[</td></tr>
    <tr><td>Inverse</td><td>f(x) = 1/x</td><td>Decroissante sur ]-&infin;;0[ et ]0;+&infin;[</td></tr>
    <tr><td>Racine</td><td>f(x) = &radic;x</td><td>Croissante sur [0;+&infin;[</td></tr>
    <tr><td>Valeur absolue</td><td>f(x) = |x|</td><td>Decroissante puis croissante (minimum en 0)</td></tr>
  </table>
</div>

<div class="exo">
  <div class="exo-titre">Exercice</div>
  <p>Soit f(x) = x&sup2; - 4x + 3.</p>
  <p>1) Calculer f(0), f(1), f(2), f(3), f(4). 2) Factoriser f(x). 3) Resoudre f(x) = 0.</p>
  <button class="btn-solution">Voir la solution</button>
  <div class="solution">
    <p>1) f(0)=3, f(1)=0, f(2)=-1, f(3)=0, f(4)=3</p>
    <p>2) f(x) = (x-1)(x-3)</p>
    <p>3) f(x)=0 &rarr; <strong>x=1 ou x=3</strong></p>
  </div>
</div>`)
  },

  // ┌─────────────────────────────────────────────────────────────────────────┐
  // │  SVT — 3EME                                                            │
  // └─────────────────────────────────────────────────────────────────────────┘

  'nat-svt-3eme-reproduction': {
    titre: 'La Reproduction Humaine — Cours Complet',
    type: 'cours',
    html: cours('La Reproduction Humaine', 'SVT', '3eme', '', `
<div class="section">
  <h2>I. Les appareils reproducteurs</h2>
  <h3>1.1 Appareil reproducteur masculin</h3>
  <ul>
    <li><strong>Testicules :</strong> produisent les spermatozoides (cellules reproductrices males) et la testosterone</li>
    <li><strong>Epididymes :</strong> stockage et maturation des spermatozoides</li>
    <li><strong>Canaux deferents :</strong> transport des spermatozoides</li>
    <li><strong>Prostate :</strong> secrete le liquide prostatique</li>
  </ul>
  <h3>1.2 Appareil reproducteur feminin</h3>
  <ul>
    <li><strong>Ovaires :</strong> produisent les ovules et les hormones (oestrogenes, progesterone)</li>
    <li><strong>Trompes de Fallope :</strong> lieu de la fecondation</li>
    <li><strong>Uterus :</strong> lieu de la nidation et du developpement de l'embryon</li>
  </ul>
</div>

<div class="section">
  <h2>II. Le cycle menstruel</h2>
  <div class="def">Le cycle menstruel dure en moyenne <strong>28 jours</strong> et comprend :</div>
  <table>
    <tr><th>Phase</th><th>Jours</th><th>Evenements</th></tr>
    <tr><td>Menstruation</td><td>J1 a J5</td><td>Elimination de la muqueuse uterine</td></tr>
    <tr><td>Phase folliculaire</td><td>J1 a J14</td><td>Un follicule murit dans l'ovaire</td></tr>
    <tr><td>Ovulation</td><td>J14</td><td>Liberation de l'ovule par l'ovaire</td></tr>
    <tr><td>Phase luteale</td><td>J14 a J28</td><td>Le corps jaune secrete la progesterone</td></tr>
  </table>
</div>

<div class="section">
  <h2>III. La fecondation</h2>
  <div class="def">
    La <strong>fecondation</strong> est la fusion d'un spermatozoide et d'un ovule. Elle a lieu dans la trompe de Fallope. Le resultat est une cellule-oeuf (zygote) a 46 chromosomes.
  </div>
  <div class="formule">23 chromosomes (ovule) + 23 chromosomes (spermatozoide) = 46 chromosomes (cellule-oeuf)</div>
</div>

<div class="section">
  <h2>IV. La grossesse</h2>
  <ul>
    <li><strong>Nidation :</strong> la cellule-oeuf s'implante dans la muqueuse uterine (J7 apres fecondation)</li>
    <li><strong>Embryon :</strong> de la fecondation a 8 semaines (formation des organes)</li>
    <li><strong>Foetus :</strong> de 8 semaines a la naissance (croissance et maturation)</li>
    <li><strong>Placenta :</strong> organe d'echanges entre la mere et le foetus</li>
    <li><strong>Duree :</strong> 9 mois (environ 40 semaines)</li>
  </ul>
</div>

<div class="section">
  <h2>V. La contraception</h2>
  <table>
    <tr><th>Methode</th><th>Type</th><th>Action</th></tr>
    <tr><td>Pilule</td><td>Hormonale</td><td>Bloque l'ovulation</td></tr>
    <tr><td>Preservatif</td><td>Mecanique</td><td>Empeche la rencontre des gametes + protege des IST</td></tr>
    <tr><td>Sterilet (DIU)</td><td>Mecanique</td><td>Empeche la nidation</td></tr>
    <tr><td>Implant</td><td>Hormonale</td><td>Bloque l'ovulation pendant 3 ans</td></tr>
  </table>
</div>

<div class="exo">
  <div class="exo-titre">Exercice type BFEM</div>
  <p>Le cycle d'une femme commence le 5 mars.</p>
  <p>1) A quelle date aura lieu l'ovulation ? 2) Quelle est la periode de fertilite ? 3) Quand auront lieu les prochaines regles ?</p>
  <button class="btn-sol">Voir la solution</button>
  <div class="solution">
    <p>1) Ovulation au J14 : 5 + 13 = <strong>18 mars</strong></p>
    <p>2) Fertilite : J12 a J16, soit du <strong>16 au 20 mars</strong> (l'ovule vit 24h, les spermatozoides 3-5 jours)</p>
    <p>3) Prochaines regles au J28+1 = <strong>2 avril</strong></p>
  </div>
</div>`)
  },

}

// ── Fonctions utilitaires ─────────────────────────────────────────────────
export function getContenuNatif(id: string): ContenuNatif | undefined {
  return CONTENU_NATIF[id]
}

export function getAllContenuIds(): string[] {
  return Object.keys(CONTENU_NATIF)
}
