import { chromium } from 'playwright'

const BASE = 'http://localhost:5175'

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 })

  console.log('=== HINT SYSTEM TEST ===\n')

  // Start a Quick Play game
  console.log('1. Starting Quick Play...')
  await page.goto(BASE)
  await page.waitForTimeout(2000)
  await page.click('button:has-text("QUICK PLAY")')
  await page.waitForTimeout(7000) // wait for countdown

  // Check hint button exists
  console.log('2. Checking hint button...')
  const hintBtn = page.locator('button:has-text("HINT")')
  const hintCount = await hintBtn.count()
  console.log(`   Hint button found: ${hintCount > 0 ? 'YES' : 'NO'}`)

  if (hintCount > 0) {
    const hintText = await hintBtn.textContent()
    console.log(`   Button text: "${hintText}"`)

    // Take screenshot BEFORE hint
    await page.screenshot({ path: 'public/screenshots/hint-before.png' })
    console.log('   Screenshot: hint-before.png')

    // Count visible answer buttons before hint
    const answersBefore = await page.locator('.grid-cols-2 > div').count()
    console.log(`   Answer cards visible: ${answersBefore}`)

    // Click hint
    console.log('\n3. Using hint...')
    await hintBtn.click()
    await page.waitForTimeout(500)

    // Take screenshot AFTER hint
    await page.screenshot({ path: 'public/screenshots/hint-after.png' })
    console.log('   Screenshot: hint-after.png')

    // Check hint button text changed
    const hintTextAfter = await hintBtn.textContent()
    console.log(`   Button text after: "${hintTextAfter}"`)

    // Check that some answers are now dimmed/hidden
    const dimmedCards = await page.locator('.grid-cols-2 > div.opacity-15').count()
    console.log(`   Dimmed answer cards: ${dimmedCards}`)
    console.log(`   ${dimmedCards === 2 ? 'PASS - 2 wrong answers removed!' : 'CHECK - expected 2 dimmed'}`)

    // Try clicking hint again (should be disabled)
    console.log('\n4. Trying hint again (should be disabled)...')
    const isDisabled = await hintBtn.isDisabled()
    console.log(`   Hint button disabled: ${isDisabled ? 'YES (correct)' : 'NO (wrong!)'}`)

    // Answer the question (click a non-hidden answer)
    console.log('\n5. Answering question...')
    const visibleAnswers = page.locator('.grid-cols-2 > div:not(.opacity-15)')
    const visibleCount = await visibleAnswers.count()
    console.log(`   Visible answers: ${visibleCount}`)
    if (visibleCount > 0) {
      await visibleAnswers.first().click()
      await page.waitForTimeout(2000)
    }

    // Check hint resets for next question
    console.log('\n6. Checking hint reset for next question...')
    await page.waitForTimeout(1000)
    const hintBtn2 = page.locator('button:has-text("HINT")')
    if (await hintBtn2.count() > 0) {
      const hintText2 = await hintBtn2.textContent()
      console.log(`   Hint button text: "${hintText2}"`)
      console.log(`   ${hintText2?.includes('2') ? 'PASS - hints decremented to 2!' : 'CHECK hint count'}`)
    }

    // Use second hint
    console.log('\n7. Using second hint...')
    if (await hintBtn2.count() > 0 && !(await hintBtn2.isDisabled())) {
      await hintBtn2.click()
      await page.waitForTimeout(500)
      const dimmed2 = await page.locator('.grid-cols-2 > div.opacity-15').count()
      console.log(`   Dimmed answers: ${dimmed2}`)

      // Answer and advance
      const visible2 = page.locator('.grid-cols-2 > div:not(.opacity-15)')
      if (await visible2.count() > 0) {
        await visible2.first().click()
        await page.waitForTimeout(2000)
      }
    }

    // Check third hint
    console.log('\n8. Third (last) hint...')
    await page.waitForTimeout(1000)
    const hintBtn3 = page.locator('button:has-text("HINT")')
    if (await hintBtn3.count() > 0) {
      const hintText3 = await hintBtn3.textContent()
      console.log(`   Hint button text: "${hintText3}"`)
      await hintBtn3.click()
      await page.waitForTimeout(500)

      // Answer
      const visible3 = page.locator('.grid-cols-2 > div:not(.opacity-15)')
      if (await visible3.count() > 0) {
        await visible3.first().click()
        await page.waitForTimeout(2000)
      }
    }

    // Check hints exhausted
    console.log('\n9. Checking hints exhausted...')
    await page.waitForTimeout(1000)
    const hintBtn4 = page.locator('button:has-text("HINT")')
    if (await hintBtn4.count() > 0) {
      const hintText4 = await hintBtn4.textContent()
      const isDisabled4 = await hintBtn4.isDisabled()
      console.log(`   Hint button text: "${hintText4}"`)
      console.log(`   Hint button disabled: ${isDisabled4}`)
      console.log(`   ${hintText4?.includes('0') && isDisabled4 ? 'PASS - all hints used!' : 'CHECK final state'}`)
    }

    // Final screenshot
    await page.screenshot({ path: 'public/screenshots/hints-exhausted.png' })
    console.log('   Screenshot: hints-exhausted.png')
  }

  console.log('\n=== TEST COMPLETE ===')
  await browser.close()
}

main().catch(console.error)
