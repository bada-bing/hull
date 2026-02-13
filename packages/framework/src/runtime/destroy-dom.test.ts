import { describe, expect, it } from "vitest";
import { Listeners, mountDOM } from "./mount-dom";
import { destroyDOM } from "./destroy-dom";
import { h, VFragment, VText } from "./h";

describe("Destroying DOM (Ch_4.2)", () => {
  it("should destroy text DOM node (Ch_4.2.1)", () => {
    const vTextNode: VText = {
      type: "text",
      value: "hello, world!",
    };
    const parentEl = document.createElement("body");

    mountDOM(vTextNode, parentEl);

    expect(parentEl.childNodes.length).toBe(1);

    destroyDOM(vTextNode);

    expect(parentEl.childNodes.length).toBe(0);
    expect(vTextNode.el).toBeUndefined();
  });

  it("should destroy element DOM node (Ch_4.2.2)", () => {
    const parentEl = document.createElement("body");

    const vSpanEl = h("span", {}, ["hello, world!"]);
    const vDivEl = h("div", { on: { click: () => "cliicked" } }, [vSpanEl]);

    mountDOM(vDivEl, parentEl);

    expect(parentEl.childNodes.length).toBe(1);
    const mountedDivEl = parentEl.childNodes.item(0) as HTMLElement;

    expect(mountedDivEl.childNodes.length).toBe(1);

    expect(Object.keys(vDivEl.listeners as Listeners).length).toBe(1);

    destroyDOM(vDivEl);

    expect(parentEl.childNodes.length).toBe(0);

    expect(vSpanEl.el).toBeUndefined();
    expect(vDivEl.listeners).toBeUndefined();
    expect(vDivEl.el).toBeUndefined();
  });

  it("should destroy fragment DOM node", () => {
    const parentEl = document.createElement("body");

    const spanVNode = h("span", {}, ["hello, world!"]);
    const imgVNode = h("img", {}, []);

    const vFragmentNode: VFragment = {
      type: "fragment",
      children: [spanVNode, imgVNode],
    };

    mountDOM(vFragmentNode, parentEl);

    expect(parentEl.childNodes.length).toBe(2);
    expect(vFragmentNode.el).toBe(parentEl);

    destroyDOM(vFragmentNode);

    expect(parentEl.childNodes.length).toBe(0);
    expect(vFragmentNode.el).toBeUndefined();
    expect(imgVNode.el).toBeUndefined();
    expect(spanVNode.el).toBeUndefined();
  });
});
