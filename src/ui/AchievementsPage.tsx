import { achievements, achievementsById, combatSkillDisplay, dungeonsById, skills } from '../data'
import type { AchievementRequirement } from '../data/types'
import { useGameStore } from '../state/gameStore'

function skillLabel(skillId: string): { icon: string; name: string } {
  const skill = skills[skillId as keyof typeof skills]
  if (skill) return { icon: skill.icon, name: skill.name }
  const combatSkill = combatSkillDisplay[skillId as keyof typeof combatSkillDisplay]
  if (combatSkill) return { icon: combatSkill.icon, name: combatSkill.label }
  return { icon: '❔', name: skillId }
}

function RequirementRow({ req }: { req: AchievementRequirement }) {
  const levelOf = useGameStore((s) => s.levelOf)
  const killCounts = useGameStore((s) => s.killCounts)
  const completedQuestIds = useGameStore((s) => s.completedQuestIds)
  const dungeonClearCounts = useGameStore((s) => s.dungeonClearCounts)

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
    case 'kills': {
      label = `⚔️ Defeat ${req.count}x ${req.enemyId.replace(/_/g, ' ')}`
      current = killCounts[req.enemyId] ?? 0
      target = req.count
      break
    }
    case 'questComplete': {
      label = `📜 Complete "${req.questId.replace(/_/g, ' ')}"`
      current = completedQuestIds[req.questId] ? 1 : 0
      target = 1
      break
    }
    case 'dungeonCleared': {
      const dungeon = dungeonsById[req.dungeonId]
      label = `${dungeon?.icon ?? '🗝️'} Clear ${dungeon?.name ?? req.dungeonId} x${req.count}`
      current = dungeonClearCounts[req.dungeonId] ?? 0
      target = req.count
      break
    }
  }

  const met = current >= target
  return (
    <div className="flex items-center justify-between text-sm">
      <span className={`capitalize ${met ? 'text-neutral-300' : 'text-neutral-400'}`}>
        {met ? '✅' : '⬜'} {label}
      </span>
      {req.type !== 'questComplete' && (
        <span className={met ? 'text-gold' : 'text-neutral-500'}>
          {Math.min(current, target)}/{target}
        </span>
      )}
    </div>
  )
}

function AchievementCard({ achievementId }: { achievementId: string }) {
  const achievement = achievementsById[achievementId]
  const completedAchievementIds = useGameStore((s) => s.completedAchievementIds)
  const canCompleteAchievementById = useGameStore((s) => s.canCompleteAchievementById)
  const completeAchievement = useGameStore((s) => s.completeAchievement)

  if (!achievement) return null
  const isComplete = Boolean(completedAchievementIds[achievement.id])
  const canComplete = !isComplete && canCompleteAchievementById(achievement.id)
  const hasReward = achievement.reward && (achievement.reward.gold || achievement.reward.xp)

  return (
    <div
      className={`overflow-hidden rounded-xl border bg-panel ${
        isComplete ? 'border-gold/30' : 'border-line'
      }`}
    >
      <div className="flex items-center gap-2 border-b border-line bg-rail px-4 py-2">
        <span className="text-xl">{achievement.icon}</span>
        <span className="font-semibold text-neutral-100">{achievement.name}</span>
        {isComplete && (
          <span className="ml-auto rounded-full bg-gold/15 px-2 py-0.5 text-xs font-semibold text-gold">
            ✓ Claimed
          </span>
        )}
      </div>

      <div className="space-y-3 p-4">
        <p className="text-sm text-neutral-400">{achievement.description}</p>

        <div>
          <div className="mb-1 text-xs font-semibold uppercase text-neutral-500">Requirements</div>
          <div className="space-y-1">
            {achievement.requirements.map((req, i) => (
              // Requirement shape (type + target ids) is stable per
              // achievement, so index is a safe key — there's no reordering.
              <RequirementRow key={i} req={req} />
            ))}
          </div>
        </div>

        {hasReward && (
          <div>
            <div className="mb-1 text-xs font-semibold uppercase text-neutral-500">Reward</div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-300">
              {achievement.reward?.gold && <span>🪙 {achievement.reward.gold} gold</span>}
              {Object.entries(achievement.reward?.xp ?? {}).map(([skillId, xp]) => {
                const skill = skillLabel(skillId)
                return (
                  <span key={skillId}>
                    {skill.icon} +{xp} {skill.name} XP
                  </span>
                )
              })}
            </div>
          </div>
        )}

        {!isComplete && (
          <button
            type="button"
            disabled={!canComplete}
            onClick={() => completeAchievement(achievement.id)}
            className="w-full rounded-lg bg-brand py-2 text-sm font-semibold text-neutral-950 transition-colors hover:bg-brand-dim disabled:cursor-not-allowed disabled:bg-panel-soft disabled:text-neutral-500"
          >
            Claim Achievement
          </button>
        )}
      </div>
    </div>
  )
}

export function AchievementsPage() {
  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
        {achievements.map((achievement) => (
          <AchievementCard key={achievement.id} achievementId={achievement.id} />
        ))}
      </div>
    </div>
  )
}
