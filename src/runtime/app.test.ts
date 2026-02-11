import { describe, expect, it } from "vitest";
import { createApp } from "./app";
import { h } from "./h";
import { Reducer } from "./dispatcher";

describe("Application instance - createApp() (Ch_5.2)", () => {
  // ensure that the entry point to the framework provides the expected interface
  it("application instance contains mount and unmount methods (Ch_5.2.1)", () => {
    const app = createApp({
      state: {},
      view: () => h("div", {}, []),
      reducers: {},
    });
    expect(typeof app.mount).toBe("function");
    expect(typeof app.unmount).toBe("function");
  });

  // confirm that the mount() is rendering the application view and attaching it to the DOM
  // confirm that the view is a function of the application state
  it("mounts the view into the parent element (Ch_5.2.2)", () => {
    const app = createApp({
      state: {
        text: "hello, world!",
      },
      view: (state, _emit) => {
        return h("span", {}, [state.text]);
      },
      reducers: {},
    });

    const parentEl = document.createElement("body");

    app.mount(parentEl);

    expect(parentEl.childNodes.length).toBe(1);
    expect(parentEl.innerHTML).toBe("<span>hello, world!</span>");

    app.unmount(); // Clean up DOM after the test.
  });

  /** This test tests multiple concepts related to the interaction between state and view management
   *
   * The goal is to test the outcome, and not the implementation details
   *
   * confirm that an event is emitted (i.e., application command is dispatched)
   * confirm that reducer (i.e., associated command handler) is regisetered
   * confirm that the reducer is executed when an event is emitted (i.e., an action is dispatched)
   * confirm that the command handler is updating the application state
   * confirm that the view is re-rendered when the application state changes
   */
  it("updates the state and re-renders the view when an applicationCommand is dispatched (Ch_5.2.3,5.2.4)", () => {
    type ApplicationState = {
      counter: number;
    };

    const increase_counter: Reducer<ApplicationState, number> = (
      state,
      payload,
    ) => ({
      counter: state.counter + payload,
    });

    const app = createApp({
      state: {
        counter: 0,
      },
      view: (state, emit) => {
        return h("span", { on: { click: () => emit("increase_counter", 1) } }, [
          `counter: ${state?.counter}`,
        ]);
      },
      reducers: {
        increase_counter,
      },
    });

    const parentEl = document.createElement("body");

    app.mount(parentEl);

    expect(parentEl.innerHTML).toBe("<span>counter: 0</span>");
    const span = parentEl.querySelector("span");
    expect(span).not.toBeNull();

    span?.click();
    expect(parentEl.innerHTML).toBe("<span>counter: 1</span>");

    app.unmount();
  });

  /** Ensure that the cleanup is done correctly
   *
   * confirm that innerHtml of DOM element is empty
   * confirm that subscriptions (i.e., application command handlers) are unsubscribed
   */
  it("unmounts the view from the parent element (Ch_5.2.5)", () => {
    let globalSideEffect = 0; // Simulate a potential external side effect

    type ApplicationState = {
      counter: number;
    };

    const increase_counter_with_side_effect: Reducer<
      ApplicationState,
      number
    > = (state, payload) => {
      globalSideEffect += payload; // This is an intentional side effect for testing purposes

      return { counter: state.counter + payload };
    };

    const app = createApp({
      state: {
        counter: 0,
      },

      view: (state, emit) => {
        return h("button", { on: { click: () => emit("increase", 1) } }, [
          `Count: ${state.counter}`,
        ]);
      },

      reducers: {
        increase: increase_counter_with_side_effect,
      },
    });

    const parentEl = document.createElement("body");
    app.mount(parentEl);

    expect(parentEl.innerHTML).toBe("<button>Count: 0</button>");
    expect(globalSideEffect).toBe(0);

    const button = parentEl.querySelector("button");
    button?.click(); // Trigger the event

    expect(parentEl.innerHTML).toBe("<button>Count: 1</button>");
    expect(globalSideEffect).toBe(1); // Side effect should have occurred

    app.unmount(); // Unmount the application

    expect(parentEl.childNodes.length).toBe(0);
    expect(parentEl.innerHTML).toBe("");

    // Attempt to trigger the event again on the detached button
    // The event listener should be gone, so no state change or side effect should occur
    button?.click();

    expect(parentEl.innerHTML).toBe(""); // DOM should remain empty
    expect(globalSideEffect).toBe(1); // globalSideEffect should NOT have increased again
  });
});
