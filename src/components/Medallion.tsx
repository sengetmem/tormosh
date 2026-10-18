import { MEDALLION } from './medallionPath'

type Props = {
  /** Сколько лучей — по шагу значков, чтобы каждый значок стоял на своём луче */
  rays: number
  /** Угол первого луча, градусы (0 — вправо): туда смотрит выбранный значок */
  phase: number
}

const C = 500
const CROWN = 138 // внешний край шаңыраҡа
const RAY_END = 390 // лучи доходят до фиолетового обода
const RIM = 396 // фиолетовый обод: внутри — лучи и узор, снаружи — кайма из завитков
/** В исходнике лучей 8: завиток стоит посередине между лучами −90° и −45° */
const SRC_SECTOR = 45
const SRC_MID = -67.5
const SPRIG_R = 262 // на каком радиусе центр завитка
const SPRIG_OUT = 362 // дальше завитков нет — там кончик каймы, пробивающий обод

const BORDER_OUT = 474 // дальше начинается внешняя линия исходника — её закрывает наша кайма

/** Круг одним путём — для вырезов */
const circle = (r: number) => `M ${C - r} ${C} A ${r} ${r} 0 1 0 ${C + r} ${C} A ${r} ${r} 0 1 0 ${C - r} ${C} Z`

const arc = (r: number, deg: number) => {
  const a = (deg * Math.PI) / 180
  return `${(C + r * Math.cos(a)).toFixed(1)} ${(C + r * Math.sin(a)).toFixed(1)}`
}

/** Медальон на барабане (фон — бумага самого диска). Лучи и завитки между ними строятся
 *  по числу значков; кайма из завитков и шаңыраҡ — как на картинке владельца. Цвет — в CSS */
export function Medallion({ rays, phase }: Props) {
  const sector = 360 / rays
  // В узком секторе завиток уменьшаем, чтобы соседние не слипались
  const shrink = Math.min(1, sector / SRC_SECTOR)
  const [sx, sy] = arc(SPRIG_R, SRC_MID).split(' ').map(Number)
  const angles = Array.from({ length: rays }, (_, i) => phase + i * sector)

  return (
    <svg className="yurt medallion" viewBox="0 0 1000 1000" aria-hidden="true">
      <defs>
        {/* Один сектор исходника между двумя лучами — из него берём завиток */}
        <clipPath id="medallion-sprig">
          <path
            d={`M ${arc(CROWN, SRC_MID - SRC_SECTOR / 2)} L ${arc(SPRIG_OUT, SRC_MID - SRC_SECTOR / 2)} A ${SPRIG_OUT} ${SPRIG_OUT} 0 0 1 ${arc(SPRIG_OUT, SRC_MID + SRC_SECTOR / 2)} L ${arc(CROWN, SRC_MID + SRC_SECTOR / 2)} Z`}
          />
        </clipPath>
        {/* Снаружи обода — кайма из завитков, берём как есть. Тонкую внешнюю линию исходника
            срезаем: её место занимает наша красная кайма, иначе между ними остаётся зазор */}
        <clipPath id="medallion-border">
          <path
            d={`${circle(BORDER_OUT)} ${circle(RIM)}`}
            clipRule="evenodd"
          />
        </clipPath>
      </defs>

      <path className="medallion__blue" d={MEDALLION.blue} fillRule="evenodd" clipPath="url(#medallion-border)" />

      {/* Завиток посередине каждого сектора */}
      {angles.map((a) => (
        <g key={`s${a}`} transform={`rotate(${a + sector / 2 - SRC_MID} ${C} ${C})`}>
          <g transform={`translate(${sx} ${sy}) scale(${shrink}) translate(${-sx} ${-sy})`}>
            <path className="medallion__blue" d={MEDALLION.blue} fillRule="evenodd" clipPath="url(#medallion-sprig)" />
          </g>
        </g>
      ))}

      {/* Золотые лучи — от шаңыраҡа до обода */}
      {angles.map((a) => (
        <rect
          key={`r${a}`}
          className="medallion__gold"
          x={C + CROWN - 4}
          y={C - 9}
          width={RAY_END - CROWN + 4}
          height={18}
          transform={`rotate(${a} ${C} ${C})`}
        />
      ))}

      {/* Обод сплошным кольцом: в исходнике его разрывали кончики каймы на старых лучах */}
      <circle className="medallion__ring" cx={C} cy={C} r={RIM} strokeWidth={14} />
      <path className="medallion__purple" d={MEDALLION.purple} fillRule="evenodd" />
    </svg>
  )
}
