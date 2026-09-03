/**
 * Slayer (design doc §9): "target selection and task-driven combat" layered
 * on top of the `killCounts` tracker Quests already introduced (README's
 * own "Extending the game" section calls this out as the natural next
 * step). Deliberately just a pool of assignable {enemy, kill-count range}
 * pairs — no new engine, just more data read by engine/slayerEngine.ts.
 */

export interface SlayerTaskDef {
  enemyId: string
  minKills: number
  maxKills: number
}

/** Every enemy currently in the game is slayer-assignable. Ranges are
 *  loosely scaled to how dangerous each enemy already is (a Skeleton
 *  Warrior task asks for fewer kills than a Giant Rat one). */
export const slayerTaskPool: SlayerTaskDef[] = [
  { enemyId: 'giant_rat', minKills: 6, maxKills: 15 },
  { enemyId: 'goblin', minKills: 5, maxKills: 12 },
  { enemyId: 'skeleton_warrior', minKills: 3, maxKills: 8 },
]

/** Slayer XP granted per kill still owed toward the current task — this is
 *  what makes Slayer its own long-term progression track (design principle
 *  #8) rather than just a reskin of the kill counter Quests already show. */
export const SLAYER_XP_PER_KILL = 12
/** Bonus gold per kill still owed toward the task, on top of the enemy's
 *  own normal gold drop — the "worth deviating from the easiest enemy"
 *  incentive Slayer is supposed to create. */
export const SLAYER_BONUS_GOLD_PER_KILL = 4
