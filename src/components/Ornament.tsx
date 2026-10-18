import { ORNAMENT_PATH, ORNAMENT_W } from './ornamentPath'

// Кускар («бараний рог») — один из базовых мотивов башкирского орнамента.
// Рисуем его линией, чтобы он красился через currentColor.

type KuskarProps = { size?: number; strokeWidth?: number; className?: string }

export function Kuskar({ size = 48, strokeWidth = 7, className }: KuskarProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M50 58 C50 26 86 18 89 45 C91 63 70 69 64 55 C60 46 70 40 76 47" />
      <path d="M50 58 C50 26 14 18 11 45 C9 63 30 69 36 55 C40 46 30 40 24 47" />
      <path d="M50 58 L50 84" />
      <path d="M50 84 L42 92 L50 100 L58 92 Z" strokeWidth={strokeWidth * 0.6} />
    </svg>
  )
}

/** Нижний край узора в исходнике — там сплошная лента каймы */
const ORNAMENT_TOP = 489

/**
 * Кайма «волна с рогами», согнутая в кольцо: каждую точку узора переводим в полярные координаты.
 * Сплошная лента — по внешнему краю, завитки смотрят к центру. Координаты — в квадрате 1000×1000.
 * @param depth толщина каймы в долях радиуса
 */
function ringPath(depth: number) {
  const R = 500
  const band = R * depth
  const tileArc = (ORNAMENT_W * band) / ORNAMENT_TOP
  const count = Math.round((2 * Math.PI * (R - band / 2)) / tileArc)
  const tokens = ORNAMENT_PATH.match(/[A-Za-z]|-?\d*\.?\d+/g) ?? []
  const parts: string[] = []
  for (let i = 0; i < count; i++) {
    let even = true
    let x = 0
    for (const t of tokens) {
      if (/[A-Za-z]/.test(t)) {
        parts.push(t)
        continue
      }
      if (even) {
        x = Number(t)
      } else {
        const angle = ((i + x / ORNAMENT_W) / count) * 2 * Math.PI
        const rho = R - ((ORNAMENT_TOP - Number(t)) / ORNAMENT_TOP) * band
        parts.push(`${(R + rho * Math.sin(angle)).toFixed(1)} ${(R - rho * Math.cos(angle)).toFixed(1)}`)
      }
      even = !even
    }
  }
  return parts.join(' ')
}

const ringCache = new Map<number, string>()

/** Кайма по краю круглого барабана */
export function OrnamentRing({ depth = 0.05, className = '' }: { depth?: number; className?: string }) {
  if (!ringCache.has(depth)) ringCache.set(depth, ringPath(depth))
  return (
    <svg className={`ring ${className}`} viewBox="0 0 1000 1000" aria-hidden="true">
      <path d={ringCache.get(depth)} fill="currentColor" />
    </svg>
  )
}

