import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MENU_ITEMS, SOCIALS } from '../config'
import { SizeChart } from './SizeChart'

const YEAR = new Date().getFullYear()

/** Кнопка ☰ и выезжающее меню в стиле игровой паузы */
export function Menu() {
  const [open, setOpen] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const close = () => {
    setOpen(false)
    buttonRef.current?.focus()
  }

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={`burger${open ? ' burger--open' : ''}`}
        aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
        aria-expanded={open}
        aria-controls="site-menu"
        onClick={() => setOpen((v) => !v)}
      >
        <span />
        <span />
        <span />
      </button>

      {/* Меню рендерим прямо в body, чтобы шапка и кайма не перекрывали его */}
      {createPortal(
        <AnimatePresence>
          {open && (
            <>
              <motion.div
                className="menu__shade"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={close}
              />
              <motion.nav
                id="site-menu"
                className="menu"
                aria-label="Меню сайта"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              >
                <button
                  ref={closeRef}
                  type="button"
                  className="burger burger--open menu__close"
                  aria-label="Закрыть меню"
                  onClick={close}
                >
                  <span />
                  <span />
                  <span />
                </button>
                <p className="menu__title">Пауза</p>
                {/* Соцсети — самым верхом, сразу под заголовком */}
                <div className="menu__socials">
                  <p>Мы в соцсетях</p>
                  {SOCIALS.filter((s) => s.href).map((s) => (
                    <a key={s.label} className="menu__social" href={s.href} target="_blank" rel="noreferrer">
                      <span>{s.label}</span>
                    </a>
                  ))}
                </div>
                <ul>
                  {MENU_ITEMS.map((link, i) => (
                    <motion.li
                      key={link.label}
                      initial={{ x: 40, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.08 + i * 0.04 }}
                    >
                      {link.content === 'sizes' ? (
                        <details className="menu__details">
                          <summary className="menu__item">{link.label}</summary>
                          <SizeChart />
                        </details>
                      ) : link.text ? (
                        <details className="menu__details">
                          <summary className="menu__item">{link.label}</summary>
                          {link.text.map((line) => (
                            <p key={line}>{line}</p>
                          ))}
                        </details>
                      ) : link.href ? (
                        <a
                          className="menu__item"
                          href={link.href}
                          {...(link.href.startsWith('http') ? { target: '_blank', rel: 'noreferrer' } : {})}
                          onClick={() => setOpen(false)}
                        >
                          {link.label}
                        </a>
                      ) : (
                        <span className="menu__item menu__item--soon" aria-disabled="true">
                          {link.label}
                          <small>скоро</small>
                        </span>
                      )}
                    </motion.li>
                  ))}
                </ul>
                <p className="menu__foot">© {YEAR} TORMOSH</p>
              </motion.nav>
          </>
        )}
      </AnimatePresence>,
      document.body,
      )}
    </>
  )
}
