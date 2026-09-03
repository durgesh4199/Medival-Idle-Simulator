import { petsById } from '../data'
import { useGameStore } from '../state/gameStore'
import { useNow } from './useNow'

/** How long the "you found a pet" toast stays up — same idea as
 *  CombatPage's defeat banner and DungeonsPage's clear banner. */
const TOAST_MS = 8000

/** Global toast for a pet found live, regardless of which page you're on
 *  when it happens — a pet found while away surfaces via the offline
 *  summary modal instead, so this only ever fires during active play. */
export function PetFoundToast() {
  const lastPetFound = useGameStore((s) => s.lastPetFound)
  const now = useNow(500)

  if (!lastPetFound || now - lastPetFound.at >= TOAST_MS) return null
  const pet = petsById[lastPetFound.petId]
  if (!pet) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 top-16 z-40 flex justify-center">
      <div className="flex items-center gap-2 rounded-full border border-gold/40 bg-panel px-4 py-2 text-sm text-gold shadow-lg">
        <span className="text-lg">{pet.icon}</span>
        <span>You found a pet: {pet.name}!</span>
      </div>
    </div>
  )
}
