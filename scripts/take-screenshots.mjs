import { chromium } from 'playwright'

const BASE_URL = 'http://localhost:5174'
const OUTDIR = 'screenshots'

async function run() {
  const browser = await chromium.launch()

  // Desktop menu
  const desktopCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const desktopPage = await desktopCtx.newPage()
  await desktopPage.goto(BASE_URL)
  await desktopPage.waitForTimeout(1000)
  await desktopPage.screenshot({ path: `${OUTDIR}/01-menu-desktop.png`, fullPage: true })
  console.log('1. Desktop menu screenshot taken')

  // Mobile menu (iPhone 14 viewport)
  const mobileCtx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  })
  const mobilePage = await mobileCtx.newPage()
  await mobilePage.goto(BASE_URL)
  await mobilePage.waitForTimeout(1000)
  await mobilePage.screenshot({ path: `${OUTDIR}/02-menu-mobile.png`, fullPage: true })
  console.log('2. Mobile menu screenshot taken')

  // Phone controller join page (mobile)
  const joinPage = await mobileCtx.newPage()
  await joinPage.goto(`${BASE_URL}/join/abc123`)
  await joinPage.waitForTimeout(1000)
  await joinPage.screenshot({ path: `${OUTDIR}/03-phone-join.png`, fullPage: true })
  console.log('3. Phone join page screenshot taken')

  // Click 1 PLAYER to go to CPU select
  const cpuPage = await desktopCtx.newPage()
  await cpuPage.goto(BASE_URL)
  await cpuPage.waitForTimeout(500)
  await cpuPage.click('text=1 PLAYER')
  await cpuPage.waitForTimeout(1000)
  await cpuPage.screenshot({ path: `${OUTDIR}/04-cpu-select.png`, fullPage: true })
  console.log('4. CPU select screenshot taken')

  // Settings overlay
  const settingsPage = await desktopCtx.newPage()
  await settingsPage.goto(BASE_URL)
  await settingsPage.waitForTimeout(500)
  // Click settings gear (top-right button)
  await settingsPage.click('button:has(svg)')
  await settingsPage.waitForTimeout(500)
  await settingsPage.screenshot({ path: `${OUTDIR}/05-settings.png`, fullPage: true })
  console.log('5. Settings screenshot taken')

  // Phone Lobby (click PHONE PLAY)
  const lobbyPage = await desktopCtx.newPage()
  await lobbyPage.goto(BASE_URL)
  await lobbyPage.waitForTimeout(500)
  await lobbyPage.click('text=PHONE PLAY')
  await lobbyPage.waitForTimeout(2000) // Give PeerJS time to set up
  await lobbyPage.screenshot({ path: `${OUTDIR}/06-phone-lobby.png`, fullPage: true })
  console.log('6. Phone lobby screenshot taken')

  await browser.close()
  console.log('\nAll screenshots saved to screenshots/')
}

run().catch(e => { console.error(e); process.exit(1) })
