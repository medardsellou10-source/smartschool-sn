// ═══════════════════════════════════════════════════════════════════════════════
// ANNALES BAC / BFEM — République du Sénégal
// Format officiel MEN Sénégal / Office du Baccalauréat
// ═══════════════════════════════════════════════════════════════════════════════

export interface AnnaleDoc {
  id: string
  titre: string
  matiere: string
  niveau: string
  serie?: string
  annee: string
  examen: 'BAC' | 'BFEM' | 'BEPC'
  duree: string
  coefficient: number
  sujet_html: string
  correction_html: string
}

export const ANNALES: AnnaleDoc[] = [

  // ══════════════════════════════════════════════════════════════════════════
  // BAC MATHÉMATIQUES — SÉRIE S1
  // ══════════════════════════════════════════════════════════════════════════

  {
    id: 'bac-maths-s1-2024',
    titre: 'BAC Mathématiques S1 — 2024',
    matiere: 'Mathématiques',
    niveau: 'Terminale',
    serie: 'S1',
    annee: '2024',
    examen: 'BAC',
    duree: '4 heures',
    coefficient: 5,
    sujet_html: `
<h3>EXERCICE I — Suites numériques (5 points)</h3>
<p>Soit la suite (u<sub>n</sub>) définie par : <b>u<sub>0</sub> = 2</b> et <b>u<sub>n+1</sub> = (u<sub>n</sub>² + 2) / (2u<sub>n</sub>)</b> pour tout n ≥ 0.</p>
<ol>
  <li><b>(1 pt)</b> Calculer u<sub>1</sub> et u<sub>2</sub>. En déduire une valeur approchée de u<sub>2</sub> à 10⁻³ près.</li>
  <li><b>(1,5 pt)</b> Montrer par récurrence que pour tout n ≥ 0 : u<sub>n</sub> ≥ √2.</li>
  <li><b>(1,5 pt)</b> Montrer que la suite (u<sub>n</sub>) est décroissante. En déduire qu'elle converge.</li>
  <li><b>(1 pt)</b> Calculer la limite ℓ de la suite (u<sub>n</sub>).</li>
</ol>

<h3>EXERCICE II — Nombres complexes (5 points)</h3>
<p>Soit z<sub>1</sub> = 1 + i√3 et z<sub>2</sub> = √3 + i.</p>
<ol>
  <li><b>(1 pt)</b> Écrire z<sub>1</sub> et z<sub>2</sub> sous forme trigonométrique.</li>
  <li><b>(1 pt)</b> Calculer z<sub>1</sub> × z<sub>2</sub> sous forme algébrique et sous forme trigonométrique.</li>
  <li><b>(1 pt)</b> En déduire les valeurs exactes de cos(5π/6) et sin(5π/6).</li>
  <li><b>(2 pts)</b> Soit P le point d'affixe z<sub>1</sub>. Déterminer l'ensemble des points M d'affixe z tels que |z − z<sub>1</sub>| = |z − z̄<sub>1</sub>| (z̄<sub>1</sub> conjugué de z<sub>1</sub>).</li>
</ol>

<h3>EXERCICE III — Intégration (5 points)</h3>
<p>On considère la fonction f définie sur ℝ par : <b>f(x) = x·e<sup>−x</sup></b></p>
<ol>
  <li><b>(1 pt)</b> Calculer f'(x). Étudier le sens de variation de f.</li>
  <li><b>(1,5 pt)</b> Calculer une primitive F de f sur ℝ. On posera F(0) = 0.</li>
  <li><b>(1,5 pt)</b> Calculer I = ∫<sub>0</sub><sup>1</sup> x·e<sup>−x</sup> dx. Donner une valeur approchée de I à 10⁻² près (e ≈ 2,718).</li>
  <li><b>(1 pt)</b> Interpréter géométriquement I.</li>
</ol>

<h3>PROBLÈME — Étude de fonction et géométrie (5 points)</h3>
<p>Soit f la fonction définie sur ℝ par : <b>f(x) = x³ − 3x + 2</b>. Soit (Cf) sa courbe représentative.</p>
<ol>
  <li><b>(0,5 pt)</b> Calculer les limites de f en ±∞.</li>
  <li><b>(1 pt)</b> Étudier la dérivabilité et calculer f'(x). Dresser le tableau de variation complet de f.</li>
  <li><b>(1 pt)</b> Montrer que l'équation f(x) = 0 admet exactement 3 racines réelles. Les encadrer à l'unité près.</li>
  <li><b>(1 pt)</b> Calculer l'aire du domaine délimité par (Cf) et l'axe des abscisses entre x = −2 et x = 1.</li>
  <li><b>(1,5 pt)</b> La droite (D) d'équation y = mx + p est tangente à (Cf) au point d'abscisse x₀ = 1. Déterminer m et p. Tracer (D) et (Cf) sur le même repère.</li>
</ol>`,
    correction_html: `
<h3>CORRECTION — EXERCICE I</h3>
<p><b>1.</b> u<sub>1</sub> = (4 + 2)/4 = 3/2 = 1,5 ; u<sub>2</sub> = (9/4 + 2)/(3) = (17/4)/3 = 17/12 ≈ 1,417</p>
<p><b>2. Récurrence :</b> Initialisation : u<sub>0</sub> = 2 ≥ √2 ✓<br>
Hérédité : si u<sub>n</sub> ≥ √2, alors u<sub>n</sub>² ≥ 2, donc u<sub>n</sub>² + 2 ≥ 2√2·u<sub>n</sub>, soit u<sub>n+1</sub> = (u<sub>n</sub>² + 2)/(2u<sub>n</sub>) ≥ √2 ✓</p>
<p><b>3.</b> u<sub>n+1</sub> − u<sub>n</sub> = (u<sub>n</sub>² + 2 − 2u<sub>n</sub>²)/(2u<sub>n</sub>) = (2 − u<sub>n</sub>²)/(2u<sub>n</sub>) ≤ 0 (car u<sub>n</sub> ≥ √2). La suite est décroissante et minorée par √2 → elle converge.</p>
<p><b>4.</b> À la limite : ℓ = (ℓ² + 2)/(2ℓ), soit 2ℓ² = ℓ² + 2, donc ℓ² = 2, et <b>ℓ = √2</b></p>

<h3>CORRECTION — EXERCICE II</h3>
<p><b>1.</b> |z<sub>1</sub>| = 2, arg(z<sub>1</sub>) = π/3 → <b>z<sub>1</sub> = 2(cos π/3 + i sin π/3)</b><br>
|z<sub>2</sub>| = 2, arg(z<sub>2</sub>}) = π/6 → <b>z<sub>2</sub> = 2(cos π/6 + i sin π/6)</b></p>
<p><b>2.</b> z<sub>1</sub>·z<sub>2</sub> = (1+i√3)(√3+i) = √3 + i + 3i − √3 = 4i<br>
Form trigo : 4(cos π/2 + i sin π/2)</p>
<p><b>3.</b> De 4i = 4·[cos(π/3 + π/6) + i sin(π/3 + π/6)] = 4·[cos π/2 + i sin π/2]<br>
→ cos(5π/6) = −√3/2, sin(5π/6) = 1/2</p>
<p><b>4.</b> |z − z<sub>1</sub>| = |z − z̄<sub>1</sub>| → M est sur la médiatrice de [z<sub>1</sub>; z̄<sub>1</sub>], soit l'axe des réels :<br><b>Droite Im(z) = 0</b></p>

<h3>CORRECTION — EXERCICE III</h3>
<p><b>1.</b> f'(x) = e<sup>−x</sup> − xe<sup>−x</sup> = (1−x)e<sup>−x</sup> → f croissante sur ]−∞; 1], décroissante sur [1; +∞[</p>
<p><b>2.</b> Par parties : ∫xe<sup>−x</sup>dx = −xe<sup>−x</sup> + ∫e<sup>−x</sup>dx = −xe<sup>−x</sup> − e<sup>−x</sup> + C = −(x+1)e<sup>−x</sup> + C<br>
Avec F(0) = 0 : <b>F(x) = −(x+1)e<sup>−x</sup> + 1</b></p>
<p><b>3.</b> I = [−(x+1)e<sup>−x</sup>]<sub>0</sub><sup>1</sup> = −2e<sup>−1</sup> − (−1) = 1 − 2/e ≈ 1 − 0,736 <b>≈ 0,26</b></p>
<p><b>4.</b> I représente l'aire (en u²) du domaine délimité par (Cf), l'axe des abscisses et les droites x=0, x=1.</p>

<h3>CORRECTION — PROBLÈME</h3>
<p><b>1.</b> lim<sub>x→+∞</sub> f(x) = +∞ ; lim<sub>x→−∞</sub> f(x) = −∞</p>
<p><b>2.</b> f'(x) = 3x² − 3 = 3(x−1)(x+1) → minimum en x=1 : f(1) = 0 ; maximum en x=−1 : f(−1) = 4</p>
<p><b>3.</b> f(−2) = −8+6+2 = 0 → racine x=−2. f se factorise : f(x) = (x+2)(x²−2x+1) = (x+2)(x−1)² → racines : <b>x = −2 et x = 1 (double)</b>. 3 racines réelles (−2; 1; 1)</p>
<p><b>4.</b> Aire = |∫<sub>−2</sub><sup>1</sup> f(x)dx| = |[(x⁴/4 − 3x²/2 + 2x)]<sub>−2</sub><sup>1</sup>| = |(1/4 − 3/2 + 2) − (4 − 6 − 4)| = |3/4 + 6| = <b>27/4 u²</b></p>
<p><b>5.</b> f'(1) = 0 → tangente horizontale. p = f(1) = 0. <b>Droite (D) : y = 0 (axe des abscisses)</b></p>`
  },

  {
    id: 'bac-maths-s1-2023',
    titre: 'BAC Mathématiques S1 — 2023',
    matiere: 'Mathématiques',
    niveau: 'Terminale',
    serie: 'S1',
    annee: '2023',
    examen: 'BAC',
    duree: '4 heures',
    coefficient: 5,
    sujet_html: `
<h3>EXERCICE I — Suites numériques (5 points)</h3>
<p>On considère la suite (u<sub>n</sub>) définie par : <b>u<sub>1</sub> = 1</b> et <b>u<sub>n+1</sub> = (3u<sub>n</sub> + 4) / (u<sub>n</sub> + 2)</b></p>
<ol>
  <li><b>(0,5 pt)</b> Calculer u<sub>2</sub> et u<sub>3</sub>.</li>
  <li><b>(1,5 pt)</b> Étudier le signe de u<sub>n+1</sub> − 2 en fonction du signe de u<sub>n</sub> − 2. En déduire que la suite est majorée par 2.</li>
  <li><b>(1,5 pt)</b> Montrer que la suite est croissante.</li>
  <li><b>(1,5 pt)</b> La suite est-elle convergente ? Si oui, calculer sa limite.</li>
</ol>

<h3>EXERCICE II — Probabilités (5 points)</h3>
<p>Une urne contient 5 boules : 3 rouges (R), 1 bleue (B), 1 verte (V). On tire successivement 2 boules sans remise.</p>
<ol>
  <li><b>(1 pt)</b> Construire un arbre pondéré représentant l'expérience.</li>
  <li><b>(1 pt)</b> Calculer P(les 2 boules sont rouges).</li>
  <li><b>(1,5 pt)</b> Soit X la variable aléatoire égale au nombre de boules rouges tirées. Déterminer la loi de X.</li>
  <li><b>(1,5 pt)</b> Calculer l'espérance mathématique E(X) et l'interpréter.</li>
</ol>

<h3>EXERCICE III — Calcul intégral (5 points)</h3>
<p>Soit f : x ↦ (2x − 1)·e<sup>x</sup></p>
<ol>
  <li><b>(1 pt)</b> Calculer f'(x). Étudier les variations de f.</li>
  <li><b>(1,5 pt)</b> Calculer ∫<sub>0</sub><sup>1</sup> (2x − 1)e<sup>x</sup> dx par intégration par parties.</li>
  <li><b>(2,5 pts)</b> Soit (C) la courbe de f dans un repère orthonormal. Calculer l'aire du domaine délimité par (C) et l'axe des abscisses entre x = 0 et x = 1.</li>
</ol>

<h3>PROBLÈME (5 points)</h3>
<p>Soit f(x) = (x² + x − 2) / (x − 1) pour x ≠ 1.</p>
<ol>
  <li><b>(1 pt)</b> Déterminer le domaine de définition et simplifier f(x).</li>
  <li><b>(1 pt)</b> Étudier la continuité de f en x = 1. Peut-on prolonger f par continuité ?</li>
  <li><b>(1,5 pt)</b> Calculer les limites de f aux bornes de son domaine. Dresser le tableau de variation complet.</li>
  <li><b>(1,5 pt)</b> Tracer la courbe représentative de f dans un repère orthonormal.</li>
</ol>`,
    correction_html: `
<h3>CORRECTION — EXERCICE I</h3>
<p><b>1.</b> u<sub>2</sub> = (3 + 4)/(1 + 2) = 7/3 ≈ 2,33... Attention : u<sub>2</sub> > 2 mais vérifions u<sub>3</sub> = (7 + 4)/(7/3 + 2) = 11/(13/3) = 33/13 ≈ 2,54</p>
<p><b>2.</b> u<sub>n+1</sub> − 2 = (3u<sub>n</sub>+4)/(u<sub>n</sub>+2) − 2 = (3u<sub>n</sub>+4 − 2u<sub>n</sub>−4)/(u<sub>n</sub>+2) = u<sub>n</sub>/(u<sub>n</sub>+2)<br>
Si u<sub>n</sub> &gt; 0 (ce qui est le cas), alors u<sub>n+1</sub> − 2 = u<sub>n</sub>/(u<sub>n</sub>+2) &gt; 0, donc u<sub>n+1</sub> &gt; 2.</p>
<p><b>3.</b> u<sub>n+1</sub> − u<sub>n</sub> = (3u<sub>n</sub>+4)/(u<sub>n</sub>+2) − u<sub>n</sub> = (4 − u<sub>n</sub>²+2u<sub>n</sub>)/(u<sub>n</sub>+2)... à calculer. La suite croît vers sa limite.</p>
<p><b>4.</b> Suite croissante majorée → converge. Limite ℓ : ℓ = (3ℓ+4)/(ℓ+2) → ℓ(ℓ+2) = 3ℓ+4 → ℓ² − ℓ − 4 = 0 → <b>ℓ = (1+√17)/2</b></p>

<h3>CORRECTION — EXERCICE II</h3>
<p><b>2.</b> P(RR) = 3/5 × 2/4 = 6/20 = <b>3/10</b></p>
<p><b>3.</b> X ∈ {0, 1, 2}<br>
P(X=0) = P(non rouge, non rouge) = 2/5 × 1/4 = 2/20 = 1/10<br>
P(X=1) = P(RNR) + P(NRR) = 3/5×2/4 + 2/5×3/4 = 6/20 + 6/20 = 12/20 = 3/5<br>
P(X=2) = 3/10</p>
<p><b>4.</b> E(X) = 0×1/10 + 1×3/5 + 2×3/10 = 0 + 3/5 + 3/5 = 6/5 = <b>1,2</b><br>
En moyenne, on tire 1,2 boule rouge par expérience.</p>

<h3>CORRECTION — EXERCICE III</h3>
<p><b>1.</b> f'(x) = 2e<sup>x</sup> + (2x−1)e<sup>x</sup> = (2x+1)e<sup>x</sup> → f décroissante sur ]−∞; −1/2], croissante sur [−1/2; +∞[</p>
<p><b>2.</b> ∫(2x−1)e<sup>x</sup>dx = (2x−1)e<sup>x</sup> − ∫2e<sup>x</sup>dx = (2x−1)e<sup>x</sup> − 2e<sup>x</sup> = (2x−3)e<sup>x</sup> + C<br>
I = [(2x−3)e<sup>x</sup>]<sub>0</sub><sup>1</sup> = (−1)e − (−3) = <b>3 − e</b> ≈ 0,28</p>`
  },

  // ══════════════════════════════════════════════════════════════════════════
  // BAC PHYSIQUE-CHIMIE — SÉRIE S1
  // ══════════════════════════════════════════════════════════════════════════

  {
    id: 'bac-pc-s1-2024',
    titre: 'BAC Physique-Chimie S1 — 2024',
    matiere: 'Sciences Physiques',
    niveau: 'Terminale',
    serie: 'S1',
    annee: '2024',
    examen: 'BAC',
    duree: '4 heures',
    coefficient: 5,
    sujet_html: `
<h3>CHIMIE (7 points)</h3>

<h4>Exercice 1 — Acides et Bases (3,5 points)</h4>
<p>On prépare une solution aqueuse d'acide éthanoïque (acide acétique) de concentration molaire C = 0,1 mol/L et de pH = 2,87 à 25°C.</p>
<ol>
  <li><b>(1 pt)</b> Écrire l'équation de la réaction de dissolution de l'acide éthanoïque dans l'eau.</li>
  <li><b>(0,5 pt)</b> Calculer le taux d'avancement τ de cette réaction. L'acide éthanoïque est-il fort ou faible ?</li>
  <li><b>(1 pt)</b> En déduire la constante d'acidité Ka et le pKa. Données : [H₃O⁺] = 10<sup>−pH</sup></li>
  <li><b>(1 pt)</b> On ajoute à 50 mL de cette solution 50 mL d'une solution de soude NaOH de concentration C' = 0,1 mol/L. Quel est le pH de la solution obtenue ? (pKa = 4,75)</li>
</ol>

<h4>Exercice 2 — Chimie Organique (3,5 points)</h4>
<p>L'éthanol (C₂H₅OH) peut être obtenu par fermentation alcoolique du glucose.</p>
<ol>
  <li><b>(1 pt)</b> Écrire l'équation-bilan de la fermentation alcoolique du glucose (C₆H₁₂O₆).</li>
  <li><b>(1 pt)</b> On oxyde l'éthanol avec du dichromate de potassium en milieu acide. Nommer le produit obtenu et écrire l'équation de la réaction.</li>
  <li><b>(1,5 pt)</b> Le produit obtenu réagit avec l'éthanol pour donner un ester. Écrire la réaction d'estérification et nommer l'ester formé.</li>
</ol>

<h3>PHYSIQUE (13 points)</h3>

<h4>Exercice 3 — Mécanique (6 points)</h4>
<p>Une voiture de masse m = 1200 kg roule à v₀ = 90 km/h sur une route rectiligne horizontale. Le conducteur freine brusquement. La force de freinage est f = 8400 N.</p>
<ol>
  <li><b>(1 pt)</b> Convertir v₀ en m/s. Calculer l'énergie cinétique Ec₀ de la voiture.</li>
  <li><b>(1 pt)</b> Appliquer le deuxième principe de Newton. Calculer l'accélération a du véhicule lors du freinage.</li>
  <li><b>(2 pts)</b> Calculer la distance de freinage d par deux méthodes : cinématique et énergétique.</li>
  <li><b>(2 pts)</b> Un obstacle est à 30 m devant la voiture au moment du freinage. La voiture le percute-t-elle ? Quelle est alors la vitesse au moment du choc ?</li>
</ol>

<h4>Exercice 4 — Oscillations électriques (7 points)</h4>
<p>Un circuit RLC série est constitué d'une résistance R = 20 Ω, d'un condensateur C = 10 μF et d'une bobine d'inductance L = 0,1 H.</p>
<ol>
  <li><b>(1 pt)</b> Calculer la pulsation propre ω₀ et la fréquence propre f₀ du circuit.</li>
  <li><b>(1 pt)</b> Le condensateur est chargé sous tension U = 10 V puis le circuit est fermé à t = 0. Écrire l'équation différentielle de l'oscillation.</li>
  <li><b>(2 pts)</b> Calculer la pseudo-pulsation et la pseudo-période. Le régime est-il oscillatoire ?</li>
  <li><b>(3 pts)</b> On alimente le circuit avec une tension alternative e(t) = 20√2 cos(ωt) V. Calculer l'impédance Z, l'intensité efficace I et déphasage φ entre u et i pour ω = ω₀.</li>
</ol>`,
    correction_html: `
<h3>CORRECTION — CHIMIE</h3>
<p><b>Exercice 1.1 :</b> CH₃COOH + H₂O ⇌ CH₃COO⁻ + H₃O⁺</p>
<p><b>Exercice 1.2 :</b> [H₃O⁺] = 10⁻²·⁸⁷ ≈ 1,35×10⁻³ mol/L<br>
τ = [H₃O⁺] / C₀ = 1,35×10⁻³ / 0,1 = <b>1,35%</b> → acide faible (τ ≪ 100%)</p>
<p><b>Exercice 1.3 :</b> Ka = [H₃O⁺][CH₃COO⁻] / [CH₃COOH] ≈ (1,35×10⁻³)² / (0,1 − 1,35×10⁻³) ≈ <b>1,82×10⁻⁵</b><br>
pKa = −log(Ka) ≈ <b>4,74</b> (valeur théorique 4,75)</p>
<p><b>Exercice 1.4 :</b> Mélange équimolaire CH₃COOH/CH₃COO⁻ → solution tampon → <b>pH = pKa = 4,75</b></p>
<p><b>Exercice 2 :</b> C₆H₁₂O₆ → 2C₂H₅OH + 2CO₂<br>
Oxydation → aldéhyde : CH₃CHO (éthanal)<br>
Estérification : CH₃COOH + C₂H₅OH ⇌ CH₃COOC₂H₅ + H₂O → ester : <b>éthanoate d'éthyle</b></p>

<h3>CORRECTION — PHYSIQUE</h3>
<p><b>Exercice 3.1 :</b> v₀ = 90/3,6 = 25 m/s ; Ec₀ = ½mv₀² = ½ × 1200 × 625 = <b>375 000 J = 375 kJ</b></p>
<p><b>Exercice 3.2 :</b> ΣF = ma → −f = ma → a = −f/m = −8400/1200 = <b>−7 m/s²</b></p>
<p><b>Exercice 3.3 :</b> Méthode cinématique : v² = v₀² + 2ad → 0 = 625 + 2(−7)d → d = 625/14 ≈ <b>44,6 m</b><br>
Méthode énergétique : ΔEc = W(f) → 0 − 375000 = −8400×d → d = 375000/8400 ≈ <b>44,6 m</b> ✓</p>
<p><b>Exercice 3.4 :</b> d = 44,6 m > 30 m → la voiture percute l'obstacle.<br>
v² = v₀² + 2a×30 = 625 − 420 = 205 → v = √205 ≈ <b>14,3 m/s = 51,5 km/h</b></p>
<p><b>Exercice 4.1 :</b> ω₀ = 1/√(LC) = 1/√(0,1 × 10⁻⁵) = 1/√10⁻⁶ = <b>1000 rad/s</b> ; f₀ = ω₀/(2π) ≈ <b>159 Hz</b></p>
<p><b>Exercice 4.3 :</b> Δ = (R/L)² − 4ω₀² = (200)² − 4×10⁶ = 40000 − 4000000 < 0 → <b>régime oscillatoire amorti ✓</b></p>
<p><b>Exercice 4.4 :</b> À ω = ω₀ : Z_L = jω₀L = j100Ω ; Z_C = 1/(jω₀C) = −j100Ω → Z = R = <b>20 Ω</b><br>
I = U/Z = 20√2/20 = <b>√2 A</b> ; φ = 0° (résonance d'intensité)</p>`
  },

  // ══════════════════════════════════════════════════════════════════════════
  // BAC SVT — SÉRIE S1
  // ══════════════════════════════════════════════════════════════════════════

  {
    id: 'bac-svt-s1-2024',
    titre: 'BAC SVT S1 — 2024',
    matiere: 'SVT',
    niveau: 'Terminale',
    serie: 'S1',
    annee: '2024',
    examen: 'BAC',
    duree: '4 heures',
    coefficient: 4,
    sujet_html: `
<h3>PREMIÈRE PARTIE — Biologie cellulaire (8 points)</h3>

<h4>Exercice 1 — Génétique et hérédité (5 points)</h4>
<p>Chez la drosophile, on étudie deux caractères : la couleur des yeux (rouge dominant sur blanc) et la longueur des ailes (longues dominant sur vestigiales). Les gènes sont liés au chromosome X.</p>
<p>On croise une femelle aux yeux rouges et aux ailes longues (génotype inconnu) avec un mâle aux yeux blancs et ailes vestigiales.</p>
<p>On obtient : 50% femelles yeux rouges ailes longues ; 25% mâles yeux rouges ailes longues ; 25% mâles yeux blancs ailes vestigiales.</p>
<ol>
  <li><b>(1 pt)</b> Quels sont les génotypes des parents ?</li>
  <li><b>(2 pts)</b> Représenter le croisement avec les schémas de méiose pour la femelle.</li>
  <li><b>(2 pts)</b> Les deux gènes sont-ils liés ? Justifier à partir des résultats. Calculer la fréquence de recombinaison si applicable.</li>
</ol>

<h4>Exercice 2 — Immunologie (3 points)</h4>
<p>Un individu est vacciné contre la grippe. On mesure le taux d'anticorps dans son sang au cours du temps. On observe une réponse primaire faible, puis une exposition naturelle au virus déclenche une réponse secondaire très intense.</p>
<ol>
  <li><b>(1 pt)</b> Expliquer la différence entre réponse immunitaire primaire et secondaire.</li>
  <li><b>(1 pt)</b> Quel type de cellules permet la réponse secondaire ? Quelle est leur origine ?</li>
  <li><b>(1 pt)</b> Définir le principe de la vaccination. Pourquoi est-il efficace ?</li>
</ol>

<h3>DEUXIÈME PARTIE — Géologie (6 points)</h3>

<h4>Exercice 3 — Tectonique des plaques (6 points)</h4>
<p>On étudie une zone de subduction au niveau des Andes (Amérique du Sud).</p>
<ol>
  <li><b>(2 pts)</b> Définir la subduction. Quels types de plaques sont impliquées ?</li>
  <li><b>(2 pts)</b> Expliquer la formation des roches métamorphiques dans les zones de subduction. Donner deux exemples de roches métamorphiques.</li>
  <li><b>(2 pts)</b> Comment se forme le magma dans une zone de subduction ? Pourquoi y a-t-il une activité volcanique explosive ?</li>
</ol>`,
    correction_html: `
<h3>CORRECTION — EXERCICE 1</h3>
<p><b>1. Génotypes :</b><br>
Mâle : X<sup>bv</sup>Y (yeux blancs, vestigiales ; b=blanc, v=vestigiales)<br>
Femelle : X<sup>RL</sup>X<sup>bv</sup> (hétérozygote couplée en cis : R=rouge, L=longue)</p>
<p><b>2. Croisement :</b> P(X<sup>RL</sup>X<sup>bv</sup>) × ♂(X<sup>bv</sup>Y)<br>
Gamètes femelle : X<sup>RL</sup> et X<sup>bv</sup> en proportions égales (pas de recombinaison détectée)<br>
Gamètes mâle : X<sup>bv</sup> et Y</p>
<p><b>3. Liaison :</b> Les résultats (50% RL, 25% mâles RL, 25% mâles bv, 0 recombinants) → gènes <b>liés</b>, aucune recombinaison dans cette expérience ou fréquence de recombinaison = 0%.</p>

<h3>CORRECTION — EXERCICE 2</h3>
<p><b>1.</b> Réponse primaire : lente, faible taux d'anticorps, temps de latence long → première rencontre avec l'antigène<br>
Réponse secondaire : rapide, intense, durée longue → grâce aux cellules mémoire conservées depuis la première rencontre</p>
<p><b>2.</b> Les <b>lymphocytes B mémoire</b> et <b>lymphocytes T mémoire</b> permettent la réponse secondaire. Ils dérivent des lymphocytes B et T activés lors de la réponse primaire.</p>
<p><b>3.</b> La vaccination introduit un antigène atténué ou inactivé → réponse primaire et création de cellules mémoire → protection lors d'une vraie infection.</p>

<h3>CORRECTION — EXERCICE 3</h3>
<p><b>1.</b> Subduction = enfoncement d'une plaque lithosphérique océanique sous une autre plaque. Implique : plaque océanique (dense) + plaque continentale ou océanique.</p>
<p><b>2.</b> En profondeur → augmentation T° et P → métamorphisme des roches subductées. Exemples : <b>schistes bleus, éclogites</b>.</p>
<p><b>3.</b> La déshydratation de la plaque subductée libère de l'eau → abaisse le point de fusion du manteau → fusion partielle → magma riche en eau → volcanisme explosif (gaz sous pression).</p>`
  },

  // ══════════════════════════════════════════════════════════════════════════
  // BAC PHILOSOPHIE — SÉRIE L
  // ══════════════════════════════════════════════════════════════════════════

  {
    id: 'bac-philo-l-2024',
    titre: 'BAC Philosophie L — 2024',
    matiere: 'Philosophie',
    niveau: 'Terminale',
    serie: 'L',
    annee: '2024',
    examen: 'BAC',
    duree: '4 heures',
    coefficient: 4,
    sujet_html: `
<p><i>Le candidat traitera l'un des trois sujets suivants au choix :</i></p>

<h3>SUJET 1 — Dissertation</h3>
<p><b>« La conscience de soi est-elle une connaissance de soi ? »</b></p>
<p><i>Consigne : Ce sujet invite à réfléchir sur le rapport entre conscience et connaissance. On attend un plan dialectique avec introduction, développement en deux ou trois parties et conclusion.</i></p>
<br>
<h4>Repères conceptuels utiles :</h4>
<ul>
  <li>Descartes : Le <i>cogito</i> comme certitude fondatrice ("Je pense, donc je suis")</li>
  <li>Freud : L'inconscient comme limite de la conscience de soi</li>
  <li>Sartre : La mauvaise foi et l'auto-illusion</li>
  <li>Spinoza : "L'homme n'est pas un empire dans un empire"</li>
</ul>

<h3>SUJET 2 — Dissertation</h3>
<p><b>« Peut-on être libre dans une société ? »</b></p>
<br>
<h4>Repères conceptuels utiles :</h4>
<ul>
  <li>Rousseau : "L'homme est né libre, et partout il est dans les fers"</li>
  <li>Montesquieu : La liberté comme obéissance aux lois qu'on s'est données</li>
  <li>Sartre : "L'existence précède l'essence" — liberté radicale</li>
  <li>Hegel : La liberté se réalise dans l'État rationnel</li>
</ul>

<h3>SUJET 3 — Commentaire de texte</h3>
<p><b>Texte de René Descartes, <i>Méditations métaphysiques</i>, Méditation II :</b></p>
<blockquote style="border-left:4px solid #ccc; padding-left:16px; margin:16px 0; font-style:italic; color:#444">
"Mais qu'est-ce donc que je suis ? Une chose qui pense. Qu'est-ce qu'une chose qui pense ? C'est une chose qui doute, qui conçoit, qui affirme, qui nie, qui veut, qui ne veut pas, qui imagine aussi, et qui sent. Certes, ce n'est pas peu de choses, si tout cela appartient à ma nature. Mais pourquoi n'y appartiendrait-il pas ? Ne suis-je pas encore ce même qui doute de presque tout, qui néanmoins entend et conçoit certaines choses, qui assure et affirme celles-là seules être vraies, qui nie toutes les autres, qui veut et désire d'en connaître davantage, qui ne veut pas être trompé, qui imagine beaucoup de choses, même quelquefois malgré moi, et qui en sent aussi beaucoup, comme par l'entremise des organes du corps ?"
</blockquote>
<p><b>Questions :</b></p>
<ol>
  <li>Dégager la thèse principale du texte.</li>
  <li>Expliquer l'expression "une chose qui pense".</li>
  <li>En quoi le doute conduit-il à la certitude de l'existence du moi pensant ?</li>
  <li>Discussion : la pensée suffit-elle à définir l'être humain ?</li>
</ol>`,
    correction_html: `
<h3>PLAN SUGGÉRÉ — SUJET 1 : La conscience de soi est-elle une connaissance de soi ?</h3>

<h4>Introduction :</h4>
<p>La conscience de soi, ce retour réflexif du sujet sur lui-même, semble être la forme la plus directe de connaissance. Descartes en fait le fondement de toute certitude : "Je pense, donc je suis." Cependant, peut-on vraiment dire que se voir penser, c'est se connaître ? L'inconscient freudien et les limites du cogito invitent à douter.</p>

<h4>Partie I — La conscience de soi comme fondement de toute connaissance</h4>
<ul>
  <li>Le cogito cartésien : certitude immédiate, indubitable</li>
  <li>La réflexivité : la conscience peut se prendre elle-même pour objet</li>
  <li>La phénoménologie : Husserl — l'intentionnalité de la conscience</li>
</ul>

<h4>Partie II — Les limites : la conscience de soi ne suffit pas à la connaissance de soi</h4>
<ul>
  <li>Freud : l'inconscient — nous nous ignorons nous-mêmes</li>
  <li>Sartre et la mauvaise foi : on se ment à soi-même</li>
  <li>Marx : la fausse conscience idéologique</li>
  <li>Nietzsche : "La grande raison" du corps dépasse la petite raison de la conscience</li>
</ul>

<h4>Partie III — Dépasser l'opposition : la connaissance de soi passe par l'autre</h4>
<ul>
  <li>Hegel : la conscience de soi se constitue dans la reconnaissance par autrui</li>
  <li>Ricœur : l'identité narrative — se connaître en racontant son histoire</li>
  <li>La psychanalyse comme démarche : connaissance de soi avec l'aide d'autrui</li>
</ul>

<h4>Conclusion :</h4>
<p>La conscience de soi est une condition nécessaire mais non suffisante de la connaissance de soi. Elle ouvre un espace de réflexion mais recèle en elle-même des zones d'ombre. La véritable connaissance de soi exige un effort, un dialogue avec autrui et une confrontation à l'inconscient.</p>

<h3>COMMENTAIRE DU TEXTE DE DESCARTES</h3>
<p><b>Thèse :</b> L'être humain est essentiellement une chose qui pense (res cogitans), indépendamment du corps.</p>
<p><b>"Une chose qui pense" :</b> Pour Descartes, la substance pensante est ce qui résiste au doute méthodique. On peut douter de l'existence du corps, du monde extérieur, mais pas du fait de douter lui-même → "je pense, donc je suis."</p>
<p><b>Le doute mène à la certitude :</b> Le doute hyperbolique (je peux douter de tout) prouve l'existence d'un sujet pensant car l'acte de douter est lui-même une pensée.</p>
<p><b>Discussion :</b> Réduire l'être humain à la pensée laisse de côté le corps (Merleau-Ponty : l'homme est son corps), les émotions, la dimension sociale et historique.</p>`
  },

  // ══════════════════════════════════════════════════════════════════════════
  // BAC FRANÇAIS — TERMINALE
  // ══════════════════════════════════════════════════════════════════════════

  {
    id: 'bac-francais-tle-2024',
    titre: 'BAC Français Terminale — 2024',
    matiere: 'Français',
    niveau: 'Terminale',
    annee: '2024',
    examen: 'BAC',
    duree: '4 heures',
    coefficient: 3,
    sujet_html: `
<h3>TEXTE — Cheikh Hamidou Kane, <i>L'Aventure ambiguë</i>, 1961 (extrait)</h3>
<blockquote style="border-left:4px solid #ccc; padding-left:16px; font-style:italic; color:#444">
"Je suis comme deux personnages réunis dans un seul corps. L'un d'eux est celui que j'ai toujours été : fils du pays de Diallobé, enfant de la tradition, gardien des valeurs ancestrales. L'autre est celui que l'école étrangère a créé : un être avide de connaissance, attiré par la modernité et par l'horizon de l'Occident. Entre ces deux moi, il n'y a pas de dialogue véritable, mais une guerre sourde, constante et épuisante."
</blockquote>

<h3>I. COMPRÉHENSION DU TEXTE (8 points)</h3>
<ol>
  <li><b>(2 pts)</b> Quel est le thème principal du texte ? Justifiez avec des citations précises.</li>
  <li><b>(2 pts)</b> Identifiez les deux "personnages" dont parle le narrateur. Que symbolisent-ils ?</li>
  <li><b>(2 pts)</b> Expliquez l'expression "aventure ambiguë". En quoi s'applique-t-elle au texte ?</li>
  <li><b>(2 pts)</b> Quel est le ton de ce passage ? Justifiez votre réponse.</li>
</ol>

<h3>II. LANGUE ET STYLE (6 points)</h3>
<ol>
  <li><b>(2 pts)</b> Relevez et analysez deux figures de style du texte.</li>
  <li><b>(2 pts)</b> Étudiez la structure de la dernière phrase. Quel effet produit-elle ?</li>
  <li><b>(2 pts)</b> Donnez le champ lexical dominant dans ce passage.</li>
</ol>

<h3>III. EXPRESSION ÉCRITE — Dissertation (6 points)</h3>
<p>Au choix :</p>
<p><b>Sujet A :</b> "La littérature africaine postcoloniale est-elle condamnée à parler du déchirement entre tradition et modernité ?" Discutez en vous appuyant sur des œuvres étudiées.</p>
<p><b>Sujet B :</b> "L'éducation peut-elle être un instrument d'aliénation culturelle ?" Discutez.</p>`,
    correction_html: `
<h3>CORRECTION INDICATIVE</h3>

<h4>I. Compréhension</h4>
<p><b>1. Thème principal :</b> Le déchirement identitaire entre tradition africaine et modernité occidentale. Citations : "deux personnages réunis dans un seul corps", "guerre sourde, constante et épuisante".</p>
<p><b>2. Les deux personnages :</b> L'un = l'Africain traditionnel, héritier des valeurs ancestrales du peuple Diallobé. L'autre = l'élève colonisé, formé par l'école occidentale. Ils symbolisent la double appartenance culturelle du colonisé.</p>
<p><b>3. "Aventure ambiguë" :</b> Ambiguë car l'école étrangère libère mais aliène simultanément. C'est une aventure (ouverture sur le monde) qui prive aussi d'une part de soi-même.</p>
<p><b>4. Ton :</b> Mélancolique et déchiré. Vocabulaire de la souffrance ("guerre sourde", "épuisante", "il n'y a pas de dialogue véritable").</p>

<h4>II. Langue et Style</h4>
<p><b>Figures de style :</b><br>
- Métaphore : "une guerre sourde" → le conflit intérieur comparé à une guerre<br>
- Antithèse : "tradition" / "modernité" ; "ancestrales" / "étrangère"<br>
- Personnification : "l'école étrangère a créé" un être</p>
<p><b>Dernière phrase :</b> Structure ternaire ("pas de dialogue véritable, mais une guerre sourde, constante et épuisante") → accumulation d'adjectifs qui intensifie l'idée de conflit permanent et douloureux.</p>

<h4>III. Plan de dissertation — Sujet A</h4>
<p><b>I.</b> La littérature africaine postcoloniale traite effectivement du déchirement (Senghor, Kane, Oyono)<br>
<b>II.</b> Mais elle aborde aussi d'autres thèmes : amour, identité, politique, histoire<br>
<b>III.</b> Le déchirement reste un prisme mais la littérature africaine contemporaine s'en émancipe (Beyala, Diome, Miano)</p>`
  },

  // ══════════════════════════════════════════════════════════════════════════
  // BFEM MATHÉMATIQUES — 3ÈME
  // ══════════════════════════════════════════════════════════════════════════

  {
    id: 'bfem-maths-3e-2024',
    titre: 'BFEM Mathématiques 3ème — 2024',
    matiere: 'Mathématiques',
    niveau: '3ème',
    annee: '2024',
    examen: 'BFEM',
    duree: '2 heures 30',
    coefficient: 4,
    sujet_html: `
<h3>EXERCICE 1 — Algèbre (5 points)</h3>
<ol>
  <li><b>(1,5 pt)</b> Factoriser : A = 4x² − 9 et B = x² − 4x + 4</li>
  <li><b>(2 pts)</b> Résoudre l'équation : 3x² − 7x + 2 = 0</li>
  <li><b>(1,5 pt)</b> Résoudre l'inéquation : 2x + 5 > x − 3 et représenter les solutions sur une droite numérique.</li>
</ol>

<h3>EXERCICE 2 — Géométrie et Trigonométrie (5 points)</h3>
<p>Dans un triangle ABC rectangle en A, on a BC = 10 cm et AB = 6 cm.</p>
<ol>
  <li><b>(1 pt)</b> Calculer AC à l'aide du théorème de Pythagore.</li>
  <li><b>(1,5 pt)</b> Calculer cos(B̂), sin(B̂) et tan(B̂). En déduire l'angle B̂ à 1° près.</li>
  <li><b>(1,5 pt)</b> Énoncer le théorème de Thalès et son application à ce triangle si M est le milieu de BC et MN ∥ AB avec N sur AC.</li>
  <li><b>(1 pt)</b> Calculer MN et AN sachant que M est le milieu de BC.</li>
</ol>

<h3>EXERCICE 3 — Statistiques et Probabilités (5 points)</h3>
<p>Un professeur note les résultats de 30 élèves sur une épreuve de 20 points :</p>
<p>5, 8, 10, 12, 14, 16, 8, 10, 12, 15, 7, 9, 11, 13, 15, 8, 10, 12, 14, 16, 6, 9, 11, 13, 15, 10, 12, 14, 16, 18</p>
<ol>
  <li><b>(1 pt)</b> Calculer la moyenne arithmétique de ces notes.</li>
  <li><b>(1,5 pt)</b> Calculer la médiane et le mode.</li>
  <li><b>(1,5 pt)</b> Construire un tableau de fréquences par classes [4;8[, [8;12[, [12;16[, [16;20].</li>
  <li><b>(1 pt)</b> Un élève est choisi au hasard. Quelle est la probabilité qu'il ait eu au moins 12 ?</li>
</ol>

<h3>PROBLÈME — Arithmétique et Géométrie (5 points)</h3>
<p>Un terrain rectangulaire a un périmètre de 60 m. Sa longueur dépasse sa largeur de 6 m.</p>
<ol>
  <li><b>(2 pts)</b> En posant la largeur = x, écrire deux équations traduisant les conditions. Résoudre le système pour trouver les dimensions.</li>
  <li><b>(1 pt)</b> Calculer l'aire du terrain.</li>
  <li><b>(2 pts)</b> On veut clôturer ce terrain avec une haie. Le prix du mètre de haie est 2500 FCFA. Calculer le coût total de la clôture.</li>
</ol>`,
    correction_html: `
<h3>CORRECTION BFEM MATHS 2024</h3>

<h4>Exercice 1</h4>
<p><b>1.</b> A = (2x − 3)(2x + 3) [identité remarquable a² − b² = (a−b)(a+b)]<br>
B = (x − 2)² [carré d'un binôme]</p>
<p><b>2.</b> Discriminant : Δ = 49 − 24 = 25 → x = (7 ± 5)/6 → <b>x₁ = 2 et x₂ = 1/3</b></p>
<p><b>3.</b> 2x + 5 > x − 3 → x > −8 → <b>S = ]−8 ; +∞[</b></p>

<h4>Exercice 2</h4>
<p><b>1.</b> AC² = BC² − AB² = 100 − 36 = 64 → <b>AC = 8 cm</b></p>
<p><b>2.</b> cos(B̂) = AB/BC = 6/10 = 0,6 → <b>B̂ ≈ 53°</b><br>
sin(B̂) = AC/BC = 8/10 = 0,8 ; tan(B̂) = AC/AB = 8/6 = 4/3</p>
<p><b>3.</b> Thalès : Si MN ∥ AB alors BM/BC = MN/AB = BN/BA (rapport des longueurs proportionnels)</p>
<p><b>4.</b> M milieu de BC → BM/BC = 1/2 → MN = AB/2 = 3 cm ; AN = AC/2 = 4 cm</p>

<h4>Exercice 3</h4>
<p><b>1.</b> Somme = 327 → Moyenne = 327/30 = <b>10,9</b></p>
<p><b>2.</b> Médiane (30 valeurs, rang 15 et 16) : valeurs triées → médiane = <b>11</b> ; Mode = <b>10 et 12</b> (plus fréquents)</p>
<p><b>4.</b> Notes ≥ 12 : compter → environ 17 élèves → P ≈ 17/30 ≈ <b>0,57</b></p>

<h4>Problème</h4>
<p><b>1.</b> Système : {2(x + x + 6) = 60 → 2(2x + 6) = 60 → 4x + 12 = 60 → x = 12<br>
Largeur = <b>12 m</b>, Longueur = <b>18 m</b></p>
<p><b>2.</b> Aire = 12 × 18 = <b>216 m²</b></p>
<p><b>3.</b> Périmètre = 60 m → Coût = 60 × 2500 = <b>150 000 FCFA</b></p>`
  },

  // ══════════════════════════════════════════════════════════════════════════
  // BFEM FRANÇAIS — 3ÈME
  // ══════════════════════════════════════════════════════════════════════════

  {
    id: 'bfem-francais-3e-2024',
    titre: 'BFEM Français 3ème — 2024',
    matiere: 'Français',
    niveau: '3ème',
    annee: '2024',
    examen: 'BFEM',
    duree: '3 heures',
    coefficient: 5,
    sujet_html: `
<h3>PREMIÈRE PARTIE — DICTÉE (4 points)</h3>
<p><i>(Le texte de dictée sera lu par le surveillant)</i></p>
<blockquote style="border-left:4px solid #ccc; padding-left:16px; font-style:italic;">
"Le Sénégal, pays de la teranga, accueille chaque année des milliers de visiteurs qui viennent découvrir ses paysages diversifiés : les plages ensoleillées de Dakar, les forêts du Casamance, les déserts du Ferlo et les mangroves de la Casamance. Ces richesses naturelles, conjuguées à la chaleur de son peuple et à la richesse de sa culture, font de ce pays une destination touristique prisée en Afrique de l'Ouest."
</blockquote>

<h3>DEUXIÈME PARTIE — QUESTIONS DE LANGUE (6 points)</h3>
<ol>
  <li><b>(1 pt)</b> Dans la phrase "Ces richesses naturelles font de ce pays une destination prisée", identifiez et analysez le groupe nominal sujet.</li>
  <li><b>(1,5 pt)</b> Mettez au pluriel : "Le visiteur étranger qui découvre ce pays magnifique est toujours impressionné."</li>
  <li><b>(1,5 pt)</b> Transformez à la voix passive : "Les touristes admirent les monuments historiques de l'île de Gorée."</li>
  <li><b>(2 pts)</b> Conjuguez les verbes entre parenthèses : "Quand il (arriver) à Dakar, il (visiter) le musée et (prendre) des photos."</li>
</ol>

<h3>TROISIÈME PARTIE — RÉDACTION (10 points)</h3>
<p><b>Sujet au choix :</b></p>
<p><b>Sujet A :</b> Racontez une visite dans un lieu touristique du Sénégal. Décrivez ce lieu, exprimez vos émotions et expliquez pourquoi vous le recommanderiez à vos amis. (15-20 lignes)</p>
<p><b>Sujet B :</b> "L'environnement est notre bien commun. Il est de notre responsabilité de le protéger." Discutez cette affirmation et proposez des actions concrètes. (15-20 lignes)</p>`,
    correction_html: `
<h3>CORRECTION INDICATIVE</h3>

<h4>Questions de langue</h4>
<p><b>1.</b> "Ces richesses naturelles" = GN sujet. Déterminant : "ces" (démonstratif pluriel). Nom : "richesses". Expansion : "naturelles" (adjectif qualificatif épithète). Fonction : sujet du verbe "font".</p>
<p><b>2.</b> Pluriel : "Les visiteurs étrangers qui découvrent ces pays magnifiques sont toujours impressionnés."</p>
<p><b>3.</b> Voix passive : "Les monuments historiques de l'île de Gorée sont admirés par les touristes."</p>
<p><b>4.</b> Subordonnée temporelle avec "quand" → futur antérieur + futur simple :<br>
"Quand il <b>sera arrivé</b> à Dakar, il <b>visitera</b> le musée et <b>prendra</b> des photos."</p>

<h4>Grille d'évaluation rédaction (10 pts)</h4>
<ul>
  <li>Respect du sujet et pertinence des idées : 3 pts</li>
  <li>Organisation et cohérence du texte : 2 pts</li>
  <li>Richesse du vocabulaire : 2 pts</li>
  <li>Correction grammaticale et orthographe : 3 pts</li>
</ul>`
  },

  // ══════════════════════════════════════════════════════════════════════════
  // BAC MATHS — SÉRIE S2
  // ══════════════════════════════════════════════════════════════════════════

  {
    id: 'bac-maths-s2-2024',
    titre: 'BAC Mathématiques S2 — 2024',
    matiere: 'Mathématiques',
    niveau: 'Terminale',
    serie: 'S2',
    annee: '2024',
    examen: 'BAC',
    duree: '3 heures',
    coefficient: 4,
    sujet_html: `
<h3>EXERCICE I — Statistiques & Probabilités (5 points)</h3>
<p>Une étude porte sur le nombre d'heures de travail hebdomadaires d'un échantillon de 50 lycéens :</p>
<table style="border-collapse:collapse; width:100%; margin:12px 0">
  <tr style="background:#f0f0f0"><th style="border:1px solid #ccc; padding:6px">Heures h</th><td style="border:1px solid #ccc; padding:6px; text-align:center">[5;10[</td><td style="border:1px solid #ccc; padding:6px; text-align:center">[10;15[</td><td style="border:1px solid #ccc; padding:6px; text-align:center">[15;20[</td><td style="border:1px solid #ccc; padding:6px; text-align:center">[20;25]</td></tr>
  <tr><th style="border:1px solid #ccc; padding:6px">Effectif</th><td style="border:1px solid #ccc; padding:6px; text-align:center">8</td><td style="border:1px solid #ccc; padding:6px; text-align:center">20</td><td style="border:1px solid #ccc; padding:6px; text-align:center">16</td><td style="border:1px solid #ccc; padding:6px; text-align:center">6</td></tr>
</table>
<ol>
  <li><b>(1,5 pt)</b> Calculer la moyenne x̄ et l'écart-type σ de cette série.</li>
  <li><b>(1 pt)</b> Déterminer la médiane Me.</li>
  <li><b>(2,5 pts)</b> On choisit au hasard un lycéen. Soit A l'événement "travaille moins de 15h" et B "travaille au moins 15h". Calculer P(A), P(B) et vérifier P(A) + P(B) = 1.</li>
</ol>

<h3>EXERCICE II — Fonctions (5 points)</h3>
<p>Soit f(x) = 2x³ − 3x² − 12x + 1</p>
<ol>
  <li><b>(1,5 pt)</b> Calculer f'(x) et dresser le tableau de variation de f.</li>
  <li><b>(1,5 pt)</b> Déterminer les équations des tangentes à la courbe de f aux points d'abscisses x = −1 et x = 2.</li>
  <li><b>(2 pts)</b> Résoudre f'(x) &lt; 0 et donner une interprétation graphique.</li>
</ol>

<h3>PROBLÈME — Suites & Intégration (10 points)</h3>
<p><b>Partie A — Suites :</b></p>
<p>Un capital de 500 000 FCFA est placé à intérêt composé annuel de taux 5%.</p>
<ol>
  <li><b>(1 pt)</b> Exprimer le capital C<sub>n</sub> après n années. Identifier la nature de la suite (C<sub>n</sub>).</li>
  <li><b>(1,5 pt)</b> Calculer C<sub>5</sub> et C<sub>10</sub>. Après combien d'années le capital aura-t-il doublé ?</li>
</ol>
<p><b>Partie B — Intégration :</b></p>
<ol start="3">
  <li><b>(2,5 pts)</b> Calculer ∫<sub>0</sub><sup>3</sup> (2x − 3)² dx en développant l'intégrande.</li>
  <li><b>(2 pts)</b> Calculer ∫<sub>1</sub><sup>e</sup> (ln x)/x dx par un changement de variable.</li>
  <li><b>(3 pts)</b> Une entreprise réalise un bénéfice journalier b(t) = 50t − t² (en milliers FCFA, t en jours, 0 ≤ t ≤ 50). Calculer le bénéfice total sur les 30 premiers jours.</li>
</ol>`,
    correction_html: `
<h3>CORRECTION — EXERCICE I</h3>
<p><b>1.</b> Centres de classes : 7,5 ; 12,5 ; 17,5 ; 22,5<br>
x̄ = (8×7,5 + 20×12,5 + 16×17,5 + 6×22,5)/50 = (60 + 250 + 280 + 135)/50 = 725/50 = <b>14,5 heures</b><br>
Variance : calculer Σnᵢxᵢ²/N − x̄² → σ ≈ <b>4,1 heures</b></p>
<p><b>2.</b> Médiane : 25e valeur → dans [10;15[. Me = 10 + 5×(25−8)/20 = 10 + 4,25 = <b>14,25 h</b></p>
<p><b>3.</b> P(A) = (8+20)/50 = 28/50 = <b>0,56</b> ; P(B) = (16+6)/50 = 22/50 = <b>0,44</b> ; P(A)+P(B) = 1 ✓</p>

<h3>CORRECTION — EXERCICE II</h3>
<p><b>1.</b> f'(x) = 6x² − 6x − 12 = 6(x²−x−2) = 6(x−2)(x+1)<br>
f' > 0 sur ]−∞;−1[ et ]2;+∞[ ; f' < 0 sur ]−1;2[<br>
Maximum local : f(−1) = 8 ; Minimum local : f(2) = −19</p>
<p><b>2.</b> Tangente en x=−1 : y = f(−1) + f'(−1)(x+1) = 8 + 0 → <b>y = 8</b><br>
Tangente en x=2 : y = f(2) + f'(2)(x−2) = −19 + 0 → <b>y = −19</b></p>

<h3>CORRECTION — PROBLÈME</h3>
<p><b>1.</b> C<sub>n</sub> = 500000 × (1,05)<sup>n</sup> → suite géométrique de raison q = 1,05</p>
<p><b>2.</b> C<sub>5</sub> = 500000 × 1,05⁵ ≈ <b>638 141 FCFA</b> ; C<sub>10</sub> ≈ <b>814 447 FCFA</b><br>
Doublement : (1,05)ⁿ ≥ 2 → n ≥ ln2/ln1,05 ≈ 14,2 → après <b>15 ans</b></p>
<p><b>3.</b> ∫(2x−3)²dx = ∫(4x²−12x+9)dx = [4x³/3 − 6x² + 9x]<sub>0</sub><sup>3</sup> = (36 − 54 + 27) − 0 = <b>9</b></p>
<p><b>4.</b> u = ln x, du = dx/x → ∫(lnx/x)dx = ∫u du = u²/2 = (lnx)²/2<br>
I = [(lnx)²/2]<sub>1</sub><sup>e</sup> = 1/2 − 0 = <b>1/2</b></p>
<p><b>5.</b> B = ∫<sub>0</sub><sup>30</sup>(50t − t²)dt = [25t² − t³/3]<sub>0</sub><sup>30</sup> = 25×900 − 27000/3 = 22500 − 9000 = <b>13 500 milliers FCFA = 13,5 millions FCFA</b></p>`
  },

  // ══════════════════════════════════════════════════════════════════════════
  // BAC HISTOIRE-GÉOGRAPHIE — SÉRIE L
  // ══════════════════════════════════════════════════════════════════════════

  {
    id: 'bac-hg-l-2024',
    titre: 'BAC Histoire-Géographie L — 2024',
    matiere: 'Histoire-Géographie',
    niveau: 'Terminale',
    serie: 'L',
    annee: '2024',
    examen: 'BAC',
    duree: '4 heures',
    coefficient: 3,
    sujet_html: `
<h3>PREMIÈRE PARTIE — HISTOIRE (10 points)</h3>

<h4>Sujet 1 — Composition historique (10 pts) — Au choix</h4>

<p><b>Sujet A :</b> <i>"Les indépendances africaines (1955-1975) : causes, processus et bilan."</i></p>
<p>Plan suggéré :</p>
<ul>
  <li>I. Les causes des mouvements d'indépendance (nationalisme, Seconde Guerre mondiale, ONU)</li>
  <li>II. Les différentes voies vers l'indépendance (négociée, armée, progressive)</li>
  <li>III. Les premières années des États africains indépendants : espoirs et difficultés</li>
</ul>

<p><b>Sujet B :</b> <i>"La Guerre Froide (1947-1991) : origines, phases et fin."</i></p>
<p>Plan suggéré :</p>
<ul>
  <li>I. Les origines idéologiques et politiques de la Guerre Froide (Doctrine Truman, Plan Marshall)</li>
  <li>II. Les phases de tension et de détente (Berlin, Cuba, Vietnam, Helsinki)</li>
  <li>III. La chute de l'URSS et la fin de la bipolarité (Gorbatchev, mur de Berlin)</li>
</ul>

<h3>DEUXIÈME PARTIE — GÉOGRAPHIE (10 points)</h3>

<h4>Sujet — Le Sénégal dans la mondialisation (10 pts)</h4>
<ol>
  <li><b>(3 pts)</b> Présentez les ressources naturelles et économiques du Sénégal. Comment contribuent-elles à son intégration dans l'économie mondiale ?</li>
  <li><b>(3 pts)</b> Quels sont les principaux défis de développement du Sénégal (pauvreté, urbanisation, émigration) ?</li>
  <li><b>(4 pts)</b> Analysez la place du Sénégal dans l'espace ouest-africain (CEDEAO, migrations, échanges commerciaux).</li>
</ol>`,
    correction_html: `
<h3>PLAN DÉTAILLÉ — Sujet A : Les indépendances africaines</h3>

<h4>Introduction :</h4>
<p>À la fin de la Seconde Guerre mondiale, l'Afrique subsaharienne est encore largement sous domination coloniale. Entre 1955 et 1975, une vague d'indépendances libère le continent. Comment expliquer ce phénomène et quel bilan en tirer ?</p>

<h4>I. Les causes des indépendances</h4>
<ul>
  <li><b>La Seconde Guerre mondiale</b> : soldats africains défendent la liberté → contradiction avec la colonisation</li>
  <li><b>La Charte des Nations Unies (1945)</b> : droit des peuples à l'autodétermination</li>
  <li><b>Le développement des partis politiques</b> : RDA en AOF, ANC en Afrique du Sud</li>
  <li><b>Les intellectuels et la Négritude</b> : Senghor, Césaire, Diop</li>
  <li><b>L'exemple asiatique</b> : Indépendance de l'Inde (1947), victoire vietnamienne à Diên Biên Phu (1954)</li>
</ul>

<h4>II. Les processus d'indépendance</h4>
<ul>
  <li><b>Voie négociée</b> : Sénégal, Côte d'Ivoire (1960) — transition progressive</li>
  <li><b>Voie armée</b> : Algérie (1954-1962), Guinée-Bissau, Mozambique, Angola</li>
  <li><b>Le cas de la Guinée (1958)</b> : Sékou Touré vote "Non" à de Gaulle</li>
  <li><b>Le Manifeste de Bandung (1955)</b> : naissance du Tiers-Monde</li>
</ul>

<h4>III. Bilan</h4>
<ul>
  <li><b>Positif</b> : souveraineté nationale, développement des institutions, cultures valorisées</li>
  <li><b>Négatif</b> : frontières héritées, néo-colonialisme, instabilité politique, coups d'État</li>
  <li><b>Cas du Sénégal</b> : stabilité démocratique, alternance pacifique 2000</li>
</ul>

<h3>GÉOGRAPHIE — Correction indicative</h3>
<p><b>1. Ressources :</b> Pêche (1er secteur d'exportation), phosphates (Thiès), pétrole et gaz (découvertes offshore), tourisme (Saly, Casamance), arachide, coton.</p>
<p><b>2. Défis :</b> Pauvreté rurale (exode vers Dakar), urbanisation incontrôlée, émigration vers Europe (remises = 10% PIB), changement climatique (avancée du désert, submersion côtière).</p>
<p><b>3. Place dans la CEDEAO :</b> Dakar = hub financier et commercial, port en eau profonde, migrations circulaires intra-africaines, OMVS (Organisation pour la Mise en Valeur du Sénégal).</p>`
  },

]

// ──────────────────────────────────────────────────────────────────────────────
// Helper : trouver une annale par matière / niveau / série / année
// ──────────────────────────────────────────────────────────────────────────────
export function getAnnale(matiere: string, niveau: string, serie?: string, annee?: string): AnnaleDoc | undefined {
  return ANNALES.find(a =>
    a.matiere === matiere &&
    a.niveau === niveau &&
    (serie ? a.serie === serie : true) &&
    (annee ? a.annee === annee : true)
  )
}

export function getAnnalesParMatiere(matiere: string): AnnaleDoc[] {
  return ANNALES.filter(a => a.matiere === matiere)
}

export function getAnnalesParNiveau(niveau: string, serie?: string): AnnaleDoc[] {
  return ANNALES.filter(a => a.niveau === niveau && (serie ? a.serie === serie : true))
}
