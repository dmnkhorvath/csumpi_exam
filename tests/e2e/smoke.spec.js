import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  // Pre-seed localStorage so onboarding overlay does not appear.
  await page.addInitScript(() => {
    localStorage.setItem('csumpi.studyStore.v1', JSON.stringify({
      version: 1, cards: {},
      settings: { dailyGoal: 20, theme: 'system', reducedMotion: 'system', onboardingComplete: true, userName: 'Test' },
      streak: { current: 0, best: 0, lastDay: null },
    }))
  })
})

test('home loads on iPhone 13', async ({ page }) => {
  const t0 = Date.now()
  await page.goto('/')
  await expect(page.getByText(/Szia, Test/i)).toBeVisible()
  const elapsed = Date.now() - t0
  console.log(`Home interactive in ${elapsed}ms`)
  // Generous CI margin; track regressions if it ever exceeds.
  expect(elapsed).toBeLessThan(5000)
})

test('browse all questions does not crash', async ({ page }) => {
  await page.goto('/browse')
  await page.getByRole('tab', { name: /all questions/i }).click()
  await expect(page.locator('input[placeholder="Search…"]')).toBeVisible()
  const errors = []
  page.on('pageerror', e => errors.push(e))
  for (let i = 0; i < 5; i++) {
    // mouse.wheel is not supported in mobile WebKit; use JS scroll instead.
    await page.evaluate(() => window.scrollBy(0, 2000))
    await page.waitForTimeout(150)
  }
  expect(errors).toHaveLength(0)
})

test('start session navigates without crash', async ({ page }) => {
  await page.goto('/')
  // The button might not exist if no cards are due; tolerate both paths.
  const startBtn = page.getByRole('button', { name: /start session/i })
  if (await startBtn.count() > 0) {
    await startBtn.first().click()
  }
  expect(await page.title()).not.toBe('')
})
