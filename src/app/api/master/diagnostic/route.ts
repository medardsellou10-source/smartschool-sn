import { NextResponse } from 'next/server'
import { requireOwnerApi } from '@/lib/auth/owner'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/master/diagnostic — état de configuration de bout en bout.
 *
 * Réunit trois familles de contrôles :
 *   1. Base de données — via `diagnostic_configuration()` : RLS, droits sur les
 *      référentiels de privilèges, déclencheurs de protection, contraintes
 *      financières.
 *   2. Cohérence code ↔ base — les tables que le code interroge existent-elles ?
 *      Une table absente signifie un tableau de bord qui échoue silencieusement.
 *   3. Variables d'environnement — ce qui bloque encore la mise en service.
 *
 * Réservé au propriétaire ; un refus renvoie 404 pour ne rien révéler.
 */

/** Tables et vues interrogées par l'application, extraites des appels `.from()`. */
const TABLES_ATTENDUES = [
  'abonnements', 'abonnements_cantine', 'abonnements_transport', 'absences_eleves',
  'agent_logs', 'arrets', 'budget', 'cahier_texte', 'certificats', 'classes',
  'classes_virtuelles', 'contact_messages', 'contrats_personnel', 'corrections_eleves',
  'courriers', 'cours', 'devoirs', 'ecoles', 'eleves', 'emplois_temps', 'evaluations',
  'examens', 'factures', 'groupes_scolaires', 'impersonations', 'inscriptions',
  'inventaire', 'lignes_paiement_scolarite', 'logs_audit', 'matieres',
  'matricule_templates', 'menus_cantine', 'messages', 'notes', 'notes_soumises',
  'notifications', 'notifications_transport', 'paiement_tentatives', 'paiements',
  'plans', 'pointages_profs', 'positions_vehicules', 'repas_pris', 'ressources_youtube',
  'soumissions_devoirs', 'tarifs_scolarite', 'trajets', 'utilisateurs',
  'v_moyennes_generales', 'v_moyennes_trimestre', 'v_users_impersonifiables',
  'vehicules', 'vue_comptable_eleves', 'waitlist', 'webhook_events', 'youtube_sync_logs',
] as const

interface Controle {
  categorie: string
  objet: string
  statut: 'OK' | 'ATTENTION' | 'ERREUR'
  detail: string
}

export async function GET() {
  const refus = await requireOwnerApi()
  if (refus) return refus

  const controles: Controle[] = []
  const supabase = createAdminClient()

  // ── 1. Contrôles de base de données ─────────────────────────────────────
  try {
    const { data, error } = await (supabase.rpc as any)('diagnostic_configuration')
    if (error) {
      controles.push({
        categorie: 'BASE', objet: 'diagnostic_configuration', statut: 'ERREUR',
        detail: `fonction de diagnostic injoignable : ${error.message}`,
      })
    } else {
      for (const l of (data ?? []) as Controle[]) controles.push(l)
    }
  } catch (err: any) {
    controles.push({
      categorie: 'BASE', objet: 'connexion', statut: 'ERREUR',
      detail: err?.message ?? 'erreur inconnue',
    })
  }

  // ── 2. Cohérence code ↔ base ────────────────────────────────────────────
  // Une requête par table serait coûteuse : on interroge le catalogue en une
  // fois puis on compare localement.
  try {
    const { data: existantes } = await (supabase
      .from('information_schema.tables' as any) as any)
      .select('table_name')
      .eq('table_schema', 'public')

    if (existantes) {
      const presentes = new Set((existantes as any[]).map(r => r.table_name))
      const absentes = TABLES_ATTENDUES.filter(t => !presentes.has(t))
      controles.push(absentes.length === 0
        ? {
            categorie: 'COHERENCE', objet: 'tables interrogées par le code',
            statut: 'OK',
            detail: `${TABLES_ATTENDUES.length} tables et vues présentes`,
          }
        : {
            categorie: 'COHERENCE', objet: 'tables interrogées par le code',
            statut: 'ERREUR',
            detail: `absentes — tableaux de bord en échec : ${absentes.join(', ')}`,
          })
    }
  } catch {
    // information_schema n'est pas toujours exposé via PostgREST ; le contrôle
    // équivalent existe déjà côté SQL, on n'échoue donc pas le diagnostic.
    controles.push({
      categorie: 'COHERENCE', objet: 'tables interrogées par le code',
      statut: 'ATTENTION',
      detail: 'catalogue non exposé via l\'API — vérification faite côté SQL',
    })
  }

  // ── 3. Variables d'environnement ────────────────────────────────────────
  const env: Array<[string, boolean, string]> = [
    ['SUPABASE_SERVICE_ROLE_KEY', true,  'webhooks de paiement inopérants'],
    ['NEXT_PUBLIC_SUPABASE_URL',  true,  'application non connectée à la base'],
    ['WAVE_WEBHOOK_SECRET',       false, 'encaissements Wave refusés'],
    ['CINETPAY_SECRET_KEY',       false, 'signature CinetPay non vérifiée'],
    ['CRON_SECRET',               false, 'relances automatiques désactivées'],
    ['MASTER_SESSION_SECRET',     false, 'cockpit propriétaire inaccessible'],
    ['GOOGLE_GEMINI_API_KEY',     false, 'correction IA indisponible'],
  ]
  for (const [cle, critique, consequence] of env) {
    const v = process.env[cle]
    const present = Boolean(v && v.length > 5 && !v.includes('placeholder'))
    controles.push({
      categorie: 'ENVIRONNEMENT', objet: cle,
      statut: present ? 'OK' : (critique ? 'ERREUR' : 'ATTENTION'),
      detail: present ? 'configurée' : `absente — ${consequence}`,
    })
  }

  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
    controles.push({
      categorie: 'ENVIRONNEMENT', objet: 'NEXT_PUBLIC_DEMO_MODE', statut: 'ERREUR',
      detail: 'mode démo actif — les inscriptions d\'écoles sont simulées, aucune donnée réelle n\'est créée',
    })
  }

  const erreurs    = controles.filter(c => c.statut === 'ERREUR').length
  const attentions = controles.filter(c => c.statut === 'ATTENTION').length

  return NextResponse.json(
    {
      genere_le: new Date().toISOString(),
      version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'local',
      synthese: {
        total: controles.length,
        ok: controles.length - erreurs - attentions,
        attention: attentions,
        erreur: erreurs,
        verdict: erreurs > 0 ? 'ACTION REQUISE'
               : attentions > 0 ? 'FONCTIONNEL AVEC RESERVES'
               : 'CONFORME',
      },
      controles: controles.sort((a, b) => {
        const ordre = { ERREUR: 0, ATTENTION: 1, OK: 2 } as const
        return ordre[a.statut] - ordre[b.statut] || a.categorie.localeCompare(b.categorie)
      }),
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
