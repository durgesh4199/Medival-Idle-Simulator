import { useEffect, useState } from 'react'
import { initGame } from './engine/gameLoop'
import type { SkillId } from './data/types'
import { AchievementsPage } from './ui/AchievementsPage'
import { BankPage } from './ui/BankPage'
import { CombatPage } from './ui/CombatPage'
import { DungeonsPage } from './ui/DungeonsPage'
import { Header, type View } from './ui/Header'
import { NavRail } from './ui/NavRail'
import { OfflineModal } from './ui/OfflineModal'
import { QuestsPage } from './ui/QuestsPage'
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
        {view === 'bank' && <BankPage />}
        {view === 'shop' && <ShopPage />}
        {view === 'quests' && <QuestsPage />}
        {view === 'achievements' && <AchievementsPage />}
      </div>
      <StatusBar />
      <OfflineModal />
    </div>
  )
}

export default App
