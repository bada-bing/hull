import { describe, test, expect } from "vitest";
import {
  arraysDiff,
  arraysDiffSequence,
  withoutNullsOrUndefines,
} from "./arrays";

describe("Conditional Rendering - Removing null values (Ch_3.5.1)", () => {
  test("should filter null and undefined elements out of array", () => {
    const filtered = withoutNullsOrUndefines([
      undefined,
      "element_1",
      null,
      null,
      undefined,
      { value: 3 },
    ]);
    expect(filtered).toEqual(["element_1", { value: 3 }]);
  });
});

describe("arraysDiff (Ch_7.5)", () => {
  test("returns items which are added and items which are removed", () => {
    const a = ["yellow-color", "round-border", "thick-line"];
    const b = ["green-line", "thin-line", "round-border"];

    const diff = arraysDiff(a, b);
    expect(diff).toEqual({
      added: ["green-line", "thin-line"],
      removed: ["yellow-color", "thick-line"],
    });
  });
});

describe("diffChildrenArray (Ch_7.6)", () => {
  test("returns only noop operations when arrays are the same", () => {
    const oldArr = ["a", "b", "c"];
    const newArr = ["a", "b", "c"];
    const result = arraysDiffSequence(oldArr, newArr);
    expect(result).toEqual([
      { operation: "noop", index: 0, originalIndex: 0, item: "a" },
      { operation: "noop", index: 1, originalIndex: 1, item: "b" },
      { operation: "noop", index: 2, originalIndex: 2, item: "c" },
    ]);
  });

  test("handles additions at the end", () => {
    const oldArr = ["a", "b"];
    const newArr = ["a", "b", "c"];
    const result = arraysDiffSequence(oldArr, newArr);
    expect(result).toEqual([
      { operation: "noop", index: 0, originalIndex: 0, item: "a" },
      { operation: "noop", index: 1, originalIndex: 1, item: "b" },
      { operation: "add", index: 2, item: "c" },
    ]);
  });

  test("handles additions at the beginning", () => {
    const oldArr = ["b", "c"];
    const newArr = ["a", "b", "c"];
    const result = arraysDiffSequence(oldArr, newArr);
    expect(result).toEqual([
      { operation: "add", item: "a", index: 0 },
      { operation: "noop", index: 1, originalIndex: 0, item: "b" },
      { operation: "noop", index: 2, originalIndex: 1, item: "c" },
    ]);
  });

  test("handles additions in the middle", () => {
    const oldArr = ["a", "c"];
    const newArr = ["a", "b", "c"];
    const result = arraysDiffSequence(oldArr, newArr);
    expect(result).toEqual([
      { operation: "noop", index: 0, originalIndex: 0, item: "a" },
      { operation: "add", index: 1, item: "b" },
      { operation: "noop", index: 2, originalIndex: 1, item: "c" },
    ]);
  });

  test("handles removals from the end", () => {
    const oldArr = ["a", "b", "c"];
    const newArr = ["a", "b"];
    const result = arraysDiffSequence(oldArr, newArr);
    expect(result).toEqual([
      { operation: "noop", index: 0, originalIndex: 0, item: "a" },
      { operation: "noop", index: 1, originalIndex: 1, item: "b" },
      { operation: "remove", item: "c", index: 2 },
    ]);
  });

  test("handles removals from the beginning", () => {
    const oldArr = ["a", "b", "c"];
    const newArr = ["b", "c"];
    const result = arraysDiffSequence(oldArr, newArr);
    expect(result).toEqual([
      { operation: "remove", index: 0, item: "a" },
      { operation: "noop", index: 0, originalIndex: 1, item: "b" },
      { operation: "noop", index: 1, originalIndex: 2, item: "c" },
    ]);
  });

  test("handles removals from the middle", () => {
    const oldArr = ["a", "b", "c"];
    const newArr = ["a", "c"];
    const result = arraysDiffSequence(oldArr, newArr);
    expect(result).toEqual([
      { operation: "noop", index: 0, originalIndex: 0, item: "a" },
      { operation: "remove", index: 1, item: "b" },
      { operation: "noop", index: 1, originalIndex: 2, item: "c" },
    ]);
  });

  test("handles simple swaps (moves)", () => {
    const oldArr = ["a", "b"];
    const newArr = ["b", "a"];
    const result = arraysDiffSequence(oldArr, newArr);
    expect(result).toEqual([
      { operation: "move", item: "b", index: 0, originalIndex: 1, from: 1 },
      { operation: "noop", item: "a", index: 1, originalIndex: 0 },
    ]);
  });

  test("handles complex reordering (moves)", () => {
    const oldArr = ["a", "b", "c"];
    const newArr = ["c", "b", "a"];
    const result = arraysDiffSequence(oldArr, newArr);
    
    expect(result).toEqual([
      { operation: "move", index: 0, item: "c", originalIndex: 2, from: 2 },
      { operation: "move", index: 1, item: "b", originalIndex: 1, from: 2 },
      { operation: "noop", index: 2, item: "a", originalIndex: 0 },
    ]);
  });

  test("handles complex case, i.e., mixed changes", () => {
    const oldArr = ["a", "b", "c", "d", "e"];
    const newArr = ["a", "f", "c", "g", "b"];
    const result = arraysDiffSequence(oldArr, newArr);
    expect(result).toEqual([
      { operation: "noop", index: 0, item: "a", originalIndex: 0 },
      { operation: "add", index: 1, item: "f" },
      { operation: "move", index: 2, item: "c", from: 3, originalIndex: 2 },
      { operation: "add", index: 3, item: "g" },
      { operation: "noop", index: 4, item: "b", originalIndex: 1 },
      { operation: "remove", index: 5, item: "d" },
      { operation: "remove", index: 5, item: "e" },
    ]);
  });

  test("throws an error if the new array is empty", () => {
    const oldArr = ["a", "b", "c"];
    const newArr = [];
    expect(() => arraysDiffSequence(oldArr, newArr)).toThrow(
      "the new array is empty!",
    );
  });

  test("handles creation from empty", () => {
    const oldArr = [];
    const newArr = ["a", "b", "c"];
    const result = arraysDiffSequence(oldArr, newArr);

    expect(result).toEqual([
      { operation: "add", index:0, item: "a" },
      { operation: "add", index:1, item: "b" },
      { operation: "add", index:2, item: "c" },
    ]);
  });

  test("handles arrays with duplicate values", () => {
    const oldArr = ["a", "b", "a"];
    const newArr = ["a", "a", "b"];
    const result = arraysDiffSequence(oldArr, newArr);
    expect(result).toEqual([
      { operation: "noop", index: 0, item: "a", originalIndex:0 },
      { operation: "move", index: 1, item: "a", from: 2, originalIndex: 2 },
      { operation: "noop", index: 2, item: "b", originalIndex: 1 },
    ]);
  });
});
