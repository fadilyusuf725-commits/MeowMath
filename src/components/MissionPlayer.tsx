import { useEffect, useMemo, useState } from 'react'
import type { Challenge, MissionDefinition } from '../content/missions'
import { compareProjections, compareStructures, createOrthographicProjection, createRectangularPrism, type Shape, type Voxel } from '../lib'
import { speakIndonesian } from '../lib/speech'
import { BlockBuilder } from './BlockBuilder'
import { GeometryViewer, type CameraView } from './GeometryViewer'
import { ProjectionGrid } from './ProjectionGrid'
import { MatchDropGame, ProjectionPainter, SequenceOrderGame } from './SpatialMiniGames'

export interface MissionScore {
  readonly correct: number
  readonly total: number
  readonly attempts: number
  readonly hintsUsed: number
}

interface MissionPlayerProps {
  readonly mission: MissionDefinition
  readonly audioEnabled: boolean
  readonly onExit: () => void
  readonly onFinish: (score: MissionScore) => void
}

type AnswerState = 'correct' | 'wrong' | null

const visualShapes = {
  cube: createRectangularPrism({ width: 2, height: 2, depth: 2 }),
  cuboid: createRectangularPrism({ width: 3, height: 2, depth: 1 }),
  mixed: [
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 },
    { x: 0, y: 0, z: 1 },
  ] as Shape,
}

function isSameCell(left: Voxel, right: Voxel): boolean {
  return left.x === right.x && left.y === right.y && left.z === right.z
}

function viewName(view: CameraView): string {
  return {
    isometric: '3D',
    front: 'Depan',
    top: 'Atas',
    right: 'Samping kanan',
  }[view]
}

function challengeModeLabel(challenge: Challenge): string {
  switch (challenge.type) {
    case 'choice': return 'PILIHAN MIO'
    case 'build': return 'SUSUN BLOK'
    case 'projection': return 'LIHAT DARI ARAH LAIN'
    case 'projection-draw': return 'GAMBAR YANG KAMU LIHAT'
    case 'match': return 'PASANGKAN YANG COCOK'
    case 'sequence': return 'SUSUN LANGKAHNYA'
    case 'map': return 'CARI DI PETA'
  }
}

export function MissionPlayer({ mission, audioEnabled, onExit, onFinish }: MissionPlayerProps) {
  const [step, setStep] = useState(0)
  const [choice, setChoice] = useState<number | null>(null)
  const [mapChoice, setMapChoice] = useState<string | null>(null)
  const [buildShape, setBuildShape] = useState<Shape>([])
  const [matchAssignments, setMatchAssignments] = useState<Record<string, string>>({})
  const [selectedMatchItemId, setSelectedMatchItemId] = useState<string | null>(null)
  const [sequenceOrder, setSequenceOrder] = useState<string[]>([])
  const [projectionCells, setProjectionCells] = useState<string[]>([])
  const [answerState, setAnswerState] = useState<AnswerState>(null)
  const [attemptsForStep, setAttemptsForStep] = useState(0)
  const [hintLevel, setHintLevel] = useState(0)
  const [totalAttempts, setTotalAttempts] = useState(0)
  const [totalHints, setTotalHints] = useState(0)
  const [independentCorrect, setIndependentCorrect] = useState(0)
  const [cameraView, setCameraView] = useState<CameraView>('isometric')

  const challenge = mission.challenges[step]
  const progress = ((step + (answerState === 'correct' ? 1 : 0)) / mission.challenges.length) * 100

  useEffect(() => {
    setChoice(null)
    setMapChoice(null)
    setBuildShape(challenge.type === 'build' ? challenge.startingShape ?? [] : [])
    setMatchAssignments({})
    setSelectedMatchItemId(null)
    setSequenceOrder(challenge.type === 'sequence' ? [...challenge.initialOrder] : [])
    setProjectionCells([])
    setAnswerState(null)
    setAttemptsForStep(0)
    setHintLevel(0)
    setCameraView('isometric')
  }, [challenge])

  const narratedText = useMemo(
    () => `${mission.title}. ${challenge.prompt}`,
    [mission.title, challenge.prompt],
  )

  function isAnswered(): boolean {
    if (challenge.type === 'choice' || challenge.type === 'projection') return choice !== null
    if (challenge.type === 'map') return mapChoice !== null
    if (challenge.type === 'match') return Object.keys(matchAssignments).length === challenge.items.length
    if (challenge.type === 'sequence') return sequenceOrder.length === challenge.items.length
    if (challenge.type === 'projection-draw') return projectionCells.length > 0
    return true
  }

  function checkAnswer(): void {
    if (!isAnswered()) return
    let isCorrect = false
    if (challenge.type === 'choice' || challenge.type === 'projection') {
      isCorrect = choice === challenge.correctIndex
    } else if (challenge.type === 'map') {
      isCorrect = mapChoice === `${challenge.target.column},${challenge.target.row}`
    } else if (challenge.type === 'match') {
      isCorrect = challenge.items.every((item) => matchAssignments[item.id] === challenge.correctMatches[item.id])
    } else if (challenge.type === 'sequence') {
      isCorrect = challenge.correctOrder.every((itemId, index) => sequenceOrder[index] === itemId)
    } else if (challenge.type === 'projection-draw') {
      const drawing = createOrthographicProjection(
        challenge.view,
        challenge.expected.width,
        challenge.expected.height,
        projectionCells.map((key) => {
          const [column, row] = key.split(',').map(Number)
          return { column, row }
        }),
      )
      isCorrect = compareProjections(challenge.expected, drawing).matches
    } else {
      // Setiap misi konstruksi memakai cetak biru tersimpan. Bentuk yang
      // mirip tetapi diletakkan pada titik lain tidak boleh lolos penilaian.
      isCorrect = compareStructures(challenge.target, buildShape, {
        matchMode: challenge.matchMode ?? 'exact',
      }).matches
    }

    const nextAttempts = attemptsForStep + 1
    setAttemptsForStep(nextAttempts)
    setTotalAttempts((count) => count + 1)
    setAnswerState(isCorrect ? 'correct' : 'wrong')
    if (isCorrect && nextAttempts === 1 && hintLevel === 0) {
      setIndependentCorrect((count) => count + 1)
    }
  }

  function useHint(): void {
    if (hintLevel >= challenge.hints.length) return
    setHintLevel((level) => level + 1)
    setTotalHints((count) => count + 1)
  }

  function nextStep(): void {
    if (step === mission.challenges.length - 1) {
      onFinish({
        correct: independentCorrect,
        total: mission.challenges.length,
        attempts: totalAttempts,
        hintsUsed: totalHints,
      })
      return
    }
    setStep((current) => current + 1)
  }

  function toggleBlock(cell: Voxel): void {
    setBuildShape((current) =>
      current.some((occupied) => isSameCell(occupied, cell))
        ? current.filter((occupied) => !isSameCell(occupied, cell))
        : [...current, cell],
    )
    setAnswerState(null)
  }

  function assignMatchItem(itemId: string, targetId: string): void {
    setMatchAssignments((current) => ({ ...current, [itemId]: targetId }))
    setSelectedMatchItemId(null)
    setAnswerState(null)
  }

  function moveSequenceItem(itemId: string, direction: 'up' | 'down'): void {
    setSequenceOrder((current) => {
      const index = current.indexOf(itemId)
      const nextIndex = direction === 'up' ? index - 1 : index + 1
      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return current
      const next = [...current]
      ;[next[index], next[nextIndex]] = [next[nextIndex], next[index]]
      return next
    })
    setAnswerState(null)
  }

  function moveSequenceItemBefore(itemId: string, beforeItemId: string): void {
    setSequenceOrder((current) => {
      const fromIndex = current.indexOf(itemId)
      const toIndex = current.indexOf(beforeItemId)
      if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return current
      const next = [...current]
      next.splice(fromIndex, 1)
      // Setelah elemen asal dihapus, indeks tujuan bergeser satu posisi jika
      // asal berada sebelum tujuan. Sisipkan tetap *sebelum* kartu tujuan.
      next.splice(fromIndex < toIndex ? toIndex - 1 : toIndex, 0, itemId)
      return next
    })
    setAnswerState(null)
  }

  function toggleProjectionCell(column: number, row: number): void {
    const key = `${column},${row}`
    setProjectionCells((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key])
    setAnswerState(null)
  }

  function clearProjectionCells(): void {
    setProjectionCells([])
    setAnswerState(null)
  }

  function undoProjectionCell(): void {
    setProjectionCells((current) => current.slice(0, -1))
    setAnswerState(null)
  }

  return (
    <main className="mission-page">
      <header className="mission-header">
        <button className="text-button" type="button" onClick={onExit}>← Kembali ke Kota Meow</button>
        <div className="mission-progress-wrap" aria-label={`Kemajuan misi ${Math.round(progress)} persen`}>
          <span>{mission.tpCode}</span>
          <div className="mission-progress"><span style={{ width: `${progress}%` }} /></div>
          <span>{step + 1}/{mission.challenges.length}</span>
        </div>
      </header>

      <section className={`mission-hero mission-hero--${mission.color}`}>
        <div className="mission-icon" aria-hidden="true">{mission.icon}</div>
        <div>
          <p className="eyebrow">Misi {mission.number} · {mission.tpCode}</p>
          <h1>{mission.title}</h1>
          <p>{mission.objective}</p>
        </div>
      </section>

      <section className="challenge-card" aria-live="polite">
        <div className="challenge-topline">
          <span className="challenge-topline__labels">
            <span className="mio-label">🐱 Mio berkata</span>
            <span className="challenge-mode-label">{challengeModeLabel(challenge)}</span>
          </span>
          <button
            type="button"
            className="audio-button"
            onClick={() => speakIndonesian(narratedText, audioEnabled)}
            disabled={!audioEnabled}
            title={audioEnabled ? 'Dengarkan suara Mio' : 'Suara Mio sedang dimatikan'}
          >
            🔊 Dengarkan Mio
          </button>
        </div>
        <h2>{challenge.prompt}</h2>
        <ChallengeInput
          challenge={challenge}
          choice={choice}
          onChoice={(value) => {
            setChoice(value)
            setAnswerState(null)
          }}
          mapChoice={mapChoice}
          onMapChoice={(value) => {
            setMapChoice(value)
            setAnswerState(null)
          }}
          buildShape={buildShape}
          onToggleBlock={toggleBlock}
          matchAssignments={matchAssignments}
          selectedMatchItemId={selectedMatchItemId}
          onSelectMatchItem={(itemId) => {
            setSelectedMatchItemId(itemId)
            setAnswerState(null)
          }}
          onAssignMatchItem={assignMatchItem}
          sequenceOrder={sequenceOrder}
          onMoveSequenceItem={moveSequenceItem}
          onMoveSequenceItemBefore={moveSequenceItemBefore}
          projectionCells={projectionCells}
          onToggleProjectionCell={toggleProjectionCell}
          onClearProjectionCells={clearProjectionCells}
          onUndoProjectionCell={undoProjectionCell}
          cameraView={cameraView}
          onCameraView={setCameraView}
        />

        {hintLevel > 0 && (
          <div className="hint-box">
            <strong>Mio punya petunjuk {hintLevel}</strong>
            <p>{challenge.hints[hintLevel - 1]}</p>
          </div>
        )}

        {answerState && (
          <div className={`answer-feedback answer-feedback--${answerState}`}>
            <strong>{answerState === 'correct' ? 'Hebat, kamu menemukannya!' : 'Belum cocok. Kita coba lagi, ya.'}</strong>
            <p>{answerState === 'correct' ? challenge.explanation : 'Dengarkan petunjuk Mio atau amati modelnya sekali lagi.'}</p>
          </div>
        )}

        <div className="challenge-actions">
          {answerState !== 'correct' && hintLevel < challenge.hints.length && (
            <button type="button" className="secondary-button" onClick={useHint}>💡 Minta bantuan Mio</button>
          )}
          {answerState === 'correct' ? (
            <button type="button" className="primary-button" onClick={nextStep}>
              {step === mission.challenges.length - 1 ? 'Lewati pintu ini' : 'Lanjut'} →
            </button>
          ) : (
            <button type="button" className="primary-button" onClick={checkAnswer} disabled={!isAnswered()}>
              Cek idemu
            </button>
          )}
        </div>
      </section>
    </main>
  )
}

interface ChallengeInputProps {
  readonly challenge: Challenge
  readonly choice: number | null
  readonly onChoice: (value: number) => void
  readonly mapChoice: string | null
  readonly onMapChoice: (value: string) => void
  readonly buildShape: Shape
  readonly onToggleBlock: (cell: Voxel) => void
  readonly matchAssignments: Readonly<Record<string, string>>
  readonly selectedMatchItemId: string | null
  readonly onSelectMatchItem: (itemId: string | null) => void
  readonly onAssignMatchItem: (itemId: string, targetId: string) => void
  readonly sequenceOrder: readonly string[]
  readonly onMoveSequenceItem: (itemId: string, direction: 'up' | 'down') => void
  readonly onMoveSequenceItemBefore: (itemId: string, beforeItemId: string) => void
  readonly projectionCells: readonly string[]
  readonly onToggleProjectionCell: (column: number, row: number) => void
  readonly onClearProjectionCells: () => void
  readonly onUndoProjectionCell: () => void
  readonly cameraView: CameraView
  readonly onCameraView: (view: CameraView) => void
}

function ChallengeInput({
  challenge,
  choice,
  onChoice,
  mapChoice,
  onMapChoice,
  buildShape,
  onToggleBlock,
  matchAssignments,
  selectedMatchItemId,
  onSelectMatchItem,
  onAssignMatchItem,
  sequenceOrder,
  onMoveSequenceItem,
  onMoveSequenceItemBefore,
  projectionCells,
  onToggleProjectionCell,
  onClearProjectionCells,
  onUndoProjectionCell,
  cameraView,
  onCameraView,
}: ChallengeInputProps) {
  if (challenge.type === 'choice') {
    return (
      <div className="choice-layout">
        {challenge.visual && (
          <GeometryViewer
            shape={visualShapes[challenge.visual]}
            label="Model bangun ruang untuk diamati"
            accent={challenge.visual === 'cuboid' ? '#7468d9' : '#ff985a'}
            compact
          />
        )}
        <div className="choice-list" role="radiogroup" aria-label="Pilihan jawaban">
          {challenge.options.map((option, index) => (
            <button
              type="button"
              role="radio"
              aria-checked={choice === index}
              className={`choice-button ${choice === index ? 'is-selected' : ''}`}
              key={option}
              onClick={() => onChoice(index)}
            >
              <span>{String.fromCharCode(65 + index)}</span>{option}
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (challenge.type === 'build') {
    return <BlockBuilder
      grid={challenge.grid}
      shape={buildShape}
      onToggle={onToggleBlock}
      target={challenge.target}
      showTargetCells={challenge.matchMode !== 'translation-independent'}
    />
  }

  if (challenge.type === 'projection') {
    return (
      <div className="projection-layout">
        <div>
          <div className="camera-controls" aria-label="Kontrol tampilan model">
            {(['isometric', 'front', 'top', 'right'] as const).map((view) => (
              <button
                type="button"
                key={view}
                className={cameraView === view ? 'is-active' : ''}
                onClick={() => onCameraView(view)}
              >
                {viewName(view)}
              </button>
            ))}
          </div>
          <GeometryViewer shape={challenge.object} view={cameraView} label="Model bangun ruang yang perlu diamati" />
        </div>
        <div className="projection-options" role="radiogroup" aria-label="Pilihan tampak bangun">
          {challenge.options.map((option, index) => (
            <ProjectionGrid
              key={index}
              projection={option}
              label={`Pilihan ${String.fromCharCode(65 + index)}`}
              selected={choice === index}
              onSelect={() => onChoice(index)}
            />
          ))}
        </div>
      </div>
    )
  }

  if (challenge.type === 'projection-draw') {
    return (
      <div className="projection-layout">
        <div>
          <div className="camera-controls" aria-label="Kontrol tampilan model">
            {(['isometric', 'front', 'top', 'right'] as const).map((view) => (
              <button
                type="button"
                key={view}
                className={cameraView === view ? 'is-active' : ''}
                onClick={() => onCameraView(view)}
              >
                {viewName(view)}
              </button>
            ))}
          </div>
          <GeometryViewer shape={challenge.object} view={cameraView} label="Model bangun ruang yang perlu diamati" />
        </div>
        <ProjectionPainter
          challenge={challenge}
          selectedCells={projectionCells}
          onToggleCell={onToggleProjectionCell}
          onClear={onClearProjectionCells}
          onUndo={onUndoProjectionCell}
        />
      </div>
    )
  }

  if (challenge.type === 'match') {
    return <MatchDropGame
      challenge={challenge}
      assignments={matchAssignments}
      selectedItemId={selectedMatchItemId}
      onSelectItem={onSelectMatchItem}
      onAssign={onAssignMatchItem}
    />
  }

  if (challenge.type === 'sequence') {
    return <SequenceOrderGame
      challenge={challenge}
      order={sequenceOrder}
      onMove={onMoveSequenceItem}
      onMoveBefore={onMoveSequenceItemBefore}
    />
  }

  return (
    <div className="map-challenge">
      <p className="map-direction">Kolom dibaca dari kiri ke kanan. Baris dibaca dari bawah ke atas.</p>
      <div
        className="meow-grid"
        role="grid"
        aria-label="Peta berpetak Kota Meow"
        style={{ gridTemplateColumns: `repeat(${challenge.columns}, minmax(44px, 1fr))` }}
      >
        {Array.from({ length: challenge.columns * challenge.rows }, (_, index) => {
          const column = index % challenge.columns
          const row = challenge.rows - 1 - Math.floor(index / challenge.columns)
          const key = `${column},${row}`
          const isSelected = mapChoice === key
          return (
            <button
              type="button"
              role="gridcell"
              aria-selected={isSelected}
              className={`map-cell ${isSelected ? 'is-selected' : ''}`}
              key={key}
              onClick={() => onMapChoice(key)}
            >
              <span>{column + 1},{row + 1}</span>
              {isSelected && <b>🐾</b>}
            </button>
          )
        })}
      </div>
      <p className="map-target">Target: <strong>{challenge.targetLabel}</strong></p>
    </div>
  )
}
