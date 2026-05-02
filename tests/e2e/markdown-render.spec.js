import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('csumpi.studyStore.v1', JSON.stringify({
      version: 1, cards: {},
      settings: { dailyGoal: 20, theme: 'system', reducedMotion: 'system', onboardingComplete: true, userName: 'Anna' },
      streak: { current: 0, best: 0, lastDay: null },
    }))
  })
})

test('latin study session renders question table as HTML table', async ({ page }) => {
  await page.goto('/study/latin')
  await page.waitForTimeout(2000)
  await page.screenshot({ path: 'test-results/chrome-shots/10-latin-pre.png' })

  // Click through cards until we land on one with a markdown table inside the question
  for (let i = 0; i < 40; i++) {
    const showBtn = page.getByRole('button', { name: /show answer/i })
    if (await showBtn.count() === 0) break
    const tableInQuestion = await page.locator('article table').count()
    if (tableInQuestion > 0) break
    await showBtn.first().click()
    await page.waitForTimeout(150)
    const knewIt = page.getByRole('button', { name: /knew it/i })
    if (await knewIt.count() > 0) await knewIt.first().click()
    await page.waitForTimeout(150)
  }

  // Reveal whatever current card we're on, then ensure the answer renders any tables it has
  const showBtn = page.getByRole('button', { name: /show answer/i })
  if (await showBtn.count() > 0) await showBtn.first().click()
  await page.waitForTimeout(500)
  await page.screenshot({ path: 'test-results/chrome-shots/11-latin-revealed.png' })

  // At least one table somewhere on the page
  const tables = await page.locator('table').count()
  console.log('TABLE_COUNT', tables)
  expect(tables).toBeGreaterThan(0)
})
