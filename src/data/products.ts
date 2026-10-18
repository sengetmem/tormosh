// Каталог TORMOSH. Чтобы добавить товар — допиши объект в `products`,
// а фото положи в raw/ и запусти `npm run cutout` — скрипт уберёт однотонный фон
// и сохранит картинку в public/products/. В `image` пиши img('имя-файла-без-расширения').

import { IMAGE_VERSION } from './imageVersion'

/** Путь к картинке вещи. Номер версии заставляет браузер забыть старую копию */
const img = (name: string) => `/products/${name}.webp?v=${IMAGE_VERSION}`

/** Миниатюра той же картинки для значков в круге — её делает npm run cutout */
export const thumbOf = (image: string) => image.replace('.webp?', '.thumb.webp?')

export type Product = {
  id: string
  /** Короткий номер, как в игровом меню */
  code: string
  /** Название принта — на табличке и крупно в меню */
  name: string
  /** Подпись под названием */
  tagline: string
  type: 'Футболка' | 'Кофта'
  color: string
  description: string
  image: string
  /** Вторая сторона вещи: кнопка «повернуть» на сцене. Подписи — [для image, для этой картинки] */
  flip?: { image: string; labels: [string, string] }
  /** Акцентный цвет экрана, когда выбран этот товар */
  accent: string
  /** null — цена пока не объявлена */
  price: number | null
}

export const products: Product[] = [
  {
    id: 'bakhet',
    code: '01',
    name: 'Бәхет',
    tagline: 'по-башкирски — «счастье»',
    type: 'Футболка',
    color: 'Белая',
    description: 'Два кота: красный и синий, в тюбетейке с башкирским орнаментом.',
    image: img('bakhet'),
    accent: '#1f5fe0',
    price: 1800,
  },
  {
    id: 'seen-this-man',
    code: '02',
    name: 'Have you seen this man?',
    tagline: 'Салават Юлаев · 1773',
    type: 'Футболка',
    color: 'Белая',
    description: 'Розыскной плакат про Салавата Юлаева — национального героя Башкортостана.',
    image: img('salawat'),
    accent: '#e3202f',
    price: 1800,
  },
  {
    id: 'spiral',
    code: '03',
    name: 'Ҡумыҙ',
    tagline: 'кубыз · принт на спине',
    type: 'Футболка',
    color: 'Белая',
    description: 'Спереди чистая. На спине — глаз в центре спирали и две руки, держащие нить.',
    image: img('spiral-back'),
    flip: { image: img('spiral-front'), labels: ['Спина', 'Перед'] },
    accent: '#7a3cff',
    price: 1800,
  },
  {
    id: 'sweater',
    code: '04',
    name: 'Төлкө',
    tagline: 'по-башкирски — «лиса»',
    type: 'Кофта',
    color: 'Мятная',
    description: 'Рыжая лиса обвивает плечи, рядом три сердечка с узором.',
    image: img('sweater-fox'),
    accent: '#2f9d74',
    price: null,
  },
]

/** Слот в меню выбора: настоящий товар или «секретный» — скоро появится */
export type Slot = { kind: 'product'; product: Product } | { kind: 'locked'; code: string }

const LOCKED_SLOTS = 2

export const slots: Slot[] = [
  ...products.map((product) => ({ kind: 'product' as const, product })),
  ...Array.from({ length: LOCKED_SLOTS }, (_, i) => ({
    kind: 'locked' as const,
    code: String(products.length + i + 1).padStart(2, '0'),
  })),
]

/** Слот по позиции курсора: меню закольцовано, поэтому берём по модулю */
export const slotAt = (k: number) => slots[((k % slots.length) + slots.length) % slots.length]

export const LOCKED_ACCENT = '#4a5068'
