import { AnimatePresence, motion, useMotionValue, useSpring, useTransform, useVelocity, type PanInfo } from 'motion/react'
import { useState } from 'react'
import { products, type Slot } from '../data/products'

type StageProps = {
  slot: Slot
  /** Ключ анимации — меняется при каждом шаге, даже по кругу */
  stepKey: number
  /** 1 — листаем вперёд, -1 — назад */
  direction: number
  onSwipe: (dir: 1 | -1) => void
  /** Текст на картонной бирке — цена */
  tag: string
}

const SWIPE_DISTANCE = 50
/** Наибольший наклон вещи при протяжке, градусы */
const MAX_TILT = 6

/** Большая вещь на вешалке. При смене падает сверху и раскачивается */
export function Stage({ slot, stepKey, direction, onSwipe, tag }: StageProps) {
  // Физика маятника: тянешь вбок — низ вещи отстаёт и она наклоняется,
  // отпускаешь — пружина с малым затуханием раскачивает её туда-сюда
  const x = useMotionValue(0)
  const speed = useVelocity(x)
  const lean = useTransform(speed, [-2000, 0, 2000], [-MAX_TILT, 0, MAX_TILT], { clamp: true })
  const swing = useSpring(lean, { stiffness: 170, damping: 16 })
  // Жёсткий предел: пружина может чуть перелететь, но наклон не выходит за ±MAX_TILT
  const rotate = useTransform(swing, (r) => Math.max(-MAX_TILT, Math.min(MAX_TILT, r)))

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -SWIPE_DISTANCE) onSwipe(1)
    else if (info.offset.x > SWIPE_DISTANCE) onSwipe(-1)
  }

  return (
    <div className="stage">
      <motion.div
        className="stage__drag"
        style={{ x, rotate }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        // Без инерции: отпустил — вещь сразу пружинит на крючок, а не улетает от рывка.
        // Малая упругость — даже при длинной протяжке сдвиг небольшой
        dragElastic={0.12}
        dragMomentum={false}
        dragTransition={{ bounceStiffness: 400, bounceDamping: 30 }}
        onDragEnd={handleDragEnd}
      >
        {/* Смена вещи как перелистывание: старая уезжает вбок по ходу свайпа,
            новая въезжает с другой стороны и чуть качается на крючке */}
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <motion.div
            key={stepKey}
            className="hanger"
            custom={direction}
            variants={{
              enter: (dir: number) => ({ x: `${dir * 70}%`, rotate: dir * 6, opacity: 0 }),
              show: { x: 0, rotate: 0, opacity: 1 },
              leave: (dir: number) => ({ x: `${dir * -70}%`, rotate: dir * -4, opacity: 0 }),
            }}
            initial="enter"
            animate="show"
            exit="leave"
            transition={{
              x: { type: 'spring', stiffness: 320, damping: 32 },
              opacity: { duration: 0.2 },
              // Одно-два мягких качания и останавливается
              rotate: { type: 'spring', stiffness: 120, damping: 11 },
            }}
          >
            <Hook />
            <Garment slot={slot} />
            <span className="pricetag" aria-hidden="true">
              <span className="pricetag__brand">TORMOSH</span>
              <span className="pricetag__price">{tag}</span>
            </span>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

/**
 * Хромированный крючок вешалки — одинаковый у всех вещей.
 * Втулка внизу уходит в воротник, перекладина спрятана внутри вещи.
 */
function Hook() {
  return (
    <svg className="hanger__hook" viewBox="0 0 40 66" aria-hidden="true">
      <defs>
        <linearGradient id="hook-chrome" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#7d8696" />
          <stop offset="0.42" stopColor="#f5f7fb" />
          <stop offset="0.62" stopColor="#c3cad6" />
          <stop offset="1" stopColor="#6f7888" />
        </linearGradient>
      </defs>
      <path
        d="M20 54 V37 C20 29 32 28 32 16 C32 7 26 2 19.5 2 C12.5 2 8 7 8 13"
        fill="none"
        stroke="url(#hook-chrome)"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <rect x="15" y="50" width="10" height="15" rx="2.5" fill="url(#hook-chrome)" />
    </svg>
  )
}

/** Сама вещь. Если у неё есть вторая сторона — её можно повернуть кнопкой */
function Garment({ slot }: { slot: Slot }) {
  const [flipped, setFlipped] = useState(false)

  if (slot.kind === 'locked') {
    // У «секретного» слота показываем тёмный силуэт первой футболки
    return (
      <>
        <img src={products[0].image} alt="Скоро новая вещь" className="hanger__shirt hanger__shirt--locked" draggable={false} />
        <span className="hanger__mystery" aria-hidden="true">
          ?
        </span>
      </>
    )
  }

  const p = slot.product
  const src = flipped && p.flip ? p.flip.image : p.image
  const side = p.flip ? p.flip.labels[flipped ? 1 : 0] : null
  const alt = `${p.type} «${p.name}», ${p.color.toLowerCase()}${side ? `, ${side.toLowerCase()}` : ''}`

  return (
    <>
      <span className="garment">
        <AnimatePresence mode="wait" initial={false}>
          <motion.img
            key={src}
            src={src}
            alt={alt}
            className="hanger__shirt"
            draggable={false}
            initial={{ rotateY: -90 }}
            animate={{ rotateY: 0 }}
            exit={{ rotateY: 90 }}
            transition={{ duration: 0.18, ease: 'easeIn' }}
          />
        </AnimatePresence>
      </span>
      {p.flip && (
        <button type="button" className="flip" onClick={() => setFlipped((v) => !v)}>
          ↻ {p.flip.labels[flipped ? 0 : 1]}
        </button>
      )}
    </>
  )
}
