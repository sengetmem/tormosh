// Варианты рисунка на барабане. Сравниваются панелью, если в адресе есть ?drum
// (например /?drum=rosette). Когда владелец выберет — оставим один и удалим панель.

export type Drum = {
  id: string
  name: string
  /** Рисунок: купол юрты или розетка */
  look: 'yurt' | 'rosette'
  /** Крутится ли барабан вместе со значками */
  spin: boolean
  /** Красится ли в цвет выбранной вещи */
  tint: boolean
}

export const DRUMS: Drum[] = [
  { id: 'yurt', name: 'Юрта', look: 'yurt', spin: true, tint: true },
  { id: 'yurt-calm', name: 'Юрта тихая', look: 'yurt', spin: false, tint: false },
  { id: 'rosette', name: 'Розетка', look: 'rosette', spin: true, tint: true },
  { id: 'rosette-mono', name: 'Розетка один цвет', look: 'rosette', spin: true, tint: false },
]

const param = () => new URLSearchParams(window.location.search).get('drum')

export const drumFromUrl = () => DRUMS.find((d) => d.id === param()) ?? DRUMS[0]

/** Показывать ли панель выбора барабана */
export const showDrumSwitcher = () => param() !== null
