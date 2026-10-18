import { AnimatePresence, motion, type PanInfo } from 'motion/react'
import { useRef } from 'react'
import { slotAt, thumbOf, type Slot } from '../data/products'
import { Kuskar, OrnamentRing } from './Ornament'

type WheelProps = {
  /** Позиция курсора — растёт без ограничений, слот берём по модулю */
  cursor: number
  onPick: (offset: number) => void
  /** true — дуга вертикальная (компьютер), false — горизонтальная (телефон) */
  vertical: boolean
  /** Радиус дуги, по которой едут медальоны, px */
  radius: number
  /** Куда повернули барабан: 1 или -1. Вещи в значках качаются по инерции в обратную сторону */
  direction: number
}

const VISIBLE = 2
const STEP = 40 // градусов между значками на компьютере
export const STEP_H = 25 // на телефоне: дуга пологая, во всю ширину экрана
const PAN_STEP = 90 // px протяжки на один шаг
const FLING_SPEED = 900 // px/с рывка на одну вещь по инерции

/** Барабан с медальонами, как в меню выбора персонажа Sonic Advance */
export function Wheel({ cursor, onPick, vertical, radius: r, direction }: WheelProps) {
  const place = (offset: number) => {
    const a = (offset * (vertical ? STEP : STEP_H) * Math.PI) / 180
    const near = Math.abs(offset)
    return {
      x: r * (vertical ? Math.cos(a) : Math.sin(a)),
      y: r * (vertical ? Math.sin(a) : 1 - Math.cos(a)),
      scale: near < 0.5 ? 1 : 0.68,
      opacity: near < 0.5 ? 1 : near <= 1 ? 0.9 : near <= 2 ? 0.4 : 0,
    }
  }

  // Круг можно крутить, зажав мышью или пальцем: каждые PAN_STEP пикселей — шаг,
  // а резкий рывок в конце докручивает ещё на пару вещей по инерции
  const panDone = useRef(0)
  const along = (p: { x: number; y: number }) => (vertical ? p.y : p.x)
  const onPanStart = () => {
    panDone.current = 0
  }
  const onPan = (_: unknown, info: PanInfo) => {
    const steps = Math.trunc(along(info.offset) / PAN_STEP)
    if (steps !== panDone.current) {
      // Тянем вниз (или вправо) — сверху (слева) приезжает предыдущая вещь
      onPick(panDone.current - steps)
      panDone.current = steps
    }
  }
  // После протяжки браузер ещё и «кликает» по значку под пальцем — этот клик пропускаем
  const panEndedAt = useRef(0)
  const onPanEnd = (_: unknown, info: PanInfo) => {
    panEndedAt.current = Date.now()
    const fling = Math.max(-2, Math.min(2, Math.trunc(along(info.velocity) / FLING_SPEED)))
    if (fling) onPick(-fling)
  }

  const keys = Array.from({ length: VISIBLE * 2 + 1 }, (_, i) => cursor - VISIBLE + i)

  return (
    <motion.div
      className={`wheel ${vertical ? 'wheel--v' : 'wheel--h'}`}
      style={{ ['--r' as string]: `${r}px` }}
      onPanStart={onPanStart}
      onPan={onPan}
      onPanEnd={onPanEnd}
    >
      <div className="wheel__disc" aria-hidden="true">
        <OrnamentRing className="wheel__ring" />
      </div>
      <div className="wheel__track" aria-hidden="true" />
      <AnimatePresence initial={false} custom={cursor}>
        {keys.map((k) => (
          <motion.button
            key={k}
            type="button"
            className={`medal${k === cursor ? ' medal--active' : ''}`}
            custom={cursor}
            variants={{
              enter: (c: number) => place((k - c) * 1.5),
              at: (c: number) => place(k - c),
              exit: (c: number) => place(k - c),
            }}
            initial="enter"
            animate="at"
            exit="exit"
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            onClick={() => {
              if (Date.now() - panEndedAt.current > 250) onPick(k - cursor)
            }}
            tabIndex={-1}
            aria-hidden={k !== cursor}
            aria-label={label(slotAt(k))}
          >
            <Medal slot={slotAt(k)} turn={cursor} kick={-direction} />
          </motion.button>
        ))}
      </AnimatePresence>
    </motion.div>
  )
}

function label(slot: Slot) {
  return slot.kind === 'product' ? slot.product.name : 'Скоро'
}

function Medal({
  slot,
  turn,
  kick,
}: {
  slot: Slot
  turn: number
  kick: number
}) {
  if (slot.kind === 'locked') {
    return (
      <span className="medal__face medal__face--locked">
        <Kuskar size={40} strokeWidth={8} />
      </span>
    )
  }
  return (
    <span className="medal__face" style={{ ['--accent' as string]: slot.product.accent }}>
      {/* Ключ меняется на каждом повороте — качание запускается заново */}
      <motion.span
        key={turn}
        className="medal__swing"
        initial={{ rotate: kick * 9 }}
        animate={{ rotate: 0 }}
        transition={{ type: 'spring', stiffness: 160, damping: 10 }}
      >
        <img className="medal__shirt" src={thumbOf(slot.product.image)} alt="" draggable={false} />
      </motion.span>
    </span>
  )
}
