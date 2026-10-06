// Знімки старого дизайну з wuji.world для кадру «було»
const { chromium } = require('playwright-core')
;(async () => {
  // Системний Chrome — щоб не завантажувати окремий браузер Playwright
  const browser = await chromium.launch({ channel: 'chrome' })
  const shots = [
    ['home-desktop', '/', { width: 1440, height: 900 }],
    ['novels-desktop', '/novels', { width: 1440, height: 900 }],
    ['home-mobile', '/', { width: 390, height: 844 }],
    ['book-desktop', '/novel/martial-world', { width: 1440, height: 900 }],
  ]
  for (const [name, path, viewport] of shots) {
    const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2 })
    await ctx.addInitScript(() => sessionStorage.setItem('session-visited', '1'))
    const page = await ctx.newPage()
    await page.goto('https://wuji.world' + path, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {})
    await page.waitForTimeout(2500)
    await page.screenshot({ path: `public/old/${name}.png` })
    console.log(name, page.url())
    await ctx.close()
  }
  await browser.close()
})()
