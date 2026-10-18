import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Backdrop } from './components/Backdrop'
import { ConfirmOverlay } from './components/ConfirmOverlay'
import { Menu } from './components/Menu'
import { OrnamentBand } from './components/Ornament'
import { Stage } from './components/Stage'
import { STEP_H, Wheel } from './components/Wheel'
import { orderLink } from './config'
import { LOCKED_ACCENT, slotAt, slots } from './data/products'
import { useMediaQuery, useViewport } from './hooks/useMediaQuery'
import { chime, setMuted, tick, useMuted } from './sound'

const BG_BASE = '#0a0f22'

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

export default function App() {
  const [[cursor, direction], setState] = useState<[number, number]>(() => [cursorFromHash(), 1])
  const [confirmed, setConfirmed] = useState(false)
  const muted = useMuted()
  const vertical = !useMediaQuery('(max-width: 860px)')
  const { w, h } = useViewport()
  // На компьютере круг подстраивается под окно. На телефоне радиус такой,
  // чтобы крайние значки (±2 шага) вставали ровно у краёв экрана
  const radius = vertical
    ? Math.round(Math.min(430, h * 0.47, w * 0.28))
    : Math.round((w / 2 - MEDAL_H / 2 - 4) / Math.sin((2 * STEP_H * Math.PI) / 180))

  const slot = slotAt(cursor)
  const product = slot.kind === 'product' ? slot.product : null
  const accent = product?.accent ?? LOCKED_ACCENT
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
    root.setProperty('--accent-bg', mixHex(accent, BG_BASE, 0.42))
  }, [accent])

  useEffect(() => {
    history.replaceState(null, '', product ? `#${product.id}` : ' ')
  }, [product])

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

  const confirm = useCallback(() => {
    if (!product) return
    chime()
    setConfirmed(true)
  }, [product])

  const closeConfirm = useCallback(() => setConfirmed(false), [])

  // Управление с клавиатуры, как с геймпада
  useEffect(() => {
    if (confirmed) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') step(1)
      else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') step(-1)
      else if (e.key === 'Enter' && document.activeElement === document.body) confirm()
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [confirmed, step, confirm])

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

        <OrnamentBand id="band-top" className="band--top" />

        <main className="arena" onWheel={onWheel}>
          <div className="selector">
            <button type="button" className="chevron chevron--prev" onClick={() => step(-1)} aria-label="Предыдущая">
              <span aria-hidden="true">▲</span>
            </button>
            <div className="plate-wrap">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.h2
                  key={cursor}
                  className={`plate${product && product.name.length > 10 ? ' plate--long' : ''}`}
                  initial={{ x: -60, opacity: 0, skewX: -10 }}
                  animate={{ x: 0, opacity: 1, skewX: -10 }}
                  exit={{ x: 60, opacity: 0, skewX: -10 }}
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
          {product && orderLink(product.id) ? (
            <a className="btn btn--order" href={orderLink(product.id)} target="_blank" rel="noreferrer" onClick={confirm}>
              <span>Заказать в Telegram</span>
            </a>
          ) : (
            <button type="button" className="btn btn--order" onClick={confirm} disabled={!product}>
              <span>{product ? 'Заказать в Telegram' : 'Скоро'}</span>
            </button>
          )}
        </section>

      </div>

      <AnimatePresence>{confirmed && product && <ConfirmOverlay product={product} onClose={closeConfirm} />}</AnimatePresence>
    </div>
  )
}
