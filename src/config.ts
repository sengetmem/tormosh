// Имя Telegram-бота для заказов, без @. Пример: 'tormosh_bot'
// Кнопка «Заказать» откроет бота с параметром start=order-<id вещи>,
// и бот сразу поймёт, какую вещь выбрали.
export const TELEGRAM_BOT = ''

// Запасной вариант, пока бота нет: просто ссылка на аккаунт. Пример: 'https://t.me/tormosh'
export const TELEGRAM_URL = ''

/** Куда ведёт «Заказать» для этой вещи. Пустая строка — заказ ещё не открыт */
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
    text: ['1. Выбери вещь', '2. Нажми «Заказать в Telegram»', '3. Напиши размер, договоримся о доставке'],
  },
  { label: 'Личный кабинет' },
  { label: 'Telegram-бот' },
  { label: 'Поддержка', href: TELEGRAM_URL },
  { label: 'Политика конфиденциальности' },
  { label: 'Пользовательское соглашение' },
]
