# hull

Frontend Framework

TODO setup eslint
TODO setup github actions
TODO [Optional] setup npm workspaces

## Tech Stack

- Runtime: Node.js
- Package Manager: npm
- Bundler: rollup

## Description
- Frontend Reactive Framework does two important things:
  - renders the UI (taking into consideration the active view and the current state of the application)
  - handles user interaction

TODO why is it called reactive?

- We use "hyperscript" (i.e., h() render functions) to describe the UI
  - the main reason is that it is dynamic and programmable
    - Hyperscript being JavaScript means you can weave your application state directly into the UI structure, which is what reactive frameworks are all about.
- As an interim step the framework generates the virtual DOM out of the hyperscript
- Finally, the Framework mounts the view ❓ into the actual page document by creating real DOM element nodes

TODO how do we handle user interaction
- what is a role of state? what is state manager? what does it consist of? how it is related to creating a view?

## Project Structure

### src/

- runtime/ : Framework (code which runs in the browses)
- loader/ : ...
- compiler/ : Template Compiler (compiles framework specific templates into vdom elements)

### examples/

- todos : the SPA built using the Hull Framework
