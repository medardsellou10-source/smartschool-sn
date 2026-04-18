/**
 * format.ts — Helpers de formatage centralisés
 * Remplace les définitions locales duppliquées dans parent/intendant.
 */

/* === Monnaie FCFA === */
export function formatCFA(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '0 FCFA'
  return new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' FCFA'
}

/**
 * Format compact pour les gros montants : "26 250 000" → "26,25 M FCFA"
 * Utile pour les StatCards où l'espace est limité.
 */
export function formatCFACompact(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '0 FCFA'
  const abs = Math.abs(n)
  if (abs >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2).replace('.', ',') + ' Md FCFA'
  if (abs >= 1_000_000)     return (n / 1_000_000).toFixed(2).replace('.', ',') + ' M FCFA'
  if (abs >= 1_000)         return (n / 1_000).toFixed(1).replace('.', ',') + ' k FCFA'
  return formatCFA(n)
}

/* === Heure === */
export function formatH(dateOrTime: string | Date | null | undefined): string {
  if (!dateOrTime) return '—'
  try {
    // Accepte "09:30" (string), "09:30:00", ou une Date complète
    if (typeof dateOrTime === 'string') {
      if (/^\d{2}:\d{2}/.test(dateOrTime)) {
        return dateOrTime.slice(0, 5)
      }
    }
    const d = typeof dateOrTime === 'string' ? new Date(dateOrTime) : dateOrTime
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return '—'
  }
}

/* === Heure en minutes-depuis-minuit (pour comparaison sûre) === */
export function timeToMinutes(hm: string | null | undefined): number {
  if (!hm) return 0
  const [h, m] = hm.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

/* === Date courte === */
export function formatDate(d: string | Date | null | undefined): string {
  if (!d) return '—'
  try {
    const date = typeof d === 'string' ? new Date(d) : d
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return '—'
  }
}

/* === Date longue === */
export function formatDateLong(d: string | Date | null | undefined): string {
  if (!d) return '—'
  try {
    const date = typeof d === 'string' ? new Date(d) : d
    return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return '—'
  }
}

/* === Temps relatif : "il y a 5 min", "il y a 2 h", "hier" === */
export function relativeTime(d: string | Date | null | undefined): string {
  if (!d) return '—'
  try {
    const date = typeof d === 'string' ? new Date(d) : d
    const now = Date.now()
    const diffMs = now - date.getTime()
    const sec = Math.floor(diffMs / 1000)
    const min = Math.floor(sec / 60)
    const h   = Math.floor(min / 60)
    const j   = Math.floor(h / 24)

    if (sec < 30)  return 'à l’instant'
    if (sec < 60)  return `il y a ${sec} s`
    if (min < 60)  return `il y a ${min} min`
    if (h < 24)    return `il y a ${h} h`
    if (j === 1)   return 'hier'
    if (j < 7)     return `il y a ${j} j`
    return formatDate(date)
  } catch {
    return '—'
  }
}

/* === Initiales sûres pour avatar (protection null) === */
export function getInitials(prenom?: string | null, nom?: string | null): string {
  const p = prenom?.trim()?.[0]?.toUpperCase() ?? ''
  const n = nom?.trim()?.[0]?.toUpperCase() ?? ''
  const result = `${p}${n}`
  return result || '?'
}

/* === Pourcentage === */
export function formatPct(value: number | null | undefined, digits = 0): string {
  if (value == null || Number.isNaN(value)) return '0 %'
  return `${value.toFixed(digits).replace('.', ',')} %`
}
