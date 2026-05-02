import { test, expect } from '@playwright/test'
import { mkdirSync } from 'node:fs'

const SHOTS = 'test-results/chrome-shots'
mkdirSync(SHOTS, { recursive: true })

const seedOnboardingDone = async (page) => {
  await page.addInitScript(() => {
    localStorage.setItem('csumpi.studyStore.v1', JSON.stringify({
      version: 1, cards: {},
      settings: { dailyGoal: 20, theme: 'system', reducedMotion: 'system', onboardingComplete: true, userName: 'Anna' },
      streak: { current: 7, best: 12, lastDay: null },
    }))
  })
}

test('cold load timing + console errors', async ({ page }) => {
  const errors = []
  page.on('pageerror', e => errors.push(`pageerror: ${e.message}`))
  page.on('console', m => { if (m.type() === 'error') errors.push(`console.error: ${m.text()}`) })

  await seedOnboardingDone(page)

  const t0 = Date.now()
  await page.goto('/', { waitUntil: 'networkidle' })
  const networkIdle = Date.now() - t0

  const navTiming = await page.evaluate(() => {
    const t = performance.getEntriesByType('navigation')[0]
    const fcp = performance.getEntriesByType('paint').find(p => p.name === 'first-contentful-paint')?.startTime
    return {
      domContentLoaded: t.domContentLoadedEventEnd,
      load: t.loadEventEnd,
      fcp,
      transferSize: t.transferSize,
      decodedBodySize: t.decodedBodySize,
    }
  })

  console.log('TIMING_REPORT', JSON.stringify({
    networkIdleMs: networkIdle,
    fcpMs: Math.round(navTiming.fcp ?? 0),
    domContentLoadedMs: Math.round(navTiming.domContentLoaded),
    loadMs: Math.round(navTiming.load),
    transferKB: Math.round(navTiming.transferSize / 1024),
    decodedKB: Math.round(navTiming.decodedBodySize / 1024),
    errors,
  }, null, 2))

  await page.screenshot({ path: `${SHOTS}/01-home.png`, fullPage: true })
  expect(errors).toEqual([])
})

test('home → browse all → screenshot', async ({ page }) => {
  await seedOnboardingDone(page)
  await page.goto('/')
  await page.screenshot({ path: `${SHOTS}/02-home-mid.png` })

  await page.goto('/browse')
  const tab = page.getByRole('tab', { name: /all questions/i })
  await tab.waitFor({ state: 'visible', timeout: 10000 })
  await tab.click()
  await page.waitForTimeout(1200)  // give category JSONs + virtualizer time
  await page.screenshot({ path: `${SHOTS}/03-browse-all.png`, fullPage: false })
})

test('study session → reveal → rate', async ({ page }) => {
  await seedOnboardingDone(page)
  await page.goto('/study/keringes')
  await page.waitForTimeout(1500)
  await page.screenshot({ path: `${SHOTS}/04-study-pre-reveal.png` })

  const showAnswer = page.getByRole('button', { name: /show answer/i })
  if (await showAnswer.count() > 0) {
    await showAnswer.first().click()
    await page.waitForTimeout(300)
    await page.screenshot({ path: `${SHOTS}/05-study-revealed.png` })
    await page.getByRole('button', { name: /knew it/i }).click()
    await page.waitForTimeout(300)
    await page.screenshot({ path: `${SHOTS}/06-study-after-rate.png` })
  }
})

test('settings page renders + reactivity check', async ({ page }) => {
  await seedOnboardingDone(page)
  await page.goto('/settings')
  await page.waitForTimeout(300)
  await page.screenshot({ path: `${SHOTS}/07-settings-before.png` })

  // Click 30 goal pill — verify data-active updates (catches reactivity regression)
  const goal30 = page.locator('button', { hasText: '30' }).first()
  await goal30.click()
  await page.waitForTimeout(200)
  await page.screenshot({ path: `${SHOTS}/08-settings-after-30.png` })

  const isActive = await goal30.getAttribute('data-active')
  console.log('GOAL_30_DATA_ACTIVE', isActive)
  expect(isActive).toBe('true')
})

test('dark mode rendering', async ({ browser }) => {
  const ctx = await browser.newContext({ colorScheme: 'dark' })
  const page = await ctx.newPage()
  await seedOnboardingDone(page)
  await page.goto('/')
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${SHOTS}/09-dark-home.png`, fullPage: true })
  await ctx.close()
})
