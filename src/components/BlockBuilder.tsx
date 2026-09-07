import type { GridDimensions, Shape, Voxel } from '../lib'
import { GeometryViewer } from './GeometryViewer'

interface BlockBuilderProps {
  readonly grid: GridDimensions
  readonly shape: Shape
  readonly onToggle: (cell: Voxel) => void
  readonly target: Shape
  /** Tampilkan titik target hanya bila posisi memang dinilai. */
  readonly showTargetCells?: boolean
}

export function BlockBuilder({ grid, shape, onToggle, target, showTargetCells = false }: BlockBuilderProps) {
  const occupied = new Set(shape.map((cell) => `${cell.x},${cell.y},${cell.z}`))
  const targetOccupied = new Set(target.map((cell) => `${cell.x},${cell.y},${cell.z}`))
  return (
    <div className="builder">
      <div className="builder-viewers">
        <div>
          <p className="mini-label">Target Mio</p>
          <GeometryViewer shape={target} label="Model target yang perlu dibangun" accent="#8a67d6" compact />
        </div>
        <div>
          <p className="mini-label">Bangunanmu</p>
          <GeometryViewer shape={shape} label="Model yang sedang kamu bangun" accent="#ff9a5e" compact />
        </div>
      </div>
      <div className="builder-instructions">
        {showTargetCells
          ? 'Pilih petak untuk menambah atau menghapus satu blok. Petak ungu adalah posisi target; blok hijau sudah tepat.'
          : 'Pilih petak untuk menambah atau menghapus satu blok. Kamu boleh mulai dari petak mana pun; yang dinilai adalah bentuknya.'}
      </div>
      <div className="builder-axis-guide" aria-label="Petunjuk arah petak bangunan">
        <span><b>X / kolom:</b> dari kiri ke kanan</span>
        <span><b>Z / baris:</b> dari depan ke belakang</span>
        <span><b>Y / lantai:</b> dari bawah ke atas</span>
      </div>
      <div className="builder-layers">
        {Array.from({ length: grid.height }, (_, y) => y).map((y) => (
          <section className="builder-layer" key={y} aria-label={`Lantai ${y + 1}`}>
            <h4><span>Lantai {y + 1}</span>{y === 0 && <small>mulai dari sini</small>}</h4>
            <p className="builder-depth-label">Depan - Baris 1</p>
            <div
              className="builder-grid"
              style={{ gridTemplateColumns: `repeat(${grid.width}, minmax(44px, 1fr))` }}
            >
              {Array.from({ length: grid.depth }, (_, z) => z).flatMap((z) =>
                Array.from({ length: grid.width }, (_, x) => {
                  const isFilled = occupied.has(`${x},${y},${z}`)
                  const isTarget = showTargetCells && targetOccupied.has(`${x},${y},${z}`)
                  const stateClass = isFilled && isTarget
                    ? 'is-correct'
                    : isFilled
                      ? showTargetCells ? 'is-misplaced' : 'is-filled'
                      : isTarget
                        ? 'is-target'
                        : ''
                  return (
                    <button
                      type="button"
                      className={`builder-cell ${stateClass}`}
                      key={`${x}-${y}-${z}`}
                      onClick={() => onToggle({ x, y, z })}
                      aria-label={`${isFilled ? 'Hapus' : 'Tambah'} blok kolom ${x + 1}, baris ${z + 1}, lantai ${y + 1}${isTarget ? '; posisi target' : ''}`}
                    >
                      {isFilled && isTarget ? '✓' : isFilled ? '■' : isTarget ? '•' : '+'}
                    </button>
                  )
                }),
              )}
            </div>
            <p className="builder-depth-label builder-depth-label--back">Belakang - Baris {grid.depth}</p>
          </section>
        ))}
      </div>
    </div>
  )
}
