import { motion } from 'motion/react'
import { useEffect, useRef } from 'react'
import { orderLink } from '../config'
import type { Product } from '../data/products'

type ConfirmOverlayProps = { product: Product; onClose: () => void }

/** Вспышка «Әйҙә!» после нажатия «Заказать». Telegram открывается в новой вкладке */
export function ConfirmOverlay({ product, onClose }: ConfirmOverlayProps) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

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
        {orderLink(product.id) ? (
          <p>
            Открыли Telegram в новой вкладке — осталось написать размер. Не открылся?{' '}
            <a href={orderLink(product.id)} target="_blank" rel="noreferrer">
              Перейти вручную
            </a>
          </p>
        ) : (
          <p>Заказ через Telegram скоро откроется.</p>
        )}
        <button ref={closeRef} type="button" className="btn btn--ghost" onClick={onClose}>
          Назад к выбору
        </button>
      </motion.div>
    </motion.div>
  )
}
