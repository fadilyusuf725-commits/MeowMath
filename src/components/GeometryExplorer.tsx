import { useState } from 'react'
import { createRectangularPrism } from '../lib'
import { GeometryViewer, type GeometryHighlight } from './GeometryViewer'

const cube = createRectangularPrism({ width: 2, height: 2, depth: 2 })

const focuses: readonly { readonly id: Exclude<GeometryHighlight, null>; readonly label: string; readonly explanation: string }[] = [
  {
    id: 'faces',
    label: 'Bidang',
    explanation: 'Bidang atau sisi adalah permukaan datar pada bangun ruang. Pada kubus, setiap bidang berbentuk persegi.',
  },
  {
    id: 'edges',
    label: 'Rusuk',
    explanation: 'Rusuk adalah garis tempat dua bidang bertemu. Ikuti garis tepi merah pada model.',
  },
  {
    id: 'vertices',
    label: 'Titik sudut',
    explanation: 'Titik sudut adalah titik tempat beberapa rusuk bertemu. Titik ungu menandai sudut kubus.',
  },
]

export function GeometryExplorer() {
  const [focus, setFocus] = useState<Exclude<GeometryHighlight, null>>('faces')
  const activeFocus = focuses.find((item) => item.id === focus)!

  return (
    <section className="geometry-explorer" aria-label="Laboratorium bagian kubus">
      <div className="geometry-explorer-copy">
        <p className="mini-label">LABORATORIUM KUBUS</p>
        <h3>Jelajahi bagian kubus</h3>
        <div className="feature-tabs" role="tablist" aria-label="Bagian kubus">
          {focuses.map((item) => (
            <button
              type="button"
              role="tab"
              key={item.id}
              aria-selected={focus === item.id}
              className={focus === item.id ? 'is-active' : ''}
              onClick={() => setFocus(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <p>{activeFocus.explanation}</p>
      </div>
      <GeometryViewer
        shape={cube}
        accent="#ff9c62"
        highlight={focus}
        label={`Kubus dengan ${activeFocus.label.toLowerCase()} yang disorot`}
        compact
      />
    </section>
  )
}
