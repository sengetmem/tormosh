import { ORNAMENT_H, ORNAMENT_PATH, ORNAMENT_W } from './ornamentPath'

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

/** Высота каймы на экране, px. Ширина повтора считается из пропорций узора */
const BAND_H = 44

/** Нижний край узора в исходнике: после переворота он встаёт вплотную к шапке, без зазора */
const ORNAMENT_TOP = 489

/** Кайма «волна с рогами» — красный узор без фона, свисает из-под шапки */
export function OrnamentBand({ id, className = '' }: { id: string; className?: string }) {
  const tileW = (ORNAMENT_W * BAND_H) / ORNAMENT_H
  return (
    <svg className={`band ${className}`} aria-hidden="true">
      <defs>
        <pattern
          id={id}
          width={tileW}
          height={BAND_H}
          patternUnits="userSpaceOnUse"
          viewBox={`0 0 ${ORNAMENT_W} ${ORNAMENT_H}`}
        >
          {/* Перевёрнут: сплошная лента сверху, завитки свисают вниз на прозрачный фон */}
          <path d={ORNAMENT_PATH} fill="currentColor" transform={`translate(0 ${ORNAMENT_TOP}) scale(1 -1)`} />
        </pattern>
      </defs>
      <rect width="100%" height={BAND_H} fill={`url(#${id})`} />
    </svg>
  )
}
