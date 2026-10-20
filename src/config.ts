// Имя Telegram-бота для заказов, без @. Пример: 'tormosh_bot'
// Кнопка «Telegram» откроет бота с параметром start=order-<id вещи>,
// и бот сразу поймёт, какую вещь выбрали.
export const TELEGRAM_BOT = 'tormoshbot'

/** Telegram-канал бренда */
export const TELEGRAM_CHANNEL = 'https://t.me/Tormosh02'

/** ВКонтакте: vk.me сразу открывает переписку */
export const VK_URL = 'https://vk.me/hlebusheknesi'

// Запасной вариант, пока бота нет: просто ссылка на аккаунт. Пример: 'https://t.me/tormosh'
export const TELEGRAM_URL = ''

/** Куда ведёт кнопка «Telegram» для этой вещи */
export const orderLink = (productId: string) =>
  TELEGRAM_BOT ? `https://t.me/${TELEGRAM_BOT}?start=order-${productId}` : TELEGRAM_URL

/**
 * Пункты меню ☰. У пункта либо `text` — раскрывается прямо в меню,
 * либо `href` — ссылка. Без того и другого показывается «скоро».
 */
export const MENU_ITEMS: { label: string; href?: string; text?: string[]; content?: 'sizes' }[] = [
  { label: 'Таблица размеров', content: 'sizes' },
  { label: 'О бренде', text: ['TORMOSH — башкирская одежда. «Тормош» по-башкирски значит «жизнь».'] },
  {
    label: 'Как заказать',
    text: [
      '1. Выбери вещь',
      '2. Напиши нам в Telegram или ВК — кнопки внизу экрана',
      '3. Уточним размер и доставку: СДЭК или такси',
    ],
  },
  { label: 'Покупателям: доставка, оплата, возврат', href: '/pokupatelyam.html' },
  { label: 'Политика конфиденциальности', href: '/privacy.html' },
  { label: 'Наш канал в Telegram', href: TELEGRAM_CHANNEL },
  { label: 'Telegram-бот', href: `https://t.me/${TELEGRAM_BOT}` },
  { label: 'ВКонтакте', href: VK_URL },
  { label: 'Поддержка', href: `https://t.me/${TELEGRAM_BOT}?start=help` },
]
