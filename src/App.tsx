import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Backdrop } from './components/Backdrop'
import { ConfirmOverlay, type ContactTarget } from './components/ConfirmOverlay'
import { Menu } from './components/Menu'
import { Stage } from './components/Stage'
import { EDGE_STEPS, stepOf, Wheel } from './components/Wheel'
import { orderLink, VK_URL } from './config'
import { LOCKED_ACCENT, slotAt, slots } from './data/products'
import { useMediaQuery, useViewport } from './hooks/useMediaQuery'
import { chime, setMuted, tick, useMuted } from './sound'

/** Заранее скачанные и раскодированные картинки — держим ссылки, чтобы браузер их не выбросил */
const preloaded = new Map<string, HTMLImageElement>()
const preload = (src: string) => {
  if (preloaded.has(src)) return
  const image = new Image()
  image.src = src
  image.decode().catch(() => {})
  preloaded.set(src, image)
}

const hexToRgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))

/** Смешать два цвета #rrggbb: share — доля первого */
const mixHex = (a: string, b: string, share: number) => {
  const [x, y] = [hexToRgb(a), hexToRgb(b)]
  return `rgb(${x.map((v, i) => Math.round(v * share + y[i] * (1 - share))).join(' ')})`
}

// Ссылка вида /#seen-this-man сразу открывает нужную футболку
const cursorFromHash = () =>
  Math.max(0, slots.findIndex((s) => s.kind === 'product' && `#${s.product.id}` === window.location.hash))

const WHEEL_COOLDOWN = 280
/** Наименьший промежуток между шагами меню, мс */
const STEP_COOLDOWN = 300
/** Диаметр значка на телефоне, px — как в CSS (.wheel--h .medal) */
const MEDAL_H = 66
/** Фон экрана — цвет вещи, смешанный с --ink: доля самой вещи */
const BG_BASE = '#000814'
const BG_SHARE = 0.62

export default function App() {
  const [[cursor, direction], setState] = useState<[number, number]>(() => [cursorFromHash(), 1])
  const [target, setTarget] = useState<ContactTarget | null>(null)
  const muted = useMuted()
  const vertical = !useMediaQuery('(max-width: 860px)')
  const { w, h } = useViewport()
  // На компьютере круг подстраивается под окно. На телефоне радиус такой,
  // чтобы крайние значки (±EDGE_STEPS шагов) вставали ровно у краёв экрана
  const radius = vertical
    ? Math.round(Math.min(430, h * 0.47, w * 0.28))
    : Math.round((w / 2 - MEDAL_H / 2 - 4) / Math.sin((EDGE_STEPS * stepOf(false) * Math.PI) / 180))

  const slot = slotAt(cursor)
  const product = slot.kind === 'product' ? slot.product : null
  const accent = product ? product.accent : LOCKED_ACCENT
  const position = slots.indexOf(slot) + 1

  // Ссылку на вещь могут открыть, когда сайт уже открыт, — переключаемся на неё
  useEffect(() => {
    const onHash = () => {
      const next = cursorFromHash()
      if (slots[next]?.kind === 'product' && `#${slots[next].product.id}` === window.location.hash) {
        setState(([cur]) => (slotAt(cur) === slots[next] ? [cur, 1] : [next, 1]))
      }
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  // Цвет товара красит всю страницу, включая меню, которое живёт вне .site
  useEffect(() => {
    const root = document.documentElement.style
    root.setProperty('--accent', accent)
    // Производные цвета считаем здесь, а не через color-mix в CSS:
    // часть мобильных браузеров его не знает и показывает вместо фона почти чёрный
    const [r, g, b] = hexToRgb(accent)
    root.setProperty('--accent-rgb', `${r} ${g} ${b}`)
    root.setProperty('--accent-bg', mixHex(accent, BG_BASE, BG_SHARE))
  }, [accent])

  useEffect(() => {
    history.replaceState(null, '', product ? `#${product.id}` : ' ')
  }, [product])

  // Соседние вещи (по две в каждую сторону) качаем заранее — при листании они появляются сразу,
  // без пустой вешалки. Обратную сторону («повернуть») тоже
  useEffect(() => {
    for (const offset of [1, -1, 2, -2]) {
      const s = slotAt(cursor + offset)
      if (s.kind !== 'product') continue
      preload(s.product.image)
      if (s.product.flip) preload(s.product.flip.image)
    }
    if (product?.flip) preload(product.flip.image)
  }, [cursor, product])

  // Ограничение скорости: не чаще одного шага в STEP_COOLDOWN мс — для кнопок,
  // клавиш, колёсика и пальца. Иначе при быстром листании анимации наслаиваются и лагают
  const lastStep = useRef(0)
  const step = useCallback((offset: number) => {
    if (offset === 0) return
    const now = performance.now()
    if (now - lastStep.current < STEP_COOLDOWN) return
    lastStep.current = now
    tick()
    setState(([cur]) => [cur + offset, Math.sign(offset)])
  }, [])

  // Нажали «Telegram» или «ВК» — сначала вспышка «Әйҙә!», переход делает сама вспышка
  const contact = (t: ContactTarget) => (e: React.MouseEvent) => {
    e.preventDefault()
    chime()
    setTarget(t)
  }
  const closeConfirm = useCallback(() => setTarget(null), [])

  // Управление с клавиатуры, как с геймпада
  useEffect(() => {
    if (target) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') step(1)
      else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') step(-1)
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [step, target])

  // Колёсико мыши листает вещи, как стрелки. Пауза — чтобы один щелчок колёсика = один шаг
  const lastWheel = useRef(0)
  const onWheel = (e: React.WheelEvent) => {
    if (!vertical || Math.abs(e.deltaY) < 4) return
    const now = Date.now()
    if (now - lastWheel.current < WHEEL_COOLDOWN) return
    lastWheel.current = now
    step(e.deltaY > 0 ? 1 : -1)
  }

  const priceText = product ? (product.price === null ? 'Скоро' : `${product.price.toLocaleString('ru-RU')} ₽`) : '???'

  return (
    <div className="site">
      <div className="screen">
        <Backdrop />

        <header className="topbar">
          <h1 className="logo">TORMOSH</h1>
          <div className="strip strip--top">
            <span className="strip__title">Выбери вещь</span>
            <span className="strip__count">
              {String(position).padStart(2, '0')} / {String(slots.length).padStart(2, '0')}
            </span>
          </div>
          <button
            type="button"
            className={`mute${muted ? ' mute--off' : ''}`}
            aria-pressed={!muted}
            aria-label={muted ? 'Включить звук' : 'Выключить звук'}
            onClick={() => setMuted(!muted)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 9h4l5-4v14l-5-4H4z" />
              {muted ? <path d="M16 9l5 6M21 9l-5 6" /> : <path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" />}
            </svg>
          </button>
          <Menu />
        </header>

        <main className="arena" onWheel={onWheel}>
          <div className="selector">
            <button type="button" className="chevron chevron--prev" onClick={() => step(-1)} aria-label="Предыдущая">
              <span aria-hidden="true">▲</span>
            </button>
            <div className="plate-wrap">
              {/* Табличка едет по ходу листания: «дальше» — новая приезжает справа, «назад» — слева */}
              <AnimatePresence mode="popLayout" initial={false} custom={direction}>
                <motion.h2
                  key={cursor}
                  className={`plate${product && product.name.length > 10 ? ' plate--long' : ''}`}
                  custom={direction}
                  variants={{
                    enter: (dir: number) => ({ x: dir * 60, opacity: 0, skewX: -10 }),
                    show: { x: 0, opacity: 1, skewX: -10 },
                    leave: (dir: number) => ({ x: dir * -60, opacity: 0, skewX: -10 }),
                  }}
                  initial="enter"
                  animate="show"
                  exit="leave"
                  transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                >
                  {product ? product.name : '???'}
                </motion.h2>
              </AnimatePresence>
            </div>
            <button type="button" className="chevron chevron--next" onClick={() => step(1)} aria-label="Следующая">
              <span aria-hidden="true">▲</span>
            </button>
          </div>

          <Wheel cursor={cursor} onPick={step} vertical={vertical} radius={radius} direction={direction} />

          <div className="arena__stage">
            <Stage slot={slot} stepKey={cursor} direction={direction} onSwipe={step} tag={priceText} />
          </div>
        </main>

        <section className="strip strip--bottom" aria-live="polite">
          <div className="strip__about">
            <p className="strip__name">
              {product ? product.name : 'Новая вещь'}
              <span>{product ? product.tagline : 'скоро в коллекции'}</span>
            </p>
            <p className="strip__desc">
              {product ? `${product.type} · ${product.color.toLowerCase()}. ${product.description}` : 'Следите за TORMOSH — скоро откроем.'}
            </p>
          </div>
          <div className="strip__price">
            <span>Цена</span>
            <strong>{priceText}</strong>
          </div>
          {/* Кнопки связи: Telegram сразу знает, какую вещь выбрали; ВК — просто написать */}
          {product ? (
            <div className="contact">
              <a
                className="btn btn--order"
                href={orderLink(product.id)}
                onClick={contact({ label: 'Telegram', url: orderLink(product.id) })}
              >
                <span>Telegram</span>
              </a>
              <a className="btn btn--order" href={VK_URL} onClick={contact({ label: 'ВКонтакте', url: VK_URL })}>
                <span>ВКонтакте</span>
              </a>
            </div>
          ) : (
            <button type="button" className="btn btn--order" disabled>
              <span>Скоро</span>
            </button>
          )}
        </section>

      </div>

      <AnimatePresence>
        {target && product && <ConfirmOverlay product={product} target={target} onClose={closeConfirm} />}
      </AnimatePresence>
    </div>
  )
}
