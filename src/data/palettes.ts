// Варианты палитры для сравнения. Включаются панелью, если в адресе есть ?pal
// (например /?pal=flag). Когда владелец выберет — перенесём цвета в основные и удалим лишнее.

export type Palette = {
  id: string
  name: string
  note: string
  /** Базовые цвета сайта — переопределяют CSS-переменные из index.css */
  vars: Record<'--ink' | '--navy' | '--red' | '--gold' | '--green' | '--paper' | '--muted', string>
  /** Цвет экрана для каждой вещи (id из products.ts) и для «секретного» слота */
  accents: Record<string, string>
  locked: string
  /** С чем смешивается цвет вещи для фона и в какой доле берётся сама вещь */
  bgBase: string
  bgShare: number
}

export const PALETTES: Palette[] = [
  {
    id: 'now',
    name: 'Сейчас',
    note: 'текущая',
    vars: {
      '--ink': '#070b1a',
      '--navy': '#0d1b3d',
      '--red': '#e3202f',
      '--gold': '#f6c445',
      '--green': '#1f9d55',
      '--paper': '#f4efe6',
      '--muted': '#9aa6c4',
    },
    accents: { bakhet: '#1f5fe0', 'seen-this-man': '#e3202f', spiral: '#7a3cff', sweater: '#2f9d74' },
    locked: '#4a5068',
    bgBase: '#0a0f22',
    bgShare: 0.42,
  },
  {
    id: 'flag',
    name: 'Флаг',
    note: 'синий, зелёный, курай',
    vars: {
      '--ink': '#03142e',
      '--navy': '#062a5c',
      '--red': '#d81e2c',
      '--gold': '#f2b600',
      '--green': '#00964b',
      '--paper': '#fbf8f0',
      '--muted': '#a9bad6',
    },
    accents: { bakhet: '#0a6fc2', 'seen-this-man': '#c8102e', spiral: '#00964b', sweater: '#d99a00' },
    locked: '#3d5a80',
    bgBase: '#03142e',
    bgShare: 0.5,
  },
  {
    id: 'honey',
    name: 'Мёд и войлок',
    note: 'тёплые, природные',
    vars: {
      '--ink': '#1b130d',
      '--navy': '#2b1f16',
      '--red': '#b5352a',
      '--gold': '#e8a33d',
      '--green': '#4f7a3a',
      '--paper': '#f3e6cc',
      '--muted': '#bfa98a',
    },
    accents: { bakhet: '#2f5d8a', 'seen-this-man': '#9c2f24', spiral: '#6b4e9b', sweater: '#4f7a3a' },
    locked: '#5a4a3c',
    bgBase: '#1b130d',
    bgShare: 0.48,
  },
  {
    id: 'arcade',
    name: 'Аркада',
    note: 'яркие, как в Sonic',
    vars: {
      '--ink': '#000814',
      '--navy': '#001233',
      '--red': '#ff2a3d',
      '--gold': '#ffd400',
      '--green': '#00c27a',
      '--paper': '#ffffff',
      '--muted': '#9fb3d9',
    },
    accents: { bakhet: '#0057ff', 'seen-this-man': '#ff2a3d', spiral: '#7b2dff', sweater: '#00b383' },
    locked: '#3a3f5c',
    bgBase: '#000814',
    bgShare: 0.62,
  },
]

export const paletteFromUrl = () => {
  const id = new URLSearchParams(window.location.search).get('pal')
  return PALETTES.find((p) => p.id === id) ?? PALETTES[0]
}

/** Показывать ли панель выбора палитры */
export const showPaletteSwitcher = () => new URLSearchParams(window.location.search).has('pal')
