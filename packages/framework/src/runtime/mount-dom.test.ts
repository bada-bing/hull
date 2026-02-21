import { describe, it, expect } from "vitest";
import { h, hString, VElement, VFragment, VText } from "./h";
import { Listeners, mountDOM, insert } from "./mount-dom";

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

describe("Mounting the DOM at an index (Ch_8.1)", () => {
  describe("insert() (Ch_8.1.1)", () => {
    it("inserts an element at a given index", () => {
      const parent = document.createElement("div");
      const firstChild = document.createElement("p");
      const lastChild = document.createElement("p");
      parent.append(firstChild, lastChild);

      const middleChild = document.createElement("span");
      insert(middleChild, parent, 1);

      expect(parent.childNodes.length).toBe(3);
      expect(parent.childNodes[0]).toBe(firstChild);
      expect(parent.childNodes[1]).toBe(middleChild);
      expect(parent.childNodes[2]).toBe(lastChild);
    });

    it("appends an element if no index is provided", () => {
      const parent = document.createElement("div");
      const p1 = document.createElement("p");
      parent.append(p1);

      const el = document.createElement("span");
      insert(el, parent);

      expect(parent.childNodes.length).toBe(2);
      expect(parent.childNodes[0]).toBe(p1);
      expect(parent.childNodes[1]).toBe(el);
    });

    it("appends an element if index is out of bounds", () => {
      const parent = document.createElement("div");
      const p1 = document.createElement("p");
      parent.append(p1);

      const el = document.createElement("span");
      insert(el, parent, 100);

      expect(parent.childNodes.length).toBe(2);
      expect(parent.childNodes[0]).toBe(p1);
      expect(parent.childNodes[1]).toBe(el);
    });

    it("throws an error for a negative index", () => {
      const parent = document.createElement("div");
      const el = document.createElement("span");

      expect(() => insert(el, parent, -1)).toThrow();
    });
  });

  describe("mountDOM()", ()=>{
    it("mounts a string vnode at a specific index (Ch_8.1.2)", () => {
      const parent = document.createElement("div");
      parent.append("world!");

      const textVNode = hString("hello, ");
      mountDOM(textVNode, parent, 0);

      // Verify the 'el' property is set correctly on the vnode
      expect(textVNode.el).toBe(parent.childNodes[0]);
      expect(textVNode.el?.nodeType).toBe(Node.TEXT_NODE);

      // Verify the content and order of all child nodes
      const childNodeContents = Array.from(parent.childNodes).map(
        (node) => node.textContent,
      );
      expect(childNodeContents).toEqual(["hello, ", "world!"]);
    });

    it("mounts an element vnode at a specific index (Ch_8.1.3)", () => {
      const parent = document.createElement("div");
      const initialChild = document.createElement("p");
      parent.append(initialChild);

      const vEl = h("span", {}, ["hello"]);
      mountDOM(vEl, parent, 0);

      expect(parent.childNodes.length).toBe(2);
      expect(parent.childNodes[0]).toBe(vEl.el);
      expect(parent.childNodes[1]).toBe(initialChild);

      expect(vEl.el?.tagName).toBe("SPAN");
      expect(vEl.el?.textContent).toBe("hello");
    });

    it("mounts a fragment with an index (Ch_8.1.4)", () => {
      const parent = document.createElement("div");
      const p1 = h("p");
      const p2 = h("p")
      mountDOM(p1, parent);
      mountDOM(p2, parent);

      // before mounting fragment node, the second item will be 'P'
      expect(parent.childNodes.length).toBe(2);
      expect((parent.childNodes[0] as HTMLElement).tagName).toBe("P");

      const vFragment: VFragment = {
        type: "fragment",
        children: [h("span", {}, ["world"]), h("img", {}, [])],
      };

      mountDOM(vFragment, parent, 1);
      expect(parent.childNodes.length).toBe(4);
      expect((parent.childNodes[1] as HTMLElement).tagName).toBe("SPAN");
      expect((parent.childNodes[2] as HTMLElement).tagName).toBe("IMG");
      expect(parent.childNodes[0]).toBe(p1.el);
      expect(parent.childNodes[3]).toBe(p2.el);
    });
  });
});
