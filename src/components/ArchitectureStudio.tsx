import { Edges, OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import {
  architecturePlacementsToShape,
  architectureSolids,
  coordinateLabel,
  findFirstAvailableCoordinate,
  getArchitectureSolid,
  legacyShapeToArchitecturePlacements,
  normalizeArchitecturePlacements,
  validateArchitecturePlacement,
  type ArchitecturePlacedSolid,
  type ArchitectureSolidId,
  type GridDimensions,
  type Shape,
  type Voxel,
} from '../lib'

/** A saved creation. `shape` remains for v1 compatibility; `placedSolids` is the new source of truth. */
export interface ArchitectureStudioDesign {
  readonly title: string
  readonly grid: GridDimensions
  readonly shape: Shape
  readonly placedSolids: readonly ArchitecturePlacedSolid[]
  readonly presetId: ArchitecturePresetId
  readonly savedAt: string
}

/** Data accepted when restoring a previously saved creation. */
export interface ArchitectureStudioInitialDesign {
  readonly title?: string
  readonly grid?: GridDimensions
  readonly shape?: Shape
  readonly placedSolids?: readonly ArchitecturePlacedSolid[]
  readonly presetId?: ArchitecturePresetId
}

/** Older ids stay supported so existing local creations can still be opened. */
export type ArchitecturePresetId = 'kanvas' | 'pondok-mio' | 'menara-kumis' | 'gerbang-kota' | 'custom'

export interface ArchitectureStudioProps {
  readonly initialDesign?: ArchitectureStudioInitialDesign
  readonly onSave: (design: ArchitectureStudioDesign) => void | Promise<void>
  readonly onChange?: (draft: Omit<ArchitectureStudioDesign, 'savedAt'>) => void
  /** Maximum number of complete solids a child can place. */
  readonly maxCells?: number
  readonly title?: string
}

type CameraView = 'isometric' | 'front' | 'top' | 'right'
type CoordinateAxis = keyof Voxel

const MIN_GRID_SIZE = 2
const MAX_GRID_SIZE = 6
const DEFAULT_GRID: GridDimensions = { width: 6, height: 5, depth: 6 }
const CELL_SIZE = 1.22

const cameraViews: readonly { readonly id: CameraView; readonly label: string }[] = [
  { id: 'isometric', label: '3D' },
  { id: 'front', label: 'Depan' },
  { id: 'top', label: 'Atas' },
  { id: 'right', label: 'Samping' },
]

const cameraPositions: Readonly<Record<CameraView, readonly [number, number, number]>> = {
  isometric: [8, 7.2, 8.8],
  front: [0, 3.2, 11.5],
  top: [0, 12, .01],
  right: [11.5, 3.2, 0],
}

const panelStyle: CSSProperties = {
  background: '#fffaf5',
  border: '1px solid #eee2d9',
  borderRadius: 18,
  padding: '1rem',
}

const buttonStyle: CSSProperties = {
  alignItems: 'center',
  background: '#fff',
  border: '1px solid #e7ddd6',
  borderRadius: 11,
  color: '#55495b',
  cursor: 'pointer',
  display: 'inline-flex',
  font: 'inherit',
  fontSize: '.78rem',
  fontWeight: 900,
  justifyContent: 'center',
  minHeight: 44,
  padding: '.45rem .7rem',
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value))
}

function cleanGrid(grid?: GridDimensions): GridDimensions {
  return {
    width: clamp(Math.round(grid?.width ?? DEFAULT_GRID.width), MIN_GRID_SIZE, MAX_GRID_SIZE),
    height: clamp(Math.round(grid?.height ?? DEFAULT_GRID.height), MIN_GRID_SIZE, MAX_GRID_SIZE),
    depth: clamp(Math.round(grid?.depth ?? DEFAULT_GRID.depth), MIN_GRID_SIZE, MAX_GRID_SIZE),
  }
}

function initialPlacements(initialDesign: ArchitectureStudioInitialDesign | undefined, grid: GridDimensions): ArchitecturePlacedSolid[] {
  if (initialDesign?.placedSolids !== undefined) return normalizeArchitecturePlacements(grid, initialDesign.placedSolids)
  return legacyShapeToArchitecturePlacements(grid, initialDesign?.shape)
}

function createPlacementId(): string {
  return `bangun-${crypto.randomUUID()}`
}

function isSameCoordinate(left: Voxel, right: Voxel): boolean {
  return left.x === right.x && left.y === right.y && left.z === right.z
}

function solidHeight(id: ArchitectureSolidId): number {
  switch (id) {
    case 'balok': return .62
    case 'kubus': return .84
    case 'prisma-segitiga': return .86
    case 'prisma-segiempat': return .86
    case 'limas-segiempat': return .9
    case 'limas-segitiga': return .9
    case 'tabung': return .84
    case 'kerucut': return .92
    case 'bola': return .84
  }
}

function SolidGeometry({ id }: { readonly id: ArchitectureSolidId }) {
  switch (id) {
    case 'kubus': return <boxGeometry args={[.84, .84, .84]} />
    case 'balok': return <boxGeometry args={[1.02, .62, .62]} />
    case 'prisma-segitiga': return <cylinderGeometry args={[.44, .44, .86, 3]} />
    case 'prisma-segiempat': return <cylinderGeometry args={[.43, .43, .86, 4]} />
    case 'limas-segiempat': return <coneGeometry args={[.5, .9, 4]} />
    case 'limas-segitiga': return <coneGeometry args={[.5, .9, 3]} />
    case 'tabung': return <cylinderGeometry args={[.42, .42, .84, 32]} />
    case 'kerucut': return <coneGeometry args={[.46, .92, 32]} />
    case 'bola': return <sphereGeometry args={[.43, 28, 20]} />
  }
}

function scenePosition(origin: Voxel, grid: GridDimensions, height: number): readonly [number, number, number] {
  return [
    (origin.x - (grid.width - 1) / 2) * CELL_SIZE,
    origin.y * CELL_SIZE + height / 2,
    (origin.z - (grid.depth - 1) / 2) * CELL_SIZE,
  ]
}

function CoordinateSolid({
  placement,
  grid,
  selected,
  ghost = false,
  allowed = true,
  onSelect,
}: {
  readonly placement: ArchitecturePlacedSolid
  readonly grid: GridDimensions
  readonly selected: boolean
  readonly ghost?: boolean
  readonly allowed?: boolean
  readonly onSelect?: () => void
}) {
  const solid = getArchitectureSolid(placement.solidId)
  const height = solidHeight(placement.solidId)
  const position = scenePosition(placement.origin, grid, height)
  const hasEdges = placement.solidId !== 'tabung' && placement.solidId !== 'kerucut' && placement.solidId !== 'bola'
  const color = ghost ? (allowed ? '#5dcaa5' : '#ef6d63') : solid.color

  return (
    <group position={position}>
      <mesh castShadow={!ghost} receiveShadow scale={selected && !ghost ? 1.08 : 1} onClick={onSelect}>
        <SolidGeometry id={placement.solidId} />
        <meshStandardMaterial color={color} transparent={ghost} opacity={ghost ? .42 : 1} emissive={selected || ghost ? color : '#000000'} emissiveIntensity={selected || ghost ? .18 : 0} roughness={.5} />
        {hasEdges ? <Edges color={ghost ? color : '#3f3d50'} linewidth={selected ? 2.2 : 1.3} /> : null}
      </mesh>
      {selected && !ghost ? (
        <mesh position={[0, -height / 2 + .035, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[.5, .57, 32]} />
          <meshBasicMaterial color="#715bc1" />
        </mesh>
      ) : null}
    </group>
  )
}

function CoordinateCanvas({
  grid,
  placements,
  selectedPlacementId,
  selectedSolidId,
  coordinate,
  placementAllowed,
  view,
  onSelectPlacement,
}: {
  readonly grid: GridDimensions
  readonly placements: readonly ArchitecturePlacedSolid[]
  readonly selectedPlacementId: string | null
  readonly selectedSolidId: ArchitectureSolidId
  readonly coordinate: Voxel
  readonly placementAllowed: boolean
  readonly view: CameraView
  readonly onSelectPlacement: (id: string) => void
}) {
  const selectedPlacement = placements.find((placement) => placement.id === selectedPlacementId)
  const showGhost = !selectedPlacement || !isSameCoordinate(selectedPlacement.origin, coordinate)
  const canvasSize = Math.max(grid.width, grid.depth) * CELL_SIZE + 1

  return (
    <div style={{ background: '#edf9f7', border: '1px solid #cee9e0', borderRadius: 17, height: 360, overflow: 'hidden', position: 'relative' }}>
      <Canvas key={view} camera={{ position: cameraPositions[view], fov: 42 }} dpr={[1, 1.6]} shadows aria-label="Kanvas arsitektur tiga dimensi. Sumbu X berwarna merah, sumbu Y hijau, dan sumbu Z biru. Seret untuk memutar.">
        <color attach="background" args={['#edf9f7']} />
        <ambientLight intensity={1.28} />
        <directionalLight position={[6, 9, 6]} intensity={1.4} castShadow />
        <directionalLight position={[-5, 4, -4]} intensity={.42} color="#b89bf0" />
        <gridHelper args={[canvasSize, Math.max(grid.width, grid.depth), '#8dc9bf', '#d4eee8']} position={[0, -.02, 0]} />
        <axesHelper args={[2.15]} position={[-(grid.width - 1) * CELL_SIZE / 2 - .55, 0, (grid.depth - 1) * CELL_SIZE / 2 + .55]} />
        <mesh position={[0, grid.height * CELL_SIZE / 2 - .02, 0]}>
          <boxGeometry args={[grid.width * CELL_SIZE, grid.height * CELL_SIZE, grid.depth * CELL_SIZE]} />
          <meshBasicMaterial color="#83b9c2" transparent opacity={.045} wireframe />
        </mesh>
        {placements.map((placement) => <CoordinateSolid key={placement.id} placement={placement} grid={grid} selected={placement.id === selectedPlacementId} onSelect={() => onSelectPlacement(placement.id)} />)}
        {showGhost ? <CoordinateSolid placement={{ id: 'preview', solidId: selectedSolidId, origin: coordinate }} grid={grid} selected={false} ghost allowed={placementAllowed} /> : null}
        <OrbitControls enablePan={false} enableDamping dampingFactor={.08} minDistance={4.5} maxDistance={16} rotateSpeed={.72} target={[0, Math.min(grid.height * CELL_SIZE / 2, 2), 0]} />
      </Canvas>
      <span aria-hidden="true" style={{ background: 'rgba(255,255,255,.86)', borderRadius: 10, bottom: 10, color: '#496b68', fontSize: '.67rem', fontWeight: 900, left: 10, padding: '.38rem .5rem', position: 'absolute' }}>↔ Seret untuk memutar kanvas</span>
    </div>
  )
}

function CoordinateControl({
  axis,
  label,
  hint,
  value,
  maximum,
  onChange,
}: {
  readonly axis: CoordinateAxis
  readonly label: string
  readonly hint: string
  readonly value: number
  readonly maximum: number
  readonly onChange: (amount: number) => void
}) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e7ddd6', borderRadius: 13, padding: '.48rem', textAlign: 'center' }}>
      <span style={{ color: '#756a78', display: 'block', fontSize: '.67rem', fontWeight: 900 }}>{label}</span>
      <small style={{ color: '#9a8e99', display: 'block', fontSize: '.58rem', lineHeight: 1.2, marginTop: '.08rem' }}>{hint}</small>
      <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', marginTop: '.35rem' }}>
        <button type="button" aria-label={`Koordinat ${axis.toUpperCase()} sebelumnya`} disabled={value === 0} onClick={() => onChange(-1)} style={{ ...buttonStyle, minHeight: 34, padding: '.15rem .42rem' }}>−</button>
        <span aria-label={`Koordinat ${axis.toUpperCase()} ${value + 1}`} style={{ color: '#4e405a', fontSize: '1.15rem', fontWeight: 900 }}>{value + 1}<small style={{ color: '#a0929d', fontSize: '.56rem' }}>/{maximum}</small></span>
        <button type="button" aria-label={`Koordinat ${axis.toUpperCase()} berikutnya`} disabled={value >= maximum - 1} onClick={() => onChange(1)} style={{ ...buttonStyle, minHeight: 34, padding: '.15rem .42rem' }}>+</button>
      </div>
    </div>
  )
}

/** One child-friendly architecture flow; the old separate unit-block builder is intentionally removed. */
export function ArchitectureStudio({ initialDesign, onSave, onChange, maxCells = 48, title = 'Studio Arsitek Mio' }: ArchitectureStudioProps) {
  const initialGrid = cleanGrid(initialDesign?.grid)
  const [grid, setGrid] = useState<GridDimensions>(initialGrid)
  const [placedSolids, setPlacedSolids] = useState<ArchitecturePlacedSolid[]>(() => initialPlacements(initialDesign, initialGrid))
  const [designTitle, setDesignTitle] = useState(initialDesign?.title?.trim().slice(0, 32) || 'Karya Kota Meow')
  const [selectedSolidId, setSelectedSolidId] = useState<ArchitectureSolidId>('kubus')
  const [coordinate, setCoordinate] = useState<Voxel>({ x: 0, y: 0, z: 0 })
  const [selectedPlacementId, setSelectedPlacementId] = useState<string | null>(null)
  const [view, setView] = useState<CameraView>('isometric')
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [notice, setNotice] = useState('Pilih satu bentuk, cari titiknya, lalu letakkan di kotamu.')
  const initialKey = JSON.stringify(initialDesign ?? {})

  useEffect(() => {
    const restoredGrid = cleanGrid(initialDesign?.grid)
    const restoredPlacements = initialPlacements(initialDesign, restoredGrid)
    setGrid(restoredGrid)
    setPlacedSolids(restoredPlacements)
    setDesignTitle(initialDesign?.title?.trim().slice(0, 32) || 'Karya Kota Meow')
    setSelectedSolidId(restoredPlacements[0]?.solidId ?? 'kubus')
    setCoordinate(restoredPlacements[0]?.origin ?? { x: 0, y: 0, z: 0 })
    setSelectedPlacementId(null)
    setSaveState('idle')
    setNotice(initialDesign ? 'Karyamu sudah dibuka. Ketuk bangunan untuk memindahkannya atau tambahkan ide baru.' : 'Pilih satu bentuk, cari titiknya, lalu letakkan di kotamu.')
  }, [initialKey])

  const selectedSolid = getArchitectureSolid(selectedSolidId)
  const selectedPlacement = placedSolids.find((placement) => placement.id === selectedPlacementId)
  const placementCheck = validateArchitecturePlacement(grid, placedSolids, { origin: coordinate }, selectedPlacementId ? { ignoreId: selectedPlacementId } : {})
  const capacity = Math.min(maxCells, grid.width * grid.height * grid.depth)
  const canAddAnother = placedSolids.length < capacity

  const draft = useMemo<Omit<ArchitectureStudioDesign, 'savedAt'>>(
    () => ({
      title: designTitle.trim() || 'Karya Kota Meow',
      grid: { ...grid },
      shape: architecturePlacementsToShape(placedSolids),
      placedSolids: placedSolids.map((placement) => ({ ...placement, origin: { ...placement.origin } })),
      presetId: 'custom',
    }),
    [designTitle, grid, placedSolids],
  )

  useEffect(() => { onChange?.(draft) }, [draft, onChange])

  function chooseSolid(id: ArchitectureSolidId) {
    setSelectedSolidId(id)
    setSelectedPlacementId(null)
    setSaveState('idle')
    setNotice(`${getArchitectureSolid(id).label} siap dibangun. Sekarang cari titik yang kamu suka.`)
  }

  function updateCoordinate(axis: CoordinateAxis, amount: number) {
    const maximum = axis === 'x' ? grid.width - 1 : axis === 'y' ? grid.height - 1 : grid.depth - 1
    setCoordinate((current) => ({ ...current, [axis]: clamp(current[axis] + amount, 0, maximum) }))
    setSaveState('idle')
  }

  function selectPlacedSolid(id: string) {
    const placement = placedSolids.find((item) => item.id === id)
    if (!placement) return
    setSelectedPlacementId(id)
    setSelectedSolidId(placement.solidId)
    setCoordinate({ ...placement.origin })
    setSaveState('idle')
    setNotice(`${getArchitectureSolid(placement.solidId).label} di ${coordinateLabel(placement.origin)} dipilih. Geser titiknya kalau ingin memindahkannya.`)
  }

  function placeOrMoveSolid() {
    if (!placementCheck.valid) {
      if (placementCheck.issue.code === 'OCCUPIED') {
        const other = getArchitectureSolid(placementCheck.issue.conflict.solidId)
        setNotice(`${coordinateLabel(coordinate)} sudah terpakai oleh ${other.label}. Pilih koordinat X, Y, atau Z lain agar bangun tidak bertumpang tindih.`)
      } else setNotice('Titik itu berada di luar kanvas. Coba pilih angka X, Y, dan Z yang tersedia.')
      return
    }
    if (selectedPlacement) {
      setPlacedSolids((current) => current.map((placement) => placement.id === selectedPlacement.id ? { ...placement, origin: { ...coordinate } } : placement))
      setNotice(`${getArchitectureSolid(selectedPlacement.solidId).label} pindah ke ${coordinateLabel(coordinate)}.`)
      setSaveState('idle')
      return
    }
    if (!canAddAnother) {
      setNotice(`Kotamu sudah penuh dengan ${capacity} bangunan. Hapus satu dulu kalau ingin mencoba ide baru.`)
      return
    }
    const placed: ArchitecturePlacedSolid = { id: createPlacementId(), solidId: selectedSolidId, origin: { ...coordinate } }
    setPlacedSolids((current) => [...current, placed])
    setSelectedPlacementId(placed.id)
    setNotice(`${selectedSolid.label} sudah berdiri di ${coordinateLabel(coordinate)}. Coba tambahkan bentuk lain!`)
    setSaveState('idle')
  }

  function removePlacedSolid(id: string) {
    const placement = placedSolids.find((item) => item.id === id)
    if (!placement) return
    setPlacedSolids((current) => current.filter((item) => item.id !== id))
    if (selectedPlacementId === id) setSelectedPlacementId(null)
    setNotice(`${getArchitectureSolid(placement.solidId).label} dihapus dari ${coordinateLabel(placement.origin)}.`)
    setSaveState('idle')
  }

  function addQuickExample() {
    if (placedSolids.length > 0) {
      setNotice('Contoh cepat paling pas dipakai di kanvas kosong. Hapus bangunan dulu kalau ingin melihat contoh baru.')
      return
    }
    const examples: ArchitectureSolidId[] = ['kubus', 'tabung', 'limas-segiempat', 'bola', 'kerucut']
    const next: ArchitecturePlacedSolid[] = []
    for (const solidId of examples) {
      const origin = findFirstAvailableCoordinate(grid, next)
      if (!origin) break
      next.push({ id: createPlacementId(), solidId, origin })
    }
    setPlacedSolids(next)
    setSelectedPlacementId(next[0]?.id ?? null)
    setSelectedSolidId(next[0]?.solidId ?? 'kubus')
    setCoordinate(next[0]?.origin ?? { x: 0, y: 0, z: 0 })
    setNotice('Contoh kota sudah siap. Ketuk bangunan untuk memindahkannya atau tambahkan bentukmu sendiri.')
    setSaveState('idle')
  }

  function clearAllSolids() {
    if (placedSolids.length === 0) {
      setNotice('Kanvas masih kosong. Pilih bentuk pertama untuk mulai membangun.')
      return
    }
    setPlacedSolids([])
    setSelectedPlacementId(null)
    setCoordinate({ x: 0, y: 0, z: 0 })
    setNotice('Semua bangunan sudah dihapus. Kanvas siap untuk ide barumu!')
    setSaveState('idle')
  }

  async function saveDesign() {
    if (placedSolids.length === 0) {
      setNotice('Letakkan setidaknya satu bentuk sebelum menyimpan karyamu.')
      return
    }
    setSaveState('saving')
    try {
      await onSave({ ...draft, savedAt: new Date().toISOString() })
      setSaveState('saved')
      setNotice('Karyamu sudah tersimpan di perangkat ini. Mio ikut senang melihatnya!')
    } catch {
      setSaveState('error')
      setNotice('Karyamu belum tersimpan. Coba sekali lagi, ya.')
    }
  }

  return (
    <section className="challenge-card" data-testid="architecture-unified-studio" aria-labelledby="architecture-studio-title" style={{ maxWidth: 1180 }}>
      <header style={{ alignItems: 'flex-start', display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ maxWidth: 650 }}>
          <p className="eyebrow">✦ RUANG KREASI KOORDINAT</p>
          <h2 id="architecture-studio-title" style={{ marginBottom: '.55rem' }}>{title}</h2>
          <p style={{ color: '#716775', lineHeight: 1.55, margin: 0 }}>Pilih bangun ruang, tentukan titik X–Y–Z, lalu letakkan pada kanvas. Setiap titik hanya bisa diisi satu bangun agar tidak bertumpang tindih.</p>
        </div>
        <div aria-label="Jumlah bangun yang dipakai" style={{ background: '#f1ecff', borderRadius: 14, color: '#5d4c93', fontSize: '.8rem', fontWeight: 900, padding: '.75rem .9rem', textAlign: 'right' }}>
          <span style={{ color: '#8674aa', display: 'block', fontSize: '.66rem', letterSpacing: '.05em' }}>BANGUN DI KOTA</span>
          <strong style={{ fontSize: '1.35rem' }}>{placedSolids.length}</strong> / {capacity}
        </div>
      </header>

      <section aria-label="Tiga langkah memakai studio" style={{ background: '#f3efff', border: '1px solid #e1d9f5', borderRadius: 16, display: 'grid', gap: '.6rem', gridTemplateColumns: 'repeat(auto-fit, minmax(185px, 1fr))', marginBottom: '1rem', padding: '.75rem' }}>
        {[
          ['1', 'Pilih bentuk', 'Pilih satu bangun ruang dari kartu.'],
          ['2', 'Atur X–Y–Z', 'Gunakan tombol + dan − untuk memilih titik.'],
          ['3', 'Letakkan', 'Satu titik hanya untuk satu bangun.'],
        ].map(([number, heading, detail]) => <div key={number} style={{ alignItems: 'center', display: 'flex', gap: '.55rem' }}><span style={{ alignItems: 'center', background: '#765fc3', borderRadius: 999, color: '#fff', display: 'inline-flex', fontSize: '.78rem', fontWeight: 900, height: 29, justifyContent: 'center', width: 29 }}>{number}</span><span><b style={{ color: '#56447e', display: 'block', fontSize: '.77rem' }}>{heading}</b><small style={{ color: '#786d8a', display: 'block', fontSize: '.67rem', lineHeight: 1.25, marginTop: '.1rem' }}>{detail}</small></span></div>)}
      </section>

      <div className="architecture-unified-grid" style={{ display: 'grid', gap: '1rem' }}>
        <div style={{ display: 'grid', gap: '1rem' }}>
          <section style={panelStyle} aria-labelledby="architecture-solid-picker-heading">
            <p className="mini-label">LANGKAH 1</p>
            <h3 id="architecture-solid-picker-heading" style={{ color: '#514557', fontSize: '1.15rem', margin: '.2rem 0 .45rem' }}>Pilih bangun ruang</h3>
            <p style={{ color: '#786d78', fontSize: '.73rem', lineHeight: 1.35, margin: '0 0 .7rem' }}>Kubus berada di tempat yang sama dengan semua bangun lain.</p>
            <div aria-label="Pilih bangun ruang" style={{ display: 'grid', gap: '.42rem', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
              {architectureSolids.map((solid) => {
                const active = solid.id === selectedSolidId && !selectedPlacementId
                return <button type="button" key={solid.id} aria-label={`Pilih ${solid.label}`} aria-pressed={active} onClick={() => chooseSolid(solid.id)} style={{ alignItems: 'center', background: active ? '#edf8f7' : '#fff', border: `2px solid ${active ? solid.color : '#dae7e5'}`, borderRadius: 12, color: '#47545c', cursor: 'pointer', display: 'flex', flexDirection: 'column', font: 'inherit', fontSize: '.68rem', fontWeight: 900, gap: '.16rem', justifyContent: 'center', lineHeight: 1.1, minHeight: 61, padding: '.35rem', textAlign: 'center' }}><span aria-hidden="true" style={{ fontSize: '.95rem' }}>{solid.emoji}</span><span>{solid.label}</span></button>
              })}
            </div>
            <div style={{ background: '#f9fcfc', borderRadius: 12, color: '#607477', fontSize: '.72rem', lineHeight: 1.35, marginTop: '.7rem', padding: '.6rem' }}><b style={{ color: selectedSolid.color, display: 'block', marginBottom: '.12rem' }}>{selectedSolid.emoji} {selectedSolid.label}</b>{selectedSolid.description}</div>
          </section>

          <section style={{ ...panelStyle, background: '#fff6e7', borderColor: '#f1dfb7' }} aria-labelledby="architecture-coordinate-heading">
            <p className="mini-label">LANGKAH 2</p>
            <h3 id="architecture-coordinate-heading" style={{ color: '#514557', fontSize: '1.15rem', margin: '.2rem 0 .35rem' }}>Pilih titik X–Y–Z</h3>
            <p style={{ color: '#786b76', fontSize: '.73rem', lineHeight: 1.35, margin: '0 0 .65rem' }}>X bergerak ke kanan, Y naik ke atas, dan Z bergerak ke belakang.</p>
            <div style={{ display: 'grid', gap: '.45rem', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
              <CoordinateControl axis="x" label="X" hint="kanan" value={coordinate.x} maximum={grid.width} onChange={(amount) => updateCoordinate('x', amount)} />
              <CoordinateControl axis="y" label="Y" hint="atas" value={coordinate.y} maximum={grid.height} onChange={(amount) => updateCoordinate('y', amount)} />
              <CoordinateControl axis="z" label="Z" hint="belakang" value={coordinate.z} maximum={grid.depth} onChange={(amount) => updateCoordinate('z', amount)} />
            </div>
            <p style={{ background: 'rgba(255,255,255,.78)', borderRadius: 11, color: '#5b4c66', fontSize: '.78rem', fontWeight: 900, margin: '.7rem 0 0', padding: '.55rem .6rem' }}>Titik pilihan: {coordinateLabel(coordinate)}</p>
            {!placementCheck.valid && placementCheck.issue.code === 'OCCUPIED' ? <p role="alert" style={{ background: '#fff0ed', borderRadius: 10, color: '#a34e45', fontSize: '.72rem', fontWeight: 800, lineHeight: 1.35, margin: '.55rem 0 0', padding: '.55rem .6rem' }}>⚠️ Titik ini sudah terpakai oleh {getArchitectureSolid(placementCheck.issue.conflict.solidId).label}. Pilih koordinat lain agar tidak bertumpang tindih.</p> : <p style={{ background: '#eaf8f1', borderRadius: 10, color: '#427962', fontSize: '.72rem', fontWeight: 800, lineHeight: 1.35, margin: '.55rem 0 0', padding: '.55rem .6rem' }}>✓ Titik ini kosong dan siap dipakai.</p>}
            <div style={{ display: 'grid', gap: '.45rem', gridTemplateColumns: selectedPlacement ? '1fr 1fr' : '1fr', marginTop: '.65rem' }}>
              <button type="button" onClick={placeOrMoveSolid} style={{ ...buttonStyle, background: placementCheck.valid ? '#765fc3' : '#ad746b', borderColor: placementCheck.valid ? '#765fc3' : '#ad746b', color: '#fff' }}>{selectedPlacement ? 'Pindahkan bangun' : 'Letakkan bangun'}</button>
              {selectedPlacement ? <button type="button" onClick={() => { setSelectedPlacementId(null); setNotice('Pilih bentuk baru untuk diletakkan di titik lain.') }} style={buttonStyle}>Bangun baru</button> : null}
            </div>
          </section>

          <section style={{ ...panelStyle, background: '#f3fbff', borderColor: '#d2e7ee' }} aria-label="Bantuan kanvas">
            <b style={{ color: '#426775', display: 'block', fontSize: '.8rem' }}>Butuh ide awal?</b>
            <p style={{ color: '#657982', fontSize: '.72rem', lineHeight: 1.35, margin: '.25rem 0 .6rem' }}>Contoh cepat meletakkan lima bentuk berbeda agar kamu bisa langsung mencoba memindahkannya.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.45rem' }}><button type="button" onClick={addQuickExample} style={{ ...buttonStyle, background: '#fff', borderColor: '#cbe2ea', color: '#3e7180' }}>Coba contoh cepat</button><button type="button" onClick={clearAllSolids} style={{ ...buttonStyle, color: '#ad564a' }}>Hapus semua bangun</button></div>
          </section>
        </div>

        <div style={{ display: 'grid', gap: '1rem', minWidth: 0 }}>
          <section aria-label="Kanvas arsitektur tiga dimensi" style={{ ...panelStyle, background: '#f6fcfb', borderColor: '#d6eee8', padding: '.75rem' }}>
            <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: '.55rem', justifyContent: 'space-between', margin: '.1rem .2rem .65rem' }}>
              <div><p className="mini-label" style={{ marginBottom: '.12rem' }}>KANVAS KOTA MEOW</p><strong style={{ color: '#4d4255', fontSize: '.95rem' }}>Sumbu X–Y–Z</strong></div>
              <div className="camera-controls" aria-label="Pilih arah kanvas" style={{ margin: 0 }}>{cameraViews.map((camera) => <button type="button" key={camera.id} className={view === camera.id ? 'is-active' : ''} onClick={() => setView(camera.id)}>{camera.label}</button>)}</div>
            </div>
            <div aria-label="Arti warna sumbu koordinat" style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem .65rem', margin: '0 .2rem .6rem' }}>
              {[['#e95e5d', 'X = kanan'], ['#50a96f', 'Y = atas'], ['#497fe3', 'Z = belakang']].map(([color, copy]) => <span key={copy} style={{ alignItems: 'center', color: '#5d706f', display: 'inline-flex', fontSize: '.68rem', fontWeight: 800, gap: '.26rem' }}><i aria-hidden="true" style={{ background: color, borderRadius: 999, height: 9, width: 9 }} />{copy}</span>)}
            </div>
            <CoordinateCanvas grid={grid} placements={placedSolids} selectedPlacementId={selectedPlacementId} selectedSolidId={selectedSolidId} coordinate={coordinate} placementAllowed={placementCheck.valid} view={view} onSelectPlacement={selectPlacedSolid} />
            <p style={{ color: '#617b79', fontSize: '.71rem', fontWeight: 800, lineHeight: 1.35, margin: '.65rem .25rem .1rem' }}>Bangun transparan adalah pratinjau titik pilihan. Hijau berarti bisa diletakkan, merah berarti titiknya sudah terpakai.</p>
          </section>

          <section style={panelStyle} aria-labelledby="architecture-list-heading">
            <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: '.6rem', justifyContent: 'space-between', marginBottom: '.65rem' }}><div><p className="mini-label">BANGUN DI KOTAMU</p><h3 id="architecture-list-heading" style={{ color: '#514557', fontSize: '1.1rem', margin: '.18rem 0 0' }}>{placedSolids.length === 0 ? 'Belum ada bangun' : `${placedSolids.length} bangun sudah diletakkan`}</h3></div>{selectedPlacement ? <button type="button" onClick={() => removePlacedSolid(selectedPlacement.id)} style={{ ...buttonStyle, color: '#ab584e' }}>Hapus yang dipilih</button> : null}</div>
            {placedSolids.length === 0 ? <p style={{ color: '#786d78', fontSize: '.78rem', lineHeight: 1.4, margin: 0 }}>Mulai dari satu bentuk di X 1, Y 1, Z 1. Setelah itu, coba naikkan Y atau ubah X dan Z.</p> : <div style={{ display: 'grid', gap: '.45rem', gridTemplateColumns: 'repeat(auto-fit, minmax(185px, 1fr))' }}>{placedSolids.map((placement) => {
              const solid = getArchitectureSolid(placement.solidId)
              const selected = placement.id === selectedPlacementId
              return <article key={placement.id} style={{ alignItems: 'center', background: selected ? '#f0ecff' : '#fff', border: `2px solid ${selected ? '#866ed2' : '#ece1d9'}`, borderRadius: 12, display: 'grid', gap: '.4rem', gridTemplateColumns: 'minmax(0, 1fr) auto', padding: '.52rem .56rem' }}><button type="button" aria-label={`Pilih ${solid.label} di ${coordinateLabel(placement.origin)}`} onClick={() => selectPlacedSolid(placement.id)} style={{ background: 'transparent', border: 0, color: '#514557', cursor: 'pointer', font: 'inherit', minWidth: 0, padding: 0, textAlign: 'left' }}><b style={{ display: 'block', fontSize: '.75rem' }}>{solid.emoji} {solid.label}</b><small style={{ color: '#7b707d', display: 'block', fontSize: '.65rem', fontWeight: 800, marginTop: '.12rem' }}>{coordinateLabel(placement.origin)}</small></button><button type="button" aria-label={`Hapus ${solid.label} di ${coordinateLabel(placement.origin)}`} onClick={() => removePlacedSolid(placement.id)} style={{ ...buttonStyle, color: '#ad584f', minHeight: 34, padding: '.15rem .42rem' }}>×</button></article>
            })}</div>}
          </section>

          <section style={panelStyle} aria-labelledby="studio-name-heading">
            <label htmlFor="architecture-title" id="studio-name-heading" className="mini-label">NAMA KARYA</label>
            <div style={{ alignItems: 'center', display: 'flex', gap: '.55rem', marginTop: '.3rem' }}><input id="architecture-title" value={designTitle} maxLength={32} onChange={(event) => { setDesignTitle(event.target.value); setSaveState('idle') }} aria-describedby="architecture-title-help" style={{ background: '#fffaf5', border: '2px solid #eadfd5', borderRadius: 11, color: '#463b4d', flex: 1, font: 'inherit', fontWeight: 800, minWidth: 0, padding: '.65rem .75rem' }} /><button type="button" onClick={() => void saveDesign()} disabled={saveState === 'saving' || placedSolids.length === 0} style={{ ...buttonStyle, background: '#ff925c', borderColor: '#ff925c', color: '#fff', whiteSpace: 'nowrap' }}>{saveState === 'saving' ? 'Menyimpan…' : saveState === 'saved' ? '✓ Tersimpan' : 'Simpan karya'}</button></div>
            <small id="architecture-title-help" style={{ color: '#817583', display: 'block', fontSize: '.68rem', lineHeight: 1.35, marginTop: '.45rem' }}>Karya tersimpan hanya di perangkat ini dan dapat dibuka lagi dari Galeri Lokal.</small>
          </section>
        </div>
      </div>

      <p role="status" aria-live="polite" style={{ background: saveState === 'error' ? '#fff0eb' : '#f7f1ff', borderRadius: 12, color: saveState === 'error' ? '#a44d42' : '#655489', fontSize: '.78rem', fontWeight: 800, lineHeight: 1.4, margin: '1rem 0 0', padding: '.7rem .85rem' }}><span aria-hidden="true">🐾 </span>{notice}</p>
    </section>
  )
}

export default ArchitectureStudio
