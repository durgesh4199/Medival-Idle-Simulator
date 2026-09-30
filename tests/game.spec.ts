import { test, expect, type Page } from '@playwright/test'

const key = 'medieval-idle-save'
const fixture = (changes: Record<string, unknown> = {}) => ({
  version: 1,
  savedAt: Date.now(),
  gold: 0,
  skillXp: {},
  inventory: {},
  activeAction: null,
  ...changes,
})
async function seed(page: Page, changes: Record<string, unknown>) {
  await page.goto('/')
  await page.evaluate(
    async ({ key, save }) => {
      const { stopGameLoop } = await import('/src/engine/gameLoop.ts' as string)
      stopGameLoop()
      localStorage.setItem(key, JSON.stringify(save))
    },
    { key, save: fixture(changes) },
  )
  await page.reload()
}
async function settings(page: Page) {
  await page.getByRole('navigation').getByRole('button', { name: 'Settings', exact: true }).click()
}
async function save(page: Page) {
  await settings(page)
  await page.getByRole('button', { name: 'Save Now', exact: true }).click()
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), key)
}

test('phone screens retain full-width gameplay and all navigation destinations', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  for (const width of [360, 390, 768]) {
    await page.setViewportSize({ width, height: 844 })
    await page.goto('/')
    await expect(page.getByRole('navigation')).toBeHidden()
    const bounds = await page.locator('main').boundingBox()
    expect(bounds!.width).toBeGreaterThan(width < 768 ? width - 50 : 400)
    await expect(page.getByRole('button', { name: 'Start fishing', exact: true })).toBeVisible()
    for (const name of [
      'Bank',
      'Shop',
      'Quests',
      'Combat',
      'Dungeons',
      'Farming',
      'Ranching',
      'Pets',
      'Achievements',
      'Codex',
      'Settings',
    ]) {
      await page.getByRole('button', { name: 'Toggle navigation' }).click()
      await page.getByRole('navigation').getByRole('button', { name, exact: true }).click()
      await expect(page.getByRole('navigation')).toBeHidden()
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      )
    }
  }
  expect(errors).toEqual([])
})

test('gathering rewards survive save and reload', async ({ page }) => {
  await page.clock.install()
  await page.goto('/')
  await page.getByRole('button', { name: 'Start fishing', exact: true }).click()
  await page.clock.fastForward(11_000)
  const saved = await save(page)
  expect(saved.skillXp.fishing).toBeGreaterThanOrEqual(12)
  expect((saved.inventory.raw_herring ?? 0) + (saved.inventory.junk ?? 0)).toBeGreaterThanOrEqual(1)
  await page.reload()
  const restored = await save(page)
  expect(restored.skillXp.fishing).toBeGreaterThanOrEqual(saved.skillXp.fishing)
})

test('next goal claims rewards and item references navigate to actual recipes', async ({
  page,
}) => {
  await seed(page, { inventory: { raw_herring: 5 }, skillXp: { fishing: 60 } })
  await page.getByRole('button', { name: 'Claim reward', exact: true }).click()
  await expect(page.getByRole('region', { name: 'Adventure guide' })).toContainText(
    'Kitchen Basics',
  )
  await page.getByRole('navigation').getByRole('button', { name: 'Codex', exact: true }).click()
  await page.getByRole('button', { name: /^Items \(/ }).click()
  await page.getByRole('button', { name: 'Cooked Herring', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toContainText('Where to obtain')
  await expect(dialog).toContainText('Raw Herring')
  await dialog.getByRole('button', { name: 'Cook Herring', exact: true }).click()
  await expect(dialog).not.toBeVisible()
  await expect(page.getByRole('button', { name: 'Start cooking', exact: true })).toBeVisible()
  const saved = await save(page)
  expect(saved.completedQuestIds.a_fishermans_start).toBe(true)
})

test('pinned quests survive reload', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('navigation').getByRole('button', { name: 'Quests', exact: true }).click()
  await page.getByRole('button', { name: 'Pin as next goal', exact: true }).nth(2).click()
  await expect(page.getByRole('region', { name: 'Adventure guide' })).toContainText(
    "Smith's Apprentice",
  )
  await save(page)
  await page.reload()
  await expect(page.getByRole('region', { name: 'Adventure guide' })).toContainText(
    "Smith's Apprentice",
  )
})

test('batch trading respects costs and owned quantities', async ({ page }) => {
  await seed(page, { gold: 100, inventory: { logs: 3 } })
  await page.getByRole('navigation').getByRole('button', { name: 'Shop', exact: true }).click()
  await page.getByLabel('Trade quantity').selectOption('10')
  await page
    .locator('[data-buy-item-id="logs"]')
    .getByRole('button', { name: 'Buy 10', exact: true })
    .click()
  await expect(page.locator('[data-buy-item-id="logs"]')).toContainText('You have 13')
  await expect(
    page
      .locator('[data-buy-item-id="cooked_herring"]')
      .getByRole('button', { name: 'Buy 10', exact: true }),
  ).toBeDisabled()
  await page
    .locator('[data-sell-item-id="logs"]')
    .getByRole('button', { name: 'Sell 10', exact: true })
    .click()
  await expect(page.locator('[data-buy-item-id="logs"]')).toContainText('You have 3')
  const saved = await save(page)
  expect(saved.inventory.logs).toBe(3)
  expect(saved.gold).toBe(80) // buy 10 at 3g; sell 10 at 1g
})

test('malformed import cannot replace current progress', async ({ page }) => {
  await seed(page, { gold: 77 })
  await settings(page)
  for (const changes of [
    { gold: -1 },
    { skillXp: { fishing: 'bad' } },
    { inventory: { raw_herring: -10 } },
    { version: 99 },
    { activeAction: { actionId: 'bad', startedAt: Date.now(), durationMs: 0 } },
  ]) {
    await page
      .getByPlaceholder('…or paste exported save JSON here')
      .fill(JSON.stringify(fixture(changes)))
    await page.getByRole('button', { name: 'Load Save', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Load Save', exact: true })).toBeVisible()
    expect((await save(page)).gold).toBe(77)
  }
})

test('corrupt primary is preserved while a backup is recovered', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(
    async ({ key, backup }) => {
      const { stopGameLoop } = await import('/src/engine/gameLoop.ts' as string)
      stopGameLoop()
      localStorage.setItem(key, '{broken')
      localStorage.setItem(`${key}-backup`, JSON.stringify(backup))
    },
    { key, backup: fixture({ gold: 42 }) },
  )
  await page.reload()
  await expect(page.getByRole('alert')).toContainText('Recovered the previous backup')
  await settings(page)
  await page.getByRole('button', { name: 'Save Now', exact: true }).click()
  expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBe('{broken')
  await page.getByRole('button', { name: 'Keep recovered progress', exact: true }).click()
  expect(await page.evaluate((key) => localStorage.getItem(`${key}-recovery`), key)).toBe('{broken')
  expect((await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), key)).gold).toBe(42)
})

test('storage failures show an error instead of a saved confirmation', async ({ page }) => {
  await page.goto('/')
  await settings(page)
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException('Full', 'QuotaExceededError')
    }
  })
  await page.getByRole('button', { name: 'Save Now', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Progress could not be saved')
  await expect(page.getByRole('button', { name: 'Save Now', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Prepare Export', exact: true }).click()
  await expect(page.locator('textarea[readonly]')).toContainText('"version": 1')
})

test('24-hour offline gathering cap holds through the next live tick', async ({ page }) => {
  await page.goto('/')
  // Exercise the real store with deterministic clocks and randomness, including
  // the first live tick after catch-up, which was the original regression.
  const result = await page.evaluate(async () => {
    const { useGameStore } = await import('/src/state/gameStore.ts' as string)
    const { stopGameLoop } = await import('/src/engine/gameLoop.ts' as string)
    stopGameLoop()
    const now = Date.now()
    const originalRandom = Math.random
    Math.random = () => 0.5
    try {
      const results = []
      for (const hours of [24, 48, 72]) {
        const old = now - hours * 3600000
        const base = {
          ...useGameStore.getState().toSaveShape(),
          version: 1,
          savedAt: old,
          skillXp: {},
          inventory: {},
          combat: null,
          dungeonRun: null,
          masteryXp: {},
          masteryPoolXp: {},
          activeAction: { actionId: 'shallow_shores_quiet_bend', startedAt: old, durationMs: 8000 },
        }
        useGameStore.getState().loadFromSave(base)
        const afterLoad = useGameStore.getState().skillXp.fishing
        useGameStore.getState().tick(now)
        results.push({
          hours,
          afterLoad,
          afterTick: useGameStore.getState().skillXp.fishing,
          lag: now - useGameStore.getState().activeAction.startedAt,
        })
      }
      return results
    } finally {
      Math.random = originalRandom
    }
  })
  for (const entry of result) {
    expect(entry.afterTick).toBe(entry.afterLoad)
    expect(entry.lag).toBeLessThan(10_000)
  }
  expect(result[0].afterLoad).toBe(result[2].afterLoad)
})

test('offline combat completes its allowed chunks and cannot earn extra on the next tick', async ({
  page,
}) => {
  await page.goto('/')
  const results = await page.evaluate(async () => {
    const { useGameStore } = await import('/src/state/gameStore.ts' as string)
    const { stopGameLoop } = await import('/src/engine/gameLoop.ts' as string)
    stopGameLoop()
    const now = Date.now()
    const random = Math.random
    Math.random = () => 0.2
    try {
      return [24, 48, 72].map((hours) => {
        const old = now - hours * 3600000
        const save = {
          ...useGameStore.getState().toSaveShape(),
          version: 1,
          savedAt: old,
          skillXp: {},
          gold: 0,
          inventory: { cooked_herring: 100000 },
          equipment: {},
          killCounts: {},
          masteryXp: {},
          masteryPoolXp: {},
          ownedPetIds: {},
          slayerTask: null,
          selectedFoodItemId: 'cooked_herring',
          selectedPrayerId: null,
          selectedSpellId: null,
          activeAction: null,
          dungeonRun: null,
          combat: {
            enemyId: 'giant_rat',
            enemyHp: 20,
            playerHp: 20,
            nextPlayerAttackAt: old + 3600,
            nextEnemyAttackAt: old + 3000,
            kills: 0,
          },
        }
        useGameStore.getState().loadFromSave(save)
        const afterLoad = useGameStore.getState().killCounts.giant_rat
        const foodAfterLoad = useGameStore.getState().inventory.cooked_herring
        useGameStore.getState().combatTick(now)
        const state = useGameStore.getState()
        return {
          hours,
          afterLoad,
          foodAfterLoad,
          afterTick: state.killCounts.giant_rat,
          foodAfterTick: state.inventory.cooked_herring,
          next: Math.min(state.combat.nextPlayerAttackAt, state.combat.nextEnemyAttackAt) - now,
        }
      })
    } finally {
      Math.random = random
    }
  })
  for (const result of results) {
    expect(result.afterLoad).toBeGreaterThan(0)
    expect(result.afterTick).toBe(result.afterLoad)
    expect(result.foodAfterTick).toBe(result.foodAfterLoad)
    expect(result.next).toBeGreaterThan(0)
  }
  expect(results[0].afterLoad).toBe(results[2].afterLoad)
})

test('valid legacy imports receive defaults and dungeon rewards cannot be claimed twice', async ({
  page,
}) => {
  await seed(page, { gold: 15 })
  const result = await page.evaluate(async () => {
    const { useGameStore } = await import('/src/state/gameStore.ts' as string)
    const { stopGameLoop } = await import('/src/engine/gameLoop.ts' as string)
    const { parseSaveData } = await import('/src/engine/saveValidation.ts' as string)
    stopGameLoop()
    const legacy = parseSaveData({
      version: 1,
      savedAt: Date.now(),
      gold: 15,
      skillXp: {},
      inventory: {},
      activeAction: null,
    })
    const state = useGameStore.getState()
    const now = Date.now()
    const save = {
      ...state.toSaveShape(),
      version: 1,
      savedAt: now - 72 * 3600000,
      skillXp: { attack: 13034431, strength: 13034431, defence: 13034431, hitpoints: 13034431 },
      inventory: { cooked_herring: 1000 },
      selectedFoodItemId: 'cooked_herring',
      activeAction: null,
      combat: null,
      dungeonRun: {
        dungeonId: 'goblin_den',
        enemyIndex: 0,
        enemyHp: 20,
        playerHp: 2000,
        nextPlayerAttackAt: now - 72 * 3600000 + 3600,
        nextEnemyAttackAt: now - 72 * 3600000 + 3000,
      },
    }
    state.loadFromSave(save)
    const gold = useGameStore.getState().gold
    const clears = useGameStore.getState().dungeonClearCounts.goblin_den
    useGameStore.getState().dungeonTick(now)
    return {
      legacyOk: legacy.ok,
      legacyCombat: legacy.ok ? legacy.data.combat : 'invalid',
      gold,
      clears,
      goldAfterTick: useGameStore.getState().gold,
      clearsAfterTick: useGameStore.getState().dungeonClearCounts.goblin_den,
      run: useGameStore.getState().dungeonRun,
    }
  })
  expect(result.legacyOk).toBe(true)
  expect(result.legacyCombat).toBeNull()
  expect(result.clears).toBe(1)
  expect(result.goldAfterTick).toBe(result.gold)
  expect(result.clearsAfterTick).toBe(1)
  expect(result.run).toBeNull()
})

test('a fresh player can follow the guide from fishing to prepared combat', async ({ page }) => {
  await page.clock.install()
  await page.goto('/')
  await page.evaluate(() => {
    Math.random = () => 0.5
  })
  const guide = page.getByRole('region', { name: 'Adventure guide' })
  await page.getByRole('button', { name: 'Start fishing', exact: true }).click()
  await page.clock.fastForward(150_000)
  await guide.getByRole('button', { name: 'Claim reward', exact: true }).click()
  await guide.getByRole('button', { name: 'Go to Cooking', exact: true }).click()
  await page.getByRole('button', { name: 'Start cooking', exact: true }).click()
  await page.clock.fastForward(25_000)
  await guide.getByRole('button', { name: 'Claim reward', exact: true }).click()
  await expect(guide).toContainText('Equip your first weapon')
  await guide.getByRole('button', { name: 'Open Bank', exact: true }).click()
  await page
    .locator('[data-item-id="bronze_sword"]')
    .getByRole('button', { name: 'Equip', exact: true })
    .click()
  await guide.getByRole('button', { name: 'Prepare combat', exact: true }).click()
  await page
    .getByRole('main')
    .getByRole('button', { name: /Cooked Herring/ })
    .click()
  await expect(guide).toContainText('Blooded Blade')
  await page.getByRole('button', { name: 'Fight Giant Rat', exact: true }).click()
  await page.clock.fastForward(100_000)
  const saved = await save(page)
  expect(saved.equipment.weapon).toBe('bronze_sword')
  expect(saved.selectedFoodItemId).toBe('cooked_herring')
  expect(saved.activeAction).toBeNull()
  expect(saved.killCounts.giant_rat).toBeGreaterThan(0)
})

test('milestone feedback appears for live rewards and sound remains optional', async ({ page }) => {
  await seed(page, { inventory: { raw_herring: 5 } })
  await page
    .getByRole('region', { name: 'Adventure guide' })
    .getByRole('button', { name: 'Claim reward', exact: true })
    .click()
  await expect(page.getByRole('status').filter({ hasText: 'Adventure rewarded' })).toContainText(
    'Completed "A Fisherman',
  )
  await settings(page)
  const sound = page.getByRole('switch', { name: /Reward sounds/ })
  await expect(sound).toHaveAttribute('aria-checked', 'false')
  await sound.click()
  await expect(sound).toHaveAttribute('aria-checked', 'true')
  await page.reload()
  await settings(page)
  await expect(page.getByRole('switch', { name: /Reward sounds/ })).toHaveAttribute(
    'aria-checked',
    'true',
  )
})

test('rare loot creates a discovery notification in the activity log', async ({ page }) => {
  await page.clock.install()
  await seed(page, { skillXp: { fishing: 10000 } })
  await page.evaluate(() => {
    Math.random = () => 0.0001
  })
  await page.getByRole('button', { name: /Shrapnel River/ }).click()
  await page.getByRole('button', { name: 'Pebble Bank', exact: true }).click()
  await page.getByRole('button', { name: 'Start fishing', exact: true }).click()
  await page.clock.fastForward(14_000)
  await expect(page.getByRole('status').filter({ hasText: 'A rare discovery' })).toContainText(
    'Rusty Ancient Dagger',
  )
  await page.getByRole('navigation').getByRole('button', { name: 'Codex', exact: true }).click()
  await page.getByRole('button', { name: /^Activity/ }).click()
  await expect(
    page.getByText('Found rare loot: Rusty Ancient Dagger!', { exact: true }).first(),
  ).toBeVisible()
})
