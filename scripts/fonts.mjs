// Скачивает шрифты с Google Fonts и кладёт их в сам сайт: public/fonts/*.woff2 + src/fonts.css.
// Так посетители не обращаются к серверам Google (их адрес не уходит третьей стороне).
// Запуск: node scripts/fonts.mjs — нужен только при смене шрифтов.
import { mkdir, rm, writeFile } from 'node:fs/promises'

const CSS_URL =
  'https://fonts.googleapis.com/css2?family=Golos+Text:wght@400;600;800&family=Rubik:wght@500;700;900&family=Unbounded:wght@900&display=swap'
// Современный браузер — тогда Google отдаёт woff2 с разбивкой по алфавитам
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'
// Нужные алфавиты: кириллица (с башкирскими буквами) и латиница
const KEEP = new Set(['cyrillic-ext', 'cyrillic', 'latin-ext', 'latin'])

const css = await (await fetch(CSS_URL, { headers: { 'User-Agent': UA } })).text()
await rm('public/fonts', { recursive: true, force: true })
await mkdir('public/fonts', { recursive: true })

// Блоки вида: /* cyrillic */ @font-face { ... }
const blocks = [...css.matchAll(/\/\* ([\w-]+) \*\/\s*(@font-face \{[^}]+\})/g)]
let out = '/* Создаётся скриптом scripts/fonts.mjs — не править руками */\n'
for (const [, subset, face] of blocks) {
  if (!KEEP.has(subset)) continue
  const family = face.match(/font-family: '([^']+)'/)[1]
  const weight = face.match(/font-weight: (\d+)/)[1]
  const url = face.match(/url\((https:[^)]+)\)/)[1]
  const file = `${family.replace(/\s+/g, '-').toLowerCase()}-${weight}-${subset}.woff2`
  await writeFile(`public/fonts/${file}`, Buffer.from(await (await fetch(url)).arrayBuffer()))
  out += `/* ${subset} */\n${face.replace(url, `/fonts/${file}`)}\n`
}
await writeFile('src/fonts.css', out)
console.log('шрифтов:', out.match(/@font-face/g).length)
