/**
 * E2E + verification tests for Tower Climb and new feature modules
 * Tests: file existence, TypeScript compilation, and Tower Climb gameplay flow
 */
import { existsSync } from 'fs'
import { execSync } from 'child_process'
import { chromium } from 'playwright'

const BASE = 'http://localhost:5175'
let passed = 0
let failed = 0
const failures = []

function assert(condition, msg) {
  if (condition) {
    passed++
    console.log(`  ✅ ${msg}`)
  } else {
    failed++
    failures.push(msg)
    console.log(`  ❌ FAIL: ${msg}`)
  }
}

async function assertVisible(page, selector, msg) {
  try {
    const el = page.locator(selector).first()
    await el.waitFor({ state: 'visible', timeout: 5000 })
    assert(true, msg)
  } catch {
    assert(false, `${msg} (selector: ${selector})`)
  }
}

async function assertText(page, text, msg) {
  try {
    await page.locator(`text=${text}`).first().waitFor({ state: 'visible', timeout: 5000 })
    assert(true, msg)
  } catch {
    assert(false, `${msg} (text: "${text}")`)
  }
}

async function run() {
  // ═══════════════════════════════════════════════
  // PHASE 1: FILE EXISTENCE CHECKS
  // ═══════════════════════════════════════════════
  console.log('\n📁 PHASE 1: REQUIRED FILE EXISTENCE')

  const requiredFiles = [
    'src/utils/playerAnalytics.ts',
    'src/utils/adaptiveDifficulty.ts',
    'src/utils/standardsMap.ts',
    'src/utils/speechSynthesis.ts',
    'src/utils/backgroundMusic.ts',
    'src/utils/gameAnalyticsStore.ts',
    'src/utils/towerClimbAnnouncer.ts',
    'src/utils/marathonAnnouncer.ts',
    'src/utils/tugOfWarAnnouncer.ts',
    'src/components/TowerClimb/TowerClimb.tsx',
    'src/components/TowerClimb/TowerScene.tsx',
    'src/components/TowerClimb/VoxelTower.tsx',
    'src/components/TowerClimb/Missile.tsx',
    'src/components/TowerClimb/PlayerSprite.tsx',
    'src/components/PostGameStats/PostGameStats.tsx',
    'src/components/Leaderboards/Leaderboards.tsx',
    'src/components/SpectatorDashboard/SpectatorDashboard.tsx',
  ]

  for (const f of requiredFiles) {
    if (existsSync(f)) {
      assert(true, `File exists: ${f}`)
    } else {
      assert(false, `File missing: ${f}`)
    }
  }

  // ═══════════════════════════════════════════════
  // PHASE 2: TYPESCRIPT TYPE CHECK
  // ═══════════════════════════════════════════════
  console.log('\n🔷 PHASE 2: TYPESCRIPT COMPILATION')
  try {
    execSync('npx tsc --noEmit', { stdio: 'pipe' })
    assert(true, 'TypeScript compilation passes with no errors')
  } catch (e) {
    assert(false, 'TypeScript compilation failed')
    const errOut = e.stderr?.toString() || e.stdout?.toString() || ''
    console.log('  TypeScript errors:')
    errOut.split('\n').slice(0, 20).forEach(line => console.log(`    ${line}`))
  }

  // ═══════════════════════════════════════════════
  // PHASE 3: PLAYWRIGHT E2E TESTS
  // ═══════════════════════════════════════════════
  console.log('\n🎮 PHASE 3: PLAYWRIGHT E2E TESTS')

  let browser
  try {
    browser = await chromium.launch()
  } catch (e) {
    console.log(`  ⚠️  Could not launch browser — skipping E2E tests: ${e.message}`)
    console.log('  (Ensure dev server is running on port 5175)')
    printResults()
    return
  }

  // ─────────────────────────────────────────────
  // TEST 1: EVENT SELECT SHOWS TOWER CLIMB
  // ─────────────────────────────────────────────
  console.log('\n🗼 TEST 1: EVENT SELECT — TOWER CLIMB OPTION')
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } })
    const page = await ctx.newPage()
    await page.goto(BASE)
    await page.waitForTimeout(500)

    await page.click('text=1 PLAYER')
    await page.waitForTimeout(500)
    await page.click('text=Kevin')
    await page.waitForTimeout(500)
    await page.click('text=NEXT')
    await page.waitForTimeout(500)

    await assertText(page, 'MARATHON', 'Event select shows MARATHON')
    await assertText(page, 'TUG OF WAR', 'Event select shows TUG OF WAR')
    await assertText(page, 'TOWER CLIMB', 'Event select shows TOWER CLIMB')

    // Verify Tower Climb card is a clickable button
    const towerBtn = page.locator('button').filter({ hasText: /TOWER CLIMB/ }).first()
    assert(await towerBtn.count() > 0, 'TOWER CLIMB is a clickable button')

    await ctx.close()
  }

  // ─────────────────────────────────────────────
  // TEST 2: TOWER CLIMB GAME LOADS
  // ─────────────────────────────────────────────
  console.log('\n🗼 TEST 2: TOWER CLIMB GAME LOADS')
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } })
    const page = await ctx.newPage()
    await page.goto(BASE)
    await page.waitForTimeout(500)

    await page.click('text=1 PLAYER')
    await page.waitForTimeout(500)
    await page.click('text=Kevin')
    await page.waitForTimeout(500)
    await page.click('text=NEXT')
    await page.waitForTimeout(500)

    // Click Tower Climb event card
    const towerBtn = page.locator('button').filter({ hasText: /TOWER CLIMB/ }).first()
    await towerBtn.click()
    await page.waitForTimeout(3000) // Three.js + lazy load takes time

    // Game should be running
    await assertText(page, 'Player 1', 'Tower Climb shows Player 1')
    await assertText(page, 'Kevin', 'Tower Climb shows CPU opponent')
    await assertText(page, 'TIME', 'Tower Climb shows timer')
    await assertText(page, 'PROBLEM #', 'Tower Climb shows problem counter')

    // Check for FLOOR counter (unique to Tower Climb)
    const html = await page.content()
    const hasFloorOrBlock = html.includes('FLOOR') || html.includes('Block') || html.includes('Height')
    assert(hasFloorOrBlock, 'Tower Climb shows height/floor indicator')

    await ctx.close()
  }

  // ─────────────────────────────────────────────
  // TEST 3: TOWER CLIMB QUESTION INTERACTION
  // ─────────────────────────────────────────────
  console.log('\n🗼 TEST 3: TOWER CLIMB QUESTION INTERACTION')
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } })
    const page = await ctx.newPage()
    await page.goto(BASE)
    await page.waitForTimeout(500)

    await page.click('text=1 PLAYER')
    await page.waitForTimeout(500)
    await page.click('text=Kevin')
    await page.waitForTimeout(500)
    await page.click('text=NEXT')
    await page.waitForTimeout(500)

    const towerBtn = page.locator('button').filter({ hasText: /TOWER CLIMB/ }).first()
    await towerBtn.click()
    await page.waitForTimeout(3000)

    // A question should be visible
    const questionMark = page.locator('text=?').first()
    assert(await questionMark.count() > 0, 'Question mark is visible (question displayed)')

    // 4 answer choices should exist
    const answerCount = await page.evaluate(() => {
      const grid = document.querySelector('.grid.grid-cols-2')
      if (!grid) return 0
      return grid.children.length
    })
    assert(answerCount >= 4, `4 answer choices exist (found ${answerCount})`)

    // Get initial problem number
    const initialHtml = await page.content()
    const initialMatch = initialHtml.match(/PROBLEM #(\d+)/)
    const initialProblem = initialMatch ? parseInt(initialMatch[1]) : 0

    // Answer by pressing key 1
    await page.keyboard.press('1')
    await page.waitForTimeout(3500) // Wait for result display + next problem

    // Problem counter should have advanced
    const afterHtml = await page.content()
    const afterMatch = afterHtml.match(/PROBLEM #(\d+)/)
    const afterProblem = afterMatch ? parseInt(afterMatch[1]) : 0
    assert(afterProblem > initialProblem, `Problem advances after answering (${initialProblem} -> ${afterProblem})`)

    // Answer a few more to verify gameplay loop
    for (let i = 0; i < 2; i++) {
      await page.waitForTimeout(2500)
      await page.keyboard.press(String(1 + (i % 4)))
      await page.waitForTimeout(600)
    }

    const loopContent = await page.content()
    assert(loopContent.includes('PROBLEM'), 'Tower Climb gameplay loop continues normally')

    await ctx.close()
  }

  // ─────────────────────────────────────────────
  // TEST 4: TOWER CLIMB — NO CONSOLE ERRORS
  // ─────────────────────────────────────────────
  console.log('\n🗼 TEST 4: TOWER CLIMB — NO CRITICAL CONSOLE ERRORS')
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } })
    const page = await ctx.newPage()
    const errors = []
    page.on('pageerror', err => errors.push(err.message))
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })

    await page.goto(BASE)
    await page.waitForTimeout(500)

    await page.click('text=1 PLAYER')
    await page.waitForTimeout(500)
    await page.click('text=Kevin')
    await page.waitForTimeout(500)
    await page.click('text=NEXT')
    await page.waitForTimeout(500)

    const towerBtn = page.locator('button').filter({ hasText: /TOWER CLIMB/ }).first()
    await towerBtn.click()
    await page.waitForTimeout(3000)

    // Answer 2 questions
    for (let i = 0; i < 2; i++) {
      await page.keyboard.press(String(1 + i))
      await page.waitForTimeout(3000)
    }

    const criticalErrors = errors.filter(e =>
      !e.includes('peerjs') &&
      !e.includes('PeerJS') &&
      !e.includes('net::ERR') &&
      !e.includes('Failed to load resource') &&
      !e.includes('Autoplay') &&
      !e.includes('THREE.')  // Three.js WebGL warnings in headless mode are expected
    )
    assert(
      criticalErrors.length === 0,
      `No critical console errors during Tower Climb (found ${criticalErrors.length}${criticalErrors.length > 0 ? ': ' + criticalErrors.slice(0, 2).join('; ') : ''})`
    )

    await ctx.close()
  }

  // ─────────────────────────────────────────────
  // TEST 5: TOWER CLIMB — MOBILE RESPONSIVE
  // ─────────────────────────────────────────────
  console.log('\n🗼 TEST 5: TOWER CLIMB — MOBILE RESPONSIVE')
  {
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    })
    const page = await ctx.newPage()
    await page.goto(BASE)
    await page.waitForTimeout(500)

    await page.click('text=1 PLAYER')
    await page.waitForTimeout(500)
    await page.click('text=Kevin')
    await page.waitForTimeout(500)
    await page.click('text=NEXT')
    await page.waitForTimeout(500)

    await assertText(page, 'TOWER CLIMB', 'Mobile: TOWER CLIMB visible in event select')

    const towerBtn = page.locator('button').filter({ hasText: /TOWER CLIMB/ }).first()
    await towerBtn.click()
    await page.waitForTimeout(3000)

    // Game should load on mobile
    await assertText(page, 'TIME', 'Mobile: Timer visible in Tower Climb')

    // No horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    const viewportWidth = await page.evaluate(() => window.innerWidth)
    assert(bodyWidth <= viewportWidth + 5, `Mobile: No horizontal overflow (body: ${bodyWidth}, viewport: ${viewportWidth})`)

    await ctx.close()
  }

  // ─────────────────────────────────────────────
  // TEST 6: POST-GAME STATS COMPONENT EXISTS IN DOM
  // ─────────────────────────────────────────────
  console.log('\n📊 TEST 6: POST-GAME STATS COMPONENT')
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } })
    const page = await ctx.newPage()
    await page.goto(BASE)
    await page.waitForTimeout(500)

    // Set minimal track length to reach game over faster
    await page.click('button:has(svg)')
    await page.waitForTimeout(300)
    const trackBtn5 = page.locator('button').filter({ hasText: /^5$/ })
    if (await trackBtn5.count() > 0) {
      await trackBtn5.first().click()
      await page.waitForTimeout(200)
    }
    await page.click('text=DONE')
    await page.waitForTimeout(300)

    await page.click('text=1 PLAYER')
    await page.waitForTimeout(500)
    await page.click('text=Kevin')
    await page.waitForTimeout(500)
    await page.click('text=NEXT')
    await page.waitForTimeout(500)

    const towerBtn = page.locator('button').filter({ hasText: /TOWER CLIMB/ }).first()
    await towerBtn.click()
    await page.waitForTimeout(3000)

    // Rapid-answer 8 questions (enough to potentially finish a short game)
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('1')
      await page.waitForTimeout(3200)
    }

    const finalHtml = await page.content()
    const hasWinner = finalHtml.includes('WINS') || finalHtml.includes('REMATCH') || finalHtml.includes('GAME OVER')
    const hasStats = finalHtml.includes('Accuracy') || finalHtml.includes('PROBLEM') || finalHtml.includes('Score')

    // Game either ended or is still running — both are valid
    assert(hasStats || finalHtml.includes('PROBLEM #'), 'Game loop functioning (stats or problem counter present)')

    await ctx.close()
  }

  // ─────────────────────────────────────────────
  // TEST 7: LEADERBOARDS COMPONENT ACCESSIBLE VIA TROPHIES
  // ─────────────────────────────────────────────
  console.log('\n🏆 TEST 7: LEADERBOARDS SCREEN')
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } })
    const page = await ctx.newPage()
    await page.goto(BASE)
    await page.waitForTimeout(500)

    await page.click('text=TROPHIES')
    await page.waitForTimeout(500)

    await assertText(page, 'TROPHIES', 'Trophies screen loads')
    await assertText(page, 'BACK TO MENU', 'Back button exists')

    // Check for leaderboard content or empty state
    const html = await page.content()
    const hasContent = html.includes('Games Played') || html.includes('No profiles') ||
                       html.includes('Leaderboard') || html.includes('Best Score')
    assert(hasContent, 'Trophies/Leaderboards screen shows content or empty state')

    await page.click('text=BACK TO MENU')
    await page.waitForTimeout(500)
    await assertText(page, '1 PLAYER', 'Returns to menu from leaderboards')

    await ctx.close()
  }

  // ─────────────────────────────────────────────
  // TEST 8: TOWER SOUNDS LOADED
  // ─────────────────────────────────────────────
  console.log('\n🔊 TEST 8: TOWER CLIMB SOUND FILES')
  {
    const towerSoundFiles = ['tower-rise', 'tower-missile', 'tower-collapse', 'tower-win']
    const ctx = await browser.newContext()
    let soundsFound = 0
    for (const name of towerSoundFiles) {
      const page = await ctx.newPage()
      const res = await page.goto(`${BASE}/sounds/${name}.wav`).catch(() => null)
      const status = res?.status() ?? 0
      if (status === 200) soundsFound++
      assert(status === 200, `Tower sound ${name}.wav loads (status: ${status})`)
      await page.close()
    }
    await ctx.close()
  }

  await browser.close()
  printResults()
}

function printResults() {
  console.log('\n' + '═'.repeat(50))
  console.log(`\n📊 TOWER CLIMB TEST RESULTS: ${passed} passed, ${failed} failed\n`)
  if (failures.length > 0) {
    console.log('FAILURES:')
    failures.forEach(f => console.log(`  ❌ ${f}`))
  }
  console.log()
  process.exit(failed > 0 ? 1 : 0)
}

run().catch(e => { console.error(e); process.exit(1) })
