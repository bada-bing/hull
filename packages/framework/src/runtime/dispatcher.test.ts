import { describe, expect, it, vitest } from "vitest";
import { Dispatcher, Reducer } from "./dispatcher";

type ApplicationState = { counter: number };

const increaseCounter: Reducer<ApplicationState, number> = (
  currentApplicationState,
  payload,
) => {
  return {
    counter: currentApplicationState.counter + payload,
  };
};

describe("Reducer functions (Ch_5.1.2)", () => {
  it("reducer is pure function", () => {
    // given instance of state
    const applicationState: ApplicationState = {
      counter: 0,
    };
    // when goes through reducer
    const newApplicationState = increaseCounter(applicationState, 2);
    // then result is new instance of state without modifying input
    expect(newApplicationState).not.toBe(applicationState);
    expect(applicationState.counter).toEqual(0);
    expect(newApplicationState.counter).toEqual(2);
  });
});

describe("Dispatcher (Ch_5.1.3)", () => {
  it("calls subscribed handler on dispatch", () => {
    const handler = vitest.fn();
    const d = new Dispatcher();

    d.subscribe("increment-value", handler);
    d.dispatch("increment-value", 2);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenLastCalledWith(2);
  });

  it("removes handler when unsubscribed", () => {
    const handler = vitest.fn();
    const d = new Dispatcher();

    const unsubscribe = d.subscribe("increment-value", handler);
    unsubscribe();

    d.dispatch("increment-value", 2);

    expect(handler).not.toHaveBeenCalled();
  });

  it("does not register the same handler twice", () => {
    const handler = vitest.fn();
    const d = new Dispatcher();

    d.subscribe("increment-value", handler);
    d.subscribe("increment-value", handler);

    d.dispatch("increment-value", 2);

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("calls all handlers subscribed to an application command", () => {
    const h1 = vitest.fn();
    const h2 = vitest.fn();
    const d = new Dispatcher();

    d.subscribe("increment-value", h1);
    d.subscribe("increment-value", h2);

    d.dispatch("increment-value", 2);

    expect(h1).toHaveBeenCalledWith(2);
    expect(h2).toHaveBeenCalledWith(2);
  });

  it("executes 'after-command handlers' last", () => {
    const calls: string[] = [];

    const handler = vitest.fn(() => calls.push("handler"));
    const afterCommandHandler = vitest.fn(() => calls.push("after"));

    const d = new Dispatcher();
    d.subscribe("increment-value", handler);
    d.registerAfterHandler(afterCommandHandler);

    d.dispatch("increment-value", 2);

    expect(calls).toEqual(["handler", "after"]);
  });

  it("throws an error when dispatching an unknown command", () => {
    const d = new Dispatcher();

    expect(() => {
      d.dispatch("unknown-command", 123);
    }).toThrow(/unknown application command/i); // /i is ignore-case flag
  });
});
