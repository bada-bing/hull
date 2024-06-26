import { describe, test, expect, assert } from "vitest";
import { type VElement, type VText, h } from "./h";
import { _notNull } from "./arrays";

/**
 * Virtual Element which resembles the following HTML structure (i.e., form DOM element with its children).
 *
 * h() function should ensure that such VElement is created.
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

describe("h", () => {
  let inputUser: VElement;
  let inputPass: VElement;
  let buttonLogIn: VElement;

  test("should create form VElement with its children and props", () => {
    inputUser = createVElement("input", { type: "text", name: "user" });
    inputPass = createVElement("input", { type: "text", name: "pass" });
    buttonLogIn = createVElement("button", { on: { click: "login" } }, [
      "Log in",
    ]);

    const formEl = createVElement(
      "form",
      { class: "login-form", action: "login" },
      [inputUser, inputPass, null, buttonLogIn],
    );

    expect(formEl).toEqual(expectedRes);
  });

  function createVElement(
    tag: string,
    props: {},
    children?: (string | VElement | null)[],
  ) {
    const el = h(tag, props, children);

    let expChildren: (VElement | VText)[] = [];

    if (children) {
      expChildren = children.filter(_notNull).map((child) => {
        return typeof child === "string"
          ? ({ type: "text", value: child } as const)
          : child;
      });
    }

    const expected = {
      type: "element",
      tag,
      props,
      children: expChildren,
    } as const;

    assert.deepEqual(el, expected, `Child of type ${tag}`);

    return el;
  }
});
