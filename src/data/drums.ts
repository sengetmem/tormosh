// Варианты рисунка на барабане. Сравниваются панелью, если в адресе есть ?drum
// (например /?drum=rosette). Когда владелец выберет — оставим один и удалим панель.

export type Drum = { id: 'yurt' | 'rosette'; name: string }

export const DRUMS: Drum[] = [
  { id: 'yurt', name: 'Юрта' },
  { id: 'rosette', name: 'Розетка' },
]

const param = () => new URLSearchParams(window.location.search).get('drum')

export const drumFromUrl = () => DRUMS.find((d) => d.id === param()) ?? DRUMS[0]

/** Показывать ли панель выбора барабана */
export const showDrumSwitcher = () => param() !== null
