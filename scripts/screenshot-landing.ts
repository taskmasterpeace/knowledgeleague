import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'

const BASE = 'http://localhost:5173'
const OUT = path.join(process.cwd(), 'test-screenshots', 'qc')

async function main() {
  fs.mkdirSync(OUT, { recursive: true })
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })

  await page.goto(`${BASE}/landing.html`, { timeout: 15000 })
  await page.waitForTimeout(2000)

  await page.screenshot({ path: path.join(OUT, 'landing-hero.png') })
  console.log('  ✓ landing-hero')

  await page.evaluate(() => document.getElementById('events')?.scrollIntoView())
  await page.waitForTimeout(600)
  await page.screenshot({ path: path.join(OUT, 'landing-events.png') })
  console.log('  ✓ landing-events')

  await page.evaluate(() => document.getElementById('features')?.scrollIntoView())
  await page.waitForTimeout(600)
  await page.screenshot({ path: path.join(OUT, 'landing-features.png') })
  console.log('  ✓ landing-features')

  await page.evaluate(() => document.getElementById('how')?.scrollIntoView())
  await page.waitForTimeout(600)
  await page.screenshot({ path: path.join(OUT, 'landing-how.png') })
  console.log('  ✓ landing-how')

  // Screenshots section
  await page.evaluate(() => document.getElementById('screenshots')?.scrollIntoView())
  await page.waitForTimeout(600)
  await page.screenshot({ path: path.join(OUT, 'landing-screenshots.png') })
  console.log('  ✓ landing-screenshots')

  await browser.close()
  console.log('\nDone!')
}

main().catch(e => { console.error(e); process.exit(1) })
