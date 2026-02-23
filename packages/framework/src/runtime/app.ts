import { destroyDOM } from "./destroy-dom";
import {
  Dispatcher,
  Reducer,
  UnsubscribeFn,
} from "./dispatcher";
import { VNode } from "./h";
import { mountDOM } from "./mount-dom";

type ApplicationState = Record<string, unknown>;

export type CreateAppParams<
  State,
  Reducers extends Record<string, Reducer<State>>
> = {
  state: State;
  view: (state: State, emit: Function) => VNode;
  reducers: Reducers;
};

// connects dispatcher with renderer (ui management)
interface AppInstance {
  mount(_parentEl: HTMLElement): void;
  unmount(): void;
}

/**
 *
 * @param object which contains:
 * the initial app state
 * the view - a factory which produces a top level component (i.e., a function which returns a vdom tree)
 * reducers - a mapping between application commands and associated pure functions
 *
 * @returns an application instance
 */
export function createApp<
  State extends ApplicationState,
  Reducers extends Record<string, Reducer<State>>
>({
  state,
  view,
  reducers,
}: CreateAppParams<State, Reducers>): AppInstance {
  let parentEl: HTMLElement | null = null;
  let vdom: VNode | null = null;

  const dispatcher = new Dispatcher();

  const subscriptions: UnsubscribeFn[] = [
    dispatcher.registerAfterHandler(renderApp),
  ];

  // TODO ❓ is it correct: event is in this scenario an applicationCommand
  // don't confuse with browser events, this an application event
  // read as: on click 'emit(add todo)'
  function emit(eventName: string, payload: unknown) {
    dispatcher.dispatch(eventName, payload);
  }

  for (const actionCommand in reducers) {
    const reducer = reducers[actionCommand];

    // create applicationCommand handlers as wrapper functions around individual reducers
    // TODO seems that one application command, can have only one reducer associated with it
    const subs = dispatcher.subscribe(actionCommand, (payload) => {
      state = reducer(state, payload);
    });

    subscriptions.push(subs);
  }

  // render the view -> convert virtual DOM into DOM
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
