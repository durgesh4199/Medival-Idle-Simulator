import {
  combatSkillDisplay,
  enemiesById,
  getItem,
  quests,
  questsById,
  skills,
} from '../data'
import type { QuestRequirement } from '../data/types'
import { useGameStore } from '../state/gameStore'

function skillLabel(skillId: string): { icon: string; name: string } {
  const skill = skills[skillId as keyof typeof skills]
  if (skill) return { icon: skill.icon, name: skill.name }
  const combatSkill = combatSkillDisplay[skillId as keyof typeof combatSkillDisplay]
  if (combatSkill) return { icon: combatSkill.icon, name: combatSkill.label }
  return { icon: '❔', name: skillId }
}

function RequirementRow({ req }: { req: QuestRequirement }) {
  const levelOf = useGameStore((s) => s.levelOf)
  const inventory = useGameStore((s) => s.inventory)
  const killCounts = useGameStore((s) => s.killCounts)
  const completedQuestIds = useGameStore((s) => s.completedQuestIds)

  let label: string
  let current: number
  let target: number

  switch (req.type) {
    case 'skillLevel': {
      const skill = skillLabel(req.skillId)
      label = `${skill.icon} ${skill.name} level ${req.level}`
      current = levelOf(req.skillId)
      target = req.level
      break
    }
    case 'itemCount': {
      const item = getItem(req.itemId)
      label = `${item.icon} ${item.name} x${req.qty}`
      current = inventory[req.itemId] ?? 0
      target = req.qty
      break
    }
    case 'kills': {
      const enemy = enemiesById[req.enemyId]
      label = `${enemy?.icon ?? '👹'} Defeat ${req.count}x ${enemy?.name ?? req.enemyId}`
      current = killCounts[req.enemyId] ?? 0
      target = req.count
      break
    }
    case 'questComplete': {
      const quest = questsById[req.questId]
      label = `${quest?.icon ?? '📜'} Complete "${quest?.name ?? req.questId}"`
      current = completedQuestIds[req.questId] ? 1 : 0
      target = 1
      break
    }
  }

  const met = current >= target
  return (
    <div className="flex items-center justify-between text-sm">
      <span className={met ? 'text-neutral-300' : 'text-neutral-400'}>
        {met ? '✅' : '⬜'} {label}
      </span>
      {req.type !== 'questComplete' && (
        <span className={met ? 'text-teal-300' : 'text-neutral-500'}>
          {Math.min(current, target)}/{target}
        </span>
      )}
    </div>
  )
}

function QuestCard({ questId }: { questId: string }) {
  const quest = questsById[questId]
  const completedQuestIds = useGameStore((s) => s.completedQuestIds)
  const canCompleteQuestById = useGameStore((s) => s.canCompleteQuestById)
  const completeQuest = useGameStore((s) => s.completeQuest)

  if (!quest) return null
  const isComplete = Boolean(completedQuestIds[quest.id])
  const canComplete = !isComplete && canCompleteQuestById(quest.id)

  return (
    <div
      className={`overflow-hidden rounded-xl border bg-neutral-900 ${
        isComplete ? 'border-teal-500/30' : 'border-neutral-800'
      }`}
    >
      <div className="flex items-center gap-2 border-b border-neutral-800 bg-neutral-950 px-4 py-2">
        <span className="text-xl">{quest.icon}</span>
        <span className="font-semibold text-neutral-100">{quest.name}</span>
        {isComplete && (
          <span className="ml-auto rounded-full bg-teal-500/15 px-2 py-0.5 text-xs font-semibold text-teal-300">
            ✓ Completed
          </span>
        )}
      </div>

      <div className="space-y-3 p-4">
        <p className="text-sm text-neutral-400">{quest.description}</p>

        <div>
          <div className="mb-1 text-xs font-semibold uppercase text-neutral-500">Requirements</div>
          <div className="space-y-1">
            {quest.requirements.map((req, i) => (
              // Requirement shape (type + target ids) is stable per quest,
              // so index is a safe key here — there's no reordering.
              <RequirementRow key={i} req={req} />
            ))}
          </div>
        </div>

        <div>
          <div className="mb-1 text-xs font-semibold uppercase text-neutral-500">Rewards</div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-300">
            {quest.rewards.gold && <span>🪙 {quest.rewards.gold} gold</span>}
            {Object.entries(quest.rewards.xp ?? {}).map(([skillId, xp]) => {
              const skill = skillLabel(skillId)
              return (
                <span key={skillId}>
                  {skill.icon} +{xp} {skill.name} XP
                </span>
              )
            })}
            {(quest.rewards.items ?? []).map((reward) => {
              const item = getItem(reward.itemId)
              return (
                <span key={reward.itemId}>
                  {item.icon} {item.name}
                  {reward.qty > 1 ? ` x${reward.qty}` : ''}
                </span>
              )
            })}
          </div>
        </div>

        {!isComplete && (
          <button
            type="button"
            disabled={!canComplete}
            onClick={() => completeQuest(quest.id)}
            className="w-full rounded-lg bg-teal-500 py-2 text-sm font-semibold text-neutral-950 transition-colors hover:bg-teal-400 disabled:cursor-not-allowed disabled:bg-neutral-800 disabled:text-neutral-500"
          >
            Complete Quest
          </button>
        )}
      </div>
    </div>
  )
}

export function QuestsPage() {
  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
        {quests.map((quest) => (
          <QuestCard key={quest.id} questId={quest.id} />
        ))}
      </div>
    </div>
  )
}
