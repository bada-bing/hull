import { describe, expect, test } from "vitest";
import { areNodesEqual } from "./nodes-equal";
import { h, hFragment, hString } from "./h";

describe("areNodesEqual (Ch_8.2.2)", () => {
  test("should return true for two element nodes with the same tag", () => {
    const node1 = h("div");
    const node2 = h("div");
    expect(areNodesEqual(node1, node2)).toBe(true);
  });

  test("should return false for two element nodes with different tags", () => {
    const node1 = h("div");
    const node2 = h("p");
    expect(areNodesEqual(node1, node2)).toBe(false);
  });

  test("should return true for two text nodes", () => {
    const node1 = hString("hello");
    const node2 = hString("world");
    expect(areNodesEqual(node1, node2)).toBe(true);
  });

  test("should return true for two fragment nodes", () => {
    const node1 = hFragment([]);
    const node2 = hFragment([]);
    expect(areNodesEqual(node1, node2)).toBe(true);
  });

  test("should return false for a fragment and a text node", () => {
    const node1 = hFragment([]);
    const node2 = hString("text");
    expect(areNodesEqual(node1, node2)).toBe(false);
  });

  test("should return false for a fragment and an element node", () => {
    const node1 = hFragment([]);
    const node2 = h("div");
    expect(areNodesEqual(node1, node2)).toBe(false);
  });

  test("should return false for a text and an element node", () => {
    const node1 = hString("text");
    const node2 = h("div");
    expect(areNodesEqual(node1, node2)).toBe(false);
  });
});
