import { describe, expect, it } from 'vitest'
import { curriculumMenuData, solidResources } from './learningResources'

describe('learning resource content', () => {
  it('covers every available solid in one library without duplicate ids', () => {
    expect(solidResources.map((resource) => resource.id)).toEqual([
      'kubus',
      'balok',
      'prisma-segitiga',
      'prisma-segiempat',
      'limas-segiempat',
      'limas-segitiga',
      'tabung',
      'kerucut',
      'bola',
    ])
    expect(new Set(solidResources.map((resource) => resource.id)).size).toBe(solidResources.length)
    expect(solidResources).toHaveLength(9)
  })

  it('labels every formula as enrichment and keeps TP-1 through TP-6 in the curriculum map', () => {
    for (const resource of solidResources) {
      expect(resource.possibleNets.length).toBeGreaterThan(0)
      expect(resource.formulas.every((formula) => formula.scopeLabel === 'Pengayaan di luar fokus penilaian MeowMath v1')).toBe(true)
    }
    expect(curriculumMenuData.meowMathProposal.learningObjectives.map((item) => item.code)).toEqual([
      'TP-1', 'TP-2', 'TP-3', 'TP-4', 'TP-5', 'TP-6',
    ])
  })
})
