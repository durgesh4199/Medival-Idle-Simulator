import { actions, enemiesById, items, quests, questsById, skills } from '../data'
import type { SkillId } from '../data/types'
import { useGameStore } from '../state/gameStore'
import { useGameNavigation } from './gameNavigation'

/** Guidance follows actual progression, so old saves automatically skip finished steps. */
export function GoalPanel() {
  const state = useGameStore()
  const { navigate, inspectItem } = useGameNavigation()
  const equipped = Boolean(state.equipment.weapon)
  const stocked = Object.entries(state.inventory).some(
    ([id, qty]) => qty > 0 && items[id]?.healAmount,
  )
  const tutorialDone = Boolean(state.completedQuestIds.blooded_blade)
  const nextQuest =
    !tutorialDone && state.completedQuestIds.kitchen_basics
      ? questsById.blooded_blade
      : quests.find(
          (q) =>
            !state.completedQuestIds[q.id] &&
            q.requirements.every(
              (r) => r.type !== 'questComplete' || state.completedQuestIds[r.questId],
            ),
        )
  const pinnedQuest =
    state.pinnedQuestId && !state.completedQuestIds[state.pinnedQuestId]
      ? questsById[state.pinnedQuestId]
      : undefined
  const quest = pinnedQuest ?? nextQuest
  const foodPrepared = Boolean(
    state.selectedFoodItemId && (state.inventory[state.selectedFoodItemId] ?? 0) > 0,
  )
  let title = quest ? quest.name : 'Your next adventure'
  let description = 'Explore the Codex, train your skills, and prepare for the next dungeon.'
  let button = 'Explore Codex'
  let go = () => navigate({ view: 'codex' })
  if (!pinnedQuest && !tutorialDone && state.completedQuestIds.kitchen_basics && !equipped) {
    title = 'Equip your first weapon'
    description =
      'Your Kitchen Basics reward is in the Bank. Equip the Bronze Sword before fighting.'
    button = 'Open Bank'
    go = () => navigate({ view: 'bank' })
  } else if (!pinnedQuest && !tutorialDone && state.completedQuestIds.kitchen_basics && !stocked) {
    title = 'Pack food for combat'
    description =
      'Cook some extra herring or buy food, then select it on the Combat screen for automatic healing.'
    button = 'Find cooked herring'
    go = () => inspectItem('cooked_herring')
  } else if (
    !pinnedQuest &&
    !tutorialDone &&
    state.completedQuestIds.kitchen_basics &&
    !foodPrepared
  ) {
    title = 'Select your combat food'
    description =
      'Choose your cooked food before starting the fight. It will be eaten automatically at half HP.'
    button = 'Prepare combat'
    go = () => navigate({ view: 'combat', enemyId: 'giant_rat' })
  } else if (quest) {
    const ready = state.canCompleteQuestById(quest.id)
    if (ready) {
      description = 'All requirements are met. Claim your reward to continue.'
      button = 'Claim reward'
      go = () => state.completeQuest(quest.id)
    } else {
      const req = quest.requirements.find((r) => {
        switch (r.type) {
          case 'itemCount':
            return (state.inventory[r.itemId] ?? 0) < r.qty
          case 'kills':
            return (state.killCounts[r.enemyId] ?? 0) < r.count
          case 'skillLevel':
            return state.levelOf(r.skillId) < r.level
          case 'questComplete':
            return !state.completedQuestIds[r.questId]
        }
      })
      if (req?.type === 'itemCount') {
        const item = items[req.itemId]
        description = `Collect ${req.qty} ${item.name} (${Math.min(req.qty, state.inventory[req.itemId] ?? 0)}/${req.qty}). Keep these for the quest.`
        const source = actions.find(
          (a) => a.outputs.some((o) => o.itemId === req.itemId) && state.canStartAction(a.id),
        )
        button = source ? `Go to ${skills[source.skillId].name}` : 'Find sources'
        go = source
          ? () => navigate({ view: 'skills', skillId: source.skillId, actionId: source.id })
          : () => inspectItem(req.itemId)
      } else if (req?.type === 'kills') {
        description = `Defeat ${req.count} ${enemiesById[req.enemyId].name} (${Math.min(req.count, state.killCounts[req.enemyId] ?? 0)}/${req.count}). Equip a weapon and select food first.`
        button = 'Go to combat'
        go = () => navigate({ view: 'combat', enemyId: req.enemyId })
      } else if (req?.type === 'skillLevel') {
        description = `Train ${req.skillId} to level ${req.level}. Current level: ${state.levelOf(req.skillId)}.`
        button = 'Train skill'
        go = () =>
          navigate(
            Object.hasOwn(skills, req.skillId)
              ? { view: 'skills', skillId: req.skillId as SkillId }
              : req.skillId === 'farming'
                ? { view: 'farming' }
                : req.skillId === 'ranching'
                  ? { view: 'ranching' }
                  : { view: 'combat' },
          )
      } else if (req?.type === 'questComplete') {
        description = `Complete ${questsById[req.questId].name} first.`
        button = 'View quests'
        go = () => navigate({ view: 'quests' })
      }
    }
  }
  const milestones = [
    [
      'Catch five herring and claim A Fisherman’s Start',
      Boolean(state.completedQuestIds.a_fishermans_start),
    ],
    [
      'Cook three herring and claim Kitchen Basics',
      Boolean(state.completedQuestIds.kitchen_basics),
    ],
    ['Equip your sword in the Bank', equipped || tutorialDone],
    ['Stock food and select it in Combat', foodPrepared || tutorialDone],
    ['Defeat three Giant Rats and claim Blooded Blade', tutorialDone],
  ] as const
  return (
    <section
      aria-label="Adventure guide"
      className="max-h-[40dvh] shrink-0 overflow-y-auto border-b border-gold/20 bg-panel px-3 py-2 sm:px-4"
    >
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-widest text-gold">
            {state.pinnedQuestId === quest?.id ? 'Pinned quest' : 'Next goal'}
          </p>
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs text-neutral-400">{description}</p>
        </div>
        <button
          type="button"
          onClick={go}
          className="shrink-0 rounded-lg border border-gold/30 bg-gold/10 px-3 py-2 text-xs font-semibold text-gold"
        >
          {button}
        </button>
      </div>
      <details className="mt-1 text-xs">
        <summary className="w-fit cursor-pointer py-1 text-neutral-400">
          {tutorialDone ? 'Adventure guide completed' : 'Your first adventure'} ·{' '}
          {milestones.filter(([, done]) => done).length}/5 steps
        </summary>
        <ol className="mt-2 space-y-1 pb-2">
          {milestones.map(([text, done], i) => (
            <li key={text} className={done ? 'text-brand' : 'text-neutral-300'}>
              {done ? '✓' : `${i + 1}.`} {text}
            </li>
          ))}
        </ol>
        <p className="pb-2 text-neutral-400">
          One training or combat activity runs at a time. Farming and Ranching run alongside it.
          Progress autosaves every 10 seconds; export a backup in Settings.
        </p>
        {state.pinnedQuestId && (
          <button
            type="button"
            onClick={() => state.pinQuest(null)}
            className="text-gold underline"
          >
            Unpin quest
          </button>
        )}
      </details>
    </section>
  )
}
