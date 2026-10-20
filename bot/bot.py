"""Бот заказов TORMOSH (@tormoshbot).

Сайт открывает бота ссылкой t.me/tormoshbot?start=order-<id вещи>. Бот спрашивает размер
и контакт и присылает заказ владельцу. Вопросы в поддержку (?start=help) тоже уходят владельцу;
владелец отвечает покупателю, просто ответив (reply) на сообщение бота.

Настройки — переменные окружения:
  BOT_TOKEN — токен от @BotFather;
  ADMINS — админы через запятую: числовые id и/или @ники (ник срабатывает, когда человек нажмёт «Старт»);
  DATA_DIR — где хранить данные (по умолчанию ./data).
Заказы и вопросы приходят всем админам; ответить покупателю может любой из них.
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
from aiogram.filters import Command, CommandObject, CommandStart
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import (
    CallbackQuery,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    KeyboardButton,
    Message,
    BotCommand,
    ReplyKeyboardMarkup,
)

SITE = "http://tormoshuwu.ru"
CHANNEL = "https://t.me/Tormosh02"

# Каталог — копия src/data/products.ts: при новых вещах дописать и сюда.
# sizes=False — размеры у вещи пока не объявлены, бот их не спрашивает
PRODUCTS = {
    "bakhet": {"name": "Бәхет", "price": 1800, "sizes": True},
    "seen-this-man": {"name": "Have you seen this man?", "price": 1800, "sizes": True},
    "spiral": {"name": "Ҡумыҙ", "price": 1800, "sizes": True},
    "sweater": {"name": "Төлкө", "price": None, "sizes": False},
}
SIZES = ["S", "M"]  # пока шьём только эти два
# Замеры, см — из таблицы на сайте (src/data/sizes.ts)
SIZE_CHART = "S (44–46): длина 70, ширина 63, плечо 20, рукав 19\nM (46–48): длина 72, ширина 65, плечо 20, рукав 20"

# Кнопки внизу экрана: всегда под рукой, а не только «поделиться номером»
BTN_CATALOG = "🛍 Каталог"
BTN_SIZES = "📏 Размеры"
BTN_QUESTION = "❓ Задать вопрос"
BTN_CHANNEL = "📢 Наш канал"
BTN_CANCEL = "✖️ Отменить заказ"
MAIN_KB = ReplyKeyboardMarkup(
    keyboard=[
        [KeyboardButton(text=BTN_CATALOG), KeyboardButton(text=BTN_SIZES)],
        [KeyboardButton(text=BTN_QUESTION), KeyboardButton(text=BTN_CHANNEL)],
    ],
    resize_keyboard=True,
    is_persistent=True,
)

TOKEN = os.environ["BOT_TOKEN"]
DATA = Path(os.environ.get("DATA_DIR", "data"))
DATA.mkdir(parents=True, exist_ok=True)
# Какое сообщение у админа к какому покупателю относится — чтобы ответ ушёл адресату
LINKS_FILE = DATA / "links.json"
# id админов, которых знаем по нику: Telegram не даёт узнать id по нику, пока человек не напишет боту
KNOWN_ADMINS_FILE = DATA / "admins.json"

_admin_entries = [a.strip() for a in os.environ.get("ADMINS", "").split(",") if a.strip()]
ADMIN_IDS = {int(a) for a in _admin_entries if a.isdigit()}
ADMIN_NICKS = {a.lstrip("@").lower() for a in _admin_entries if not a.isdigit()}

log = logging.getLogger("tormoshbot")
dp = Dispatcher()


class Order(StatesGroup):
    size = State()
    contact = State()


class Support(StatesGroup):
    question = State()


def known_admins() -> set[int]:
    try:
        saved = set(json.loads(KNOWN_ADMINS_FILE.read_text("utf-8")))
    except (FileNotFoundError, ValueError):
        saved = set()
    return ADMIN_IDS | saved


def is_admin(user) -> bool:
    """Админ по id из настроек — или по нику; во втором случае запоминаем его id."""
    if user.id in known_admins():
        return True
    if user.username and user.username.lower() in ADMIN_NICKS:
        KNOWN_ADMINS_FILE.write_text(json.dumps(sorted(known_admins() | {user.id})), "utf-8")
        log.info("Новый админ @%s id=%s", user.username, user.id)
        return True
    return False


def load_links() -> dict[str, int]:
    try:
        return json.loads(LINKS_FILE.read_text("utf-8"))
    except (FileNotFoundError, ValueError):
        return {}


def link_key(chat_id: int, message_id: int) -> str:
    return f"{chat_id}:{message_id}"


def remember_link(key: str, user_id: int) -> None:
    links = load_links()
    links[key] = user_id
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
            buttons,
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
    # На шаге контакта внизу — «поделиться номером» и «отменить»; после заказа вернётся обычное меню
    keyboard = ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="📱 Поделиться номером", request_contact=True)],
            [KeyboardButton(text=BTN_CANCEL)],
        ],
        resize_keyboard=True,
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
    if not arg and is_admin(m.from_user):
        await m.answer(
            "Вы админ TORMOSH: сюда будут приходить заказы и вопросы.\n"
            "Чтобы ответить покупателю — ответьте (reply) на его заказ или вопрос.\n\n"
            "Ниже — то, что видит покупатель:"
        )
    if arg.startswith("order-") and arg[6:] in PRODUCTS:
        await ask_size_or_contact(m, state, arg[6:])
    elif arg == "help":
        await state.set_state(Support.question)
        await m.answer("Напишите вопрос одним сообщением — передам, и вам ответят здесь же.")
    else:
        await m.answer("Сәләм! Это TORMOSH — башкирская одежда.", reply_markup=MAIN_KB)
        await show_catalog(m)


async def show_catalog(m: Message) -> None:
    await m.answer("Выберите вещь, и оформим заказ:", reply_markup=catalog_keyboard())


# Кнопки нижнего меню работают на любом шаге: нажал «Каталог» посреди заказа — заказ сбрасывается
@dp.message(F.text == BTN_CATALOG)
async def menu_catalog(m: Message, state: FSMContext) -> None:
    await state.clear()
    await m.answer("Каталог TORMOSH", reply_markup=MAIN_KB)
    await show_catalog(m)


@dp.message(F.text == BTN_SIZES)
async def menu_sizes(m: Message) -> None:
    await m.answer(f"📏 <b>Размеры футболок (оверсайз)</b>, см:\n{SIZE_CHART}\n\nСомневаетесь — спросите, подскажем.")


@dp.message(F.text == BTN_QUESTION)
async def menu_question(m: Message, state: FSMContext) -> None:
    await state.set_state(Support.question)
    await m.answer("Напишите вопрос одним сообщением — передам, и вам ответят здесь же.", reply_markup=MAIN_KB)


@dp.message(Command("help"))
async def help_command(m: Message, state: FSMContext) -> None:
    await menu_question(m, state)


@dp.message(F.text == BTN_CHANNEL)
async def menu_channel(m: Message) -> None:
    await m.answer(
        "Новости и новые вещи — в канале:",
        reply_markup=InlineKeyboardMarkup(inline_keyboard=[[InlineKeyboardButton(text="Открыть канал", url=CHANNEL)]]),
    )


@dp.message(F.text == BTN_CANCEL)
async def menu_cancel(m: Message, state: FSMContext) -> None:
    await state.clear()
    await m.answer("Заказ отменён. Если передумаете — «🛍 Каталог».", reply_markup=MAIN_KB)


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
        reply_markup=MAIN_KB,
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
    await m.answer("Передал! Ответ придёт сюда.", reply_markup=MAIN_KB)
    await notify_owner(bot, f"❓ <b>Вопрос</b> от {who(m)}:\n\n{m.html_text or '(без текста)'}", m.from_user.id)


async def notify_owner(bot: Bot, text: str, user_id: int) -> None:
    """Заказ или вопрос — всем админам."""
    admins = known_admins()
    if not admins:
        log.warning("Админов нет — некому отправить: %s", text)
        return
    for admin in admins:
        try:
            sent = await bot.send_message(admin, text)
            remember_link(link_key(admin, sent.message_id), user_id)
        except Exception:  # админ мог заблокировать бота — остальным всё равно отправим
            log.exception("Не отправилось админу %s", admin)


@dp.message(F.reply_to_message, F.func(lambda m: is_admin(m.from_user)))
async def admin_reply(m: Message, bot: Bot) -> None:
    """Админ ответил на заказ или вопрос — пересылаем ответ покупателю."""
    user_id = load_links().get(link_key(m.chat.id, m.reply_to_message.message_id))
    if not user_id:
        await m.reply(
            "Не понял, кому ответ. Нажмите «Ответить» именно на сообщении «🛒 Новый заказ» или «❓ Вопрос»."
        )
        return
    await bot.copy_message(user_id, m.chat.id, m.message_id)
    await m.reply("Отправлено покупателю ✓")


@dp.message()
async def anything_else(m: Message, state: FSMContext, bot: Bot) -> None:
    """Любое другое сообщение — считаем вопросом и передаём владельцу."""
    if is_admin(m.from_user):
        await m.answer("Чтобы ответить покупателю, ответьте (reply) на его заказ или вопрос.")
        return
    await got_question(m, state, bot)


async def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    bot = Bot(TOKEN, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
    await bot.delete_webhook(drop_pending_updates=False)
    # Меню команд слева от поля ввода
    await bot.set_my_commands([
        BotCommand(command="start", description="Каталог и заказ"),
        BotCommand(command="help", description="Задать вопрос"),
    ])
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
