import { describe, expect, it } from "vitest";

import {
  areProjectionsEqual,
  areStructuresExactlyEqual,
  areStructuresEqual,
  areStructuresCongruent,
  classifySolidShape,
  compareProjections,
  compareStructures,
  createOccupancyGrid,
  createOrthographicProjection,
  createRectangularPrism,
  deriveOrthographicProjections,
  getDistinctOrientations,
  normalizeShape,
  rotateShape,
  setOccupied,
  validateShape,
  type Shape,
} from "./geometry";

describe("shape validation and occupancy grids", () => {
  it("rejects duplicate unit blocks and permits an empty in-progress grid", () => {
    expect(validateShape([{ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }])).toMatchObject({
      valid: false,
    });

    const emptyGrid = createOccupancyGrid({ width: 3, height: 3, depth: 3 });
    const withOneBlock = setOccupied(emptyGrid, { x: 1, y: 0, z: 2 }, true);
    expect(withOneBlock.cells).toEqual([{ x: 1, y: 0, z: 2 }]);
    expect(setOccupied(withOneBlock, { x: 1, y: 0, z: 2 }, false).cells).toEqual([]);
  });

  it("normalises translations without changing a structure", () => {
    const shifted: Shape = [
      { x: 7, y: -2, z: 5 },
      { x: 8, y: -2, z: 5 },
    ];
    expect(normalizeShape(shifted)).toEqual([
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
    ]);
  });

  it("can require an exact saved coordinate pattern for guided construction", () => {
    const target: Shape = [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
    ];
    const shiftedCopy: Shape = target.map((cell) => ({ ...cell, x: cell.x + 1, z: cell.z + 1 }));

    expect(areStructuresEqual(target, shiftedCopy)).toBe(true);
    expect(areStructuresExactlyEqual(target, shiftedCopy)).toBe(false);
    expect(compareStructures(target, shiftedCopy, { matchMode: "exact" })).toMatchObject({
      matches: false,
      missing: expect.any(Array),
      extra: expect.any(Array),
    });
  });
});

describe("solid shape classification and rotation", () => {
  it("distinguishes a cube, a balok, and a non-solid structure", () => {
    expect(classifySolidShape(createRectangularPrism({ width: 2, height: 2, depth: 2 })).kind).toBe(
      "kubus",
    );
    expect(classifySolidShape(createRectangularPrism({ width: 2, height: 3, depth: 1 })).kind).toBe(
      "balok",
    );
    expect(classifySolidShape([{ x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1 }]).kind).toBe(
      "bukan-balok",
    );
  });

  it("normalises quarter-turn rotations and finds congruent structures", () => {
    const target: Shape = [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
    ];
    const rotated = rotateShape(target, "y");

    expect(areStructuresCongruent(target, rotated)).toBe(true);
    expect(compareStructures(target, rotated).matches).toBe(false);
    expect(compareStructures(target, rotated, { allowRotation: true })).toMatchObject({
      matches: true,
      matchedWithRotation: true,
    });
    expect(getDistinctOrientations(target).length).toBeGreaterThan(1);
  });
});

describe("orthographic projections", () => {
  it("derives the documented front, top, and right silhouettes", () => {
    const tower: Shape = [
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 1, y: 0, z: 1 },
    ];
    const views = deriveOrthographicProjections(tower);

    expect(views.front).toEqual({
      view: "front",
      width: 2,
      height: 2,
      cells: [
        { column: 0, row: 0 },
        { column: 1, row: 0 },
        { column: 0, row: 1 },
      ],
    });
    expect(views.top).toEqual({
      view: "top",
      width: 2,
      height: 2,
      cells: [
        { column: 0, row: 0 },
        { column: 1, row: 1 },
      ],
    });
    expect(views.right).toEqual({
      view: "right",
      width: 2,
      height: 2,
      cells: [
        { column: 0, row: 0 },
        { column: 1, row: 0 },
        { column: 0, row: 1 },
      ],
    });
  });

  it("reports missing and extra selected projection cells", () => {
    const expected = createOrthographicProjection("front", 2, 2, [
      { column: 0, row: 0 },
      { column: 1, row: 1 },
    ]);
    const actual = createOrthographicProjection("front", 2, 2, [
      { column: 0, row: 0 },
      { column: 1, row: 0 },
    ]);

    expect(compareProjections(expected, actual)).toMatchObject({
      matches: false,
      missing: [{ column: 1, row: 1 }],
      extra: [{ column: 1, row: 0 }],
    });
    expect(areProjectionsEqual(expected, actual)).toBe(false);
  });
});
