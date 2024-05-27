type UnsubscribeFn = Function;

/**
 * Handlers are wrapper functions around reducers functions which change the state
 */
type Handler = Function;

/**
 * Dispatcher connects the application commands with consumer handler functions
 *
 * Application Commands are usually signals derived from the user's interaction with the UI
 * and they specify which handler functions should change the application state
 *
 */
export class Dispatcher {
  #subscriptions = new Map<string, Handler[]>();
  #afterHandlers: Handler[] = [];

  subscribe(
    applicationCommand: ApplicationCommand,
    handler: Function,
  ): UnsubscribeFn {
    if (!this.#subscriptions.has(applicationCommand)) {
      this.#subscriptions.set(applicationCommand, []);
    }

    const handlers = this.#subscriptions.get(applicationCommand) as Handler[];

    if (handlers.includes(handler)) {
      // if consumer handler is already registered create fake unsubscribe fn
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

  registerAfterHandler(handler: Function): UnsubscribeFn {
    this.#afterHandlers.push(handler);

    return () => {
      const idx = this.#afterHandlers.indexOf(handler);
      this.#afterHandlers.splice(idx, 1);
    };
  }

  dispatch(commandName: string, payload: unknown) {
    if (this.#subscriptions.has(commandName) == false) {
      throw new Error(`unknown application command: ${commandName}`);
    }

    const handlers = this.#subscriptions.get(commandName) as Function[];

    handlers.forEach((h) => {
      h(payload);
    });

    this.#afterHandlers.forEach((h) => {
      h();
    });
  }
}

type ApplicationCommand = string;
