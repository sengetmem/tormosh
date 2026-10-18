import { MEDALLION } from './medallionPath'

/** Медальон на барабане. Цвета слоёв задаются в CSS (.medallion__*) — так один рисунок
 *  работает и в своих цветах, и в цветах прежнего барабана */
export function Medallion() {
  return (
    <svg className="yurt medallion" viewBox="0 0 1000 1000" aria-hidden="true">
      <circle className="medallion__bg" cx="500" cy="500" r="500" />
      <path className="medallion__blue" d={MEDALLION.blue} fillRule="evenodd" />
      <path className="medallion__purple" d={MEDALLION.purple} fillRule="evenodd" />
      <path className="medallion__gold" d={MEDALLION.gold} fillRule="evenodd" />
    </svg>
  )
}
