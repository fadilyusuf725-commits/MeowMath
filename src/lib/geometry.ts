/**
 * Geometry domain utilities for MeowMath.
 *
 * Coordinate convention
 * ---------------------
 * A voxel is one unit block in a three-dimensional grid:
 * - `x` grows to the learner's right.
 * - `y` grows upward.
 * - `z` grows away from the learner (into the scene).
 *
 * Shapes are translation-independent when they are normalised: their smallest
 * coordinate on every axis is `(0, 0, 0)`. Projection `row` values remain
 * mathematical coordinates (they are not CSS row indices): front/right rows
 * grow upward and top rows grow away from the learner. A renderer may invert
 * a vertical axis when placing cells on screen.
 */

export interface Voxel {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

/** A set-like list of occupied unit blocks. Duplicate cells are invalid. */
export type Shape = readonly Voxel[];

export interface GridDimensions {
  readonly width: number;
  readonly height: number;
  readonly depth: number;
}

export interface OccupancyGrid {
  readonly dimensions: GridDimensions;
  readonly cells: Shape;
}

export type ShapeValidationErrorCode =
  | "EMPTY_SHAPE"
  | "INVALID_COORDINATE"
  | "DUPLICATE_CELL";

export interface ShapeValidationError {
  readonly code: ShapeValidationErrorCode;
  readonly message: string;
  readonly index?: number;
  readonly cell?: Voxel;
}

export interface ShapeValidationResult {
  readonly valid: boolean;
  readonly errors: readonly ShapeValidationError[];
}

export interface GridValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

export interface ShapeBounds extends GridDimensions {
  readonly min: Voxel;
  readonly max: Voxel;
}

export interface CompareStructuresOptions {
  /**
   * `exact` compares the occupied coordinates themselves. Use it for guided
   * construction tasks where the learner must place each block on the saved
   * target position. `translation-independent` is useful for free-form shape
   * comparison where an object may be moved within a larger grid.
   */
  readonly matchMode?: "exact" | "translation-independent";
  /**
   * Accept an object if it matches the target after any rigid quarter-turn
   * rotation. This option applies only to translation-independent comparison;
   * an exact-position task always keeps its fixed coordinate system.
   */
  readonly allowRotation?: boolean;
}

export interface StructureComparison {
  readonly matches: boolean;
  readonly missing: Shape;
  readonly extra: Shape;
  readonly matchedWithRotation: boolean;
}

export type RotationAxis = "x" | "y" | "z";

export type ProjectionView = "front" | "top" | "right";

export interface ProjectionCell {
  readonly column: number;
  readonly row: number;
}

export interface OrthographicProjection {
  readonly view: ProjectionView;
  readonly width: number;
  readonly height: number;
  /** Occupied cells in the 2D silhouette, sorted by row then column. */
  readonly cells: readonly ProjectionCell[];
}

export interface ProjectionComparison {
  readonly matches: boolean;
  readonly viewMatches: boolean;
  readonly dimensionsMatch: boolean;
  readonly missing: readonly ProjectionCell[];
  readonly extra: readonly ProjectionCell[];
}

export type SolidShapeKind = "kubus" | "balok" | "bukan-balok";

export interface SolidShapeClassification {
  readonly kind: SolidShapeKind;
  readonly dimensions: GridDimensions;
  readonly cellCount: number;
}

const EMPTY_DIMENSIONS: GridDimensions = { width: 0, height: 0, depth: 0 };

function isInteger(value: number): boolean {
  return Number.isFinite(value) && Number.isInteger(value);
}

function copyVoxel({ x, y, z }: Voxel): Voxel {
  return { x, y, z };
}

function copyProjectionCell({ column, row }: ProjectionCell): ProjectionCell {
  return { column, row };
}

/** Stable key suitable for occupancy lookups. */
export function voxelKey({ x, y, z }: Voxel): string {
  return `${x},${y},${z}`;
}

/** Stable key suitable for orthographic projection lookups. */
export function projectionCellKey({ column, row }: ProjectionCell): string {
  return `${column},${row}`;
}

export function areVoxelsEqual(left: Voxel, right: Voxel): boolean {
  return left.x === right.x && left.y === right.y && left.z === right.z;
}

export function areProjectionCellsEqual(
  left: ProjectionCell,
  right: ProjectionCell,
): boolean {
  return left.column === right.column && left.row === right.row;
}

/**
 * Validate the set-like representation used by all shape operations.
 * Empty shapes are useful while a learner is building, so callers can opt in.
 */
export function validateShape(
  shape: Shape,
  options: { readonly allowEmpty?: boolean } = {},
): ShapeValidationResult {
  const errors: ShapeValidationError[] = [];

  if (shape.length === 0 && !options.allowEmpty) {
    errors.push({
      code: "EMPTY_SHAPE",
      message: "A shape must contain at least one occupied cell.",
    });
  }

  const seen = new Map<string, number>();

  shape.forEach((cell, index) => {
    if (!isInteger(cell.x) || !isInteger(cell.y) || !isInteger(cell.z)) {
      errors.push({
        code: "INVALID_COORDINATE",
        message: "Each voxel coordinate must be a finite integer.",
        index,
        cell: copyVoxel(cell),
      });
      return;
    }

    const key = voxelKey(cell);
    const firstIndex = seen.get(key);
    if (firstIndex !== undefined) {
      errors.push({
        code: "DUPLICATE_CELL",
        message: `Cell ${key} is duplicated (first seen at index ${firstIndex}).`,
        index,
        cell: copyVoxel(cell),
      });
      return;
    }

    seen.set(key, index);
  });

  return { valid: errors.length === 0, errors };
}

export function assertValidShape(
  shape: Shape,
  options: { readonly allowEmpty?: boolean } = {},
): void {
  const result = validateShape(shape, options);
  if (!result.valid) {
    throw new Error(result.errors.map((error) => error.message).join(" "));
  }
}

export function sortShape(shape: Shape): Shape {
  return [...shape]
    .map(copyVoxel)
    .sort((left, right) => left.z - right.z || left.y - right.y || left.x - right.x);
}

/**
 * Move a valid shape so its minimum x, y, and z values are all zero.
 * The input is never mutated. Empty construction states remain empty.
 */
export function normalizeShape(shape: Shape): Shape {
  assertValidShape(shape, { allowEmpty: true });

  const bounds = getShapeBoundsUnchecked(shape);
  if (!bounds) {
    return [];
  }

  return sortShape(
    shape.map((cell) => ({
      x: cell.x - bounds.min.x,
      y: cell.y - bounds.min.y,
      z: cell.z - bounds.min.z,
    })),
  );
}

export function getShapeBounds(shape: Shape): ShapeBounds | undefined {
  assertValidShape(shape, { allowEmpty: true });
  return getShapeBoundsUnchecked(shape);
}

function getShapeBoundsUnchecked(shape: Shape): ShapeBounds | undefined {
  if (shape.length === 0) {
    return undefined;
  }

  let minX = shape[0].x;
  let minY = shape[0].y;
  let minZ = shape[0].z;
  let maxX = shape[0].x;
  let maxY = shape[0].y;
  let maxZ = shape[0].z;

  for (const { x, y, z } of shape.slice(1)) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    minZ = Math.min(minZ, z);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
    maxZ = Math.max(maxZ, z);
  }

  return {
    min: { x: minX, y: minY, z: minZ },
    max: { x: maxX, y: maxY, z: maxZ },
    width: maxX - minX + 1,
    height: maxY - minY + 1,
    depth: maxZ - minZ + 1,
  };
}

export function getShapeDimensions(shape: Shape): GridDimensions {
  const bounds = getShapeBounds(shape);
  return bounds
    ? { width: bounds.width, height: bounds.height, depth: bounds.depth }
    : { ...EMPTY_DIMENSIONS };
}

export function translateShape(shape: Shape, offset: Voxel): Shape {
  assertValidShape(shape, { allowEmpty: true });
  if (!isInteger(offset.x) || !isInteger(offset.y) || !isInteger(offset.z)) {
    throw new Error("A shape offset must use finite integer coordinates.");
  }

  return sortShape(
    shape.map((cell) => ({
      x: cell.x + offset.x,
      y: cell.y + offset.y,
      z: cell.z + offset.z,
    })),
  );
}

/** Create a solid cube or rectangular prism from unit blocks. */
export function createRectangularPrism(dimensions: GridDimensions): Shape {
  assertValidDimensions(dimensions);
  const cells: Voxel[] = [];

  for (let z = 0; z < dimensions.depth; z += 1) {
    for (let y = 0; y < dimensions.height; y += 1) {
      for (let x = 0; x < dimensions.width; x += 1) {
        cells.push({ x, y, z });
      }
    }
  }

  return cells;
}

/** True only when every cell in the shape's bounding box is occupied. */
export function isSolidRectangularPrism(shape: Shape): boolean {
  const normalized = normalizeShape(shape);
  const dimensions = getShapeDimensions(normalized);
  if (normalized.length === 0) {
    return false;
  }

  return normalized.length === dimensions.width * dimensions.height * dimensions.depth;
}

export function classifySolidShape(shape: Shape): SolidShapeClassification {
  const normalized = normalizeShape(shape);
  const dimensions = getShapeDimensions(normalized);

  if (!isSolidRectangularPrism(normalized)) {
    return { kind: "bukan-balok", dimensions, cellCount: normalized.length };
  }

  const isCube =
    dimensions.width === dimensions.height && dimensions.height === dimensions.depth;

  return {
    kind: isCube ? "kubus" : "balok",
    dimensions,
    cellCount: normalized.length,
  };
}

export function isOccupied(grid: OccupancyGrid, cell: Voxel): boolean {
  assertValidOccupancyGrid(grid);
  return grid.cells.some((occupiedCell) => areVoxelsEqual(occupiedCell, cell));
}

export function isWithinGrid(dimensions: GridDimensions, cell: Voxel): boolean {
  return (
    isInteger(cell.x) &&
    isInteger(cell.y) &&
    isInteger(cell.z) &&
    cell.x >= 0 &&
    cell.y >= 0 &&
    cell.z >= 0 &&
    cell.x < dimensions.width &&
    cell.y < dimensions.height &&
    cell.z < dimensions.depth
  );
}

export function validateOccupancyGrid(grid: OccupancyGrid): GridValidationResult {
  const errors: string[] = [];

  if (!areDimensionsValid(grid.dimensions)) {
    errors.push("Grid width, height, and depth must be positive finite integers.");
  }

  const shapeResult = validateShape(grid.cells, { allowEmpty: true });
  errors.push(...shapeResult.errors.map((error) => error.message));

  if (areDimensionsValid(grid.dimensions)) {
    grid.cells.forEach((cell) => {
      if (!isWithinGrid(grid.dimensions, cell)) {
        errors.push(`Cell ${voxelKey(cell)} is outside the occupancy grid.`);
      }
    });
  }

  return { valid: errors.length === 0, errors };
}

export function createOccupancyGrid(
  dimensions: GridDimensions,
  cells: Shape = [],
): OccupancyGrid {
  const grid = { dimensions: { ...dimensions }, cells: sortShape(cells) };
  assertValidOccupancyGrid(grid);
  return grid;
}

/** Add or remove one unit block without mutating the original grid. */
export function setOccupied(
  grid: OccupancyGrid,
  cell: Voxel,
  occupied: boolean,
): OccupancyGrid {
  assertValidOccupancyGrid(grid);
  if (!isWithinGrid(grid.dimensions, cell)) {
    throw new Error(`Cell ${voxelKey(cell)} is outside the occupancy grid.`);
  }

  const key = voxelKey(cell);
  const remaining = grid.cells.filter((occupiedCell) => voxelKey(occupiedCell) !== key);
  const cells = occupied ? [...remaining, copyVoxel(cell)] : remaining;
  return createOccupancyGrid(grid.dimensions, cells);
}

/**
 * Rotate a coordinate around the origin by a number of positive quarter turns.
 * The formulas are deliberately explicit so game code has no camera dependency.
 */
export function rotateVoxel(
  cell: Voxel,
  axis: RotationAxis,
  quarterTurns = 1,
): Voxel {
  if (!isInteger(cell.x) || !isInteger(cell.y) || !isInteger(cell.z)) {
    throw new Error("A voxel must use finite integer coordinates.");
  }

  const turns = ((quarterTurns % 4) + 4) % 4;
  let rotated = copyVoxel(cell);

  for (let turn = 0; turn < turns; turn += 1) {
    const { x, y, z } = rotated;
    switch (axis) {
      case "x":
        rotated = { x, y: -z, z: y };
        break;
      case "y":
        rotated = { x: z, y, z: -x };
        break;
      case "z":
        rotated = { x: -y, y: x, z };
        break;
    }
  }

  return rotated;
}

/** Rotate a shape then normalise it back into a non-negative construction grid. */
export function rotateShape(
  shape: Shape,
  axis: RotationAxis,
  quarterTurns = 1,
): Shape {
  assertValidShape(shape, { allowEmpty: true });
  return normalizeShape(shape.map((cell) => rotateVoxel(cell, axis, quarterTurns)));
}

/**
 * Return every distinct rigid orientation of a shape under quarter-turns.
 * Symmetric shapes naturally produce fewer than 24 entries.
 */
export function getDistinctOrientations(shape: Shape): readonly Shape[] {
  const initial = normalizeShape(shape);
  const results: Shape[] = [];
  const visited = new Set<string>();
  const pending: Shape[] = [initial];

  while (pending.length > 0) {
    const current = pending.shift()!;
    const key = shapeSignature(current);
    if (visited.has(key)) {
      continue;
    }

    visited.add(key);
    results.push(current);

    for (const axis of ["x", "y", "z"] as const) {
      pending.push(rotateShape(current, axis));
    }
  }

  return results;
}

/** Translation-independent structural equality. */
export function areStructuresEqual(left: Shape, right: Shape): boolean {
  return shapeSignature(normalizeShape(left)) === shapeSignature(normalizeShape(right));
}

/** Exact equality: every occupied unit block must use the same x, y, and z. */
export function areStructuresExactlyEqual(left: Shape, right: Shape): boolean {
  assertValidShape(left, { allowEmpty: true });
  assertValidShape(right, { allowEmpty: true });
  return shapeSignature(left) === shapeSignature(right);
}

/** Structural equality allowing any rigid quarter-turn orientation. */
export function areStructuresCongruent(left: Shape, right: Shape): boolean {
  const target = shapeSignature(normalizeShape(left));
  return getDistinctOrientations(right).some(
    (orientation) => shapeSignature(orientation) === target,
  );
}

/**
 * Compare a learner's construction with a target and provide cells for visual
 * feedback. `missing` and `extra` are expressed in the target's fixed view.
 */
export function compareStructures(
  expected: Shape,
  actual: Shape,
  options: CompareStructuresOptions = {},
): StructureComparison {
  const matchMode = options.matchMode ?? "translation-independent";
  const expectedComparable =
    matchMode === "exact" ? sortShape(expected) : normalizeShape(expected);
  const actualComparable =
    matchMode === "exact" ? sortShape(actual) : normalizeShape(actual);
  const expectedKeys = new Set(expectedComparable.map(voxelKey));
  const actualKeys = new Set(actualComparable.map(voxelKey));
  const missing = expectedComparable.filter((cell) => !actualKeys.has(voxelKey(cell)));
  const extra = actualComparable.filter((cell) => !expectedKeys.has(voxelKey(cell)));
  const directMatch = missing.length === 0 && extra.length === 0;

  if (directMatch) {
    return { matches: true, missing: [], extra: [], matchedWithRotation: false };
  }

  const matchedWithRotation =
    matchMode === "translation-independent" &&
    options.allowRotation === true &&
    areStructuresCongruent(expectedComparable, actualComparable);

  return {
    matches: matchedWithRotation,
    missing: matchedWithRotation ? [] : missing,
    extra: matchedWithRotation ? [] : extra,
    matchedWithRotation,
  };
}

/** Map a 3D cell to a 2D mathematical coordinate for a named view. */
export function projectVoxel(cell: Voxel, view: ProjectionView): ProjectionCell {
  switch (view) {
    case "front":
      return { column: cell.x, row: cell.y };
    case "top":
      return { column: cell.x, row: cell.z };
    case "right":
      return { column: cell.z, row: cell.y };
  }
}

/** Derive the occupied silhouette for a front, top, or right orthographic view. */
export function deriveOrthographicProjection(
  shape: Shape,
  view: ProjectionView,
): OrthographicProjection {
  const normalized = normalizeShape(shape);
  const dimensions = getShapeDimensions(normalized);
  const uniqueCells = new Map<string, ProjectionCell>();

  for (const voxel of normalized) {
    const cell = projectVoxel(voxel, view);
    uniqueCells.set(projectionCellKey(cell), cell);
  }

  const cells = sortProjectionCells([...uniqueCells.values()]);
  const size = getProjectionDimensions(dimensions, view);

  return { view, width: size.width, height: size.height, cells };
}

export function deriveOrthographicProjections(shape: Shape): Readonly<
  Record<ProjectionView, OrthographicProjection>
> {
  return {
    front: deriveOrthographicProjection(shape, "front"),
    top: deriveOrthographicProjection(shape, "top"),
    right: deriveOrthographicProjection(shape, "right"),
  };
}

/**
 * Make a checked answer projection for questions where learners select cells
 * directly on a 2D grid.
 */
export function createOrthographicProjection(
  view: ProjectionView,
  width: number,
  height: number,
  cells: readonly ProjectionCell[],
): OrthographicProjection {
  if (!isPositiveInteger(width) || !isPositiveInteger(height)) {
    throw new Error("Projection width and height must be positive integers.");
  }

  const seen = new Set<string>();
  for (const cell of cells) {
    if (!isInteger(cell.column) || !isInteger(cell.row)) {
      throw new Error("Projection coordinates must be finite integers.");
    }
    if (cell.column < 0 || cell.row < 0 || cell.column >= width || cell.row >= height) {
      throw new Error(`Projection cell ${projectionCellKey(cell)} is outside its grid.`);
    }
    const key = projectionCellKey(cell);
    if (seen.has(key)) {
      throw new Error(`Projection cell ${key} is duplicated.`);
    }
    seen.add(key);
  }

  return { view, width, height, cells: sortProjectionCells(cells) };
}

export function areProjectionsEqual(
  left: OrthographicProjection,
  right: OrthographicProjection,
): boolean {
  return compareProjections(left, right).matches;
}

export function compareProjections(
  expected: OrthographicProjection,
  actual: OrthographicProjection,
): ProjectionComparison {
  const viewMatches = expected.view === actual.view;
  const dimensionsMatch =
    expected.width === actual.width && expected.height === actual.height;
  const expectedKeys = new Set(expected.cells.map(projectionCellKey));
  const actualKeys = new Set(actual.cells.map(projectionCellKey));
  const missing = sortProjectionCells(
    expected.cells.filter((cell) => !actualKeys.has(projectionCellKey(cell))),
  );
  const extra = sortProjectionCells(
    actual.cells.filter((cell) => !expectedKeys.has(projectionCellKey(cell))),
  );

  return {
    matches: viewMatches && dimensionsMatch && missing.length === 0 && extra.length === 0,
    viewMatches,
    dimensionsMatch,
    missing,
    extra,
  };
}

function shapeSignature(shape: Shape): string {
  return sortShape(shape).map(voxelKey).join("|");
}

function getProjectionDimensions(
  dimensions: GridDimensions,
  view: ProjectionView,
): { width: number; height: number } {
  switch (view) {
    case "front":
      return { width: dimensions.width, height: dimensions.height };
    case "top":
      return { width: dimensions.width, height: dimensions.depth };
    case "right":
      return { width: dimensions.depth, height: dimensions.height };
  }
}

function sortProjectionCells(cells: readonly ProjectionCell[]): readonly ProjectionCell[] {
  return [...cells]
    .map(copyProjectionCell)
    .sort((left, right) => left.row - right.row || left.column - right.column);
}

function areDimensionsValid(dimensions: GridDimensions): boolean {
  return (
    isPositiveInteger(dimensions.width) &&
    isPositiveInteger(dimensions.height) &&
    isPositiveInteger(dimensions.depth)
  );
}

function isPositiveInteger(value: number): boolean {
  return isInteger(value) && value > 0;
}

function assertValidDimensions(dimensions: GridDimensions): void {
  if (!areDimensionsValid(dimensions)) {
    throw new Error("Width, height, and depth must be positive finite integers.");
  }
}

function assertValidOccupancyGrid(grid: OccupancyGrid): void {
  const result = validateOccupancyGrid(grid);
  if (!result.valid) {
    throw new Error(result.errors.join(" "));
  }
}
