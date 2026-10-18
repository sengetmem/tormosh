import { DRUMS, type Drum } from '../data/drums'

type Props = { current: Drum; onPick: (d: Drum) => void }

/** Временная панель для сравнения барабанов. Видна только с ?drum в адресе */
export function DrumSwitcher({ current, onPick }: Props) {
  const pick = (d: Drum) => {
    onPick(d)
    const url = new URL(window.location.href)
    url.searchParams.set('drum', d.id)
    history.replaceState(null, '', url)
  }

  return (
    <div className="variants" role="radiogroup" aria-label="Барабан">
      {DRUMS.map((d) => (
        <button
          key={d.id}
          type="button"
          role="radio"
          aria-checked={d.id === current.id}
          className={`variants__item${d.id === current.id ? ' variants__item--on' : ''}`}
          onClick={() => pick(d)}
        >
          {d.name}
        </button>
      ))}
    </div>
  )
}
