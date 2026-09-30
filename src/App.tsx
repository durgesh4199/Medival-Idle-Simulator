import { RewardToast } from './ui/RewardToast'
import { GameNavigation, type Destination } from './ui/gameNavigation'
import { GoalPanel } from './ui/GoalPanel'
import { ItemDetails } from './ui/ItemDetails'
import { useSaveStatus } from './engine/saveSystem'
import { useEffect, useState } from 'react'
import { initGame, stopGameLoop } from './engine/gameLoop'
import type { SkillId } from './data/types'
import { AchievementsPage } from './ui/AchievementsPage'
import { BankPage } from './ui/BankPage'
import { CodexPage } from './ui/CodexPage'
import { CombatPage } from './ui/CombatPage'
import { DungeonsPage } from './ui/DungeonsPage'
import { FarmingPage } from './ui/FarmingPage'
import { Header, type View } from './ui/Header'
import { NavRail } from './ui/NavRail'
import { OfflineModal } from './ui/OfflineModal'
import { PetFoundToast } from './ui/PetFoundToast'
import { PetsPage } from './ui/PetsPage'
import { QuestsPage } from './ui/QuestsPage'
import { RanchingPage } from './ui/RanchingPage'
import { SettingsPage } from './ui/SettingsPage'
import { ShopPage } from './ui/ShopPage'
import { SkillPanel } from './ui/SkillPanel'
import { StatusBar } from './ui/StatusBar'

function App() {
  const [itemId, setItemId] = useState<string | null>(null)
  const [destination, setDestination] = useState<Destination>({ view: 'skills' })
  const saveError = useSaveStatus((s) => s.error)
  const navigate = (next: Destination) => {
    setDestination(next)
    if (next.skillId) setSelectedSkill(next.skillId)
    changeView(next.view)
  }
  const [menuOpen, setMenuOpen] = useState(false)
  const changeView = (next: View) => {
    setView(next)
    setMenuOpen(false)
  }
  const [view, setView] = useState<View>('skills')
  const [selectedSkill, setSelectedSkill] = useState<SkillId>('fishing')

  useEffect(() => {
    initGame()
    return stopGameLoop
  }, [])

  return (
    <GameNavigation.Provider value={{ navigate, inspectItem: setItemId }}>
      <div className="reference-shell flex h-dvh w-full flex-col overflow-hidden bg-app text-neutral-100">
        <Header
          view={view}
          selectedSkill={selectedSkill}
          menuOpen={menuOpen}
          onToggleMenu={() => setMenuOpen(!menuOpen)}
        />
        {saveError && view !== 'settings' && (
          <div
            role="alert"
            className="flex shrink-0 items-center gap-2 bg-amber-950 px-4 py-2 text-xs text-amber-200"
          >
            <p className="flex-1">{saveError}</p>
            <button type="button" onClick={() => changeView('settings')} className="underline">
              Open Settings
            </button>
          </div>
        )}
        <GoalPanel />
        <div className="relative flex min-h-0 flex-1 overflow-hidden">
          {menuOpen && (
            <button
              aria-label="Close navigation"
              className="absolute inset-0 z-20 bg-black/60 lg:hidden"
              onClick={() => setMenuOpen(false)}
            />
          )}
          <div
            className={`${menuOpen ? 'block' : 'hidden'} absolute inset-y-0 left-0 z-30 border-r border-line bg-rail lg:static lg:block`}
          >
            <NavRail
              view={view}
              selectedSkill={selectedSkill}
              onSelectSkill={setSelectedSkill}
              onChangeView={changeView}
            />
          </div>
          {view === 'skills' && (
            <SkillPanel
              key={`${selectedSkill}-${destination.actionId ?? ''}`}
              skillId={selectedSkill}
              initialActionId={destination.actionId}
            />
          )}
          {view === 'combat' && (
            <CombatPage key={destination.enemyId} initialEnemyId={destination.enemyId} />
          )}
          {view === 'dungeons' && (
            <DungeonsPage key={destination.dungeonId} initialDungeonId={destination.dungeonId} />
          )}
          {view === 'farming' && <FarmingPage />}
          {view === 'ranching' && <RanchingPage />}
          {view === 'bank' && <BankPage />}
          {view === 'shop' && <ShopPage />}
          {view === 'quests' && <QuestsPage />}
          {view === 'achievements' && <AchievementsPage />}
          {view === 'pets' && <PetsPage />}
          {view === 'codex' && <CodexPage />}
          {view === 'settings' && <SettingsPage />}

        </div>
        <StatusBar />
        <PetFoundToast />
        <RewardToast />
        <OfflineModal />
        {itemId && <ItemDetails key={itemId} itemId={itemId} onClose={() => setItemId(null)} />}
      </div>
    </GameNavigation.Provider>
  )
}

export default App
