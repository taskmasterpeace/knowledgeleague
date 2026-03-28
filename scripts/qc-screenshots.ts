import { chromium } from 'playwright'
import path from 'path'
import fs from 'fs'

const BASE = 'http://localhost:5173'
const OUT = path.join(process.cwd(), 'test-screenshots', 'qc')

async function navigateToEventSelect(page: any) {
  await page.goto(BASE)
  await page.waitForTimeout(1500)
  await page.click('button:has-text("PLAY")')
  await page.waitForTimeout(600)
  // Pick Kevin — clicking CPU auto-advances to avatar select
  await page.locator('button').filter({ hasText: 'Kevin' }).first().click()
  await page.waitForTimeout(800)
  // Avatar select → event select (button says "NEXT")
  await page.click('button:has-text("NEXT")')
  await page.waitForTimeout(600)
}

async function shot(page: any, name: string) {
  await page.waitForTimeout(400)
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: false })
  console.log(`  ✓ ${name}`)
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true })

  const browser = await chromium.launch()

  // --- Menu flow screenshots ---
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
    await page.goto(BASE)
    await page.waitForTimeout(1500)
    await shot(page, '01-main-menu')
    await page.click('button:has-text("PLAY")')
    await page.waitForTimeout(800)
    await shot(page, '02-cpu-select')
    // Click Kevin — auto-advances to avatar
    await page.locator('button').filter({ hasText: 'Kevin' }).first().click()
    await page.waitForTimeout(800)
    await shot(page, '03-avatar-select')
    // NEXT goes to event select
    await page.click('button:has-text("NEXT")')
    await page.waitForTimeout(800)
    await shot(page, '04-event-select')
    await page.close()
  }

  // --- Each game event ---
  const events = [
    { alt: 'Math Marathon', name: '05-marathon' },
    { alt: 'Tug of War', name: '06-tug-of-war' },
    { alt: 'Hurdle Dash', name: '07-hurdle-dash' },
    { alt: 'Long Jump', name: '08-long-jump' },
    { alt: 'Spelling Bee', name: '09-spelling-bee' },
  ]

  for (const ev of events) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
    await navigateToEventSelect(page)
    await page.locator(`button:has(img[alt="${ev.alt}"])`).click()
    await page.waitForTimeout(4500) // countdown
    await shot(page, ev.name)
    await page.close()
  }

  // --- Settings ---
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
    await page.goto(BASE)
    await page.waitForTimeout(1500)
    const settingsBtn = page.locator('button[title="Settings"], button:has-text("SETTINGS")').first()
    if (await settingsBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await settingsBtn.click()
      await page.waitForTimeout(800)
      await shot(page, '10-settings')
    } else {
      console.log('  ⚠ Settings button not found, skipping')
    }
    await page.close()
  }

  await browser.close()
  console.log(`\nAll screenshots saved to ${OUT}`)
}

main().catch(console.error)
