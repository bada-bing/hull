import { describe, test, expect } from "vitest";
import {
  type VElement,
  VFragment,
  type VText,
  h,
  hFragment,
  hString,
  mapStringsToTextNodes,
} from "./h";

// Ch3 - rendering and the virtual DOM
describe("Rendering and the Virtual DOM (Ch_3)", () => {
  describe("Element Nodes - h() (Ch_3.5)", () => {
    test("should map strings to Text Nodes - mapStringsToTextNodes() (Ch_3.5.2)", () => {
      const childElNode: VElement = {
        type: "element",
        tag: "div",
        props: {},
        children: [],
      };
      const mappedArray = mapStringsToTextNodes([
        null,
        "text_a",
        childElNode,
        "text_b",
      ]);
      expect(mappedArray).toEqual([
        null,
        {
          type: "text",
          value: "text_a",
        },
        childElNode,
        {
          type: "text",
          value: "text_b",
        },
      ]);
    });
  });

  describe("Text Nodes - hString() (Ch_3.6)", () => {
    test("should create VText", () => {
      const vTextNode: VText = hString("login button");
      const expected: VText = {
        type: "text",
        value: "login button",
      };
    });
  });

  describe("Fragment Nodes - hFragment() (Ch_3.7)", () => {
    test("should create VFragment", () => {
      const imgElement: VElement = {
        type: "element",
        tag: "img",
        props: {
          width: 30,
        },
        children: [],
      };
      const vFragmentNode: VFragment = hFragment([
        "caption_text",
        imgElement,
        null,
      ]);

      expect(vFragmentNode).toEqual({
        type: "fragment",
        children: [
          {
            type: "text",
            value: "caption_text",
          },
          imgElement,
        ],
      });
    });
  });
});

/**
 * expectedRes is a Virtual Element which resembles the following HTML structure (i.e., form DOM element with its children)
 *
 * It describes:
 * - what nodes are in the tree and their attributes
 * - the hierarchy of the nodes in the tree
 * - the relative position of the nodes in the tree
 *
 * h() function should ensure that such VElement is created
 *
 * @example
 * <form class="login-form" action="login">
 *   <input type="text" name="user">
 *   <input type="password" name="pass">
 *   <button>Log in</button>
 * </form>
 */
const expectedRes: VElement = {
  type: "element",
  tag: "form",
  props: { class: "login-form", action: "login" },
  children: [
    {
      type: "element",
      tag: "input",
      props: { type: "text", name: "user" },
      children: [],
    },
    {
      type: "element",
      tag: "input",
      props: { type: "text", name: "pass" },
      children: [],
    },
    {
      type: "element",
      tag: "button",
      props: { on: { click: "login" } },
      children: [{ type: "text", value: "Log in" }],
    },
  ],
};

// Ch 3.8 Components: the cornerstone of frontend frameworks
// The most important test of the chapter, since it a complex case of creating a vdom node
describe("Components - h() (Ch_3.8)", () => {
  let inputUser: VElement;
  let inputPass: VElement;
  let buttonLogIn: VElement;

  test("should create form VElement with its children and props", () => {
    inputUser = h("input", { type: "text", name: "user" });
    inputPass = h("input", { type: "text", name: "pass" });
    buttonLogIn = h("button", { on: { click: "login" } }, ["Log in"]);

    const formEl = h("form", { class: "login-form", action: "login" }, [
      inputUser,
      inputPass,
      null,
      buttonLogIn,
    ]);

    expect(formEl).toEqual(expectedRes);
  });
});
