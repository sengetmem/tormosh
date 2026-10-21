import react from '@vitejs/plugin-react'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { defineConfig, runnerImport, type Plugin } from 'vite'

/** Только нужные здесь поля вещи из src/data/products.ts */
type Product = { id: string; name: string; tagline: string; type: string; description: string; price: number | null }

const SITE = 'https://tormoshuwu.ru'

const escape = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** У каждой вещи своя страница /<id>/ — тот же сайт, но со своей карточкой для ссылок
 *  (картинка public/og/<id>.jpg, её рисует scripts/og-cards.mjs). Telegram и ВК не запускают
 *  скрипты сайта, поэтому название, цена и картинка должны быть прямо в HTML */
function productPages(): Plugin {
  let outDir = 'dist'
  return {
    name: 'tormosh-product-pages',
    apply: 'build',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir)
    },
    async closeBundle() {
      // Каталог — прямо из src/data/products.ts (vite сам понимает TypeScript)
      const { module } = await runnerImport<{ products: Product[] }>('/src/data/products.ts', { configFile: false })
      const { products } = module
      const base = await readFile(path.join(outDir, 'index.html'), 'utf8')
      for (const p of products) {
        const price = p.price === null ? 'скоро' : `${p.price.toLocaleString('ru-RU')} ₽`
        const title = escape(`${p.name} — ${p.type.toLowerCase()} TORMOSH, ${price}`)
        const description = escape(`${p.tagline}. ${p.description}`)
        const set = (html: string, attr: string, key: string, value: string) =>
          html.replace(new RegExp(`(<meta ${attr}="${key}" content=")[^"]*(")`), `$1${value}$2`)
        let html = base.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
        html = set(html, 'name', 'description', description)
        html = set(html, 'property', 'og:title', title)
        html = set(html, 'property', 'og:description', description)
        html = set(html, 'property', 'og:url', `${SITE}/${p.id}/`)
        html = set(html, 'property', 'og:image', `${SITE}/og/${p.id}.jpg`)
        await mkdir(path.join(outDir, p.id), { recursive: true })
        await writeFile(path.join(outDir, p.id, 'index.html'), html)
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), productPages()],
  server: {
    // Временная ссылка Cloudflare (cloudflared tunnel) для просмотра с телефона
    allowedHosts: ['.trycloudflare.com'],
  },
})
