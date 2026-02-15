import { describe, expect, test } from "vitest";
import { objectsDiff } from "./objects";

describe("objectsDiff (Ch_7.4)", () => {
  test("doesn't return attributes which are same in both objects", () => {
    const a = {
      a: "input",
    };

    const b = {
      a: "input",
    };

    const diff = objectsDiff(a, b);

    expect(diff.added).not.toContain("a");
    expect(diff.removed).not.toContain("a");
    expect(diff.updated).not.toContain("a");
  });

  test("returns all attributes which are added to the second object, i.e., are missing in first object", () => {
    const a = {
      a: "input",
    };

    const b = {
      a: "input",
      b: "div",
    };

    const diff = objectsDiff(a, b);
    expect(diff.added).toEqual(["b"]);
  });

  test("returns all attributes which are removed from the first object, i.e., are missing in second object", () => {
    const a = {
      a: "span",
      b: "hello, world!",
    };

    const b = {
      a: "span",
    };

    const diff = objectsDiff(a, b);
    expect(diff.removed).toEqual(["b"]);
  });

  test("returns all attributes which changed", () => {
    const a = {
      a: "span",
      b: "hello, world!",
    };

    const b = {
      a: "span",
      b: "good day, civilization!",
    };

    const diff = objectsDiff(a, b);

    expect(diff.updated).toEqual(["b"]);
  });

  test("returns a complete diff which includes added, updated and removed attributes", () => {
    const a = {
      common: "value",
      otherCommon: "value",
      removed: "old",
      updated: "valueA",
    };
    
    const b = {
      common: "value",
      otherCommon: "value",
      added: "new",
      updated: "valueB",
    };

    const diff = objectsDiff(a, b);

    expect(diff).toEqual({
      added: ["added"],
      removed: ["removed"],
      updated: ["updated"]
    })
  });
});
