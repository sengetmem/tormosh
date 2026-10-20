"""Бот заказов TORMOSH (@tormoshbot).

Сайт открывает бота ссылкой t.me/tormoshbot?start=order-<id вещи>. Бот спрашивает размер
и контакт и присылает заказ владельцу. Вопросы в поддержку (?start=help) тоже уходят владельцу;
владелец отвечает покупателю, просто ответив (reply) на сообщение бота.

Настройки — переменные окружения: BOT_TOKEN, OWNER_ID, DATA_DIR (по умолчанию ./data).
"""

import asyncio
import json
import logging
import os
from datetime import datetime
from pathlib import Path

from aiogram import Bot, Dispatcher, F
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.filters import CommandObject, CommandStart
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import (
    CallbackQuery,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    KeyboardButton,
    Message,
    ReplyKeyboardMarkup,
    ReplyKeyboardRemove,
)

SITE = "http://tormoshuwu.ru"

# Каталог — копия src/data/products.ts: при новых вещах дописать и сюда.
# sizes=False — размеры у вещи пока не объявлены, бот их не спрашивает
PRODUCTS = {
    "bakhet": {"name": "Бәхет", "price": 1800, "sizes": True},
    "seen-this-man": {"name": "Have you seen this man?", "price": 1800, "sizes": True},
    "spiral": {"name": "Ҡумыҙ", "price": 1800, "sizes": True},
    "sweater": {"name": "Төлкө", "price": None, "sizes": False},
}
SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL"]

TOKEN = os.environ["BOT_TOKEN"]
OWNER_ID = int(os.environ.get("OWNER_ID", "0"))
DATA = Path(os.environ.get("DATA_DIR", "data"))
DATA.mkdir(parents=True, exist_ok=True)
# Какое сообщение у владельца к какому покупателю относится — чтобы ответ ушёл адресату
LINKS_FILE = DATA / "links.json"

log = logging.getLogger("tormoshbot")
dp = Dispatcher()


class Order(StatesGroup):
    size = State()
    contact = State()


class Support(StatesGroup):
    question = State()


def load_links() -> dict[str, int]:
    try:
        return json.loads(LINKS_FILE.read_text("utf-8"))
    except (FileNotFoundError, ValueError):
        return {}


def remember_link(owner_message_id: int, user_id: int) -> None:
    links = load_links()
    links[str(owner_message_id)] = user_id
    # Храним только последние 500 — старые переписки не нужны
    LINKS_FILE.write_text(json.dumps(dict(list(links.items())[-500:])), "utf-8")


def price_text(p: dict) -> str:
    return f"{p['price']} ₽" if p["price"] else "цена скоро"


def who(m: Message) -> str:
    u = m.from_user
    name = u.full_name or "без имени"
    nick = f" @{u.username}" if u.username else ""
    return f'<a href="tg://user?id={u.id}">{name}</a>{nick}'


def catalog_keyboard() -> InlineKeyboardMarkup:
    rows = [
        [InlineKeyboardButton(text=f"{p['name']} · {price_text(p)}", callback_data=f"item:{pid}")]
        for pid, p in PRODUCTS.items()
    ]
    rows.append([InlineKeyboardButton(text="Открыть сайт", url=SITE)])
    return InlineKeyboardMarkup(inline_keyboard=rows)


def sizes_keyboard() -> InlineKeyboardMarkup:
    buttons = [InlineKeyboardButton(text=s, callback_data=f"size:{s}") for s in SIZES]
    return InlineKeyboardMarkup(
        inline_keyboard=[
            buttons[:4],
            buttons[4:],
            [InlineKeyboardButton(text="Не знаю размер — помогите", callback_data="size:?")],
        ]
    )


async def ask_size_or_contact(m: Message, state: FSMContext, pid: str) -> None:
    p = PRODUCTS[pid]
    await state.update_data(item=pid)
    if p["sizes"]:
        await state.set_state(Order.size)
        await m.answer(
            f"Вы выбрали <b>{p['name']}</b> — {price_text(p)}.\n\nКакой размер? "
            "Таблица размеров есть на сайте в меню ☰.",
            reply_markup=sizes_keyboard(),
        )
    else:
        await state.update_data(size="уточнить")
        await ask_contact(m, state, intro=f"<b>{p['name']}</b> — {price_text(p)}. Размеры уточним в переписке.\n\n")


async def ask_contact(m: Message, state: FSMContext, intro: str = "") -> None:
    await state.set_state(Order.contact)
    keyboard = ReplyKeyboardMarkup(
        keyboard=[[KeyboardButton(text="📱 Поделиться номером", request_contact=True)]],
        resize_keyboard=True,
        one_time_keyboard=True,
    )
    await m.answer(
        intro + "Как с вами связаться? Нажмите кнопку ниже или напишите телефон / @ник.\n"
        "<i>Контакт нужен только чтобы договориться о заказе.</i>",
        reply_markup=keyboard,
    )


@dp.message(CommandStart())
async def start(m: Message, command: CommandObject, state: FSMContext) -> None:
    await state.clear()
    arg = command.args or ""
    if arg.startswith("order-") and arg[6:] in PRODUCTS:
        await ask_size_or_contact(m, state, arg[6:])
    elif arg == "help":
        await state.set_state(Support.question)
        await m.answer("Напишите вопрос одним сообщением — передам, и вам ответят здесь же.")
    else:
        await m.answer(
            "Сәләм! Это TORMOSH — башкирская одежда.\nВыберите вещь, и оформим заказ:",
            reply_markup=catalog_keyboard(),
        )


@dp.callback_query(F.data.startswith("item:"))
async def pick_item(c: CallbackQuery, state: FSMContext) -> None:
    pid = c.data.split(":", 1)[1]
    await c.answer()
    if pid in PRODUCTS:
        await ask_size_or_contact(c.message, state, pid)


@dp.callback_query(Order.size, F.data.startswith("size:"))
async def pick_size(c: CallbackQuery, state: FSMContext) -> None:
    size = c.data.split(":", 1)[1]
    await c.answer()
    await state.update_data(size="помочь подобрать" if size == "?" else size)
    await c.message.edit_reply_markup(reply_markup=None)
    await ask_contact(c.message, state, intro=f"Размер: <b>{size if size != '?' else 'подберём вместе'}</b>.\n\n")


@dp.message(Order.contact)
async def got_contact(m: Message, state: FSMContext, bot: Bot) -> None:
    contact = m.contact.phone_number if m.contact else (m.text or "").strip()
    if not contact:
        await m.answer("Напишите телефон или @ник текстом, пожалуйста.")
        return
    data = await state.get_data()
    p = PRODUCTS[data["item"]]
    await state.clear()
    await m.answer(
        "Заказ принят! Напишем вам в течение дня, чтобы договориться о доставке и оплате. Рахмат! 🧡",
        reply_markup=ReplyKeyboardRemove(),
    )
    text = (
        f"🛒 <b>Новый заказ</b>\n{p['name']} — {price_text(p)}\nРазмер: {data.get('size')}\n"
        f"Контакт: {contact}\nПокупатель: {who(m)}\n\n<i>Ответьте на это сообщение — ответ уйдёт покупателю.</i>"
    )
    await notify_owner(bot, text, m.from_user.id)
    with (DATA / "orders.jsonl").open("a", encoding="utf-8") as f:
        f.write(json.dumps({"at": datetime.now().isoformat(timespec="seconds"), "item": data["item"],
                            "size": data.get("size"), "user": m.from_user.id}, ensure_ascii=False) + "\n")


@dp.message(Support.question)
async def got_question(m: Message, state: FSMContext, bot: Bot) -> None:
    await state.clear()
    await m.answer("Передал! Ответ придёт сюда.")
    await notify_owner(bot, f"❓ <b>Вопрос</b> от {who(m)}:\n\n{m.html_text or '(без текста)'}", m.from_user.id)


async def notify_owner(bot: Bot, text: str, user_id: int) -> None:
    if not OWNER_ID:
        log.warning("OWNER_ID не задан — некому отправить: %s", text)
        return
    sent = await bot.send_message(OWNER_ID, text)
    remember_link(sent.message_id, user_id)


@dp.message(F.chat.id == OWNER_ID, F.reply_to_message)
async def owner_reply(m: Message, bot: Bot) -> None:
    """Владелец ответил на заказ или вопрос — пересылаем ответ покупателю."""
    user_id = load_links().get(str(m.reply_to_message.message_id))
    if not user_id:
        await m.reply("Не понял, кому это. Ответьте именно на сообщение с заказом или вопросом.")
        return
    await bot.copy_message(user_id, m.chat.id, m.message_id)
    await m.reply("Отправлено покупателю ✓")


@dp.message()
async def anything_else(m: Message, state: FSMContext, bot: Bot) -> None:
    """Любое другое сообщение — считаем вопросом и передаём владельцу."""
    if m.chat.id == OWNER_ID:
        await m.answer("Чтобы ответить покупателю, ответьте (reply) на его заказ или вопрос.")
        return
    await got_question(m, state, bot)


async def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    bot = Bot(TOKEN, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
    await bot.delete_webhook(drop_pending_updates=False)
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
