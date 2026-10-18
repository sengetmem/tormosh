// Размерная сетка футболок оверсайз — из таблицы владельца (2026-10-18). Все замеры в см.

export const SIZE_NOTE = 'Футболки оверсайз · 100% хлопок пенье · плотность 180 / 210 г/м²'

export const MEASURES = [
  { key: 'A', label: 'Длина изделия' },
  { key: 'B', label: 'Ширина изделия' },
  { key: 'C', label: 'Ширина плеча' },
  { key: 'D', label: 'Длина рукава' },
] as const

export const SIZES: { size: string; ru: string; cm: [number, number, number, number] }[] = [
  { size: 'XS', ru: '42–44', cm: [68, 61, 20, 18] },
  { size: 'S', ru: '44–46', cm: [70, 63, 20, 19] },
  { size: 'M', ru: '46–48', cm: [72, 65, 20, 20] },
  { size: 'L', ru: '48–50', cm: [74, 67, 20, 21] },
  { size: 'XL', ru: '50–52', cm: [76, 69, 20, 22] },
  { size: 'XXL', ru: '52–54', cm: [78, 71, 20, 23] },
  { size: '3XL', ru: '56–58', cm: [80, 73, 20, 24] },
]
