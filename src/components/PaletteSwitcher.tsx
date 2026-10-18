import { PALETTES, type Palette } from '../data/palettes'

type Props = { current: Palette; onPick: (p: Palette) => void }

/** Временная панель для сравнения палитр. Видна только с ?pal в адресе */
export function PaletteSwitcher({ current, onPick }: Props) {
  const pick = (p: Palette) => {
    onPick(p)
    const url = new URL(window.location.href)
    url.searchParams.set('pal', p.id)
    history.replaceState(null, '', url)
  }

  return (
    <div className="palettes" role="radiogroup" aria-label="Палитра">
      {PALETTES.map((p) => (
        <button
          key={p.id}
          type="button"
          role="radio"
          aria-checked={p.id === current.id}
          className={`palettes__item${p.id === current.id ? ' palettes__item--on' : ''}`}
          onClick={() => pick(p)}
          title={p.note}
        >
          <span className="palettes__dots" aria-hidden="true">
            {Object.values(p.accents).map((c) => (
              <i key={c} style={{ background: c }} />
            ))}
          </span>
          {p.name}
        </button>
      ))}
    </div>
  )
}
