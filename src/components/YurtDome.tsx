// Купол юрты, вид снизу: войлок, уыҡ (жерди) и шаңыраҡ с решёткой в центре.
// Рисуем сами, а не фото: жердей ровно столько, сколько вещей в меню,
// и круг идеально по центру — при повороте ничего не «гуляет».

type Props = {
  /** Сколько жердей — по числу вещей: один поворот на вещь = одна жердь */
  poles: number
  /** Угол первой жерди, градусы (0 — вправо): туда смотрит выбранный значок */
  phase: number
}

const C = 500
const CROWN = 118 // радиус шаңыраҡа
const EDGE = 500

const xy = (r: number, deg: number) => {
  const a = (deg * Math.PI) / 180
  return [C + r * Math.cos(a), C + r * Math.sin(a)].map((v) => Number(v.toFixed(1)))
}
const polar = (r: number, deg: number) => xy(r, deg).join(' ')

export function YurtDome({ poles, phase }: Props) {
  const step = 360 / poles
  const angles = Array.from({ length: poles }, (_, i) => phase + i * step)
  // Перекладины решётки: по три в каждую сторону, как на настоящем шаңыраҡе
  const bars = [-34, 0, 34]

  return (
    <svg className="yurt" viewBox="0 0 1000 1000" aria-hidden="true">
      <defs>
        <linearGradient id="yurt-pole" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a8703f" />
          <stop offset="0.5" stopColor="#8a5a31" />
          <stop offset="1" stopColor="#5e3b1e" />
        </linearGradient>
        <clipPath id="yurt-hole">
          <circle cx={C} cy={C} r={CROWN - 14} />
        </clipPath>
      </defs>

      {/* Войлок: полотнища между жердями чуть разного тона, как сшитые куски */}
      {angles.map((a, i) => (
        <path
          key={a}
          d={`M ${polar(CROWN, a)} L ${polar(EDGE, a)} A ${EDGE} ${EDGE} 0 0 1 ${polar(EDGE, a + step)} L ${polar(CROWN, a + step)} Z`}
          fill={i % 2 ? '#d6cfc2' : '#cdc5b6'}
        />
      ))}
      {/* Швы посередине полотнищ */}
      {angles.map((a) => {
        const [x1, y1] = xy(CROWN + 30, a + step / 2)
        const [x2, y2] = xy(EDGE, a + step / 2)
        return <line key={a} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#b9b09f" strokeWidth="2" strokeDasharray="10 8" />
      })}

      {/* Жерди: тень + само дерево, от шаңыраҡа к краю */}
      {angles.map((a) => (
        <g key={a} transform={`rotate(${a} ${C} ${C})`}>
          <rect x={C + CROWN - 6} y={C - 6} width={EDGE - CROWN + 6} height="22" fill="rgb(40 25 10 / 0.25)" />
          <rect x={C + CROWN - 6} y={C - 11} width={EDGE - CROWN + 6} height="22" rx="3" fill="url(#yurt-pole)" />
        </g>
      ))}

      {/* Шаңыраҡ: тёмное небо в проёме, решётка и толстый обод */}
      <circle cx={C} cy={C} r={CROWN} fill="#2b1d12" />
      <g clipPath="url(#yurt-hole)" fill="url(#yurt-pole)">
        {bars.map((d) => (
          <rect key={`v${d}`} x={C + d - 8} y={C - CROWN} width="16" height={CROWN * 2} />
        ))}
        {bars.map((d) => (
          <rect key={`h${d}`} x={C - CROWN} y={C + d - 8} width={CROWN * 2} height="16" />
        ))}
      </g>
      <circle cx={C} cy={C} r={CROWN - 7} fill="none" stroke="#7a4e2a" strokeWidth="16" />
      <circle cx={C} cy={C} r={CROWN - 7} fill="none" stroke="#a8703f" strokeWidth="4" />
    </svg>
  )
}
