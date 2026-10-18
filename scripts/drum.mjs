// Готовит рисунок барабана «Юрта»: raw/drum/yurt.jpg → public/drum/yurt.webp
// Запуск: npm run drum
// Вырезаем круг купола (вид сверху) внутри его собственной каймы — её место
// займёт наша красная кайма. Приглушаем, чтобы войлок не спорил со значками.
import sharp from 'sharp'

const SRC = 'raw/drum/yurt.jpg'
const OUT = 'public/drum/yurt.webp'
/** Центр купола и радиус выреза на исходнике 1254×1254 */
const CX = 625
const CY = 598
const R = 392
const SIZE = 1200

const side = R * 2
const mask = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}"><circle cx="${SIZE / 2}" cy="${SIZE / 2}" r="${SIZE / 2}"/></svg>`,
)

await sharp(SRC)
  .extract({ left: CX - R, top: CY - R, width: side, height: side })
  .resize(SIZE, SIZE)
  .modulate({ brightness: 0.78, saturation: 0.75 })
  .linear(0.92, 4)
  .ensureAlpha()
  .composite([{ input: mask, blend: 'dest-in' }])
  .webp({ quality: 82 })
  .toFile(OUT)

console.log('готово:', OUT)
