export type ApplicationCommand = string;

export type Reducer<State, Payload = unknown> = (
  applicationState: Readonly<State>,
  payload: Payload,
) => State;

/**
 * Handlers are wrapper functions around reducers functions which change the state
 * They are consumers: they consume the payload of an application command
 * They return nothing, but they do mutate the application state
 */
type Handler<T = unknown> = (payload: T) => void;
type AfterCommandHandler = Function;
export type UnsubscribeFn = Function;

/**
 * Dispatcher connects the application commands with consumer handler functions
 *
 * Application Commands are usually signals derived from the user's interaction with the UI
 * and they specify which handler functions should change the application state
 *
 */
export class Dispatcher {
  // # is used in JS (ES2020) for private properties.
  // In comparison to TS's `private` access modifier it stays private in runtime as well.

  #subscriptions = new Map<ApplicationCommand, Handler[]>();
  // after-command handlers run after all consumers of a command run
  #afterCommandHandlers: AfterCommandHandler[] = [];

  subscribe(
    applicationCommand: ApplicationCommand,
    handler: Handler,
  ): UnsubscribeFn {
    if (!this.#subscriptions.has(applicationCommand)) {
      this.#subscriptions.set(applicationCommand, []);
    }

    const handlers = this.#subscriptions.get(applicationCommand) as Handler[];

    if (handlers.includes(handler)) {
      // if consumer handler is already registered create empty unsubscribe fn
      // we do this to avoid unexpected behavior if the application code tries to unregister the same handler multiple times
      return () => {};
    } else {
      handlers.push(handler);

      // else return unsubscribe fn to unregister (i.e., remove) handler
      return () => {
        const idx = handlers.indexOf(handler);
        handlers.splice(idx, 1);
      };
    }
  }

  // afterEveryCommand
  registerAfterHandler(handler: AfterCommandHandler): UnsubscribeFn {
    this.#afterCommandHandlers.push(handler);

    return () => {
      const idx = this.#afterCommandHandlers.indexOf(handler);
      this.#afterCommandHandlers.splice(idx, 1);
    };
  }

  dispatch(commandName: ApplicationCommand, payload: unknown) {
    if (this.#subscriptions.has(commandName) == false) {
      throw new Error(`unknown application command: ${commandName}`);
    }

    const handlers = this.#subscriptions.get(commandName) as Function[];

    handlers.forEach((h) => {
      h(payload);
    });

    this.#afterCommandHandlers.forEach((h) => {
      h();
    });
  }
}
