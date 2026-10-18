/** Фон экрана: плоский цвет вещи и диагональные полосы — как в меню SA2 */
export function Backdrop() {
  return (
    <div className="backdrop" aria-hidden="true">
      <div className="backdrop__stripes" />
    </div>
  )
}
