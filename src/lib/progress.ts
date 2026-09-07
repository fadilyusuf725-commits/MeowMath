import { openDB, type DBSchema } from 'idb'
import type { LearningStatus, MissionId } from '../content/missions'
import {
  architecturePlacementsToShape,
  legacyShapeToArchitecturePlacements,
  normalizeArchitecturePlacements,
  type ArchitecturePlacedSolid,
} from './architecturePlacement'
import { createOccupancyGrid, type GridDimensions, type Shape } from './geometry'

export interface LearnerProfile {
  readonly id: string
  readonly nickname: string
  readonly createdAt: string
  readonly lastActiveAt: string
}

export interface MissionResult {
  readonly id: string
  readonly profileId: string
  readonly missionId: MissionId
  readonly correct: number
  readonly total: number
  readonly attempts: number
  readonly hintsUsed: number
  readonly status: LearningStatus
  readonly completedAt: string
}

export interface AppSettings {
  readonly id: 'settings'
  readonly audioEnabled: boolean
  readonly reducedMotion: boolean
}

/** A locally saved free-build creation from Studio Arsitek Mio. */
export interface CreativeDesign {
  readonly id: string
  readonly profileId: string
  readonly title: string
  readonly grid: GridDimensions
  /** Optional so locally saved pre-coordinate-studio designs remain readable. */
  readonly placedSolids?: readonly ArchitecturePlacedSolid[]
  readonly shape: Shape
  readonly presetId: string
  readonly createdAt: string
  readonly updatedAt: string
}

export interface SaveCreativeDesignInput {
  /** Supply an id to update an existing local design instead of creating one. */
  readonly id?: string
  readonly profileId: string
  readonly title: string
  readonly grid: GridDimensions
  readonly placedSolids?: readonly ArchitecturePlacedSolid[]
  readonly shape: Shape
  readonly presetId: string
}

interface MeowMathDB extends DBSchema {
  profiles: {
    key: string
    value: LearnerProfile
    indexes: { 'by-last-active': string }
  }
  results: {
    key: string
    value: MissionResult
    indexes: { 'by-profile': string; 'by-profile-mission': [string, MissionId] }
  }
  settings: {
    key: string
    value: AppSettings
  }
  designs: {
    key: string
    value: CreativeDesign
    indexes: { 'by-profile': string; 'by-updated-at': string }
  }
}

const database = openDB<MeowMathDB>('meowmath-v1', 2, {
  upgrade(db, oldVersion) {
    if (oldVersion < 1) {
      const profiles = db.createObjectStore('profiles', { keyPath: 'id' })
      profiles.createIndex('by-last-active', 'lastActiveAt')

      const results = db.createObjectStore('results', { keyPath: 'id' })
      results.createIndex('by-profile', 'profileId')
      results.createIndex('by-profile-mission', ['profileId', 'missionId'])

      db.createObjectStore('settings', { keyPath: 'id' })
    }

    if (oldVersion < 2) {
      const designs = db.createObjectStore('designs', { keyPath: 'id' })
      designs.createIndex('by-profile', 'profileId')
      designs.createIndex('by-updated-at', 'updatedAt')
    }
  },
})

function now(): string {
  return new Date().toISOString()
}

function createId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`
}

export function statusFromResult(
  correct: number,
  total: number,
  hintsUsed: number,
): LearningStatus {
  const accuracy = total === 0 ? 0 : correct / total
  if (accuracy >= 0.8 && hintsUsed <= 1) return 'Mandiri'
  if (accuracy >= 0.5) return 'Berkembang'
  return 'Perlu dukungan'
}

export async function listProfiles(): Promise<LearnerProfile[]> {
  const db = await database
  return (await db.getAllFromIndex('profiles', 'by-last-active')).reverse()
}

export async function createProfile(nickname: string): Promise<LearnerProfile> {
  const cleanNickname = nickname.trim().slice(0, 20)
  if (!cleanNickname) throw new Error('Nama panggilan diperlukan.')

  const createdAt = now()
  const profile: LearnerProfile = {
    id: createId('murid'),
    nickname: cleanNickname,
    createdAt,
    lastActiveAt: createdAt,
  }
  const db = await database
  await db.put('profiles', profile)
  return profile
}

export async function touchProfile(profile: LearnerProfile): Promise<LearnerProfile> {
  const updated = { ...profile, lastActiveAt: now() }
  const db = await database
  await db.put('profiles', updated)
  return updated
}

export async function listResults(profileId?: string): Promise<MissionResult[]> {
  const db = await database
  if (!profileId) return db.getAll('results')
  return db.getAllFromIndex('results', 'by-profile', profileId)
}

export async function getMissionResult(
  profileId: string,
  missionId: MissionId,
): Promise<MissionResult | undefined> {
  const db = await database
  const results = await db.getAllFromIndex('results', 'by-profile-mission', [profileId, missionId])
  return results.sort((a, b) => b.completedAt.localeCompare(a.completedAt))[0]
}

export async function saveMissionResult(
  input: Omit<MissionResult, 'id' | 'completedAt' | 'status'>,
): Promise<MissionResult> {
  const result: MissionResult = {
    ...input,
    id: createId('hasil'),
    completedAt: now(),
    status: statusFromResult(input.correct, input.total, input.hintsUsed),
  }
  const db = await database
  await db.put('results', result)
  return result
}

export async function getSettings(): Promise<AppSettings> {
  const db = await database
  return (
    (await db.get('settings', 'settings')) ?? {
      id: 'settings',
      audioEnabled: true,
      reducedMotion: false,
    }
  )
}

export async function saveSettings(settings: AppSettings): Promise<AppSettings> {
  const db = await database
  await db.put('settings', settings)
  return settings
}

export async function listCreativeDesigns(profileId: string): Promise<CreativeDesign[]> {
  const db = await database
  const designs = await db.getAllFromIndex('designs', 'by-profile', profileId)
  return designs.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
}

export async function saveCreativeDesign(input: SaveCreativeDesignInput): Promise<CreativeDesign> {
  const title = input.title.trim().slice(0, 32) || 'Karya Kota Meow'
  const grid = {
    width: input.grid.width,
    height: input.grid.height,
    depth: input.grid.depth,
  }
  // A pre-coordinate-studio creation has only voxels. Convert it to cube
  // placements once, then store later creations in the unified format.
  const placedSolids = normalizeArchitecturePlacements(
    grid,
    input.placedSolids === undefined
      ? legacyShapeToArchitecturePlacements(grid, input.shape)
      : input.placedSolids,
  )
  // Retain a compact voxel representation for compatibility with v1 records.
  const shape = createOccupancyGrid(grid, architecturePlacementsToShape(placedSolids)).cells
  const db = await database
  const existing = input.id ? await db.get('designs', input.id) : undefined
  const timestamp = now()
  const design: CreativeDesign = {
    id: existing?.id ?? createId('karya'),
    profileId: input.profileId,
    title,
    grid,
    placedSolids,
    shape,
    presetId: input.presetId,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
  }
  await db.put('designs', design)
  return design
}

export async function deleteCreativeDesign(id: string): Promise<void> {
  const db = await database
  await db.delete('designs', id)
}

export async function clearAllLocalData(): Promise<void> {
  const db = await database
  const transaction = db.transaction(['profiles', 'results', 'settings', 'designs'], 'readwrite')
  await Promise.all([
    transaction.objectStore('profiles').clear(),
    transaction.objectStore('results').clear(),
    transaction.objectStore('settings').clear(),
    transaction.objectStore('designs').clear(),
    transaction.done,
  ])
}
