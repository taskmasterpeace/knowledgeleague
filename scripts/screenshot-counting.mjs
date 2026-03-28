import { chromium } from 'playwright'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })

await page.goto('http://localhost:5173')
await page.waitForTimeout(2500)

// Settings — enable only Images subject
await page.click('[aria-label="Settings"]')
await page.waitForTimeout(1000)
await page.locator('button:has-text("Images")').click()
await page.waitForTimeout(300)
for (const subject of ['Math', 'Science', 'Reading', 'Spelling']) {
  const btn = page.locator(`button:has-text("${subject}")`).first()
  const classes = await btn.getAttribute('class')
  if (classes && classes.includes('bg-cyan-500')) {
    await btn.click()
    await page.waitForTimeout(300)
  }
}
await page.locator('button:has-text("BACK TO MENU")').click()
await page.waitForTimeout(1500)

// 1 PLAYER
await page.locator('button:has-text("1 PLAYER")').click()
await page.waitForTimeout(1500)

// CPU: click Kevin
await page.locator('text=Kevin').click()
await page.waitForTimeout(1500)

// Avatar: click NEXT (the yellow button at the bottom)
await page.locator('button:has-text("NEXT")').click()
await page.waitForTimeout(2000)

// Verify we're on event select
await page.screenshot({ path: 'test-screenshots/debug-event.png' })
const pageText = await page.textContent('body')
console.log('Page contains PICK YOUR EVENT:', pageText.includes('PICK YOUR'))

// Event select — click the first event image (marathon)
// Use the img inside the button as anchor
const marathonImg = page.locator('img[alt="Math Marathon"]')
const imgCount = await marathonImg.count()
console.log('Found marathon images:', imgCount)
if (imgCount > 0) {
  await marathonImg.click()
} else {
  // Click center of first big card area
  await page.click('button:has(img) >> nth=0')
}
await page.waitForTimeout(4000)

// Take screenshots of gameplay
for (let i = 0; i < 6; i++) {
  await page.screenshot({ path: `test-screenshots/image-question-${i}.png` })
  console.log(`Screenshot ${i} taken`)
  await page.keyboard.press('Digit1')
  await page.waitForTimeout(2500)
}

console.log('Done!')
await browser.close()
