import { useEffect, useState } from 'react'
import { initGame } from './engine/gameLoop'
import type { SkillId } from './data/types'
import { BankPage } from './ui/BankPage'
import { CombatPage } from './ui/CombatPage'
import { Header, type View } from './ui/Header'
import { OfflineModal } from './ui/OfflineModal'
import { QuestsPage } from './ui/QuestsPage'
import { ShopPage } from './ui/ShopPage'
import { Sidebar } from './ui/Sidebar'
import { SkillPanel } from './ui/SkillPanel'

function App() {
  const [view, setView] = useState<View>('skills')
  const [selectedSkill, setSelectedSkill] = useState<SkillId>('fishing')

  useEffect(() => {
    initGame()
  }, [])

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-neutral-950 text-neutral-100">
      <Header view={view} onChangeView={setView} selectedSkill={selectedSkill} />
      {view === 'skills' && (
        <div className="flex flex-1 overflow-hidden">
          <Sidebar selected={selectedSkill} onSelect={setSelectedSkill} />
          <SkillPanel key={selectedSkill} skillId={selectedSkill} />
        </div>
      )}
      {view === 'combat' && <CombatPage />}
      {view === 'bank' && <BankPage />}
      {view === 'shop' && <ShopPage />}
      {view === 'quests' && <QuestsPage />}
      <OfflineModal />
    </div>
  )
}

export default App
