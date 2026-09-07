import {
  isWithinGrid,
  voxelKey,
  type GridDimensions,
  type Shape,
  type Voxel,
} from './geometry'

/** Every solid available in the unified Kota Meow architecture canvas. */
export type ArchitectureSolidId =
  | 'kubus'
  | 'balok'
  | 'prisma-segitiga'
  | 'prisma-segiempat'
  | 'limas-segiempat'
  | 'limas-segitiga'
  | 'tabung'
  | 'kerucut'
  | 'bola'

export interface ArchitectureSolidDefinition {
  readonly id: ArchitectureSolidId
  readonly label: string
  readonly emoji: string
  readonly description: string
  readonly color: string
  /**
   * Children place one complete solid inside one coordinate cell. Keeping every
   * visual model inside its cell makes collision rules easy to see: one XYZ
   * coordinate can contain one object only.
   */
  readonly occupiesOneCell: true
}

export interface ArchitecturePlacedSolid {
  readonly id: string
  readonly solidId: ArchitectureSolidId
  /** Zero-based internal coordinate. The interface presents it to children as X/Y/Z 1-based. */
  readonly origin: Voxel
}

export type PlacementIssue =
  | { readonly code: 'OUT_OF_BOUNDS' }
  | { readonly code: 'OCCUPIED'; readonly conflict: ArchitecturePlacedSolid }

export type PlacementCheck =
  | { readonly valid: true }
  | { readonly valid: false; readonly issue: PlacementIssue }

export const architectureSolids: readonly ArchitectureSolidDefinition[] = [
  { id: 'kubus', label: 'Kubus', emoji: '🧊', description: 'Enam bidang persegi sama besar.', color: '#ff965f', occupiesOneCell: true },
  { id: 'balok', label: 'Balok', emoji: '📦', description: 'Kotak memanjang dengan bidang datar.', color: '#f6b14e', occupiesOneCell: true },
  { id: 'prisma-segitiga', label: 'Prisma Segitiga', emoji: '🔺', description: 'Memiliki dua alas segitiga.', color: '#62c8ba', occupiesOneCell: true },
  { id: 'prisma-segiempat', label: 'Prisma Segiempat', emoji: '🔷', description: 'Memiliki dua alas segiempat.', color: '#5caea8', occupiesOneCell: true },
  { id: 'limas-segiempat', label: 'Limas Segiempat', emoji: '⛰️', description: 'Memiliki alas segiempat dan satu puncak.', color: '#a981e0', occupiesOneCell: true },
  { id: 'limas-segitiga', label: 'Limas Segitiga', emoji: '▲', description: 'Memiliki alas segitiga dan satu puncak.', color: '#bd8adc', occupiesOneCell: true },
  { id: 'tabung', label: 'Tabung', emoji: '🥫', description: 'Memiliki dua lingkaran dan sisi lengkung.', color: '#64a8ec', occupiesOneCell: true },
  { id: 'kerucut', label: 'Kerucut', emoji: '🍦', description: 'Memiliki alas lingkaran dan satu puncak.', color: '#ea7892', occupiesOneCell: true },
  { id: 'bola', label: 'Bola', emoji: '⚽', description: 'Satu permukaan lengkung tanpa sudut.', color: '#78c66d', occupiesOneCell: true },
]

const solidById = new Map(architectureSolids.map((solid) => [solid.id, solid]))

export function getArchitectureSolid(id: ArchitectureSolidId): ArchitectureSolidDefinition {
  return solidById.get(id) ?? architectureSolids[0]
}

export function isArchitectureSolidId(value: string): value is ArchitectureSolidId {
  return solidById.has(value as ArchitectureSolidId)
}

export function coordinateLabel(origin: Voxel): string {
  return `X ${origin.x + 1}, Y ${origin.y + 1}, Z ${origin.z + 1}`
}

export function findPlacedSolidAt(
  placements: readonly ArchitecturePlacedSolid[],
  origin: Voxel,
  ignoreId?: string,
): ArchitecturePlacedSolid | undefined {
  const key = voxelKey(origin)
  return placements.find((placement) => placement.id !== ignoreId && voxelKey(placement.origin) === key)
}

/** Check one placement against the canvas bounds and all occupied coordinates. */
export function validateArchitecturePlacement(
  grid: GridDimensions,
  placements: readonly ArchitecturePlacedSolid[],
  candidate: Pick<ArchitecturePlacedSolid, 'origin'>,
  options: { readonly ignoreId?: string } = {},
): PlacementCheck {
  if (!isWithinGrid(grid, candidate.origin)) return { valid: false, issue: { code: 'OUT_OF_BOUNDS' } }
  const conflict = findPlacedSolidAt(placements, candidate.origin, options.ignoreId)
  return conflict
    ? { valid: false, issue: { code: 'OCCUPIED', conflict } }
    : { valid: true }
}

/** Return the first vacant coordinate in a child-friendly bottom-to-top scan. */
export function findFirstAvailableCoordinate(
  grid: GridDimensions,
  placements: readonly ArchitecturePlacedSolid[],
): Voxel | undefined {
  for (let y = 0; y < grid.height; y += 1) {
    for (let z = 0; z < grid.depth; z += 1) {
      for (let x = 0; x < grid.width; x += 1) {
        const origin = { x, y, z }
        if (validateArchitecturePlacement(grid, placements, { origin }).valid) return origin
      }
    }
  }
  return undefined
}

/**
 * Clean persisted placements defensively. Invalid ids, coordinates, and
 * duplicate occupied cells are omitted so a corrupt local record never makes
 * the architecture screen unusable.
 */
export function normalizeArchitecturePlacements(
  grid: GridDimensions,
  placements: readonly ArchitecturePlacedSolid[] | undefined,
): ArchitecturePlacedSolid[] {
  const cleaned: ArchitecturePlacedSolid[] = []
  const usedIds = new Set<string>()
  for (const placement of placements ?? []) {
    if (!placement || !isArchitectureSolidId(placement.solidId)) continue
    if (!placement.id || usedIds.has(placement.id)) continue
    const origin = placement.origin
    if (!origin || !Number.isInteger(origin.x) || !Number.isInteger(origin.y) || !Number.isInteger(origin.z)) continue
    if (!validateArchitecturePlacement(grid, cleaned, { origin }).valid) continue
    cleaned.push({ id: placement.id, solidId: placement.solidId, origin: { ...origin } })
    usedIds.add(placement.id)
  }
  return cleaned
}

/** Converts pre-redesign voxel creations into individual cube placements. */
export function legacyShapeToArchitecturePlacements(grid: GridDimensions, shape: Shape | undefined): ArchitecturePlacedSolid[] {
  return normalizeArchitecturePlacements(
    grid,
    (shape ?? []).map((origin) => ({
      id: `legacy-kubus-${origin.x}-${origin.y}-${origin.z}`,
      solidId: 'kubus' as const,
      origin,
    })),
  )
}

/** A compact compatibility representation used by older local records and gallery counters. */
export function architecturePlacementsToShape(placements: readonly ArchitecturePlacedSolid[]): Shape {
  return placements.map((placement) => ({ ...placement.origin }))
}
