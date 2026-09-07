import { useRef, useState, type DragEvent } from 'react'
import type { MatchChallenge, ProjectionDrawChallenge, SequenceChallenge, SequenceItem } from '../content/missions'

export interface MatchDropGameProps {
  readonly challenge: MatchChallenge
  readonly assignments: Readonly<Record<string, string>>
  readonly selectedItemId: string | null
  readonly onSelectItem: (itemId: string | null) => void
  readonly onAssign: (itemId: string, targetId: string) => void
}

/**
 * Mini game klasifikasi: bisa diseret, tetapi selalu dapat dimainkan dengan
 * pola sederhana "pilih kartu, lalu pilih tempat" pada layar sentuh/keyboard.
 */
export function MatchDropGame({
  challenge,
  assignments,
  selectedItemId,
  onSelectItem,
  onAssign,
}: MatchDropGameProps) {
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState('')
  const placedCount = Object.keys(assignments).filter((itemId) => challenge.items.some((item) => item.id === itemId)).length
  const selectedItem = challenge.items.find((item) => item.id === selectedItemId)

  function placeItem(itemId: string, targetId: string): void {
    const item = challenge.items.find((candidate) => candidate.id === itemId)
    const target = challenge.targets.find((candidate) => candidate.id === targetId)
    onAssign(itemId, targetId)
    setFeedback(`${item?.label ?? 'Kartu'} dipasangkan ke ${target?.label ?? 'gerbang'}.`)
  }

  function beginDrag(event: DragEvent<HTMLButtonElement>, itemId: string) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', itemId)
    setDraggingItemId(itemId)
    const item = challenge.items.find((candidate) => candidate.id === itemId)
    setFeedback(`${item?.label ?? 'Kartu'} sedang dibawa. Lepaskan di gerbang yang cocok.`)
  }

  function dropOnTarget(event: DragEvent<HTMLButtonElement>, targetId: string) {
    event.preventDefault()
    const itemId = event.dataTransfer.getData('text/plain') || draggingItemId
    if (itemId && challenge.items.some((item) => item.id === itemId)) placeItem(itemId, targetId)
    setDraggingItemId(null)
  }

  return (
    <section className="mini-game match-game" data-testid={`mini-game-${challenge.id}`} aria-label="Mini game memasangkan kartu">
      <div className="mini-game__intro">
        <span aria-hidden="true">🐾</span>
        <p><b>Caranya:</b> seret kartu ke gerbang. Jika memakai layar sentuh, ketuk kartu lalu ketuk gerbang.</p>
      </div>
      <p className="mini-game__status" role="status" aria-live="polite" data-testid="mini-game-status">
        {feedback || (selectedItem
          ? `${selectedItem.label} terpilih. Sekarang pilih gerbang tujuan.`
          : placedCount === challenge.items.length
            ? 'Semua kartu sudah ditempatkan. Periksa pilihanmu!'
            : `${placedCount} dari ${challenge.items.length} kartu sudah ditempatkan.`)}
      </p>
      {selectedItem && <button
        type="button"
        className="match-game__cancel"
        data-testid="clear-match-selection"
        onClick={() => {
          onSelectItem(null)
          setFeedback(`Pilihan ${selectedItem.label} dibatalkan.`)
        }}
      >Batal pilih {selectedItem.label}</button>}
      <div className="match-game__layout">
        <div className="match-game__cards" aria-label="Kartu benda atau petunjuk">
          <p className="mini-game__label">Kartu Mio</p>
          {challenge.items.map((item) => {
            const assignedTarget = assignments[item.id]
            const target = challenge.targets.find((candidate) => candidate.id === assignedTarget)
            return (
              <button
                key={item.id}
                type="button"
                draggable
                data-testid={`drag-item-${item.id}`}
                className={`match-card ${selectedItemId === item.id ? 'is-selected' : ''} ${assignedTarget ? 'is-placed' : ''}`}
                aria-pressed={selectedItemId === item.id}
                aria-label={`${item.label}${target ? `, ditempatkan di ${target.label}` : ''}. Pilih untuk dipasangkan.`}
                onClick={() => {
                  const isAlreadySelected = selectedItemId === item.id
                  onSelectItem(isAlreadySelected ? null : item.id)
                  setFeedback(isAlreadySelected
                    ? `Pilihan ${item.label} dibatalkan.`
                    : `${item.label} terpilih. Sekarang pilih gerbang tujuan.`)
                }}
                onDragStart={(event) => beginDrag(event, item.id)}
                onDragEnd={() => setDraggingItemId(null)}
              >
                <span aria-hidden="true">{item.emoji ?? '🧩'}</span>
                <b>{item.label}</b>
                <small>{target ? `→ ${target.label}` : 'Pilih atau seret'}</small>
              </button>
            )
          })}
        </div>
        <div className="match-game__targets" aria-label="Gerbang pasangan">
          <p className="mini-game__label">Gerbang tujuan</p>
          {challenge.targets.map((target) => {
            const placedItems = challenge.items.filter((item) => assignments[item.id] === target.id)
            const canReceive = Boolean(selectedItemId || draggingItemId)
            return (
              <button
                key={target.id}
                type="button"
                data-testid={`drop-zone-${target.id}`}
                className={`match-target ${canReceive ? 'is-ready' : ''}`}
                aria-label={`${target.label}. ${placedItems.length ? `${placedItems.map((item) => item.label).join(', ')} sudah ditempatkan.` : 'Belum ada kartu.'}`}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => dropOnTarget(event, target.id)}
                onClick={() => {
                  if (selectedItemId) placeItem(selectedItemId, target.id)
                  else setFeedback('Pilih satu kartu dahulu, lalu pilih gerbang tujuan.')
                }}
              >
                <span className="match-target__title"><i aria-hidden="true">{target.emoji ?? '🏠'}</i><b>{target.label}</b></span>
                {target.helper && <small>{target.helper}</small>}
                <span className="match-target__items">
                  {placedItems.length > 0 ? placedItems.map((item) => <span key={item.id}>{item.emoji ?? '🧩'} {item.label}</span>) : <em>Letakkan kartu di sini</em>}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export interface SequenceOrderGameProps {
  readonly challenge: SequenceChallenge
  readonly order: readonly string[]
  readonly onMove: (itemId: string, direction: 'up' | 'down') => void
  readonly onMoveBefore: (itemId: string, beforeItemId: string) => void
}

/** Mini game urutkan langkah: drag tersedia, tombol panah menjadi alternatif yang presisi. */
export function SequenceOrderGame({ challenge, order, onMove, onMoveBefore }: SequenceOrderGameProps) {
  const draggingItem = useRef<string | null>(null)
  const [feedback, setFeedback] = useState('')
  const orderedItems = order.map((id) => challenge.items.find((item) => item.id === id)).filter((item): item is NonNullable<typeof item> => Boolean(item))

  function moveItem(item: SequenceItem, index: number, direction: 'up' | 'down'): void {
    onMove(item.id, direction)
    setFeedback(`${item.label} berpindah ke posisi ${index + (direction === 'up' ? 0 : 2)}.`)
  }

  function moveItemBefore(itemId: string, beforeItemId: string): void {
    const item = challenge.items.find((candidate) => candidate.id === itemId)
    const beforeItem = challenge.items.find((candidate) => candidate.id === beforeItemId)
    onMoveBefore(itemId, beforeItemId)
    setFeedback(`${item?.label ?? 'Kartu'} dipindahkan sebelum ${beforeItem?.label ?? 'kartu tujuan'}.`)
  }

  return (
    <section className="mini-game sequence-game" data-testid={`mini-game-${challenge.id}`} aria-label="Mini game mengurutkan langkah">
      <div className="mini-game__intro"><span aria-hidden="true">🧭</span><p><b>Caranya:</b> seret langkah ke tempat yang sesuai atau gunakan tombol panah untuk memindahkannya.</p></div>
      <p className="mini-game__status" role="status" aria-live="polite" data-testid="mini-game-status">{feedback || `Urutkan ${orderedItems.length} kartu dari langkah pertama sampai terakhir.`}</p>
      <div className="sequence-game__anchors" aria-hidden="true"><span>1. Pertama</span><span>Terakhir</span></div>
      <ol className="sequence-game__list">
        {orderedItems.map((item, index) => (
          <li
            key={item.id}
            className="sequence-card"
            draggable
            data-testid={`sequence-item-${item.id}`}
            onDragStart={(event) => {
              event.dataTransfer.effectAllowed = 'move'
              event.dataTransfer.setData('text/plain', item.id)
              draggingItem.current = item.id
            }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault()
              const itemId = event.dataTransfer.getData('text/plain') || draggingItem.current
              if (itemId && itemId !== item.id) moveItemBefore(itemId, item.id)
              draggingItem.current = null
            }}
            onDragEnd={() => { draggingItem.current = null }}
          >
            <span className="sequence-card__number" aria-hidden="true">{index + 1}</span>
            <span className="sequence-card__copy"><b>{item.emoji ?? '🧱'} {item.label}</b><small>Seret atau gunakan panah.</small></span>
            <span className="sequence-card__buttons">
              <button type="button" aria-label={`Naikkan ${item.label}`} disabled={index === 0} onClick={() => moveItem(item, index, 'up')}>↑</button>
              <button type="button" aria-label={`Turunkan ${item.label}`} disabled={index === orderedItems.length - 1} onClick={() => moveItem(item, index, 'down')}>↓</button>
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}

export interface ProjectionPainterProps {
  readonly challenge: ProjectionDrawChallenge
  readonly selectedCells: readonly string[]
  readonly onToggleCell: (column: number, row: number) => void
  readonly onClear: () => void
  readonly onUndo: () => void
}

/** Menggambar tampak ortografis dengan menyalakan atau mematikan petak. */
export function ProjectionPainter({ challenge, selectedCells, onToggleCell, onClear, onUndo }: ProjectionPainterProps) {
  const selected = new Set(selectedCells)
  const { expected } = challenge
  const axisHelp = challenge.view === 'top'
    ? 'Kolom dari kiri ke kanan. Baris 1 berada di depan.'
    : challenge.view === 'front'
      ? 'Kolom dari kiri ke kanan. Baris 1 berada paling bawah.'
      : 'Kolom dari depan ke belakang. Baris 1 berada paling bawah.'
  return (
    <section className="mini-game projection-painter" data-testid={`mini-game-${challenge.id}`} aria-label="Mini game menggambar tampak bangun">
      <div className="mini-game__intro"><span aria-hidden="true">🖍️</span><p><b>Nyalakan petak</b> yang tampak terisi. Ketuk lagi jika ingin menghapusnya.</p></div>
      <p className="mini-game__status" role="status" data-testid="mini-game-status">{selected.size} petak sudah kamu nyalakan.</p>
      <div className="projection-painter__frame">
        <span className="mini-game__label">Kanvas tampak {challenge.view === 'top' ? 'atas' : challenge.view === 'front' ? 'depan' : 'samping kanan'}</span>
        <p className="projection-painter__axis">{axisHelp}</p>
        <div className="projection-painter__actions">
          <button type="button" disabled={selected.size === 0} onClick={onUndo}>Urungkan petak terakhir</button>
          <button type="button" disabled={selected.size === 0} onClick={onClear}>Kosongkan semua</button>
        </div>
        <div className="projection-painter__grid" role="group" aria-label="Petak tampak yang dapat diisi" style={{ gridTemplateColumns: `repeat(${expected.width}, minmax(44px, 1fr))` }}>
          {Array.from({ length: expected.width * expected.height }, (_, index) => {
            const column = index % expected.width
            const row = expected.height - 1 - Math.floor(index / expected.width)
            const key = `${column},${row}`
            const isSelected = selected.has(key)
            return <button
              key={key}
              type="button"
              aria-pressed={isSelected}
              aria-label={`${isSelected ? 'Hapus' : 'Nyalakan'} petak kolom ${column + 1}, baris ${row + 1}`}
              className={`projection-painter__cell ${isSelected ? 'is-filled' : ''}`}
              onClick={() => onToggleCell(column, row)}
            >{isSelected ? '■' : ''}</button>
          })}
        </div>
      </div>
    </section>
  )
}
