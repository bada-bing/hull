// application instance
// connects dispatcher (state management) with render (ui management)

import { destroyDOM } from "./destroy-dom";
import { Dispatcher } from "./dispatcher";
import { VNode } from "./h";
import { mountDOM } from "./mount-dom";

export type CreateAppParams = {
  state: Record<string, unknown>;
  view: (state: Record<string, unknown>, emit: Function) => VNode;
  reducers: Record<string, Function>;
};

interface AppInstance {
  mount(_parentEl: HTMLElement): void;
  unmount(): void;
}

// this function produces app renderer
// 1. initial app state
// 2. view - top level component (i.e., pure fn which produces the vdom)
export function createApp({
  state,
  view,
  reducers,
}: CreateAppParams): AppInstance {
  let parentEl: HTMLElement | null = null;
  let vdom: VNode | null = null;

  const dispatcher = new Dispatcher();
  const subscriptions = [dispatcher.registerAfterHandler(renderApp)];

  function emit(eventName: string, payload: unknown) {
    dispatcher.dispatch(eventName, payload);
  }

  for (const actionName in reducers) {
    const reducer = reducers[actionName];

    const subs = dispatcher.subscribe(actionName, (payload) => {
      state = reducer(state, payload);
    });

    subscriptions.push(subs);
  }

  function renderApp() {
    if (vdom) destroyDOM(vdom);

    vdom = view(state, emit);
    if (parentEl) mountDOM(vdom, parentEl);
  }

  return {
    mount(_parentEl: HTMLElement) {
      parentEl = _parentEl;
      renderApp();
    },

    unmount() {
      if (vdom) destroyDOM(vdom);
      vdom = null;

      subscriptions.forEach((unsubscribe) => unsubscribe());
    },
  };
}
