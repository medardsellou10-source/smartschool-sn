import { openDB, DBSchema, IDBPDatabase } from 'idb'

interface SmartSchoolDB extends DBSchema {
  notes_cache: {
    key: string
    value: {
      id: string
      eleveId: string
      matiereId: string
      note: number
      synced: number
      timestamp: number
    }
    indexes: { 'by-sync': number }
  }
  gps_cache: {
    key: string
    value: {
      id: string
      profId: string
      latitude: number
      longitude: number
      synced: number
      timestamp: number
    }
  }
}

let dbPromise: Promise<IDBPDatabase<SmartSchoolDB>> | null = null

if (typeof window !== 'undefined') {
  dbPromise = openDB<SmartSchoolDB>('smartschool-offline-db', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('notes_cache')) {
        const notesStore = db.createObjectStore('notes_cache', { keyPath: 'id' })
        notesStore.createIndex('by-sync', 'synced')
      }
      if (!db.objectStoreNames.contains('gps_cache')) {
        db.createObjectStore('gps_cache', { keyPath: 'id' })
      }
    },
  })
}

/**
 * Sauvegarde une note localement en mode hors-ligne
 */
export async function saveNoteOffline(note: { eleveId: string; matiereId: string; note: number }) {
  if (!dbPromise) return null
  const db = await dbPromise
  const record = {
    id: `${note.eleveId}-${note.matiereId}-${Date.now()}`,
    ...note,
    synced: 0,
    timestamp: Date.now(),
  }
  await db.put('notes_cache', record)
  return record
}

/**
 * Sauvegarde un pointage GPS localement
 */
export async function saveGpsOffline(pointage: { profId: string; latitude: number; longitude: number }) {
  if (!dbPromise) return null
  const db = await dbPromise
  const record = {
    id: `${pointage.profId}-${Date.now()}`,
    ...pointage,
    synced: 0,
    timestamp: Date.now()
  }
  await db.put('gps_cache', record)
  return record
}

/**
 * Récupère les données non synchronisées
 */
export async function getUnsyncedNotes() {
  if (!dbPromise) return []
  const db = await dbPromise
  return db.getAllFromIndex('notes_cache', 'by-sync', 0)
}

/**
 * Marque les données comme synchronisées
 */
export async function markNoteAsSynced(id: string) {
  if (!dbPromise) return
  const db = await dbPromise
  const note = await db.get('notes_cache', id)
  if (note) {
    note.synced = 1
    await db.put('notes_cache', note)
  }
}
