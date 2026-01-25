import { describe, it, expect } from "vitest";
import { h, VElement, VFragment, VText } from "./h";
import { Listeners, mountDOM } from "./mount-dom";
import { assert } from "console";
import { destroyDOM } from "./destroy-dom";

// Ch4 - Mounting the virtual DOM
describe("Mounting virtual DOM (Ch_4.1)", () => {
  it("should throw an error if the virtual node is invalid (Ch_4.1.1)", () => {
    const vFakeNode = {
      type: "error",
      message: "don't care",
    };

    // to catch an error inside of expect() we need to execute mountDOM as inside an async fn
    expect(() =>
      mountDOM(vFakeNode as any, document.createElement("body")),
    ).toThrowError();
  });

  it("should mount vdom text node to dom (Ch_4.1.2)", () => {
    const vTextNode: VText = {
      type: "text",
      value: "hello, world!",
    };
    const parentEl = document.createElement("body");

    mountDOM(vTextNode, parentEl);

    // .childNodes returns all nodes which belong to the parent (including text and comment nodes)
    expect(parentEl.childNodes.length).toBe(1);

    const mountedNode = parentEl.childNodes.item(0);
    expect(mountedNode.nodeType).toBe(Node.TEXT_NODE);
    expect(mountedNode.textContent).toBe("hello, world!");

    expect(vTextNode.el).toBe(mountedNode);
  });

  // fragment nodes are an array of children
  // el of a fragment node should point to the parent DOM node
  it("should mount vdom fragment node to dom (Ch_4.1.3)", () => {
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

    const mountedSpanNode = parentEl.childNodes.item(0) as HTMLElement;
    const mountedImgNode = parentEl.childNodes.item(1) as HTMLElement;

    expect(mountedSpanNode.nodeType).toBe(Node.ELEMENT_NODE);
    expect(mountedSpanNode).toBeInstanceOf(HTMLElement);
    expect(mountedSpanNode.tagName).toBe("SPAN");
    expect(mountedSpanNode.textContent).toBe("hello, world!");
    expect(spanVNode.el).toBe(mountedSpanNode);

    expect(mountedImgNode.nodeType).toBe(Node.ELEMENT_NODE);
    expect(mountedImgNode).toBeInstanceOf(HTMLElement);
    expect(mountedImgNode.tagName).toBe("IMG");
    expect(imgVNode.el).toBe(mountedImgNode);
  });

  it("should mount vdom el node to dom (Ch_4.1.4)", () => {
    const parentEl = document.createElement("body");

    const vSpanEl = h("span", {}, ["hello, world!"]);
    const vDivEl = h("div", {}, [vSpanEl]);

    mountDOM(vDivEl, parentEl);

    // ensure that the Node is mounted to the right parent
    expect(parentEl.childNodes.length).toBe(1);
    const mountedDivEl = parentEl.childNodes.item(0) as HTMLElement;

    // ensure that its el reference is correct
    expect(vDivEl.el).toBe(mountedDivEl);

    // ensure that mounted DOM el node is of the right tag
    expect(mountedDivEl.tagName).toBe("DIV");
    expect(mountedDivEl.childNodes.length).toBe(1);
    expect(mountedDivEl.textContent).toBe("hello, world!");

    // ensure that children are mounted
    expect(mountedDivEl.childNodes.length).toBe(1);
    const mountedSpanEl = mountedDivEl.childNodes.item(0);
    expect(vSpanEl.el).toBe(mountedSpanEl);
  });

  it("should ensure that listeners are attached to element when mounting it (Ch_4.1.5)", () => {
    let applicationState: string = "initial state";

    const vSpan: VElement = h(
      "span",
      {
        on: {
          click: () => {
            applicationState = "changed after click";
          },
        },
      },
      ["hello, world!"],
    );

    const parentEl = document.createElement("body");
    mountDOM(vSpan, parentEl);

    // Assert that the 'listeners' property exists and is of the expected type
    const attachedListeners = vSpan.listeners as Listeners;

    expect(attachedListeners).toBeDefined();
    expect(Object.keys(attachedListeners).length).toBe(1);
    expect(attachedListeners["click"]).toBeInstanceOf(Function);

    // Asert that an event triggers the related listener

    // HTMLElement.click() method programmatically dispatches an event and doesn't return a value (it returns void)
    vSpan.el?.click();

    expect(applicationState).toEqual("changed after click");
  });

  it("should set attributes to element when mounting it (Ch_4.1.6)", () => {
    // we set the value of of a prop to corresponding property, i.e., attribute, of the element
    // two special attributes: style and class
    // 1. create vEl with some attributes: style, class, regular html attribute and some custom data-attr
    // 2. ensure that vEl.el (DOM el) contains all relevatn attributes properly set up

    const vInput = h("input", {
      id: "input_1",
      style: {
        border: "1px solid red",
      },
      class: "customInput thickBorder",
    });

    const parentEl = document.createElement("body");

    mountDOM(vInput, parentEl);

    expect(vInput.el?.id).toBe("input_1");
    expect(vInput.el?.style.cssText).toBe("border: 1px solid red;");
    expect(vInput.el?.style.border).toBe("1px solid red");
    expect(vInput.el?.className).toBe("customInput thickBorder");
    expect(vInput.el?.classList.length).toBe(2);
  });
});
