// API Export — Format Ministère de l'Éducation Nationale du Sénégal
// Compatible PLANETE 3
// GET /api/export/ministere?type=eleves|profs|resultats|absences|financier&format=json|csv

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  if (!key || key.includes('placeholder')) return null
  return createClient(url, key)
}

function toCSV(headers: string[], rows: string[][]): string {
  const BOM = '\uFEFF' // Pour Excel
  const headerLine = headers.map(h => `"${h}"`).join(';')
  const dataLines = rows.map(row => row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(';'))
  return BOM + [headerLine, ...dataLines].join('\n')
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'eleves'
  const format = searchParams.get('format') || 'json'
  const ecoleId = searchParams.get('ecole_id')

  const supabase = getSupabase()
  if (!supabase) {
    return NextResponse.json({ error: 'Service non configuré' }, { status: 503 })
  }

  // Déterminer l'école
  let targetEcoleId = ecoleId
  if (!targetEcoleId) {
    // Utiliser la première école active
    const { data: ecole } = await supabase.from('ecoles').select('id').eq('actif', true).limit(1).single()
    targetEcoleId = ecole?.id
  }

  if (!targetEcoleId) {
    return NextResponse.json({ error: 'École non trouvée' }, { status: 404 })
  }

  // Info école
  const { data: ecole } = await supabase.from('ecoles').select('*').eq('id', targetEcoleId).single()

  const metadata = {
    ecole: ecole?.nom || 'Inconnue',
    ville: ecole?.ville || '',
    region: ecole?.region || '',
    date_export: new Date().toISOString(),
    annee_scolaire: '2025-2026',
    format_version: '1.0',
    plateforme: 'SmartSchool SN v2.0',
  }

  try {
    switch (type) {
      case 'eleves': {
        const { data: eleves } = await supabase
          .from('eleves')
          .select('matricule, nom, prenom, date_naissance, sexe, classe_id, actif, classes(nom, niveau)')
          .eq('ecole_id', targetEcoleId)
          .eq('actif', true)
          .order('nom')

        const rows = (eleves || []).map((e: any) => ({
          matricule: e.matricule || '',
          nom: e.nom,
          prenom: e.prenom,
          date_naissance: e.date_naissance || '',
          sexe: e.sexe || '',
          classe: e.classes?.nom || '',
          niveau: e.classes?.niveau || '',
          statut: e.actif ? 'Actif' : 'Inactif',
        }))

        if (format === 'csv') {
          const csv = toCSV(
            ['Matricule', 'Nom', 'Prénom', 'Date naissance', 'Sexe', 'Classe', 'Niveau', 'Statut'],
            rows.map(r => [r.matricule, r.nom, r.prenom, r.date_naissance, r.sexe, r.classe, r.niveau, r.statut])
          )
          return new Response(csv, {
            headers: {
              'Content-Type': 'text/csv; charset=utf-8',
              'Content-Disposition': `attachment; filename="eleves_${metadata.annee_scolaire}.csv"`,
            },
          })
        }
        return NextResponse.json({ metadata, type: 'eleves', total: rows.length, data: rows })
      }

      case 'profs': {
        const { data: profs } = await supabase
          .from('utilisateurs')
          .select('nom, prenom, telephone, actif')
          .eq('ecole_id', targetEcoleId)
          .eq('role', 'professeur')
          .order('nom')

        const rows = (profs || []).map((p: any) => ({
          nom: p.nom,
          prenom: p.prenom,
          telephone: p.telephone || '',
          statut: p.actif ? 'Actif' : 'Inactif',
        }))

        if (format === 'csv') {
          const csv = toCSV(
            ['Nom', 'Prénom', 'Téléphone', 'Statut'],
            rows.map(r => [r.nom, r.prenom, r.telephone, r.statut])
          )
          return new Response(csv, {
            headers: {
              'Content-Type': 'text/csv; charset=utf-8',
              'Content-Disposition': `attachment; filename="enseignants_${metadata.annee_scolaire}.csv"`,
            },
          })
        }
        return NextResponse.json({ metadata, type: 'enseignants', total: rows.length, data: rows })
      }

      case 'resultats': {
        const { data: moyennes } = await supabase
          .from('v_moyennes_generales')
          .select('eleve_id, trimestre, moyenne_generale, rang')

        const { data: eleves } = await supabase
          .from('eleves')
          .select('id, matricule, nom, prenom, classes(nom)')
          .eq('ecole_id', targetEcoleId)

        const elevesMap = new Map((eleves || []).map((e: any) => [e.id, e]))

        const rows = (moyennes || []).map((m: any) => {
          const eleve = elevesMap.get(m.eleve_id) as any
          return {
            matricule: eleve?.matricule || '',
            nom: eleve?.nom || '',
            prenom: eleve?.prenom || '',
            classe: eleve?.classes?.nom || '',
            trimestre: m.trimestre,
            moyenne_generale: Number(m.moyenne_generale || 0).toFixed(2),
            rang: m.rang || '',
            decision: Number(m.moyenne_generale) >= 10 ? 'Admis' : 'En difficulté',
          }
        })

        if (format === 'csv') {
          const csv = toCSV(
            ['Matricule', 'Nom', 'Prénom', 'Classe', 'Trimestre', 'Moyenne', 'Rang', 'Décision'],
            rows.map(r => [r.matricule, r.nom, r.prenom, r.classe, String(r.trimestre), r.moyenne_generale, String(r.rang), r.decision])
          )
          return new Response(csv, {
            headers: {
              'Content-Type': 'text/csv; charset=utf-8',
              'Content-Disposition': `attachment; filename="resultats_${metadata.annee_scolaire}.csv"`,
            },
          })
        }
        return NextResponse.json({ metadata, type: 'resultats', total: rows.length, data: rows })
      }

      case 'absences': {
        const { data: eleves } = await supabase
          .from('eleves')
          .select('id, matricule, nom, prenom, classes(nom)')
          .eq('ecole_id', targetEcoleId)

        const { data: absences } = await supabase
          .from('absences_eleves')
          .select('eleve_id, justifiee')
          .eq('ecole_id', targetEcoleId)

        const absMap = new Map<string, { total: number; justifiees: number }>()
        for (const a of (absences || []) as any[]) {
          const cur = absMap.get(a.eleve_id) || { total: 0, justifiees: 0 }
          cur.total++
          if (a.justifiee) cur.justifiees++
          absMap.set(a.eleve_id, cur)
        }

        const rows = (eleves || []).map((e: any) => {
          const abs = absMap.get(e.id) || { total: 0, justifiees: 0 }
          return {
            matricule: e.matricule || '',
            nom: e.nom,
            prenom: e.prenom,
            classe: e.classes?.nom || '',
            nb_absences: abs.total,
            nb_justifiees: abs.justifiees,
            nb_non_justifiees: abs.total - abs.justifiees,
            taux_presence: abs.total > 0 ? `${((1 - abs.total / 180) * 100).toFixed(1)}%` : '100%',
          }
        })

        if (format === 'csv') {
          const csv = toCSV(
            ['Matricule', 'Nom', 'Prénom', 'Classe', 'Absences', 'Justifiées', 'Non justifiées', 'Taux présence'],
            rows.map(r => [r.matricule, r.nom, r.prenom, r.classe, String(r.nb_absences), String(r.nb_justifiees), String(r.nb_non_justifiees), r.taux_presence])
          )
          return new Response(csv, {
            headers: {
              'Content-Type': 'text/csv; charset=utf-8',
              'Content-Disposition': `attachment; filename="absences_${metadata.annee_scolaire}.csv"`,
            },
          })
        }
        return NextResponse.json({ metadata, type: 'absences', total: rows.length, data: rows })
      }

      case 'financier': {
        const { data: factures } = await supabase
          .from('factures')
          .select('montant_total, montant_paye, statut')
          .eq('ecole_id', targetEcoleId)

        const { data: eleves } = await supabase
          .from('eleves')
          .select('id')
          .eq('ecole_id', targetEcoleId)
          .eq('actif', true)

        const totalFacture = (factures || []).reduce((s: number, f: any) => s + (f.montant_total || 0), 0)
        const totalPaye = (factures || []).reduce((s: number, f: any) => s + (f.montant_paye || 0), 0)
        const totalImpaye = totalFacture - totalPaye
        const tauxRecouvrement = totalFacture > 0 ? ((totalPaye / totalFacture) * 100).toFixed(1) : '0'

        const bilan = {
          total_eleves: (eleves || []).length,
          total_factures: (factures || []).length,
          montant_total_facture: totalFacture,
          montant_total_paye: totalPaye,
          montant_total_impaye: totalImpaye,
          taux_recouvrement: `${tauxRecouvrement}%`,
        }

        if (format === 'csv') {
          const csv = toCSV(
            ['Indicateur', 'Valeur'],
            [
              ['Total élèves', String(bilan.total_eleves)],
              ['Total factures', String(bilan.total_factures)],
              ['Montant total facturé (FCFA)', String(bilan.montant_total_facture)],
              ['Montant total payé (FCFA)', String(bilan.montant_total_paye)],
              ['Montant total impayé (FCFA)', String(bilan.montant_total_impaye)],
              ['Taux de recouvrement', bilan.taux_recouvrement],
            ]
          )
          return new Response(csv, {
            headers: {
              'Content-Type': 'text/csv; charset=utf-8',
              'Content-Disposition': `attachment; filename="bilan_financier_${metadata.annee_scolaire}.csv"`,
            },
          })
        }
        return NextResponse.json({ metadata, type: 'financier', data: bilan })
      }

      default:
        return NextResponse.json({ error: `Type d'export inconnu: ${type}` }, { status: 400 })
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
