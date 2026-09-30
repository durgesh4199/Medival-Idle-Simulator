import {
  actionsById,
  achievementsById,
  combatSkillOrder,
  dungeonsById,
  enemiesById,
  farmingCropsById,
  farmingPlotUnlockLevels,
  items,
  petsById,
  prayersById,
  questsById,
  ranchAnimalsById,
  ranchPenUnlockLevels,
  skills,
  spellsById,
} from '../data'
import type { SaveData } from './saveSystem'

const record = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)
const number = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= Number.MAX_SAFE_INTEGER
const integer = (v: unknown): v is number => number(v) && Number.isSafeInteger(v)
const known = (table: object, id: unknown): id is string =>
  typeof id === 'string' && Object.hasOwn(table, id)
const skillIds = Object.fromEntries(
  [...Object.keys(skills), ...combatSkillOrder, 'slayer', 'farming', 'ranching'].map((id) => [
    id,
    true,
  ]),
)
const masteryIds = { ...actionsById, ...farmingCropsById, ...ranchAnimalsById }
const poolIds = { ...skills, farming: true, ranching: true }
const slots = ['helmet', 'amulet', 'body', 'weapon', 'shield', 'legs', 'gloves', 'boots', 'ring']

export type SaveValidation = { ok: true; data: SaveData } | { ok: false; error: string }

/** Validate before touching live state. Missing fields from older version-1
 * saves receive defaults; present but malformed fields are always rejected. */
export function parseSaveData(value: unknown, now = Date.now()): SaveValidation {
  const fail = (error: string): SaveValidation => ({ ok: false, error })
  if (!record(value)) return fail('The save must be a JSON object.')
  if (value.version !== 1)
    return fail('Unsupported save version. Use a version 1 Medieval Idle save.')
  if (!integer(value.gold)) return fail('Gold must be a nonnegative whole number.')
  const timestamp = (v: unknown) => number(v) && v <= now + 60_000
  if (!timestamp(value.savedAt)) return fail('The save timestamp is missing or invalid.')
  const map = (v: unknown, ids: object, check: (v: unknown) => boolean) =>
    record(v) && Object.entries(v).every(([id, n]) => known(ids, id) && check(n))
  if (!map(value.skillXp, skillIds, number))
    return fail('Skill XP contains an unknown skill or invalid number.')
  if (!map(value.inventory, items, integer))
    return fail('Inventory contains an unknown item or invalid quantity.')
  for (const [field, ids, check] of [
    ['masteryXp', masteryIds, number],
    ['masteryPoolXp', poolIds, number],
    ['killCounts', enemiesById, integer],
    ['dungeonClearCounts', dungeonsById, integer],
    ['completedQuestIds', questsById, (v: unknown) => typeof v === 'boolean'],
    ['completedAchievementIds', achievementsById, (v: unknown) => typeof v === 'boolean'],
    ['ownedPetIds', petsById, (v: unknown) => typeof v === 'boolean'],
  ] as const) {
    if (value[field] !== undefined && !map(value[field], ids, check))
      return fail(`Invalid ${field} values.`)
  }
  if (
    value.equipment !== undefined &&
    (!record(value.equipment) ||
      !Object.entries(value.equipment).every(
        ([slot, id]) =>
          slots.includes(slot) && known(items, id) && items[id].equipment?.slot === slot,
      ))
  ) {
    return fail('Equipment contains an unknown item or an incorrect slot.')
  }
  if (value.pinnedQuestId != null && !known(questsById, value.pinnedQuestId))
    return fail('Unknown pinned quest.')
  const active = value.activeAction
  if (
    active != null &&
    (!record(active) ||
      !known(actionsById, active.actionId) ||
      !timestamp(active.startedAt) ||
      !number(active.durationMs) ||
      active.durationMs < 1 ||
      active.durationMs > actionsById[active.actionId].durationMs[1])
  )
    return fail('Invalid gathering action or timer.')
  if (record(active)) {
    const action = actionsById[active.actionId as string]
    if (active.hitsRemaining !== undefined && (!Number.isInteger(active.hitsRemaining) ||
      (active.hitsRemaining as number) < 1 || (active.hitsRemaining as number) > (action.hitsPerCycle ?? 1)))
      return fail('Invalid remaining tree hits.')
    if (active.priorityItemId != null && (action.skillId !== 'fishing' ||
      !action.outputs.some(o => o.itemId === active.priorityItemId && o.itemId !== 'junk')))
      return fail('Invalid priority fish.')
    if (active.baitItemId != null && (action.skillId !== 'fishing' || active.baitItemId !== 'feathers'))
      return fail('Invalid fishing bait.')
  }
  const combat = value.combat
  const fight = (v: Record<string, unknown>) =>
    number(v.enemyHp) &&
    number(v.playerHp) &&
    timestamp(v.nextPlayerAttackAt) &&
    timestamp(v.nextEnemyAttackAt)
  // Attack timers can be slightly ahead of now and may be a full attack interval
  // ahead on a freshly written save.
  const combatFight = (v: Record<string, unknown>) =>
    fight(v) && (v.playerHp as number) > 0 && (v.enemyHp as number) > 0
  if (
    combat != null &&
    (!record(combat) ||
      !known(enemiesById, combat.enemyId) ||
      !combatFight(combat) ||
      !integer(combat.kills) ||
      (combat.enemyHp as number) > enemiesById[combat.enemyId].hp)
  )
    return fail('Invalid combat state.')
  const dungeon = value.dungeonRun
  if (
    dungeon != null &&
    (!record(dungeon) ||
      !known(dungeonsById, dungeon.dungeonId) ||
      !integer(dungeon.enemyIndex) ||
      dungeon.enemyIndex >= dungeonsById[dungeon.dungeonId].enemyIds.length ||
      !combatFight(dungeon) ||
      (dungeon.enemyHp as number) >
        enemiesById[dungeonsById[dungeon.dungeonId].enemyIds[dungeon.enemyIndex]].hp)
  )
    return fail('Invalid dungeon state.')
  if ([active, combat, dungeon].filter((v) => v != null).length > 1)
    return fail('Only one gathering, combat, or dungeon activity can be active.')
  for (const [field, ids] of [
    ['selectedPrayerId', prayersById],
    ['selectedSpellId', spellsById],
  ] as const) {
    if (value[field] != null && !known(ids, value[field])) return fail(`Unknown ${field}.`)
  }
  if (
    value.selectedFoodItemId != null &&
    (!known(items, value.selectedFoodItemId) || !items[value.selectedFoodItemId].healAmount)
  )
    return fail('Selected food is not a healing item.')
  const task = value.slayerTask
  if (
    task != null &&
    (!record(task) ||
      !known(enemiesById, task.enemyId) ||
      !integer(task.targetKills) ||
      task.targetKills < 1 ||
      !integer(task.killsAtAssignment))
  )
    return fail('Invalid Slayer task.')
  const plots = value.farmingPlots
  if (
    plots !== undefined &&
    (!Array.isArray(plots) ||
      plots.length > farmingPlotUnlockLevels.length ||
      !plots.every(
        (v) =>
          record(v) &&
          (v.cropId === null
            ? v.plantedAt === null
            : known(farmingCropsById, v.cropId) && timestamp(v.plantedAt)),
      ))
  )
    return fail('Invalid farming plots.')
  const pens = value.ranchPens
  if (
    pens !== undefined &&
    (!Array.isArray(pens) ||
      pens.length > ranchPenUnlockLevels.length ||
      !pens.every(
        (v) =>
          record(v) &&
          (v.animalId === null
            ? v.placedAt === null && v.lastCollectedAt === null
            : known(ranchAnimalsById, v.animalId) &&
              timestamp(v.placedAt) &&
              (v.lastCollectedAt === null || timestamp(v.lastCollectedAt))),
      ))
  )
    return fail('Invalid ranch pens.')
  const log = value.eventLog
  if (
    log !== undefined &&
    (!Array.isArray(log) ||
      log.length > 50 ||
      !log.every(
        (v) =>
          record(v) &&
          typeof v.id === 'string' &&
          v.id.length <= 100 &&
          typeof v.icon === 'string' &&
          v.icon.length <= 32 &&
          typeof v.message === 'string' &&
          v.message.length <= 1000 &&
          timestamp(v.at),
      ))
  )
    return fail('Invalid activity log.')
  return {
    ok: true,
    data: {
      ...value,
      equipment: value.equipment ?? {},
      activeAction: active ?? null,
      combat: combat ?? null,
      dungeonRun: dungeon ?? null,
      slayerTask: task ?? null,
      selectedFoodItemId: value.selectedFoodItemId ?? null,
      selectedPrayerId: value.selectedPrayerId ?? null,
      selectedSpellId: value.selectedSpellId ?? null,
      masteryXp: value.masteryXp ?? {},
      masteryPoolXp: value.masteryPoolXp ?? {},
      killCounts: value.killCounts ?? {},
      dungeonClearCounts: value.dungeonClearCounts ?? {},
      completedQuestIds: value.completedQuestIds ?? {},
      completedAchievementIds: value.completedAchievementIds ?? {},
      ownedPetIds: value.ownedPetIds ?? {},
    } as unknown as SaveData,
  }
}
