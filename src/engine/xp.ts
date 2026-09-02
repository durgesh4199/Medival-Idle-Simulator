/**
 * Level/XP math, shared by every skill.
 *
 * Uses the same style of curve as Melvor/RuneScape: each level requires
 * progressively more XP than the last. `xpForLevel(n)` is total cumulative
 * XP needed to reach level n.
 */

const MAX_LEVEL = 120

const xpTable: number[] = (() => {
  const table = [0] // level 1 starts at 0 xp
  let points = 0
  for (let level = 1; level < MAX_LEVEL; level++) {
    points += Math.floor(level + 300 * Math.pow(2, level / 7))
    table.push(Math.floor(points / 4))
  }
  return table
})()

export function xpForLevel(level: number): number {
  const clamped = Math.min(Math.max(level, 1), MAX_LEVEL)
  return xpTable[clamped - 1]
}

export function levelForXp(xp: number): number {
  let level = 1
  for (let i = MAX_LEVEL; i >= 1; i--) {
    if (xp >= xpTable[i - 1]) {
      level = i
      break
    }
  }
  return level
}

export function xpProgress(xp: number): {
  level: number
  currentLevelXp: number
  xpIntoLevel: number
  xpForNextLevel: number
  percent: number
} {
  const level = levelForXp(xp)
  if (level >= MAX_LEVEL) {
    return {
      level,
      currentLevelXp: xpForLevel(level),
      xpIntoLevel: 0,
      xpForNextLevel: 0,
      percent: 100,
    }
  }
  const currentLevelXp = xpForLevel(level)
  const nextLevelXp = xpForLevel(level + 1)
  const xpIntoLevel = xp - currentLevelXp
  const xpForNextLevel = nextLevelXp - currentLevelXp
  return {
    level,
    currentLevelXp,
    xpIntoLevel,
    xpForNextLevel,
    percent: (xpIntoLevel / xpForNextLevel) * 100,
  }
}

export { MAX_LEVEL }
