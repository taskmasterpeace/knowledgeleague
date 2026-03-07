import { chromium } from '@playwright/test'

async function main() {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })

  // Menu screen
  await page.goto('http://localhost:5555')
  await page.waitForTimeout(1000)
  await page.screenshot({ path: 'screenshots/01-menu.png' })
  console.log('Captured: Menu')

  // Click 1 PLAYER
  await page.click('text=1 PLAYER')
  await page.waitForTimeout(500)
  await page.screenshot({ path: 'screenshots/02-cpu-select.png' })
  console.log('Captured: CPU Select')

  // Pick Kevin
  await page.click('text=Kevin')
  await page.waitForTimeout(500)
  await page.screenshot({ path: 'screenshots/03-avatar-select.png' })
  console.log('Captured: Avatar Select (with upload/describe options)')

  // Click NEXT to skip avatar generation
  await page.click('text=NEXT')
  await page.waitForTimeout(500)
  await page.screenshot({ path: 'screenshots/04-event-select.png' })
  console.log('Captured: Event Select')

  // Pick Math Marathon
  await page.click('text=MATH MARATHON')
  await page.waitForTimeout(1000)
  await page.screenshot({ path: 'screenshots/05-marathon.png' })
  console.log('Captured: Math Marathon gameplay')

  await browser.close()
  console.log('All screenshots captured!')
}

main().catch(console.error)
