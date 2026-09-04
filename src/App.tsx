import { useEffect, useState } from 'react'
import { initGame } from './engine/gameLoop'
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
  const [view, setView] = useState<View>('skills')
  const [selectedSkill, setSelectedSkill] = useState<SkillId>('fishing')

  useEffect(() => {
    initGame()
  }, [])

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-app text-neutral-100">
      <Header view={view} selectedSkill={selectedSkill} />
      <div className="flex flex-1 overflow-hidden">
        <NavRail
          view={view}
          selectedSkill={selectedSkill}
          onSelectSkill={setSelectedSkill}
          onChangeView={setView}
        />
        {view === 'skills' && <SkillPanel key={selectedSkill} skillId={selectedSkill} />}
        {view === 'combat' && <CombatPage />}
        {view === 'dungeons' && <DungeonsPage />}
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
      <OfflineModal />
    </div>
  )
}

export default App
