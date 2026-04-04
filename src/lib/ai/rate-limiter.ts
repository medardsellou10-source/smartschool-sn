// Rate limiter simple pour protéger l'API AI

interface RateLimitEntry {
  count: number
  resetAt: number
}

const limits = new Map<string, RateLimitEntry>()

// Limites par rôle (messages par heure)
const ROLE_LIMITS: Record<string, number> = {
  admin_global: 100,
  professeur: 60,
  surveillant: 40,
  parent: 30,
  eleve: 40,
}

const WINDOW_MS = 60 * 60 * 1000 // 1 heure

export function checkRateLimit(userId: string, role: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now()
  const key = `${userId}:${role}`
  const maxRequests = ROLE_LIMITS[role] || 30

  const entry = limits.get(key)

  if (!entry || now > entry.resetAt) {
    limits.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return { allowed: true, remaining: maxRequests - 1, resetIn: WINDOW_MS }
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetIn: entry.resetAt - now }
  }

  entry.count++
  return { allowed: true, remaining: maxRequests - entry.count, resetIn: entry.resetAt - now }
}

// Nettoyer les entrées expirées périodiquement
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of limits.entries()) {
      if (now > entry.resetAt) limits.delete(key)
    }
  }, 5 * 60 * 1000) // Toutes les 5 minutes
}
