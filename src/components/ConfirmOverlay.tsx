import { motion } from 'motion/react'
import { useEffect, useRef } from 'react'
import type { Product } from '../data/products'

/** Куда переходим после вспышки */
export type ContactTarget = { label: 'Telegram' | 'ВКонтакте'; url: string }

type ConfirmOverlayProps = { product: Product; target: ContactTarget; onClose: () => void }

/** Через сколько после «Әйҙә!» открывать переписку, мс — чтобы вспышку успели увидеть */
const REDIRECT_DELAY = 1300

/** Вспышка «Әйҙә!» после нажатия «Telegram» или «ВКонтакте», затем переход в переписку в этой же вкладке */
export function ConfirmOverlay({ product, target, onClose }: ConfirmOverlayProps) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    // В этой же вкладке: открыть новую по таймеру браузер не даст — сочтёт рекламным окном
    const timer = window.setTimeout(() => window.location.assign(target.url), REDIRECT_DELAY)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.clearTimeout(timer)
    }
  }, [onClose, target.url])

  return (
    <motion.div
      className="confirm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      style={{ ['--accent' as string]: product.accent }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="confirm__flash"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.35, ease: [0.7, 0, 0.2, 1] }}
      />
      <motion.p
        className="confirm__shout"
        initial={{ scale: 2.4, opacity: 0, rotate: -6 }}
        animate={{ scale: 1, opacity: 1, rotate: -6 }}
        transition={{ type: 'spring', stiffness: 300, damping: 14, delay: 0.15 }}
        aria-hidden="true"
      >
        Әйҙә!
      </motion.p>
      <motion.div
        className="confirm__panel"
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.35, type: 'spring', stiffness: 220, damping: 22 }}
      >
        <h2 id="confirm-title">Выбор: «{product.name}»</h2>
        <p>
          Открываем {target.label}… Не открылось?{' '}
          <a href={target.url} target="_blank" rel="noreferrer">
            Перейти вручную
          </a>
        </p>
        <button ref={closeRef} type="button" className="btn btn--ghost" onClick={onClose}>
          Назад к выбору
        </button>
      </motion.div>
    </motion.div>
  )
}
