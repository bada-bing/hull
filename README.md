# hull

## Architecture & Data Flow

The architecture of the framework is essentially a **unidirectional data flow** (very similar to the Elm architecture or Redux/React paradigms).

### The Architecture Diagram

```text
=============================================================================
                           1. INITIALIZATION Phase
=============================================================================
 
 [ Application (e.g. todos.ts) ]
      |
      | createApp({ state, view, reducers })
      v
 [ Framework (app.ts) ] 
      |
      | app.mount(document.body)
      v
 (Triggers Initial Render)

=============================================================================
                           2. RENDER Phase
=============================================================================

                   +-----------------------+
                   |     Current State     |
                   +-----------+-----------+
                               |
                               v (state, emit)
                   +-----------------------+
                   |    View Function      | <--- The application view &
                   |                       |      hyperscript h() functions
                   +-----------+-----------+
                               |
                               v Returns Virtual DOM (VNodes)
                   +-----------------------+
                   |      renderApp()      | <--- Framework (app.ts)
                   | destroyDOM/mountDOM   | 
                   +-----------+-----------+
                               |
                               v 
                   +-----------------------+
                   |      Browser DOM      | <--- The actual HTML the user sees
                   +-----------------------+

=============================================================================
                     3. INTERACTION & UPDATE Phase
=============================================================================

 [ Browser DOM ] --- 1. User interacts (clicks, types)
      |
      v
 [ Event Listeners ] --- 2. Triggers `emit("command-name", payload)`
 (Defined in view)
      |
      v
 [ Dispatcher ] --- 3. Looks up the command name in the reducers map
 (dispatcher.ts)
      |
      v
 [ Reducer ] --- 4. Takes current state + payload, returns NEW state
      |
      v
 [ Dispatcher ] --- 5. Updates the App state, runs `afterCommandHandlers`
      |
      v
 [ renderApp() ] --- 6. Triggers Phase 2 (RENDER phase) all over again!
 (app.ts)               using the NEW state to build a NEW virtual DOM
```

### How the Flow Works Step-by-Step

**1. The Setup (Initialization):**
When you call `createApp(...)`, the framework sets up the `Dispatcher`. It binds all specific application commands (like `"add-todo"`) to the provided reducer functions. It also registers a special hook: whenever a command finishes running, the dispatcher will call `renderApp()`. Finally, `app.mount(bodyElement)` kicks off the very first render.

**2. Drawing the UI (The Render Phase):**
Inside `app.ts`, `renderApp()` is called. It passes the initial state and the `emit` function into the view.
The view evaluates the state and uses the `h(...)` functions (hyperscript) to build out a **Virtual DOM** (a lightweight javascript object tree describing what the UI *should* look like). The framework takes this tree, runs `mountDOM`, and creates actual `HTMLElement`s on the browser page.

**3. Reactivity (The Interaction Phase):**
When the user interacts with the page:
1. A DOM event fires (like `InputEvent`).
2. The listener catches it and calls `emit("update-input-value", currentInputValue)`.
3. The `Dispatcher` receives this application command. It runs the reducer, replacing the state with the new values.
4. Because the state was updated, the Dispatcher automatically runs its `afterCommandHandlers`. 
5. The `renderApp()` function runs again! It destroys the old DOM, passes the *new* state to the view, generates a *new* Virtual DOM, and mounts the updated UI to the screen.

## Project Structure

### src/

- runtime/ : Framework (code which runs in the browses)
- loader/ : ...
- compiler/ : Template Compiler (compiles framework specific templates into vdom elements)

### examples/

- todos : the SPA built using the Hull Framework
