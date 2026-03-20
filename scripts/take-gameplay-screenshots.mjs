import { chromium } from 'playwright'

const BASE_URL = 'http://localhost:5174'
const OUTDIR = 'screenshots'

async function run() {
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } })

  // Full single-player flow
  const page = await ctx.newPage()
  await page.goto(BASE_URL)
  await page.waitForTimeout(500)
  await page.click('text=1 PLAYER')
  await page.waitForTimeout(500)

  // CPU select — click Kevin's card
  await page.click('text=Kevin')
  await page.waitForTimeout(500)

  // Avatar select — click NEXT
  await page.screenshot({ path: `${OUTDIR}/07-avatar-select.png` })
  console.log('7. Avatar select')
  await page.click('text=NEXT')
  await page.waitForTimeout(500)

  // Event select
  await page.screenshot({ path: `${OUTDIR}/08-event-select.png` })
  console.log('8. Event select')

  // Click first button (Marathon card)
  const buttons = await page.$$('button.pixel-card')
  if (buttons.length > 0) {
    await buttons[0].click()
  }
  await page.waitForTimeout(1500)
  await page.screenshot({ path: `${OUTDIR}/09-marathon-gameplay.png` })
  console.log('9. Marathon gameplay')

  // Tug of War - start fresh
  const tugPage = await ctx.newPage()
  await tugPage.goto(BASE_URL)
  await tugPage.waitForTimeout(500)
  await tugPage.click('text=1 PLAYER')
  await tugPage.waitForTimeout(500)
  await tugPage.click('text=Sally')
  await tugPage.waitForTimeout(500)
  await tugPage.click('text=NEXT')
  await tugPage.waitForTimeout(500)
  // Click second button (Tug of War card)
  const tugButtons = await tugPage.$$('button.pixel-card')
  if (tugButtons.length > 1) {
    await tugButtons[1].click()
  }
  await tugPage.waitForTimeout(1500)
  await tugPage.screenshot({ path: `${OUTDIR}/10-tug-of-war.png` })
  console.log('10. Tug of War')

  // Mobile marathon
  const mobileCtx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  })
  const mobilePage = await mobileCtx.newPage()
  await mobilePage.goto(BASE_URL)
  await mobilePage.waitForTimeout(500)
  await mobilePage.click('text=1 PLAYER')
  await mobilePage.waitForTimeout(500)
  await mobilePage.click('text=Benny')
  await mobilePage.waitForTimeout(500)
  await mobilePage.click('text=NEXT')
  await mobilePage.waitForTimeout(500)
  const mButtons = await mobilePage.$$('button.pixel-card')
  if (mButtons.length > 0) {
    await mButtons[0].click()
  }
  await mobilePage.waitForTimeout(1500)
  await mobilePage.screenshot({ path: `${OUTDIR}/11-marathon-mobile.png` })
  console.log('11. Marathon mobile')

  // Settings scrolled to announcer
  const settingsPage = await ctx.newPage()
  await settingsPage.goto(BASE_URL)
  await settingsPage.waitForTimeout(500)
  await settingsPage.click('button:has(svg)')
  await settingsPage.waitForTimeout(500)
  await settingsPage.evaluate(() => {
    const modal = document.querySelector('.overflow-y-auto')
    if (modal) modal.scrollTop = modal.scrollHeight
  })
  await settingsPage.waitForTimeout(300)
  await settingsPage.screenshot({ path: `${OUTDIR}/12-settings-announcer.png` })
  console.log('12. Settings announcer')

  await browser.close()
  console.log('\nDone!')
}

run().catch(e => { console.error(e); process.exit(1) })
