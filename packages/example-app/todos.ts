import { h } from "../src/runtime/h";
import { CreateAppParams, createApp } from "../src/runtime/app";

const todosView: CreateAppParams["view"] = (state, emit) => {
  const component = h("section", {}, [
    h("h1", {}, ["My Blog"]),
    h("p", {}, ["Welcome to My Blog!"]),
    h(
      "button",
      {
        on: {
          click: () => {
            console.log("clicked the button and liked it");
            emit("click", "test-button");
          },
        },
      },
      ["click me"],
    ),
  ]);

  return component;
};

// Generate App Component and mount it to body

const app = createApp({
  state: {},
  view: todosView,
  reducers: {},
});

let bodyElement = document.body as HTMLBodyElement;
app.mount(bodyElement);
