import { Edges, OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useState, type CSSProperties } from 'react'
import type { SolidId } from '../content/learningResources'

/**
 * ID tambahan ini sengaja didukung supaya penjelajah tetap dapat dipakai saat
 * pustaka pengayaan bertambah. SolidId dari resource tetap menjadi API utama.
 */
export type ExplorerSolidId = SolidId | 'limas-segitiga' | 'prisma-segiempat'

type ViewId = 'isometric' | 'front' | 'top' | 'right'
type GeometryKind =
  | 'cube'
  | 'cuboid'
  | 'triangular-prism'
  | 'square-pyramid'
  | 'cylinder'
  | 'cone'
  | 'sphere'
  | 'triangular-pyramid'
  | 'square-prism'

interface SolidConfig {
  readonly label: string
  readonly shortHint: string
  readonly geometry: GeometryKind
  readonly color: string
  readonly showEdges: boolean
  readonly rotation?: readonly [number, number, number]
}

export interface SolidExplorer3DProps {
  /** Salah satu SolidId dari resource pembelajaran. */
  readonly solidId: ExplorerSolidId | (string & {})
  /** Mengganti judul yang terlihat, tanpa mengubah model yang dipilih. */
  readonly label?: string
  /** Versi pendek untuk kartu resource yang rapat. */
  readonly compact?: boolean
}

const solidConfigs: Readonly<Record<ExplorerSolidId, SolidConfig>> = {
  kubus: {
    label: 'Kubus',
    shortHint: 'Enam bidang perseginya sama besar.',
    geometry: 'cube',
    color: '#ff955d',
    showEdges: true,
  },
  balok: {
    label: 'Balok',
    shortHint: 'Bidang yang berhadapan memiliki ukuran yang sama.',
    geometry: 'cuboid',
    color: '#faad4d',
    showEdges: true,
  },
  'prisma-segitiga': {
    label: 'Prisma Segitiga',
    shortHint: 'Cari dua bidang segitiga yang sejajar.',
    geometry: 'triangular-prism',
    color: '#6ecfbe',
    showEdges: true,
    rotation: [0, Math.PI / 6, 0],
  },
  'limas-segiempat': {
    label: 'Limas Segiempat',
    shortHint: 'Empat bidang segitiga bertemu pada satu puncak.',
    geometry: 'square-pyramid',
    color: '#a982e5',
    showEdges: true,
    rotation: [0, Math.PI / 4, 0],
  },
  tabung: {
    label: 'Tabung',
    shortHint: 'Dua lingkaran sejajar dihubungkan sisi lengkung.',
    geometry: 'cylinder',
    color: '#5ea8ed',
    showEdges: false,
  },
  kerucut: {
    label: 'Kerucut',
    shortHint: 'Sisi lengkungnya mengerucut ke satu puncak.',
    geometry: 'cone',
    color: '#ee7a94',
    showEdges: false,
  },
  bola: {
    label: 'Bola',
    shortHint: 'Seluruh permukaannya melengkung dan tidak punya rusuk.',
    geometry: 'sphere',
    color: '#7bc86c',
    showEdges: false,
  },
  'limas-segitiga': {
    label: 'Limas Segitiga',
    shortHint: 'Tiga bidang segitiga bertemu pada satu puncak.',
    geometry: 'triangular-pyramid',
    color: '#b384db',
    showEdges: true,
    rotation: [0, Math.PI / 6, 0],
  },
  'prisma-segiempat': {
    label: 'Prisma Segiempat',
    shortHint: 'Dua bidang segiempat yang sama besar tampak sejajar.',
    geometry: 'square-prism',
    color: '#57b9ac',
    showEdges: true,
    rotation: [0, Math.PI / 4, 0],
  },
}

const cameraPositions: Readonly<Record<ViewId, readonly [number, number, number]>> = {
  isometric: [6.2, 5.1, 7.2],
  front: [0, 1, 8.6],
  top: [0, 8.6, 0.01],
  right: [8.6, 1, 0],
}

const viewButtons: readonly { readonly id: ViewId; readonly label: string }[] = [
  { id: 'isometric', label: 'Putar bebas' },
  { id: 'front', label: 'Depan' },
  { id: 'top', label: 'Atas' },
  { id: 'right', label: 'Samping' },
]

const fallbackConfig: SolidConfig = {
  label: 'Bangun ruang',
  shortHint: 'Model kubus dasar ditampilkan untuk bangun yang belum tersedia.',
  geometry: 'cube',
  color: '#ff955d',
  showEdges: true,
}

function resolveSolidConfig(solidId: string): { readonly config: SolidConfig; readonly isFallback: boolean } {
  const config = solidConfigs[solidId as ExplorerSolidId]
  return config ? { config, isFallback: false } : { config: fallbackConfig, isFallback: true }
}

function GeometryFor({ kind }: { readonly kind: GeometryKind }) {
  switch (kind) {
    case 'cube':
      return <boxGeometry args={[2.55, 2.55, 2.55]} />
    case 'cuboid':
      return <boxGeometry args={[3.85, 2.3, 1.95]} />
    case 'triangular-prism':
      return <cylinderGeometry args={[1.55, 1.55, 2.9, 3]} />
    case 'square-pyramid':
      return <coneGeometry args={[1.7, 3.05, 4]} />
    case 'cylinder':
      return <cylinderGeometry args={[1.48, 1.48, 3.05, 48]} />
    case 'cone':
      return <coneGeometry args={[1.58, 3.25, 48]} />
    case 'sphere':
      return <sphereGeometry args={[1.72, 36, 24]} />
    case 'triangular-pyramid':
      return <coneGeometry args={[1.7, 3.05, 3]} />
    case 'square-prism':
      return <cylinderGeometry args={[1.6, 1.6, 3, 4]} />
  }
}

function CurvedSurfaceGuides({ kind }: { readonly kind: GeometryKind }) {
  const guideMaterial = <meshBasicMaterial color="#fff8dc" transparent opacity={0.78} />

  if (kind === 'cylinder') {
    return (
      <group>
        <mesh position={[0, 1.53, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.48, 0.026, 10, 48]} />
          {guideMaterial}
        </mesh>
        <mesh position={[0, -1.53, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.48, 0.026, 10, 48]} />
          <meshBasicMaterial color="#fff8dc" transparent opacity={0.78} />
        </mesh>
      </group>
    )
  }

  if (kind === 'cone') {
    return (
      <mesh position={[0, -1.63, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.58, 0.026, 10, 48]} />
        {guideMaterial}
      </mesh>
    )
  }

  if (kind === 'sphere') {
    return (
      <group>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.725, 0.018, 10, 48]} />
          {guideMaterial}
        </mesh>
        <mesh>
          <torusGeometry args={[1.725, 0.018, 10, 48]} />
          <meshBasicMaterial color="#fff8dc" transparent opacity={0.52} />
        </mesh>
      </group>
    )
  }

  return null
}

function SolidModel({ config }: { readonly config: SolidConfig }) {
  const rotation = config.rotation ?? [0, 0, 0]

  return (
    <group rotation={rotation}>
      <mesh castShadow receiveShadow>
        <GeometryFor kind={config.geometry} />
        <meshStandardMaterial
          color={config.color}
          roughness={0.48}
          metalness={0.04}
          emissive={config.color}
          emissiveIntensity={0.08}
        />
        {config.showEdges ? <Edges color="#413b56" linewidth={1.55} /> : null}
      </mesh>
      <CurvedSurfaceGuides kind={config.geometry} />
    </group>
  )
}

const panelStyle: CSSProperties = {
  border: '2px solid #d6e8e3',
  borderRadius: 22,
  overflow: 'hidden',
  background: '#ffffff',
  boxShadow: '0 8px 20px rgba(50, 73, 76, .08)',
}

const buttonBaseStyle: CSSProperties = {
  minHeight: 44,
  borderRadius: 12,
  border: '1px solid #c9ddd7',
  padding: '8px 12px',
  font: 'inherit',
  fontWeight: 700,
  cursor: 'pointer',
}

/**
 * Model 3D mandiri untuk menu pembekalan. Komponen ini tidak mengandalkan CSS
 * halaman sehingga aman dipakai pada kartu materi ataupun layar penuh.
 */
export function SolidExplorer3D({ solidId, label, compact = false }: SolidExplorer3DProps) {
  const [view, setView] = useState<ViewId>('isometric')
  const [canvasVersion, setCanvasVersion] = useState(0)
  const { config, isFallback } = resolveSolidConfig(solidId)
  const displayLabel = label ?? config.label
  const height = compact ? 244 : 330

  const selectView = (nextView: ViewId) => {
    setView(nextView)
    // Remount Canvas agar sudut, putaran, dan zoom benar-benar kembali jelas.
    setCanvasVersion((version) => version + 1)
  }

  const resetView = () => {
    setView('isometric')
    setCanvasVersion((version) => version + 1)
  }

  return (
    <section
      data-testid={`solid-explorer-${solidId}`}
      aria-label={`Penjelajah 3D ${displayLabel}`}
      style={panelStyle}
    >
      <div style={{ padding: compact ? '14px 16px 10px' : '18px 20px 12px' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div>
            <p style={{ margin: 0, color: '#27756d', fontSize: 13, fontWeight: 800, letterSpacing: '.02em' }}>
              MODEL 3D INTERAKTIF
            </p>
            <h3 style={{ margin: '3px 0 0', color: '#2d2940', fontSize: compact ? 19 : 22 }}>{displayLabel}</h3>
          </div>
          <button
            type="button"
            onClick={resetView}
            style={{ ...buttonBaseStyle, background: '#fff7e8', color: '#6f4a16', borderColor: '#f0d49b' }}
            aria-label={`Atur ulang putaran dan ukuran model ${displayLabel}`}
          >
            ↺ Atur ulang
          </button>
        </div>
        <p id={`solid-explorer-${solidId}-hint`} style={{ margin: '8px 0 0', color: '#545166', lineHeight: 1.45 }}>
          {config.shortHint}
        </p>
        {isFallback ? (
          <p style={{ margin: '7px 0 0', color: '#8b4c16', fontSize: 13, lineHeight: 1.4 }}>
            Nama bangun ini belum memiliki model khusus, jadi Mio menampilkan model dasar terlebih dahulu.
          </p>
        ) : null}
      </div>

      <div
        style={{ height, background: 'linear-gradient(145deg, #eafdF7 0%, #eaf5ff 100%)', cursor: 'grab' }}
        aria-describedby={`solid-explorer-${solidId}-hint`}
      >
        <Canvas
          key={`${solidId}-${view}-${canvasVersion}`}
          camera={{ position: cameraPositions[view], fov: 42 }}
          dpr={[1, 1.7]}
          shadows
          aria-label={`Model tiga dimensi ${displayLabel}. Seret area model untuk memutarnya.`}
        >
          <color attach="background" args={['#eafdF7']} />
          <ambientLight intensity={1.25} />
          <directionalLight position={[5.5, 7, 5.5]} intensity={1.35} castShadow />
          <directionalLight position={[-4, 2.5, -3.5]} intensity={0.42} color="#b999ef" />
          <SolidModel config={config} />
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.82, 0]} receiveShadow>
            <planeGeometry args={[13, 13]} />
            <meshStandardMaterial color="#d7f0e9" roughness={0.95} />
          </mesh>
          <gridHelper args={[10, 10, '#aedbd2', '#d7eee9']} position={[0, -1.8, 0]} />
          <OrbitControls
            enablePan={false}
            minDistance={4.3}
            maxDistance={12}
            target={[0, 0, 0]}
            enableDamping
            dampingFactor={0.08}
            rotateSpeed={0.7}
          />
        </Canvas>
      </div>

      <div style={{ padding: compact ? '12px 14px 14px' : '14px 20px 18px' }}>
        <p style={{ margin: '0 0 10px', color: '#4a4759', fontSize: 14, lineHeight: 1.45 }}>
          Seret model untuk memutar. Gunakan roda mouse atau cubit layar untuk memperbesar dan memperkecil.
        </p>
        <div aria-label="Pilih arah tampilan model" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {viewButtons.map((item) => {
            const active = item.id === view
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => selectView(item.id)}
                aria-pressed={active}
                aria-label={`Tampilkan ${displayLabel} dari arah ${item.label.toLowerCase()}`}
                style={{
                  ...buttonBaseStyle,
                  background: active ? '#267c72' : '#f6fbfa',
                  color: active ? '#ffffff' : '#2f5e59',
                  borderColor: active ? '#267c72' : '#c9ddd7',
                }}
              >
                {item.label}
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default SolidExplorer3D
