import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { defineComponent } from "./component";
import { h, hFragment, VNode } from "./h";

describe("defineComponent (Ch_09)", () => {
  let hostEl: HTMLElement;

  beforeEach(() => {
    hostEl = document.createElement("div");
    document.body.appendChild(hostEl);
  });

  afterEach(() => {
    hostEl.remove();
  });

  describe("Component Rendering (Ch_09.2)", () => {
    test("mounts, updates and unmounts a component", () => {
      const CounterComponent = defineComponent({
        initialState: () => ({ count: 0 }),
        viewFunction: function (): VNode {
          return h("div", {}, [h("span", {}, [`Count: ${this.state.count}`])]);
        },
      });

      const counter = new CounterComponent({});

      expect(hostEl.innerHTML).toBe(""); // Ensure hostEl is empty before mounting

      counter.mount(hostEl);
      expect(hostEl.querySelector("span")?.textContent).toBe("Count: 0");

      counter.updateState({ count: 1 });
      expect(hostEl.querySelector("span")?.textContent).toBe("Count: 1");

      counter.unmount();
      expect(hostEl.innerHTML).toBe("");
    });

    test("throws error if mounted twice or unmounted when not mounted", () => {
      const MyComponent = defineComponent({
        initialState: () => ({}),
        viewFunction: () => h("div"),
      });
      const component = new MyComponent({});

      expect(() => component.unmount()).toThrow("Component is not mounted!");

      component.mount(hostEl);
      expect(hostEl.querySelector("div")).not.toBe(null);
      
      expect(() => component.mount(hostEl)).toThrow(
        "Component is already mounted!",
      );

      component.unmount();
      expect(hostEl.innerHTML).toBe("");
      
      expect(() => component.unmount()).toThrow("Component is not mounted!");
    });
  });

  describe("Component State (Ch_09.3)", () => {
    test("initializes state from props and renderes state data in the view (Ch_09.3)", () => {
      const GreetingComponent = defineComponent({
        initialState: (props: { name: string }) => ({
          message: `Hello, ${props.name}`,
        }),
        viewFunction: function () {
          return h("p", {}, [this.state.message]);
        },
      });

      const component = new GreetingComponent({ name: "World" });
      component.mount(hostEl);

      expect(hostEl.querySelector("p")?.textContent).toBe("Hello, World");
    });

    test("registers event listener which updates the state (Ch_09.3.1)", () => {
      const Counter = defineComponent({
        initialState: () => ({ count: 0 }),
        viewFunction: function () {
          return h("div", {}, [
            h("span", {}, [`${this.state.count}`]),
            h(
              "button",
              {
                on: {
                  click: () => {
                    this.updateState({ count: this.state.count + 1 });
                  },
                },
              },
              ["+"],
            ),
          ]);
        },
      });

      const component = new Counter({});
      component.mount(hostEl, null);

      expect(hostEl.querySelector("span")?.textContent).toBe("0");

      const button = hostEl.querySelector("button")!;
      button.click();

      expect(hostEl.querySelector("span")?.textContent).toBe("1");
    });
  });

  describe("Offset (Ch_09.3.3, 09.3.4)", () => {
    test("returns the correct offset for a fragment component (Ch_09.3)", () => {
      const FragmentComponent = defineComponent({
        initialState: () => ({}),
        viewFunction: function () {
          return hFragment([
            h("span", {}, ["Span 1"]),
            h("p", {}, ["Paragraph 1"]),
          ]);
        },
      });

      // Add some preceding sibling nodes to hostEl
      const preExistingDiv = document.createElement("div");
      preExistingDiv.textContent = "Pre-existing div";
      hostEl.appendChild(preExistingDiv);

      const component = new FragmentComponent({});
      component.mount(hostEl);

      // The hostEl DOM now contains: [div, span, p]
      // The first element of the component (span) should be at index 1
      expect(component.offset).toBe(1);
      expect(component.firstElement).toBe(hostEl.children[1]);

      component.unmount();
      expect(hostEl.innerHTML).toBe("<div>Pre-existing div</div>");
    });

    test("returns 0 offset for a single element component (Ch_09.3)", () => {
      const SingleElementComponent = defineComponent({
        initialState: () => ({}),
        viewFunction: function () {
          return h("div", {}, ["Single Element"]);
        },
      });

      const component = new SingleElementComponent({});
      component.mount(hostEl, null); // Mounts directly into hostEl

      // The hostEl now contains: [div]
      // The single element of the component should be at index 0
      expect(component.offset).toBe(0);
      expect(component.firstElement).toBe(hostEl.children[0]);

      component.unmount();
      expect(hostEl.innerHTML).toBe("");
    });

    test("verifies 'elements', 'firstElement' and 'offset' getters for a multi-element fragment", () => {
      const MultiElementFragmentComponent = defineComponent({
        initialState: () => ({}),
        viewFunction: function () {
          return hFragment([
            h("span", { id: "span1" }, ["Span 1"]),
            h("span", { id: "span2" }, ["Span 2"]),
            h("p", { id: "p1" }, ["Paragraph 1"]),
          ]);
        },
      });

      // Add some preceding sibling nodes to hostEl
      const preExistingDiv = document.createElement("div");
      preExistingDiv.textContent = "Pre-existing div";
      hostEl.appendChild(preExistingDiv);

      const component = new MultiElementFragmentComponent({});
      expect(component.elements).toEqual([]);
      component.mount(hostEl);

      // Verify offset
      // The hostEl DOM now contains: [div (preExisting), span1, span2, p1]
      // The first element of the component (span1) should be at index 1
      expect(component.offset).toBe(1);

      // Verify firstElement
      expect(component.firstElement).toBe(hostEl.querySelector("#span1"));
      expect(component.firstElement?.textContent).toBe("Span 1");

      // Verify elements
      const expectedElements = [
        hostEl.querySelector("#span1"),
        hostEl.querySelector("#span2"),
        hostEl.querySelector("#p1"),
      ];
      expect(component.elements).toEqual(expectedElements);
      expect(component.elements.length).toBe(3);

      component.unmount();
      expect(hostEl.innerHTML).toBe("<div>Pre-existing div</div>");
    });

    //TODO ensure that you tested that offset really places the child nodes in correct place when patching DOM
  });
});
