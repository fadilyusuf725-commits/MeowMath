import { describe, expect, it } from 'vitest'
import { createOccupancyGrid, deriveOrthographicProjection, projectionCellKey, voxelKey } from '../lib'
import { missions } from './missions'

describe('bank konten MeowMath', () => {
  it('memiliki identitas misi dan soal yang unik', () => {
    expect(new Set(missions.map((mission) => mission.id)).size).toBe(missions.length)

    const challengeIds = missions.flatMap((mission) => mission.challenges.map((challenge) => challenge.id))
    expect(new Set(challengeIds).size).toBe(challengeIds.length)
  })

  it('memberikan tepat satu jawaban benar yang sah untuk setiap soal pilihan dan tampak', () => {
    for (const mission of missions) {
      for (const challenge of mission.challenges) {
        if (challenge.type === 'choice') {
          expect(challenge.correctIndex).toBeGreaterThanOrEqual(0)
          expect(challenge.correctIndex).toBeLessThan(challenge.options.length)
          expect(new Set(challenge.options).size).toBe(challenge.options.length)
        }

        if (challenge.type === 'projection') {
          expect(challenge.correctIndex).toBeGreaterThanOrEqual(0)
          expect(challenge.correctIndex).toBeLessThan(challenge.options.length)
          const signatures = challenge.options.map((projection) =>
            `${projection.view}:${projection.width}x${projection.height}:${projection.cells.map(projectionCellKey).join('|')}`,
          )
          expect(new Set(signatures).size).toBe(signatures.length)
        }

        if (challenge.type === 'match') {
          const itemIds = challenge.items.map((item) => item.id)
          const targetIds = new Set(challenge.targets.map((target) => target.id))
          expect(new Set(itemIds).size).toBe(itemIds.length)
          expect(new Set(challenge.targets.map((target) => target.id)).size).toBe(challenge.targets.length)
          expect(Object.keys(challenge.correctMatches).sort()).toEqual([...itemIds].sort())
          for (const targetId of Object.values(challenge.correctMatches)) {
            expect(targetIds.has(targetId)).toBe(true)
          }
        }

        if (challenge.type === 'sequence') {
          const itemIds = challenge.items.map((item) => item.id)
          expect(new Set(itemIds).size).toBe(itemIds.length)
          expect([...challenge.initialOrder].sort()).toEqual([...itemIds].sort())
          expect([...challenge.correctOrder].sort()).toEqual([...itemIds].sort())
          expect(challenge.initialOrder).not.toEqual(challenge.correctOrder)
        }

        if (challenge.type === 'projection-draw') {
          const derived = deriveOrthographicProjection(challenge.object, challenge.view)
          expect(challenge.expected).toEqual(derived)
          expect(new Set(challenge.expected.cells.map(projectionCellKey)).size).toBe(challenge.expected.cells.length)
        }
      }
    }
  })

  it('memuat target bangun dan lokasi peta yang valid', () => {
    for (const mission of missions) {
      for (const challenge of mission.challenges) {
        if (challenge.type === 'build') {
          expect(() => createOccupancyGrid(challenge.grid, challenge.target)).not.toThrow()
          expect(new Set(challenge.target.map(voxelKey)).size).toBe(challenge.target.length)
          expect(challenge.matchMode ?? 'exact').toBe('exact')
          if (challenge.startingShape) {
            expect(() => createOccupancyGrid(challenge.grid, challenge.startingShape ?? [])).not.toThrow()
            expect(new Set(challenge.startingShape.map(voxelKey)).size).toBe(challenge.startingShape.length)
          }
        }

        if (challenge.type === 'map') {
          expect(challenge.target.column).toBeGreaterThanOrEqual(0)
          expect(challenge.target.column).toBeLessThan(challenge.columns)
          expect(challenge.target.row).toBeGreaterThanOrEqual(0)
          expect(challenge.target.row).toBeLessThan(challenge.rows)
        }
      }
    }
  })
})
