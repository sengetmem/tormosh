// Убирает однотонный фон с фото вещей: raw/*.jpg → public/products/*.webp
// Запуск: npm run cutout
// Цвет фона берётся с краёв кадра (чёрный, кремовый — любой однотонный).
// Заливка идёт от краёв, поэтому такой же цвет внутри принта не трогается.
import { readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const SRC = 'raw'
const OUT = 'public/products'
const THUMB_W = 360 // ширина миниатюры для значков, px
const SOLID = 22 // ближе к фону — полностью прозрачно
const SPREAD = 110 // дальше от фона — уже вещь; между ними — мягкий край

// Для вещей, у которых по краю есть цвет, близкий к фону (белый мех лисы на кремовом),
// заливаем строже — иначе часть рисунка уйдёт вместе с фоном
// protect — многоугольник (в пикселях исходника), куда заливка фона не заходит:
// у кофты белый мех на правом плече сливается с кремовым фоном, границу задаём вручную
const TUNE = {
  'sweater-fox': {
    solid: 10,
    spread: 24,
    protect: [
      [702, 152],
      [790, 188],
      [790, 330],
      [702, 330],
    ],
  },
}

const inside = (poly, x, y) => {
  let hit = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]
    const [xj, yj] = poly[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit
  }
  return hit
}

for (const file of await readdir(SRC)) {
  if (!/\.(jpe?g|png)$/i.test(file)) continue
  const name = file.replace(/\.\w+$/, '.webp')
  const { solid = SOLID, spread = SPREAD, protect } = TUNE[name.replace('.webp', '')] ?? {}
  const { data, info } = await sharp(path.join(SRC, file)).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width: w, height: h } = info

  // Фон — медиана пикселей по периметру
  const border = []
  for (let x = 0; x < w; x++) border.push(x, (h - 1) * w + x)
  for (let y = 0; y < h; y++) border.push(y * w, y * w + w - 1)
  const bg = [0, 1, 2].map((c) => {
    const v = border.map((i) => data[i * 3 + c]).sort((a, b) => a - b)
    return v[v.length >> 1]
  })
  const dist = (i) => Math.max(...[0, 1, 2].map((c) => Math.abs(data[i * 3 + c] - bg[c])))

  const rgba = Buffer.alloc(w * h * 4)
  for (let i = 0; i < w * h; i++) {
    rgba[i * 4] = data[i * 3]
    rgba[i * 4 + 1] = data[i * 3 + 1]
    rgba[i * 4 + 2] = data[i * 3 + 2]
    rgba[i * 4 + 3] = 255
  }

  const seen = new Uint8Array(w * h)
  const stack = [...border]
  while (stack.length) {
    const i = stack.pop()
    if (seen[i]) continue
    seen[i] = 1
    const d = dist(i)
    if (d >= spread) continue
    if (protect && inside(protect, i % w, Math.floor(i / w))) continue
    // Полупрозрачный край: вычитаем из пикселя примесь фона
    const a = Math.max(0, Math.min(1, (d - solid) / (spread - solid)))
    rgba[i * 4 + 3] = Math.round(a * 255)
    if (a > 0) {
      for (let c = 0; c < 3; c++) {
        const v = (data[i * 3 + c] - bg[c] * (1 - a)) / a
        rgba[i * 4 + c] = Math.max(0, Math.min(255, Math.round(v)))
      }
    }
    const x = i % w
    if (x > 0) stack.push(i - 1)
    if (x < w - 1) stack.push(i + 1)
    if (i >= w) stack.push(i - w)
    if (i < w * (h - 1)) stack.push(i + w)
  }

  // Оставляем только самую большую цельную область — саму вещь.
  // Пылинки и полоски на фоне фотографии иначе остаются и сбивают обрезку
  const comp = new Int32Array(w * h).fill(-1)
  let best = -1
  let bestSize = 0
  for (let start = 0, id = 0; start < w * h; start++) {
    if (comp[start] !== -1 || rgba[start * 4 + 3] === 0) continue
    let size = 0
    const queue = [start]
    comp[start] = id
    while (queue.length) {
      const i = queue.pop()
      size++
      const x = i % w
      for (const n of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w]) {
        if (n < 0 || n >= w * h || comp[n] !== -1 || rgba[n * 4 + 3] === 0) continue
        comp[n] = id
        queue.push(n)
      }
    }
    if (size > bestSize) {
      bestSize = size
      best = id
    }
    id++
  }
  for (let i = 0; i < w * h; i++) if (comp[i] !== best) rgba[i * 4 + 3] = 0

  const cut = await sharp(rgba, { raw: { width: w, height: h, channels: 4 } })
    .trim()
    .png()
    .toBuffer()
  await sharp(cut).webp({ quality: 90, alphaQuality: 90 }).toFile(path.join(OUT, name))
  // Миниатюра для значков: браузер грубо ужимает большое фото в маленький кружок,
  // поэтому уменьшаем заранее качественным фильтром (с запасом под чёткие экраны)
  await sharp(cut)
    .resize(THUMB_W, null, { kernel: 'lanczos3' })
    .sharpen({ sigma: 0.6 })
    .webp({ quality: 92, alphaQuality: 95 })
    .toFile(path.join(OUT, name.replace('.webp', '.thumb.webp')))
  console.log('ok', name, 'фон', bg.join(','))
}

// Новый номер версии картинок: имя файла не меняется, и без него браузер
// показывает старую копию из кэша
await writeFile(
  'src/data/imageVersion.ts',
  `// Создаётся скриптом npm run cutout — не править руками\nexport const IMAGE_VERSION = '${Date.now().toString(36)}'\n`,
)
