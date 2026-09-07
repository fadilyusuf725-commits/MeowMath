import { Canvas } from '@react-three/fiber'
import { Edges, OrbitControls } from '@react-three/drei'
import { useMemo } from 'react'
import type { Shape } from '../lib'

type CameraView = 'isometric' | 'front' | 'top' | 'right'
export type GeometryHighlight = 'faces' | 'edges' | 'vertices' | null

interface GeometryViewerProps {
  readonly shape: Shape
  readonly view?: CameraView
  readonly accent?: string
  readonly label: string
  readonly compact?: boolean
  readonly highlight?: GeometryHighlight
}

const cameraPositions: Record<CameraView, [number, number, number]> = {
  isometric: [6, 5, 7],
  front: [0, 1.5, 8],
  top: [0, 8, 0.01],
  right: [8, 1.5, 0],
}

function VoxelBlocks({
  shape,
  accent,
  highlight,
}: {
  readonly shape: Shape
  readonly accent: string
  readonly highlight: GeometryHighlight
}) {
  const { centered, vertices } = useMemo(() => {
    if (!shape.length) return { centered: [], vertices: [] as [number, number, number][] }
    const maxX = Math.max(...shape.map((cell) => cell.x))
    const maxY = Math.max(...shape.map((cell) => cell.y))
    const maxZ = Math.max(...shape.map((cell) => cell.z))
    const minX = Math.min(...shape.map((cell) => cell.x))
    const minY = Math.min(...shape.map((cell) => cell.y))
    const minZ = Math.min(...shape.map((cell) => cell.z))
    const centre: [number, number, number] = [(minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2]
    return {
      centered: shape.map((cell) => ({
        ...cell,
        position: [cell.x - centre[0], cell.y - centre[1], cell.z - centre[2]] as const,
      })),
      vertices: [
        [minX - .5 - centre[0], minY - .5 - centre[1], minZ - .5 - centre[2]],
        [maxX + .5 - centre[0], minY - .5 - centre[1], minZ - .5 - centre[2]],
        [minX - .5 - centre[0], maxY + .5 - centre[1], minZ - .5 - centre[2]],
        [maxX + .5 - centre[0], maxY + .5 - centre[1], minZ - .5 - centre[2]],
        [minX - .5 - centre[0], minY - .5 - centre[1], maxZ + .5 - centre[2]],
        [maxX + .5 - centre[0], minY - .5 - centre[1], maxZ + .5 - centre[2]],
        [minX - .5 - centre[0], maxY + .5 - centre[1], maxZ + .5 - centre[2]],
        [maxX + .5 - centre[0], maxY + .5 - centre[1], maxZ + .5 - centre[2]],
      ] as [number, number, number][],
    }
  }, [shape])

  return (
    <group>
      {centered.map((cell) => (
        <mesh key={`${cell.x}-${cell.y}-${cell.z}`} position={cell.position} castShadow receiveShadow>
          <boxGeometry args={[0.92, 0.92, 0.92]} />
          <meshStandardMaterial
            color={highlight === 'edges' ? '#fff4e7' : accent}
            emissive={highlight === 'faces' ? accent : '#000000'}
            emissiveIntensity={highlight === 'faces' ? .13 : 0}
            roughness={0.56}
            metalness={0.02}
          />
          <Edges color={highlight === 'edges' ? '#f05b48' : '#3d3550'} linewidth={highlight === 'edges' ? 2.8 : 1.4} />
        </mesh>
      ))}
      {highlight === 'vertices' && vertices.map((position, index) => (
        <mesh key={`vertex-${index}`} position={position}>
          <sphereGeometry args={[.125, 18, 18]} />
          <meshStandardMaterial color="#6952b9" emissive="#6952b9" emissiveIntensity={.32} />
        </mesh>
      ))}
    </group>
  )
}

export function GeometryViewer({
  shape,
  view = 'isometric',
  accent = '#ff9a5e',
  label,
  compact = false,
  highlight = null,
}: GeometryViewerProps) {
  return (
    <div className={`geometry-viewer ${compact ? 'geometry-viewer--compact' : ''}`}>
      <Canvas
        key={view}
        camera={{ position: cameraPositions[view], fov: 42 }}
        dpr={[1, 1.7]}
        shadows
        aria-label={label}
      >
        <color attach="background" args={['#effcf9']} />
        <ambientLight intensity={1.2} />
        <directionalLight position={[5, 7, 6]} intensity={1.4} castShadow />
        <directionalLight position={[-4, 2, -3]} intensity={0.35} color="#b490ff" />
        <VoxelBlocks shape={shape} accent={accent} highlight={highlight} />
        <gridHelper args={[8, 8, '#9ed9d2', '#d8f3ed']} position={[0, -1, 0]} />
        <OrbitControls
          enablePan={false}
          minDistance={4}
          maxDistance={14}
          target={[0, 0, 0]}
          enableDamping
        />
      </Canvas>
      <span className="sr-only">{label}</span>
      <div className="viewer-orbit-hint" aria-hidden="true">
        {highlight === 'faces' ? '▰ Bidang disorot' : highlight === 'edges' ? '╱ Rusuk disorot' : highlight === 'vertices' ? '● Titik sudut disorot' : '↔ Putar model'}
      </div>
    </div>
  )
}

export type { CameraView }
