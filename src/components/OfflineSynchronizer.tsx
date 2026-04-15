'use client'

import { useEffect, useState } from 'react'
import { getUnsyncedNotes, markNoteAsSynced } from '@/lib/offline/db'
import toast from 'react-hot-toast'

export function OfflineSynchronizer() {
  const [isOnline, setIsOnline] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    // Vérification initiale
    setIsOnline(navigator.onLine)

    const handleOnline = () => {
      setIsOnline(true)
      toast.success('Connexion rétablie. Synchronisation en cours...', { icon: '🔄' })
      syncData()
    }

    const handleOffline = () => {
      setIsOnline(false)
      toast.error('Vous êtes hors-ligne. Mode hors-ligne activé.', { icon: '📶' })
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Sync au chargement si online
    if (navigator.onLine) {
      syncData()
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const syncData = async () => {
    if (isSyncing) return
    setIsSyncing(true)

    try {
      const unsyncedNotes = await getUnsyncedNotes()
      
      if (unsyncedNotes.length > 0) {
        let syncedCount = 0
        
        for (const note of unsyncedNotes) {
          try {
            // Simulation API Call
            // await fetch('/api/notes', { method: 'POST', body: JSON.stringify(note) })
            
            // Attente de validation API
            await new Promise(r => setTimeout(r, 200)) 
            
            await markNoteAsSynced(note.id)
            syncedCount++
          } catch (error) {
            console.error('Erreur sync note:', error)
          }
        }
        
        if (syncedCount > 0) {
           toast.success(`${syncedCount} note(s) synchronisée(s) avec succès !`)
        }
      }
    } catch (err) {
      console.error('Erreur globale sync:', err)
    } finally {
      setIsSyncing(false)
    }
  }

  // Composant invisible, agit uniquement en arrière-plan
  return null
}
