import { createContext, useContext } from 'react'
import type { SkillId } from '../data/types'
import type { View } from './Header'

export interface Destination {
  view: View
  skillId?: SkillId
  actionId?: string
  enemyId?: string
  dungeonId?: string
}
export const GameNavigation = createContext<{
  navigate: (destination: Destination) => void
  inspectItem: (itemId: string) => void
}>({ navigate: () => {}, inspectItem: () => {} })
export const useGameNavigation = () => useContext(GameNavigation)
