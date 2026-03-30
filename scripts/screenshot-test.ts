import { chromium } from 'playwright'

const BASE = 'http://localhost:5175'

async function main() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
  })

  // === FLOW 1: Menu → CPU Select → Avatar Select → Event Select → Party Setup ===
  const page1 = await context.newPage()
  await page1.goto(BASE)
  await page1.waitForTimeout(2500)

  // 1. Menu
  console.log('1. Menu...')
  await page1.screenshot({ path: 'public/screenshots/menu.png' })

  // 2. CPU Select
  console.log('2. CPU Select...')
  await page1.click('button:has-text("1 PLAYER")')
  await page1.waitForTimeout(1000)
  await page1.screenshot({ path: 'public/screenshots/cpu-select.png' })

  // Pick Kevin (click his card which has text "Kevin")
  await page1.click('text=Kevin')
  await page1.waitForTimeout(1000)

  // 3. Avatar Select
  console.log('3. Avatar Select...')
  await page1.screenshot({ path: 'public/screenshots/avatar-select.png' })

  // Click NEXT to proceed to event select
  await page1.click('button:has-text("NEXT")')
  await page1.waitForTimeout(1000)

  // 4. Event Select (should show all events + Party Mode card)
  console.log('4. Event Select...')
  await page1.screenshot({ path: 'public/screenshots/event-select.png' })

  // 5. Party Setup — click the Party Mode button
  console.log('5. Party Setup...')
  const partyBtn = page1.locator('button:has-text("PARTY MODE"), button:has-text("PARTY")')
  if (await partyBtn.count() > 0) {
    await partyBtn.first().click()
    await page1.waitForTimeout(1500)
    await page1.screenshot({ path: 'public/screenshots/party-setup.png' })
  } else {
    console.log('   Party Mode button not found — taking current screen')
    await page1.screenshot({ path: 'public/screenshots/party-setup.png' })
  }

  // === FLOW 2: Quick Play → Gameplay (wait for countdown to clear) ===
  console.log('6. Gameplay...')
  const page2 = await context.newPage()
  await page2.goto(BASE)
  await page2.waitForTimeout(2000)
  await page2.click('button:has-text("QUICK PLAY")')
  await page2.waitForTimeout(7000) // countdown is ~4s, then first question loads
  await page2.screenshot({ path: 'public/screenshots/gameplay.png' })

  // === FLOW 3: Settings ===
  console.log('7. Settings...')
  const page3 = await context.newPage()
  await page3.goto(BASE)
  await page3.waitForTimeout(2000)
  await page3.click('button[aria-label="Settings"]')
  await page3.waitForTimeout(800)
  await page3.screenshot({ path: 'public/screenshots/settings.png' })

  await browser.close()
  console.log('All screenshots saved to public/screenshots/')
}

main().catch(console.error)
