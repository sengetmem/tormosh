// Карточки для ссылок на вещи: public/og/<id>.jpg (1200×630) — их показывают Telegram и ВК,
// когда присылают ссылку вида tormoshuwu.ru/spiral/
// Запуск (после новой вещи, смены цены или фото):
//   npm i --no-save puppeteer-core
//   node scripts/og-cards.mjs
// Рисует через Microsoft Edge, который есть на любом Windows.
import { mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import puppeteer from 'puppeteer-core'
import { createServer } from 'vite'

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const ROOT = process.cwd()
const OUT = path.join(ROOT, 'public/og')
const file = (p) => pathToFileURL(path.join(ROOT, p)).href

// Каталог берём прямо из src/data/products.ts — через vite, он понимает TypeScript
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
const { products } = await vite.ssrLoadModule('/src/data/products.ts')
await vite.close()

/** Фон как на сайте: 62% цвета вещи + почти чёрный */
const mix = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
  const ink = [0, 8, 20]
  return `rgb(${c.map((v, i) => Math.round(v * 0.62 + ink[i] * 0.38)).join(' ')})`
}

const fonts = [
  ['Unbounded', 900, 'unbounded-900'],
  ['Rubik', 900, 'rubik-900'],
  ['Golos Text', 600, 'golos-text-600'],
]
  .flatMap(([family, weight, name]) =>
    ['cyrillic-ext', 'cyrillic', 'latin-ext', 'latin'].map(
      (part) => `@font-face{font-family:'${family}';font-weight:${weight};src:url(${file(`public/fonts/${name}-${part}.woff2`)})}`,
    ),
  )
  .join('\n')

const card = (p) => {
  const price = p.price === null ? 'Скоро' : `${p.price.toLocaleString('ru-RU')} ₽`
  const long = p.name.length > 10
  const image = file(`public${p.image.split('?')[0]}`)
  return `<!doctype html><meta charset="utf-8"><style>
${fonts}
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;overflow:hidden;position:relative;font-family:'Golos Text';color:#fff;
  background:repeating-linear-gradient(135deg,rgb(255 255 255/.07) 0 34px,transparent 34px 68px),${mix(p.accent)}}
.shirt{position:absolute;left:30px;top:40px;width:560px;height:560px;object-fit:contain;
  filter:drop-shadow(0 22px 26px rgb(0 0 0/.45))}
.panel{position:absolute;right:-40px;top:0;bottom:0;width:640px;background:#000814;
  clip-path:polygon(70px 0,100% 0,100% 100%,0 100%);padding:58px 90px 0 120px}
.logo{font-family:'Unbounded';font-size:58px;letter-spacing:-.03em;transform:skewX(-10deg);
  text-shadow:5px 5px 0 ${p.accent};display:inline-block}
.bar{height:6px;width:100%;background:${p.accent};margin:26px 0 34px}
.type{font-size:24px;letter-spacing:.18em;text-transform:uppercase;color:#ffd400}
.name{font-family:'Rubik';font-size:${long ? 56 : 92}px;line-height:1.02;margin:10px 0 14px;transform:skewX(-6deg)}
.tag{font-size:26px;color:rgb(255 255 255/.75);font-style:italic}
.price{position:absolute;left:120px;bottom:78px;background:#ffd400;color:#000814;font-family:'Rubik';
  font-size:54px;padding:8px 34px;transform:skewX(-10deg);box-shadow:8px 8px 0 ${p.accent}}
.site{position:absolute;left:124px;bottom:22px;font-size:22px;color:rgb(255 255 255/.6)}
</style>
<img class="shirt" src="${image}">
<div class="panel">
  <div class="logo">TORMOSH</div>
  <div class="bar"></div>
  <div class="type">${p.type} · ${p.code}</div>
  <div class="name">${p.name}</div>
  <div class="tag">${p.tagline}</div>
  <div class="price">${price}</div>
  <div class="site">tormoshuwu.ru</div>
</div>`
}

await mkdir(OUT, { recursive: true })
const browser = await puppeteer.launch({ executablePath: EDGE, headless: 'new', args: ['--allow-file-access-from-files'] })
const page = await browser.newPage()
await page.setViewport({ width: 1200, height: 630 })
for (const p of products) {
  const html = path.join(tmpdir(), `tormosh-og-${p.id}.html`)
  await writeFile(html, card(p))
  await page.goto(pathToFileURL(html).href, { waitUntil: 'load' })
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: path.join(OUT, `${p.id}.jpg`), type: 'jpeg', quality: 88 })
  console.log('og/' + p.id + '.jpg')
}
await browser.close()
