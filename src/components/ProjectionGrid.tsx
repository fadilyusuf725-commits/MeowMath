import type { OrthographicProjection } from '../lib'

interface ProjectionGridProps {
  readonly projection: OrthographicProjection
  readonly selected?: boolean
  readonly onSelect?: () => void
  readonly label?: string
}

const viewLabel = {
  front: 'depan',
  top: 'atas',
  right: 'samping kanan',
} as const

export function ProjectionGrid({ projection, selected = false, onSelect, label }: ProjectionGridProps) {
  const occupied = new Set(projection.cells.map((cell) => `${cell.column},${cell.row}`))
  const content = (
    <>
      <span className="projection-name">{label ?? `Tampak ${viewLabel[projection.view]}`}</span>
      <span
        className="projection-grid"
        style={{
          gridTemplateColumns: `repeat(${projection.width}, 1fr)`,
          gridTemplateRows: `repeat(${projection.height}, 1fr)`,
        }}
      >
        {Array.from({ length: projection.width * projection.height }, (_, index) => {
          const column = index % projection.width
          const row = projection.height - 1 - Math.floor(index / projection.width)
          const isFilled = occupied.has(`${column},${row}`)
          return <span key={`${column}-${row}`} className={`projection-cell ${isFilled ? 'is-filled' : ''}`} />
        })}
      </span>
    </>
  )

  if (!onSelect) return <div className="projection-card">{content}</div>
  return (
    <button
      type="button"
      className={`projection-card projection-card--button ${selected ? 'is-selected' : ''}`}
      onClick={onSelect}
      aria-pressed={selected}
    >
      {content}
    </button>
  )
}
