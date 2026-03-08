import { describe, test, expect, vi } from "vitest";
import { findIndexInParent, patchDOM } from "./patch-dom";
import { h, hFragment, hString } from "./h";
import { mountDOM } from "./mount-dom";

describe("patching the DOM (Ch_8.2)", () => {
  describe("subtree change (Ch_8.2.3)", () => {
    describe("findIndexInParent()", () => {
      test("returns the correct index for a child node", () => {
        const parent = document.createElement("div");

        const child1 = document.createElement("span");
        const child2 = document.createTextNode("Hello");
        const child3 = document.createElement("p");

        parent.appendChild(child1);
        parent.appendChild(child2);
        parent.appendChild(child3);

        expect(findIndexInParent(parent, child1)).toBe(0);
        expect(findIndexInParent(parent, child2)).toBe(1);
        expect(findIndexInParent(parent, child3)).toBe(2);
      });

      test("returns null when the node is not a child of the parent", () => {
        const parent = document.createElement("div");
        const orphanNode = document.createElement("a");

        expect(findIndexInParent(parent, orphanNode)).toBeNull();
      });
    });

    describe("patchDOM() - replacing nodes", () => {
      test("replaces a node with a different type", () => {
        const parentEl = document.createElement("div");
        const oldNode = h("div");
        mountDOM(oldNode, parentEl);
        expect(parentEl.innerHTML).toBe("<div></div>");

        const newNode = hString("hello world");
        patchDOM(oldNode, newNode, parentEl);

        expect(parentEl.innerHTML).toBe("hello world");
      });

      test("replaces an element node when tags are different", () => {
        const parentEl = document.createElement("body");
        const oldEl = h("p", {}, ["hello, world!"]);

        mountDOM(oldEl, parentEl);

        expect(parentEl.children.length).toBe(1);
        expect(parentEl.innerText).toEqual("hello, world!");
        expect(parentEl.innerHTML).toEqual("<p>hello, world!</p>");

        const newEl = h("input", { value: "placeholder" }, []);
        patchDOM(oldEl, newEl, parentEl);

        expect(parentEl.children.length).toBe(1);
        expect(parentEl.innerText).toEqual("");
        expect((parentEl.children[0] as HTMLInputElement).tagName).toBe("INPUT");
        expect((parentEl.children[0] as HTMLInputElement).value).toBe("placeholder");
      });

      test("replaces a node and maintains position", () => {
        const parentEl = document.createElement("div");
        const oldVdom = hFragment([
          h("span", {}, ["one"]),
          h("p", {}, ["two"]),
          h("i", {}, ["three"]),
        ]);
        mountDOM(oldVdom, parentEl);

        expect(parentEl.innerHTML).toBe(
          "<span>one</span><p>two</p><i>three</i>",
        );

        const oldNodeToReplace = oldVdom.children[1];
        const newNode = h("strong", {}, ["new two"]);

        patchDOM(oldNodeToReplace, newNode, parentEl);

        expect(parentEl.innerHTML).toBe(
          "<span>one</span><strong>new two</strong><i>three</i>",
        );
      });
    });
  });

  describe("patching text (Ch_8.2.4", ()=>{
    test("updates the text content of a text node", () => {
      const parentEl = document.createElement("div");
      const oldNode = hString("Hello");
      mountDOM(oldNode, parentEl);
      expect(parentEl.innerHTML).toBe("Hello");

      const newNode = hString("Hello World");
      patchDOM(oldNode, newNode, parentEl);

      expect(parentEl.innerHTML).toBe("Hello World");
      // Also check if newNode.el is correctly assigned
      expect(newNode.el).toBe(oldNode.el);
      expect(newNode.el?.nodeValue).toBe("Hello World");
    });

    test("does not update the text content if it's the same", () => {
      const parentEl = document.createElement("div");
      const initialText = "Same text";
      const oldNode = hString(initialText);
      mountDOM(oldNode, parentEl);
      expect(parentEl.innerHTML).toBe(initialText);

      // Store a reference to the original text node to ensure it's the same object
      const originalTextNode = oldNode.el;

      const newNode = hString(initialText);
      patchDOM(oldNode, newNode, parentEl);

      expect(parentEl.innerHTML).toBe(initialText);
      expect(newNode.el).toBe(originalTextNode); // Ensure it's the same DOM node instance
      expect(newNode.el?.nodeValue).toBe(initialText);
    });

    test("throws an error if oldNode.el is undefined when patching text", () => {
      const parentEl = document.createElement("div");
      const oldNode = hString("initial"); // This node is not mounted, so oldNode.el will be undefined
      const newNode = hString("updated");

      // We expect patchDOM to throw when oldNode.el is null/undefined
      expect(() => patchDOM(oldNode, newNode, parentEl)).toThrow(
        "old text node in DOM is undefined"
      );
    });
  })

  describe("patching elements (Ch_8.2.5)", ()=>{
    describe("patchAttributes", () => {
            test("adds a new attribute", () => {
        const parentEl = document.createElement("div");
        const oldNode = h("div", {});
        mountDOM(oldNode, parentEl);

        const newNode = h("div", { id: "foo" });
        patchDOM(oldNode, newNode, parentEl);

        expect(newNode.el!.id).toBe("foo");
      });

      test("removes an old attribute", () => {
        const parentEl = document.createElement("div");
        const oldNode = h("div", { id: "foo" });
        mountDOM(oldNode, parentEl);

        const newNode = h("div", {});
        patchDOM(oldNode, newNode, parentEl);

        expect(newNode.el!.hasAttribute("id")).toBe(false);
      });

      test("updates an existing attribute", () => {
        const parentEl = document.createElement("div");
        const oldNode = h("div", { "data-foo": "bar" });
        mountDOM(oldNode, parentEl);

        const newNode = h("div", { "data-foo": "baz" });
        patchDOM(oldNode, newNode, parentEl);

        expect(newNode.el!.getAttribute("data-foo")).toBe("baz");
      });
    });

    describe("patchingClasses", () => {
      test("adds new classes", () => {
        const parentEl = document.createElement("div");
        const oldNode = h("div", { class: "foo" });
        mountDOM(oldNode, parentEl);
        expect(oldNode.el!.className).toBe("foo");

        const newNode = h("div", { class: "foo bar" });
        patchDOM(oldNode, newNode, parentEl);

        expect(newNode.el!.className).toBe("foo bar");
      });

      test("removes old classes", () => {
        const parentEl = document.createElement("div");
        const oldNode = h("div", { class: "foo bar" });
        mountDOM(oldNode, parentEl);
        expect(oldNode.el!.className).toBe("foo bar");

        const newNode = h("div", { class: "foo" });
        patchDOM(oldNode, newNode, parentEl);

        expect(newNode.el!.className).toBe("foo");
      });

      test("handles string and array formats", () => {
        const parentEl = document.createElement("div");
        const oldNode = h("div", { class: "foo bar" }); // string
        mountDOM(oldNode, parentEl);

        const newNode = h("div", { class: ["foo", "baz"] }); // array
        patchDOM(oldNode, newNode, parentEl);

        expect(newNode.el!.className).toBe("foo baz");
      });
    });

    describe("patchingStyles", () => {
      test("adds new styles", () => {
        const parentEl = document.createElement("div");
        const oldNode = h("div", { style: { color: "red" } });
        mountDOM(oldNode, parentEl);
        expect(oldNode.el!.style.color).toBe("red");

        const newNode = h("div", { style: { color: "red", fontSize: "16px" } });
        patchDOM(oldNode, newNode, parentEl);

        expect(newNode.el!.style.color).toBe("red");
        expect(newNode.el!.style.fontSize).toBe("16px");
      });

      test("removes old styles", () => {
        const parentEl = document.createElement("div");
        const oldNode = h("div", { style: { color: "red", fontSize: "16px" } });
        mountDOM(oldNode, parentEl);

        const newNode = h("div", { style: { color: "red" } });
        patchDOM(oldNode, newNode, parentEl);

        expect(newNode.el!.style.fontSize).toBe("");
      });

      test("updates existing styles", () => {
        const parentEl = document.createElement("div");
        const oldNode = h("div", { style: { color: "red" } });
        mountDOM(oldNode, parentEl);

        const newNode = h("div", { style: { color: "blue" } });
        patchDOM(oldNode, newNode, parentEl);

        expect(newNode.el!.style.color).toBe("blue");
      });
    });

    describe("patchingEventListeners", () => {
      test("adds new event listeners", () => {        
        const oldNode = h("button");
        const parentEl = document.createElement("div");
        mountDOM(oldNode, parentEl);

        const handleClick = vi.fn();
        const newNode = h("button", { on: { click: handleClick } });
        patchDOM(oldNode, newNode, parentEl);
        
        (newNode.el as HTMLButtonElement).click();

        expect(handleClick).toHaveBeenCalledTimes(1);
      });

      test("removes an old event listener", () => {
        const handleClick = vi.fn();
        const oldNode = h("button", { on: { click: handleClick } });
        const newNode = h("button", {});
        const parentEl = document.createElement("div");
        mountDOM(oldNode, parentEl);

        (oldNode.el as HTMLButtonElement).click();
        expect(handleClick).toHaveBeenCalledTimes(1);

        patchDOM(oldNode, newNode, parentEl);
        (newNode.el as HTMLButtonElement).click();

        expect(handleClick).toHaveBeenCalledTimes(1);
      });

      test("updates an existing event listener", () => {
        const oldHandleClick = vi.fn();
        const newHandleClick = vi.fn();
        const oldNode = h("button", { on: { click: oldHandleClick } });
        const newNode = h("button", { on: { click: newHandleClick } });
        const parentEl = document.createElement("div");
        mountDOM(oldNode, parentEl);

        patchDOM(oldNode, newNode, parentEl);
        (newNode.el as HTMLButtonElement).click();

        expect(oldHandleClick).not.toHaveBeenCalled();
        expect(newHandleClick).toHaveBeenCalledTimes(1);
      });
    });
  })

  describe("patching children (Ch_8.2.6)", () => {
    test("adds children to an element", () => {
      const parentEl = document.createElement("div");
      const oldNode = h("div", {});
      mountDOM(oldNode, parentEl);
      expect(parentEl.children[0].childNodes.length).toBe(0);

      const newNode = h("div", {}, [h("span", {}, ["Hello, "]), "World!"]);
      patchDOM(oldNode, newNode, parentEl);

      const patchedDIV = parentEl.children[0];

      expect(patchedDIV.childNodes.length).toBe(2); // one element, one text

      // Check the <span> element
      const spanElement = patchedDIV.childNodes[0] as HTMLElement;
      expect(spanElement.tagName).toBe("SPAN");
      expect(spanElement.textContent).toBe("Hello, ");

      // Check the text node
      const textNode = patchedDIV.childNodes[1];
      expect(textNode.nodeValue).toBe("World!");

      // Also check the full text content of the parent
      expect(patchedDIV.textContent).toBe("Hello, World!");
    });

    test("removes all children from an element", () => {
      const parentEl = document.createElement("div");
      const oldNode = h("div", {}, [
        h("span", {}, ["Hello"]),
        h("span", {}, ["World"]),
      ]);
      mountDOM(oldNode, parentEl);
      expect(parentEl.children[0].children.length).toBe(2);

      const newNode = h("div", {});
      patchDOM(oldNode, newNode, parentEl);
      expect(parentEl.children[0].children.length).toBe(0);
    });

    test("reorders children - MOVE", () => {
      const parentEl = document.createElement("div");
      const oldNode = h("div", {}, [
        h("span", {}, ["A"]),
        h("span", {}, ["B"]),
        h("span", {}, ["C"]),
      ]);
      mountDOM(oldNode, parentEl);
      expect(parentEl.children[0].textContent).toBe("ABC");

      const newNode = h("div", {}, [
        h("span", {}, ["C"]),
        h("span", {}, ["A"]),
        h("span", {}, ["B"]),
      ]);
      patchDOM(oldNode, newNode, parentEl);
      expect(parentEl.children[0].textContent).toBe("CAB");
    });

    test("updates a child in place - NOOP", () => {
      const parentEl = document.createElement("div");
      const oldNode = h("div", {}, [h("span", { id: "foo" }, ["A"])]);
      mountDOM(oldNode, parentEl);
      expect(parentEl.children[0].children[0].id).toBe("foo");

      const newNode = h("div", {}, [h("span", { id: "bar" }, ["B"])]);
      patchDOM(oldNode, newNode, parentEl);

      const child = parentEl.children[0].children[0];
      expect(child.id).toBe("bar");
      expect(child.textContent).toBe("B");
    });

    test("handles a complex mix of operations", () => {
      const parentEl = document.createElement("div");
      const oldNode = h("div", {}, [
        h("span", {}, ["A"]),
        h("span", {}, ["B"]),
        h("span", {}, ["C"]),
        h("span", {}, ["D"]),
        h("span", {}, ["E"]),
      ]);
      mountDOM(oldNode, parentEl);

      const newNode = h("div", {}, [
        h("span", {}, ["A"]), // noop
        h("p", {}, ["F"]), // add
        h("span", {}, ["C"]), // move
        h("strong", {}, ["G"]), // add
        h("span", {}, ["B"]), // move
      ]);
      patchDOM(oldNode, newNode, parentEl);

      const root = parentEl.children[0];
      expect(root.children.length).toBe(5);
      expect(root.textContent).toBe("AFCGB");
      expect(root.children[0].tagName).toBe("SPAN");
      expect(root.children[1].tagName).toBe("P");
      expect(root.children[2].tagName).toBe("SPAN");
      expect(root.children[3].tagName).toBe("STRONG");
      expect(root.children[4].tagName).toBe("SPAN");
    });
  });
});
