import { MEASURES, SIZE_NOTE, SIZES } from '../data/sizes'

/** Таблица размеров для меню: схема замеров A–D и сетка в сантиметрах */
export function SizeChart() {
  return (
    <div className="sizes">
      <p className="sizes__note">{SIZE_NOTE}</p>

      <div className="sizes__legend">
        <svg className="sizes__shirt" viewBox="0 0 120 100" aria-hidden="true">
          <path
            className="sizes__outline"
            d="M38 6 L50 4 C52 10 68 10 70 4 L82 6 L112 22 L102 42 L88 36 L88 96 L32 96 L32 36 L18 42 L8 22 Z"
          />
          {/* A — длина */}
          <path className="sizes__line" d="M40 12 V92" />
          <text x="43" y="54">A</text>
          {/* B — ширина */}
          <path className="sizes__line" d="M34 88 H86" />
          <text x="57" y="85">B</text>
          {/* C — плечо */}
          <path className="sizes__line" d="M72 8 L86 14" />
          <text x="74" y="20">C</text>
          {/* D — рукав */}
          <path className="sizes__line" d="M88 12 L108 24" />
          <text x="100" y="15">D</text>
        </svg>
        <dl>
          {MEASURES.map((m) => (
            <div key={m.key}>
              <dt>{m.key}</dt>
              <dd>{m.label}</dd>
            </div>
          ))}
        </dl>
      </div>

      <table className="sizes__table">
        <caption className="visually-hidden">Размеры футболок, см</caption>
        <thead>
          <tr>
            <th scope="col">Размер</th>
            {MEASURES.map((m) => (
              <th key={m.key} scope="col" title={m.label}>
                {m.key}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SIZES.map((s) => (
            <tr key={s.size}>
              <th scope="row">
                <b>{s.size}</b>
                <small>{s.ru}</small>
              </th>
              {s.cm.map((v, i) => (
                <td key={MEASURES[i].key}>{v}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="sizes__unit">Замеры в сантиметрах, вещь лежит ровно</p>
    </div>
  )
}
