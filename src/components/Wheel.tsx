import { motion, useSpring, useTransform, type MotionValue, type PanInfo } from 'motion/react'
import { useEffect, useRef } from 'react'
import { slotAt, thumbOf, type Slot } from '../data/products'
import { Kuskar, OrnamentRing } from './Ornament'
import { Medallion } from './Medallion'

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
/** Градусов между значками (и между лучами медальона). На телефоне дуга пологая: 14 шагов на круг */
export const stepOf = (vertical: boolean) => (vertical ? 40 : 360 / 14)
/** Сколько значков от выбранного до края дуги на телефоне */
export const EDGE_STEPS = 2
const PAN_STEP = 90 // px протяжки на один шаг
const FLING_SPEED = 900 // px/с рывка на одну вещь по инерции

/** Барабан с медальонами, как в меню выбора персонажа Sonic Advance */
export function Wheel({ cursor, onPick, vertical, radius: r, direction }: WheelProps) {
  // Одна пружина на весь барабан: из неё считаются и поворот юрты, и места значков.
  // Значки едут строго по дуге, а не по прямой, — поэтому юрта и значки движутся как одно целое
  const pos = useSpring(cursor, { stiffness: 260, damping: 28 })
  useEffect(() => {
    pos.set(cursor)
  }, [cursor, pos])
  const step = stepOf(vertical)
  const rotate = useTransform(pos, (p) => -p * step)

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

  // На один значок больше с каждой стороны: уходящий значок успевает плавно погаснуть
  const keys = Array.from({ length: VISIBLE * 2 + 3 }, (_, i) => cursor - VISIBLE - 1 + i)

  return (
    <motion.div
      className={`wheel ${vertical ? 'wheel--v' : 'wheel--h'}`}
      style={{ ['--r' as string]: `${r}px` }}
      onPanStart={onPanStart}
      onPan={onPan}
      onPanEnd={onPanEnd}
    >
      {/* Медальон крутится вместе со значками, лучи — по шагу значков: каждый значок на своём луче */}
      <motion.div className="wheel__disc" aria-hidden="true" style={{ rotate }}>
        <Medallion rays={Math.round(360 / step)} phase={vertical ? 0 : -90} />
        <OrnamentRing className="wheel__ring" />
      </motion.div>
      {keys.map((k) => (
        <WheelMedal
          key={k}
          k={k}
          pos={pos}
          active={k === cursor}
          vertical={vertical}
          r={r}
          onClick={() => {
            if (Date.now() - panEndedAt.current > 250) onPick(k - cursor)
          }}
        >
          <Medal slot={slotAt(k)} turn={cursor} kick={-direction} />
        </WheelMedal>
      ))}
    </motion.div>
  )
}

/** Значок на дуге: место считается из общей пружины барабана */
function WheelMedal({
  k,
  pos,
  active,
  vertical,
  r,
  onClick,
  children,
}: {
  k: number
  pos: MotionValue<number>
  active: boolean
  vertical: boolean
  r: number
  onClick: () => void
  children: React.ReactNode
}) {
  const step = stepOf(vertical)
  const angle = (p: number) => ((k - p) * step * Math.PI) / 180
  const near = (p: number) => Math.abs(k - p)
  const x = useTransform(pos, (p) => r * (vertical ? Math.cos(angle(p)) : Math.sin(angle(p))))
  const y = useTransform(pos, (p) => r * (vertical ? Math.sin(angle(p)) : 1 - Math.cos(angle(p))))
  const scale = useTransform(pos, (p) => 1 - 0.32 * Math.min(1, near(p)))
  // Значки непрозрачные; гаснет только тот, что уходит за край дуги
  const opacity = useTransform(pos, (p) => Math.max(0, Math.min(1, 3 - near(p))))
  const slot = slotAt(k)
  return (
    <motion.button
      type="button"
      className={`medal${active ? ' medal--active' : ''}`}
      style={{ x, y, scale, opacity }}
      onClick={onClick}
      tabIndex={-1}
      aria-hidden={!active}
      aria-label={label(slot)}
    >
      {children}
    </motion.button>
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
