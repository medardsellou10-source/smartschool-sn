/**
 * toast-helpers.ts — Wrapper unifié autour de react-hot-toast
 * Offre des toasts cohérents (succès / erreur / info) avec styling harmonisé.
 */

import toast from 'react-hot-toast'

const BASE_STYLE = {
  background: '#0F172A',
  color: '#F8FAFC',
  border: '1px solid rgba(255,255,255,0.08)',
  fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
  borderRadius: '12px',
  fontSize: '14px',
  padding: '12px 16px',
}

export const toastSuccess = (message: string) =>
  toast.success(message, {
    style: { ...BASE_STYLE, border: '1px solid rgba(34,197,94,0.3)' },
    iconTheme: { primary: '#22C55E', secondary: '#0F172A' },
    duration: 3000,
  })

export const toastError = (message: string) =>
  toast.error(message, {
    style: { ...BASE_STYLE, border: '1px solid rgba(248,113,113,0.3)' },
    iconTheme: { primary: '#F87171', secondary: '#0F172A' },
    duration: 4000,
  })

export const toastInfo = (message: string) =>
  toast(message, {
    style: { ...BASE_STYLE, border: '1px solid rgba(56,189,248,0.3)' },
    icon: 'ℹ️',
    duration: 3000,
  })

export const toastWarning = (message: string) =>
  toast(message, {
    style: { ...BASE_STYLE, border: '1px solid rgba(251,191,36,0.3)' },
    icon: '⚠️',
    duration: 4000,
  })

/**
 * Toast "API error" standard : affiche un message lisible et indique
 * que l'on est passé en mode démo/local en fallback.
 */
export const toastApiError = (context: string, fallbackToDemo = true) => {
  const msg = fallbackToDemo
    ? `${context} — données de démo affichées`
    : `${context} — réessayez dans un instant`
  return toastError(msg)
}
