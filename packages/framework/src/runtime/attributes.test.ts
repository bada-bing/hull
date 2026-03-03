import { describe, test, expect, vi } from "vitest";
import { setAttribute, removeAttribute, cssTextToRecord } from "./attributes";

describe("patching element nodes (Ch_8.2.5)", () => {
  describe("setAttribute", () => {
    test("sets a data attribute", () => {
      const el = document.createElement("div");
      setAttribute("data-test", el, "test-value");
      expect(el.getAttribute("data-test")).toBe("test-value");
    });

    test("sets a standard attribute as a property", () => {
      const el = document.createElement("input");
      setAttribute("value", el, "text");
      expect(el.value).toBe("text");
    });

    test("removes attribute when value is null", () => {
      const el = document.createElement("div");
      el.setAttribute("data-test", "value");
      setAttribute("data-test", el, null);
      expect(el.hasAttribute("data-test")).toBe(false);
    });

    test("converts number value to string when setting attributes", () => {
      const el = document.createElement("div");
      setAttribute("data-count", el, 5);
      expect(el.getAttribute("data-count")).toBe("5");
    });
  });

  describe("removeAttribute", () => {
    test("removes a standard attribute and sets its property to null", () => {
      const el = document.createElement("input");
      el.setAttribute("value", "text");

      removeAttribute("value", el);

      expect(el.hasAttribute("value")).toBe(false);
      expect(el.value).toBe("");
    });

    test("removes a data attribute", () => {
      const el = document.createElement("div");
      el.setAttribute("data-test", "value");

      removeAttribute("data-test", el);

      expect(el.hasAttribute("data-test")).toBe(false);
    });

    test("removes an attribute even if property does not exist", () => {
      const el = document.createElement("div");
      const attr = "non-existent-prop";
      el.setAttribute(attr, "a-value");

      removeAttribute(attr, el);

      expect(el.hasAttribute(attr)).toBe(false);
    });
  });
});

describe('cssTextToRecord', () => {
  test('should convert a css text string to a record', () => {
    const cssText = 'color: red; font-family: Georgia;';
    const expectedRecord = {
      color: 'red',
      fontFamily: 'Georgia'
    };
    expect(cssTextToRecord(cssText)).toEqual(expectedRecord);
  });

  test('should handle extra spaces', () => {
    const cssText = ' color : blue ;  font-size :  16px ; ';
    const expectedRecord = {
      color: 'blue',
      fontSize: '16px'
    };
    expect(cssTextToRecord(cssText)).toEqual(expectedRecord);
  });

  test('should handle empty string', () => {
    const cssText = '';
    const expectedRecord = {};
    expect(cssTextToRecord(cssText)).toEqual(expectedRecord);
  });

  test('should handle css text with a trailing semicolon', () => {
    const cssText = 'color: green;';
    const expectedRecord = {
      color: 'green'
    };
    expect(cssTextToRecord(cssText)).toEqual(expectedRecord);
  });

  test('should handle url', () => {
    const cssText = "background-image: url('https://example.com/image.png')";
    const expectedRecord = {
      backgroundImage: "url('https://example.com/image.png')"
    };
    expect(cssTextToRecord(cssText)).toEqual(expectedRecord);
  });
});
