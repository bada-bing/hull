import { describe, test, expect } from "vitest";
import { withoutNulls } from "./arrays";

describe("Conditional Rendering - Removing null values (Ch_3.5.1)", () => {
  test("should filter null and undefined elements out of array", () => {
    const filtered = withoutNulls([
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
