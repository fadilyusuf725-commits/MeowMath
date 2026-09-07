import { Edges, OrbitControls } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import {
  BufferGeometry,
  DoubleSide,
  Float32BufferAttribute,
  MathUtils,
  Matrix4,
  Shape,
  ShapeGeometry,
  Vector3,
  type Group,
  type Mesh,
} from 'three'
import type { NetShape } from './NetExplorer'

type FoldableShape = Exclude<NetShape, 'sphere'>
type Vec3 = readonly [number, number, number]
type ViewId = 'isometric' | 'front' | 'top'

type FaceParent = {
  readonly id: string
  /** Dua titik pada rusuk bersama; menjadi poros lipatan. */
  readonly edge: readonly [string, string]
}

type FaceInput = {
  readonly id: string
  readonly vertices: readonly string[]
  readonly color: string
  readonly parent?: FaceParent
  /** Rentang progres ketika bidang ini bergerak dari jaring ke bentuk jadi. */
  readonly foldStart: number
  readonly foldEnd: number
}

type PolyhedronInput = {
  readonly vertices: Readonly<Record<string, Vector3>>
  readonly faces: readonly FaceInput[]
}

type PreparedFace = FaceInput & {
  readonly normal: Vector3
  readonly finalMatrix: Matrix4
  readonly geometry: ShapeGeometry
  /** Garis tepi dibuat terpisah agar diagonal triangulasi tidak ikut terlihat. */
  readonly outline: BufferGeometry
  readonly hinge?: {
    readonly axis: Vector3
    readonly pivot: Vector3
    /** Sudut dari posisi bangun jadi menuju jaring datar. */
    readonly unfoldAngle: number
  }
  readonly chain: readonly string[]
}

type PreparedPolyhedron = {
  readonly faces: readonly PreparedFace[]
  readonly byId: ReadonlyMap<string, PreparedFace>
}

export interface NetFold3DProps {
  /** Bangun yang sedang dipelajari pada lab jaring-jaring. */
  readonly shape: FoldableShape
  /** Nomor tahap lipatan saat ini, dimulai dari 0. */
  readonly step: number
  /** Banyak tahap pada bangun yang sedang dipelajari. */
  readonly totalSteps: number
  /** Bidang yang sedang dibahas pada langkah ini, untuk sorotan visual. */
  readonly activePieces?: readonly string[]
}

const PANEL_COLOURS = ['#ffd776', '#ffad82', '#b9ebdc', '#cbbcf7', '#9edcf2', '#f7b8ce']
const EDGE_COLOUR = '#4e4356'

const viewPositions: Readonly<Record<ViewId, Vec3>> = {
  // Jaring yang terbuka lebih lebar daripada bangun jadinya. Posisi ini
  // sengaja sedikit menjauh agar seluruh bidang tetap terlihat pada layar HP.
  isometric: [8.6, 6.6, 8.7],
  front: [0, 2.5, 10.5],
  top: [0, 10.5, 0.01],
}

const viewButtons: readonly { readonly id: ViewId; readonly label: string }[] = [
  { id: 'isometric', label: 'Putar bebas' },
  { id: 'front', label: 'Depan' },
  { id: 'top', label: 'Atas' },
]

const shapeLabels: Readonly<Record<FoldableShape, string>> = {
  cube: 'kubus',
  'rectangular-prism': 'balok',
  'triangular-prism': 'prisma segitiga',
  'square-prism': 'prisma segiempat',
  'square-pyramid': 'limas segiempat',
  'triangular-pyramid': 'limas segitiga',
  cylinder: 'tabung',
  cone: 'kerucut',
}

function point(x: number, y: number, z: number) {
  return new Vector3(x, y, z)
}

function smoothFold(progress: number, start: number, end: number) {
  if (end <= start) return progress >= end ? 1 : 0
  return MathUtils.smoothstep(progress, start, end)
}

function signedAngleAroundAxis(from: Vector3, to: Vector3, axis: Vector3) {
  const cross = new Vector3().crossVectors(from, to)
  return Math.atan2(axis.dot(cross), MathUtils.clamp(from.dot(to), -1, 1))
}

function createFaceGeometry(vertices: readonly Vector3[], centre: Vector3, u: Vector3, v: Vector3) {
  const shape = new Shape()
  const local = vertices.map((vertex) => new Vector3().subVectors(vertex, centre))
  const first = local[0]
  shape.moveTo(first.dot(u), first.dot(v))
  for (const vertex of local.slice(1)) shape.lineTo(vertex.dot(u), vertex.dot(v))
  shape.closePath()
  const outline = new BufferGeometry().setFromPoints(local.map((vertex) => new Vector3(vertex.dot(u), vertex.dot(v), 0)))
  return { geometry: new ShapeGeometry(shape), outline }
}

function preparePolyhedron(input: PolyhedronInput): PreparedPolyhedron {
  const initialFaces = input.faces.map((face) => {
    const vertices = face.vertices.map((id) => input.vertices[id])
    const centre = vertices.reduce((sum, vertex) => sum.add(vertex), new Vector3()).multiplyScalar(1 / vertices.length)
    const u = new Vector3().subVectors(vertices[1], vertices[0]).normalize()
    const normal = new Vector3()
      .crossVectors(
        new Vector3().subVectors(vertices[1], vertices[0]),
        new Vector3().subVectors(vertices[2], vertices[0]),
      )
      .normalize()
    const v = new Vector3().crossVectors(normal, u).normalize()
    const finalMatrix = new Matrix4().makeBasis(u, v, normal).setPosition(centre)
    const faceGeometry = createFaceGeometry(vertices, centre, u, v)
    return {
      ...face,
      normal,
      finalMatrix,
      geometry: faceGeometry.geometry,
      outline: faceGeometry.outline,
    }
  })

  const byId = new Map(initialFaces.map((face) => [face.id, face]))
  const faces = initialFaces.map((face) => {
    if (!face.parent) return { ...face, chain: [] } satisfies PreparedFace
    const parent = byId.get(face.parent.id)
    const [startId, endId] = face.parent.edge
    if (!parent || !input.vertices[startId] || !input.vertices[endId]) {
      throw new Error(`Engsel ${face.id} tidak ditemukan.`)
    }
    const pivot = input.vertices[startId].clone()
    const axis = new Vector3().subVectors(input.vertices[endId], pivot).normalize()
    const unfoldAngle = signedAngleAroundAxis(face.normal, parent.normal, axis)
    return {
      ...face,
      hinge: { axis, pivot, unfoldAngle },
      chain: [],
    } satisfies PreparedFace
  })

  const preparedById = new Map(faces.map((face) => [face.id, face]))
  const withChains = faces.map((face) => {
    const chain: string[] = []
    let current: PreparedFace | undefined = face
    while (current?.parent) {
      chain.unshift(current.id)
      current = preparedById.get(current.parent.id)
    }
    return { ...face, chain } satisfies PreparedFace
  })

  return { faces: withChains, byId: new Map(withChains.map((face) => [face.id, face])) }
}

type BoxFaceIds = {
  readonly root: string
  readonly front: string
  readonly right: string
  readonly back: string
  readonly left: string
  readonly top: string
}

function boxDefinition(width: number, height: number, depth: number, ids: BoxFaceIds): PolyhedronInput {
  const x = width / 2
  const y = height / 2
  const z = depth / 2
  const vertices = {
    a: point(-x, -y, -z), b: point(x, -y, -z), c: point(x, -y, z), d: point(-x, -y, z),
    e: point(-x, y, -z), f: point(x, y, -z), g: point(x, y, z), h: point(-x, y, z),
  }

  return {
    vertices,
    faces: [
      { id: ids.root, vertices: ['a', 'b', 'c', 'd'], color: PANEL_COLOURS[0], foldStart: 0, foldEnd: 0 },
      { id: ids.front, vertices: ['a', 'e', 'f', 'b'], color: PANEL_COLOURS[1], parent: { id: ids.root, edge: ['a', 'b'] }, foldStart: 0, foldEnd: .5 },
      { id: ids.right, vertices: ['b', 'f', 'g', 'c'], color: PANEL_COLOURS[2], parent: { id: ids.root, edge: ['b', 'c'] }, foldStart: 0, foldEnd: .5 },
      { id: ids.back, vertices: ['c', 'g', 'h', 'd'], color: PANEL_COLOURS[3], parent: { id: ids.root, edge: ['c', 'd'] }, foldStart: 0, foldEnd: .5 },
      { id: ids.left, vertices: ['d', 'h', 'e', 'a'], color: PANEL_COLOURS[4], parent: { id: ids.root, edge: ['d', 'a'] }, foldStart: 0, foldEnd: .5 },
      { id: ids.top, vertices: ['e', 'h', 'g', 'f'], color: PANEL_COLOURS[5], parent: { id: ids.back, edge: ['g', 'h'] }, foldStart: .5, foldEnd: 1 },
    ],
  }
}

function triangularPrismDefinition(): PolyhedronInput {
  const side = 2.7
  const triangleHeight = side * Math.sqrt(3) / 2
  const length = 2.65
  const x = length / 2
  const vertices = {
    p0: point(-x, -triangleHeight / 3, -side / 2),
    p1: point(-x, -triangleHeight / 3, side / 2),
    p2: point(-x, triangleHeight * 2 / 3, 0),
    q0: point(x, -triangleHeight / 3, -side / 2),
    q1: point(x, -triangleHeight / 3, side / 2),
    q2: point(x, triangleHeight * 2 / 3, 0),
  }
  return {
    vertices,
    faces: [
      { id: 'wall-1', vertices: ['p0', 'q0', 'q1', 'p1'], color: PANEL_COLOURS[0], foldStart: 0, foldEnd: 0 },
      { id: 'wall-2', vertices: ['p1', 'q1', 'q2', 'p2'], color: PANEL_COLOURS[1], parent: { id: 'wall-1', edge: ['p1', 'q1'] }, foldStart: 0, foldEnd: .5 },
      { id: 'wall-3', vertices: ['p2', 'q2', 'q0', 'p0'], color: PANEL_COLOURS[2], parent: { id: 'wall-1', edge: ['q0', 'p0'] }, foldStart: 0, foldEnd: .5 },
      { id: 'base', vertices: ['p0', 'p1', 'p2'], color: PANEL_COLOURS[3], parent: { id: 'wall-1', edge: ['p0', 'p1'] }, foldStart: .3, foldEnd: .7 },
      { id: 'top', vertices: ['q0', 'q2', 'q1'], color: PANEL_COLOURS[4], parent: { id: 'wall-2', edge: ['q1', 'q2'] }, foldStart: .7, foldEnd: 1 },
    ],
  }
}

function squarePyramidDefinition(): PolyhedronInput {
  const side = 3.1
  const height = 2.9
  const s = side / 2
  const vertices = {
    a: point(-s, -height / 2, -s), b: point(s, -height / 2, -s), c: point(s, -height / 2, s), d: point(-s, -height / 2, s),
    p: point(0, height / 2, 0),
  }
  return {
    vertices,
    faces: [
      { id: 'base', vertices: ['a', 'b', 'c', 'd'], color: PANEL_COLOURS[0], foldStart: 0, foldEnd: 0 },
      { id: 'north', vertices: ['a', 'p', 'b'], color: PANEL_COLOURS[1], parent: { id: 'base', edge: ['a', 'b'] }, foldStart: 0, foldEnd: 1 },
      { id: 'east', vertices: ['b', 'p', 'c'], color: PANEL_COLOURS[2], parent: { id: 'base', edge: ['b', 'c'] }, foldStart: 0, foldEnd: 1 },
      { id: 'south', vertices: ['c', 'p', 'd'], color: PANEL_COLOURS[3], parent: { id: 'base', edge: ['c', 'd'] }, foldStart: 0, foldEnd: 1 },
      { id: 'west', vertices: ['d', 'p', 'a'], color: PANEL_COLOURS[4], parent: { id: 'base', edge: ['d', 'a'] }, foldStart: 0, foldEnd: 1 },
    ],
  }
}

function triangularPyramidDefinition(): PolyhedronInput {
  const side = 3
  const height = Math.sqrt(2 / 3) * side
  const triangleHeight = Math.sqrt(3) * side / 2
  const vertices = {
    a: point(-side / 2, -height / 4, -triangleHeight / 3),
    b: point(side / 2, -height / 4, -triangleHeight / 3),
    c: point(0, -height / 4, triangleHeight * 2 / 3),
    p: point(0, height * 3 / 4, 0),
  }
  return {
    vertices,
    faces: [
      { id: 'base', vertices: ['a', 'b', 'c'], color: PANEL_COLOURS[0], foldStart: 0, foldEnd: 0 },
      { id: 'side-1', vertices: ['a', 'p', 'b'], color: PANEL_COLOURS[1], parent: { id: 'base', edge: ['a', 'b'] }, foldStart: 0, foldEnd: 1 },
      { id: 'side-2', vertices: ['b', 'p', 'c'], color: PANEL_COLOURS[2], parent: { id: 'base', edge: ['b', 'c'] }, foldStart: 0, foldEnd: 1 },
      { id: 'side-3', vertices: ['c', 'p', 'a'], color: PANEL_COLOURS[3], parent: { id: 'base', edge: ['c', 'a'] }, foldStart: 0, foldEnd: 1 },
    ],
  }
}

function polyhedronFor(shape: Exclude<FoldableShape, 'cylinder' | 'cone'>): PolyhedronInput {
  switch (shape) {
    case 'cube': return boxDefinition(2.55, 2.55, 2.55, { root: 'front', front: 'top', right: 'right', back: 'bottom', left: 'left', top: 'back' })
    case 'rectangular-prism': return boxDefinition(3.45, 2.2, 1.9, { root: 'base', front: 'front', right: 'right', back: 'back', left: 'left', top: 'top' })
    case 'square-prism': return boxDefinition(2.6, 3, 2.6, { root: 'base', front: 'wall-1', right: 'wall-2', back: 'wall-3', left: 'wall-4', top: 'top' })
    case 'triangular-prism': return triangularPrismDefinition()
    case 'square-pyramid': return squarePyramidDefinition()
    case 'triangular-pyramid': return triangularPyramidDefinition()
  }
}

function setHingeMatrix(target: Matrix4, axis: Vector3, pivot: Vector3, angle: number) {
  target.makeRotationAxis(axis, angle)
  const rotatedPivot = pivot.clone().applyMatrix4(target)
  target.setPosition(pivot.x - rotatedPivot.x, pivot.y - rotatedPivot.y, pivot.z - rotatedPivot.z)
}

function PolyhedronFold({ shape, progress, activePieces }: {
  readonly shape: Exclude<FoldableShape, 'cylinder' | 'cone'>
  readonly progress: number
  readonly activePieces: readonly string[]
}) {
  const model = useMemo(() => preparePolyhedron(polyhedronFor(shape)), [shape])
  const meshes = useRef(new Map<string, Mesh>())
  const current = useRef(progress)
  const runtime = useMemo(() => ({
    finalMatrices: new Map(model.faces.map((face) => [face.id, new Matrix4()])),
    hingeMatrices: new Map(model.faces.map((face) => [face.id, new Matrix4()])),
  }), [model])
  const activeSet = useMemo(() => new Set(activePieces), [activePieces])

  useEffect(() => () => {
    model.faces.forEach((face) => {
      face.geometry.dispose()
      face.outline.dispose()
    })
  }, [model])

  useFrame((_, delta) => {
    current.current = MathUtils.damp(current.current, progress, 6.1, delta)
    for (const face of model.faces) {
      const matrix = runtime.finalMatrices.get(face.id)!
      matrix.identity()
      for (const hingeId of face.chain) {
        const hingedFace = model.byId.get(hingeId)!
        const hinge = hingedFace.hinge!
        const unfolded = 1 - smoothFold(current.current, hingedFace.foldStart, hingedFace.foldEnd)
        const hingeMatrix = runtime.hingeMatrices.get(hingeId)!
        setHingeMatrix(hingeMatrix, hinge.axis, hinge.pivot, hinge.unfoldAngle * unfolded)
        matrix.multiply(hingeMatrix)
      }
      matrix.multiply(face.finalMatrix)
      const mesh = meshes.current.get(face.id)
      if (mesh) {
        mesh.matrix.copy(matrix)
        mesh.matrixWorldNeedsUpdate = true
      }
    }
  })

  return <group>
    {model.faces.map((face) => {
      const active = activeSet.has(face.id)
      return <mesh
        key={face.id}
        ref={(node) => {
          if (node) meshes.current.set(face.id, node)
          else meshes.current.delete(face.id)
        }}
        geometry={face.geometry}
        matrixAutoUpdate={false}
      >
        <meshStandardMaterial color={face.color} side={DoubleSide} roughness={.54} metalness={.02} emissive={active ? '#fff1b8' : '#000000'} emissiveIntensity={active ? .18 : 0} />
        <lineLoop geometry={face.outline}>
          <lineBasicMaterial color={EDGE_COLOUR} transparent opacity={.92} />
        </lineLoop>
      </mesh>
    })}
  </group>
}

function createGridGeometry(columns: number, rows: number) {
  const geometry = new BufferGeometry()
  const positions = new Float32Array((columns + 1) * (rows + 1) * 3)
  const indices: number[] = []
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const a = row * (columns + 1) + column
      const b = a + 1
      const c = a + columns + 1
      const d = c + 1
      indices.push(a, c, b, b, c, d)
    }
  }
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  return geometry
}

function useAnimatedProgress(target: number, speed = 6.1) {
  const current = useRef(target)
  useFrame((_, delta) => {
    current.current = MathUtils.damp(current.current, target, speed, delta)
  })
  return current
}

type CapSpec = {
  readonly id: string
  readonly radius: number
  readonly color: string
  readonly flatPosition: Vec3
  readonly finalPosition: Vec3
  readonly flatRotation?: Vec3
  readonly finalRotation?: Vec3
  readonly foldStart: number
  readonly foldEnd: number
}

function MovingCap({ spec, progress, active }: { readonly spec: CapSpec; readonly progress: number; readonly active: boolean }) {
  const mesh = useRef<Mesh>(null)
  const current = useAnimatedProgress(progress)
  useFrame(() => {
    const amount = smoothFold(current.current, spec.foldStart, spec.foldEnd)
    const node = mesh.current
    if (!node) return
    const flatRotation = spec.flatRotation ?? [0, 0, 0]
    const finalRotation = spec.finalRotation ?? [Math.PI / 2, 0, 0]
    node.position.set(
      MathUtils.lerp(spec.flatPosition[0], spec.finalPosition[0], amount),
      MathUtils.lerp(spec.flatPosition[1], spec.finalPosition[1], amount),
      MathUtils.lerp(spec.flatPosition[2], spec.finalPosition[2], amount),
    )
    node.rotation.set(
      MathUtils.lerp(flatRotation[0], finalRotation[0], amount),
      MathUtils.lerp(flatRotation[1], finalRotation[1], amount),
      MathUtils.lerp(flatRotation[2], finalRotation[2], amount),
    )
  })
  return <mesh ref={mesh} castShadow receiveShadow>
    <circleGeometry args={[spec.radius, 42]} />
    <meshStandardMaterial color={spec.color} side={DoubleSide} roughness={.52} metalness={.02} emissive={active ? '#fff1b8' : '#000000'} emissiveIntensity={active ? .18 : 0} />
    <Edges color={EDGE_COLOUR} linewidth={1.25} />
  </mesh>
}

function CylinderSurface({ progress, active }: { readonly progress: number; readonly active: boolean }) {
  const around = 28
  const heightSegments = 6
  const radius = 1.08
  const height = 2.55
  const geometry = useMemo(() => createGridGeometry(around, heightSegments), [])
  const current = useAnimatedProgress(progress)

  useEffect(() => () => geometry.dispose(), [geometry])

  useFrame(() => {
    const positions = geometry.getAttribute('position') as Float32BufferAttribute
    // Saat t mendekati 0, r/t × sin(sudut × t) mendekati garis lurus.
    // Gunakan epsilon kecil agar persegi panjang jaring tidak runtuh menjadi
    // satu garis pada frame pertama.
    const amount = Math.max(current.current, .001)
    const bendRadius = radius / amount
    let index = 0
    for (let row = 0; row <= heightSegments; row += 1) {
      const y = (row / heightSegments - .5) * height
      for (let column = 0; column <= around; column += 1) {
        const arc = (column / around * Math.PI * 2) - Math.PI
        const bentArc = arc * amount
        positions.array[index] = bendRadius * Math.sin(bentArc)
        positions.array[index + 1] = y
        positions.array[index + 2] = bendRadius * (1 - Math.cos(bentArc)) - radius * amount
        index += 3
      }
    }
    positions.needsUpdate = true
    geometry.computeVertexNormals()
  })

  return <group>
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial color={PANEL_COLOURS[1]} side={DoubleSide} roughness={.48} metalness={.02} emissive={active ? '#fff1b8' : '#000000'} emissiveIntensity={active ? .16 : 0} />
    </mesh>
    <mesh geometry={geometry}>
      <meshBasicMaterial color="#5c5264" transparent opacity={.13} wireframe side={DoubleSide} depthWrite={false} />
    </mesh>
  </group>
}

function CylinderFold({ progress, activePieces }: { readonly progress: number; readonly activePieces: readonly string[] }) {
  const activeSet = useMemo(() => new Set(activePieces), [activePieces])
  const radius = 1.08
  const height = 2.55
  const flatWidth = Math.PI * 2 * radius
  return <group>
    <CylinderSurface progress={progress} active={activeSet.has('wall')} />
    <MovingCap spec={{ id: 'base', radius, color: PANEL_COLOURS[2], flatPosition: [-(flatWidth / 2 + radius + .28), 0, 0], finalPosition: [0, -height / 2, 0], foldStart: .3, foldEnd: .7 }} progress={progress} active={activeSet.has('base')} />
    <MovingCap spec={{ id: 'top', radius, color: PANEL_COLOURS[4], flatPosition: [flatWidth / 2 + radius + .28, 0, 0], finalPosition: [0, height / 2, 0], foldStart: .7, foldEnd: 1 }} progress={progress} active={activeSet.has('top')} />
  </group>
}

function ConeSurface({ progress, active }: { readonly progress: number; readonly active: boolean }) {
  const angleSegments = 28
  const radialSegments = 8
  const radius = 1.17
  const height = 3.25
  const slant = Math.hypot(radius, height)
  const sectorAngle = Math.PI * 2 * radius / slant
  const geometry = useMemo(() => createGridGeometry(angleSegments, radialSegments), [])
  const current = useAnimatedProgress(progress)

  useEffect(() => () => geometry.dispose(), [geometry])

  useFrame(() => {
    const positions = geometry.getAttribute('position') as Float32BufferAttribute
    const amount = current.current
    // Kerucut dapat dikembangkan menjadi juring. Pada setiap progres, juring
    // tetap menjadi satu selubung kerucut (bukan titik-titik yang tercampur),
    // sehingga tidak muncul bentuk seperti bidang yang terpuntir.
    const semiAngle = MathUtils.lerp(Math.PI / 2, Math.asin(radius / slant), amount)
    const wrapAngle = MathUtils.lerp(sectorAngle, Math.PI * 2, amount)
    let index = 0
    for (let row = 0; row <= radialSegments; row += 1) {
      const fraction = row / radialSegments
      const distance = fraction * slant
      for (let column = 0; column <= angleSegments; column += 1) {
        const sector = -sectorAngle / 2 + column / angleSegments * sectorAngle
        const angle = sector / sectorAngle * wrapAngle
        const radialDistance = distance * Math.sin(semiAngle)
        positions.array[index] = radialDistance * Math.sin(angle)
        positions.array[index + 1] = height / 2 - distance * Math.cos(semiAngle)
        positions.array[index + 2] = -radialDistance * Math.cos(angle)
        index += 3
      }
    }
    positions.needsUpdate = true
    geometry.computeVertexNormals()
  })

  return <group>
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial color="#ee7a94" side={DoubleSide} roughness={.48} metalness={.02} emissive={active ? '#fff1b8' : '#000000'} emissiveIntensity={active ? .16 : 0} />
    </mesh>
    <mesh geometry={geometry}>
      <meshBasicMaterial color="#684857" transparent opacity={.13} wireframe side={DoubleSide} depthWrite={false} />
    </mesh>
  </group>
}

function ConeFold({ progress, activePieces }: { readonly progress: number; readonly activePieces: readonly string[] }) {
  const activeSet = useMemo(() => new Set(activePieces), [activePieces])
  const group = useRef<Group>(null)
  const current = useAnimatedProgress(progress)
  const radius = 1.17
  const height = 3.25
  const slant = Math.hypot(radius, height)
  const flatCapX = slant * Math.sin(Math.PI * radius / slant) + radius + .35
  useFrame(() => {
    // Juring awal diletakkan dekat lantai. Ketika digulung, seluruh model
    // bergerak naik ke posisi akhir kerucut tanpa mengubah bentuk permukaannya.
    if (group.current) group.current.position.y = -height * (1 - current.current)
  })
  return <group ref={group}>
    <ConeSurface progress={progress} active={activeSet.has('wall')} />
    <MovingCap spec={{ id: 'base', radius, color: PANEL_COLOURS[2], flatPosition: [flatCapX, height / 2, 0], finalPosition: [0, -height / 2, 0], flatRotation: [Math.PI / 2, 0, 0], finalRotation: [Math.PI / 2, 0, 0], foldStart: .55, foldEnd: 1 }} progress={progress} active={activeSet.has('base')} />
  </group>
}

function FoldViewportScale({ target, children }: { readonly target: number; readonly children: ReactNode }) {
  const group = useRef<Group>(null)
  // Jaring yang terbuka umumnya lebih lebar daripada bangun jadinya. Perkecil
  // hanya saat terbuka agar keenam bidang tidak terpotong pada kanvas kecil.
  const desiredScale = target === 0 ? .8 : 1
  const current = useRef(desiredScale)
  useFrame((_, delta) => {
    current.current = MathUtils.damp(current.current, desiredScale, 7, delta)
    group.current?.scale.setScalar(current.current)
  })
  return <group ref={group} scale={desiredScale}>{children}</group>
}

function FoldingScene({ shape, target, activePieces }: { readonly shape: FoldableShape; readonly target: number; readonly activePieces: readonly string[] }) {
  const foldedModel = shape === 'cylinder'
    ? <CylinderFold progress={target} activePieces={activePieces} />
    : shape === 'cone'
      ? <ConeFold progress={target} activePieces={activePieces} />
      : <PolyhedronFold shape={shape} progress={target} activePieces={activePieces} />
  return <FoldViewportScale target={target}>{foldedModel}</FoldViewportScale>
}

const panelStyle: CSSProperties = {
  background: '#fff',
  border: '1px solid #d5e8e0',
  borderRadius: 13,
  overflow: 'hidden',
}

const buttonStyle: CSSProperties = {
  border: '1px solid #c9ddd7',
  borderRadius: 9,
  cursor: 'pointer',
  font: 'inherit',
  fontSize: 12,
  fontWeight: 800,
  minHeight: 44,
  padding: '8px 10px',
}

/**
 * Model jaring-jaring 3D prosedural. Bidang bangun datar diputar pada rusuk
 * yang sama, sehingga bidang yang bertetangga selalu tetap menyatu saat dilipat.
 */
export function NetFold3D({ shape, step, totalSteps, activePieces = [] }: NetFold3DProps) {
  const [view, setView] = useState<ViewId>('isometric')
  const [canvasKey, setCanvasKey] = useState(0)
  const totalTransitions = Math.max(1, totalSteps - 1)
  const target = MathUtils.clamp(step / totalTransitions, 0, 1)
  const percentage = Math.round(target * 100)
  const hint = target === 0
    ? 'Jaring masih terbuka dan rata.'
    : target < 1
      ? 'Bidang bergerak sambil tetap bertemu pada rusuk lipatnya.'
      : `Bangun ${shapeLabels[shape]} sudah tertutup rapi.`

  function selectView(nextView: ViewId) {
    setView(nextView)
    setCanvasKey((current) => current + 1)
  }

  function resetView() {
    setView('isometric')
    setCanvasKey((current) => current + 1)
  }

  return (
    <section data-testid={`net-fold-3d-${shape}`} aria-label={`Model 3D lipatan ${shapeLabels[shape]}`} style={panelStyle}>
      <div style={{ alignItems: 'center', display: 'flex', gap: 8, justifyContent: 'space-between', padding: '9px 10px 7px' }}>
        <div>
          <p style={{ color: '#39776d', fontSize: 10, fontWeight: 900, letterSpacing: '.055em', margin: 0 }}>MODEL LIPAT 3D</p>
          <p style={{ color: '#4a4759', fontSize: 12, fontWeight: 800, margin: '2px 0 0' }}>Lipatan {percentage}%</p>
        </div>
        <button type="button" onClick={resetView} style={{ ...buttonStyle, background: '#fff7e8', borderColor: '#efd9aa', color: '#70511c' }} aria-label="Atur ulang arah model lipatan">↺ Reset</button>
      </div>
      <div style={{ background: 'linear-gradient(145deg, #e9fbf5, #edf6ff)', cursor: 'grab', height: 220 }}>
        <Canvas
          key={`${shape}-${view}-${canvasKey}`}
          camera={{ position: viewPositions[view], fov: 44 }}
          dpr={[1, 1.5]}
          shadows
          role="img"
          tabIndex={0}
          aria-describedby={`net-fold-hint-${shape}`}
          aria-label={`Model jaring-jaring tiga dimensi ${shapeLabels[shape]}. Seret untuk memutar dan cubit untuk memperbesar.`}
          style={{ height: '100%', width: '100%' }}
        >
          <color attach="background" args={['#e9fbf5']} />
          <ambientLight intensity={1.35} />
          <directionalLight position={[5, 7, 4]} intensity={1.25} castShadow />
          <directionalLight position={[-4, 2, -3]} intensity={.38} color="#a982e5" />
          <FoldingScene shape={shape} target={target} activePieces={activePieces} />
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.05, 0]} receiveShadow>
            <planeGeometry args={[14, 14]} />
            <meshStandardMaterial color="#d5eee6" roughness={.98} />
          </mesh>
          <gridHelper args={[10, 10, '#acd9d1', '#d9eee9']} position={[0, -2.03, 0]} />
          <OrbitControls enablePan={false} enableDamping dampingFactor={.08} minDistance={4.2} maxDistance={12} rotateSpeed={.72} target={[0, 0, 0]} />
        </Canvas>
      </div>
      <div style={{ padding: '8px 10px 10px' }}>
        <p id={`net-fold-hint-${shape}`} style={{ color: '#5d776f', fontSize: 11, lineHeight: 1.35, margin: '0 0 7px' }}>{hint} Seret model untuk melihatnya dari arah lain.</p>
        <div aria-label="Arah tampilan model lipatan" style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {viewButtons.map((item) => <button key={item.id} type="button" onClick={() => selectView(item.id)} aria-pressed={view === item.id} style={{ ...buttonStyle, background: view === item.id ? '#39776d' : '#f4fbf9', borderColor: view === item.id ? '#39776d' : '#c9ddd7', color: view === item.id ? '#fff' : '#35645e' }}>{item.label}</button>)}
        </div>
      </div>
    </section>
  )
}

export default NetFold3D
