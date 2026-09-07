import { describe, expect, it } from 'vitest'
import {
  findFirstAvailableCoordinate,
  legacyShapeToArchitecturePlacements,
  normalizeArchitecturePlacements,
  validateArchitecturePlacement,
  type ArchitecturePlacedSolid,
} from './architecturePlacement'

const grid = { width: 3, height: 2, depth: 3 }

const placed: ArchitecturePlacedSolid[] = [
  { id: 'kubus-1', solidId: 'kubus', origin: { x: 0, y: 0, z: 0 } },
]

describe('architecture coordinate placement', () => {
  it('accepts an empty coordinate in the canvas', () => {
    expect(validateArchitecturePlacement(grid, placed, { origin: { x: 1, y: 0, z: 0 } })).toEqual({ valid: true })
  })

  it('rejects a placement at an occupied coordinate', () => {
    const result = validateArchitecturePlacement(grid, placed, { origin: { x: 0, y: 0, z: 0 } })
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.issue.code).toBe('OCCUPIED')
      expect(result.issue.code === 'OCCUPIED' && result.issue.conflict.id).toBe('kubus-1')
    }
  })

  it('allows a selected object to remain at its own coordinate while moving', () => {
    expect(validateArchitecturePlacement(grid, placed, { origin: { x: 0, y: 0, z: 0 } }, { ignoreId: 'kubus-1' })).toEqual({ valid: true })
  })

  it('rejects coordinates outside the canvas', () => {
    const result = validateArchitecturePlacement(grid, placed, { origin: { x: 3, y: 0, z: 0 } })
    expect(result.valid).toBe(false)
    if (!result.valid) expect(result.issue.code).toBe('OUT_OF_BOUNDS')
  })

  it('finds the first empty coordinate and normalizes duplicate records', () => {
    expect(findFirstAvailableCoordinate(grid, placed)).toEqual({ x: 1, y: 0, z: 0 })
    expect(normalizeArchitecturePlacements(grid, [
      ...placed,
      { id: 'tabung-1', solidId: 'tabung', origin: { x: 0, y: 0, z: 0 } },
      { id: 'bola-1', solidId: 'bola', origin: { x: 2, y: 1, z: 2 } },
    ])).toEqual([
      placed[0],
      { id: 'bola-1', solidId: 'bola', origin: { x: 2, y: 1, z: 2 } },
    ])
  })

  it('turns legacy voxel designs into unified cube placements', () => {
    expect(legacyShapeToArchitecturePlacements(grid, [{ x: 0, y: 0, z: 0 }, { x: 2, y: 1, z: 2 }]))
      .toMatchObject([
        { solidId: 'kubus', origin: { x: 0, y: 0, z: 0 } },
        { solidId: 'kubus', origin: { x: 2, y: 1, z: 2 } },
      ])
  })
})
