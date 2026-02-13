import { h } from "@hull/framework/runtime/h";
import { CreateAppParams, createApp } from "@hull/framework/runtime/app";

type ApplicationState = {
  inputValue: string;
  todos: string[];
  edit: null | {
    idx: number;
    originalText: string;
    editedText: string;
  };
};
type CreateTodoAppParams = CreateAppParams<ApplicationState>;

const todosAppView: CreateTodoAppParams["view"] = (state, emit) => {
  const component = h("section", {}, [
    h("h1", {}, ["TODO App - Framework V1"]),
    "TODO ",
    h(
      "input",
      {
        value: state.inputValue,
        on: {
          input: (event: InputEvent) => {
            const currentInputValue = (event.target as HTMLInputElement).value;
            emit("update-input-value", currentInputValue);
          },
        },
        disabled: state.edit !== null ? true : null
      },
      [],
    ),
    h(
      "button",
      {
        on: {
          click: (event) => {
            emit("add-todo");
          },
        },
      },
      ["Add"],
    ),
    h("hr", {}, []),
    todosList(state, emit),
  ]);

  return component;
};

// Generate App Component and mount it to body
const app = createApp({
  state: {
    inputValue: "placeholder",
    todos: ["Walk the dog", "Water the plants", "Sand the chairs"],
    edit: null,
  },
  view: todosAppView,
  reducers: {
    "update-input-value": (state, currentValue) => {
      return {
        ...state,
        inputValue: currentValue,
      };
    },
    "add-todo": (state) => {
      const newItem = state.inputValue;
      const initialInputValue = "placeholder";
      state.todos.push(newItem);

      // don't make any changes if the text is shorter than 3 characters
      if (state.inputValue.length < 3) {
        return state;
      }

      return {
        ...state,
        inputValue: initialInputValue,
      };
    },
    "start-editing-todo": (state, idx: number) => {
      const edit = {
        idx,
        originalText: state.todos[idx],
        editedText: state.todos[idx],
      };
      return { ...state, edit };
    },
    "update-editing-todo": (state, newValue: string) => {
      const edit = state.edit;
      edit!.editedText = newValue;
      return {
        ...state,
        edit,
      };
    },
    "save-update-todo": (state) => {
      const todos = state.todos;
      todos[state.edit!.idx] = state.edit!.editedText;
      const edit = null;
      return { ...state, edit, todos };
    },
    "cancel-update-todo": (state) => {
      const todos = state.todos;
      todos[state.edit!.idx] = state.edit!.originalText;
      const edit = null;
      return { ...state, edit, todos };
    },
    "complete-todo": (state, idx: number) =>{
      const todos = [...state.todos]
      todos.splice(idx, 1);
      return {
        ...state,
        todos
      }
    }
  },
});

const bodyElement = document.body;
app.mount(bodyElement);

function todosList(
  state: ApplicationState,
  emit: (eventName: string, payload?: unknown) => void,
) {
  const regularTodo = (text: string) =>
    h(
      "span",
      {
        on: {
          dblclick: (event) => {
            const parentLiElement = (event.target as HTMLElement)
              .parentElement as HTMLLIElement;
            const grandParentElement =
              parentLiElement.parentElement as HTMLUListElement;
            const idx = [
              ...(grandParentElement.childNodes as NodeList),
            ].indexOf(parentLiElement);
            emit("start-editing-todo", idx);
          },
        },
      },
      [text],
    );
  const doneButton = h("button", {
    on: {
      click: (event) => {
        const liElement = (event.target as HTMLButtonElement)!.parentElement as HTMLLIElement;
        const idx = [...(liElement!.parentElement)?.childNodes as NodeList].indexOf(liElement)

        emit("complete-todo", idx);
      }
    }
  }, ["Done"]);
  const saveButton = h(
    "button",
    {
      on: {
        click: (event) => {
          emit("save-update-todo");
        },
      },
    },
    ["Save"],
  );
  const cancelButton = h("button", {
    on: {
      click: (event) => emit("cancel-update-todo")
    }
  }, ["Cancel"]);

  const editTodo = () =>
    h(
      "input",
      {
        value: state.edit!.editedText,
        on: {
          input: (event) => {
            const currentValue = (event.target as HTMLInputElement).value;
            emit("update-editing-todo", currentValue);
          },
        },
      },
      [],
    );

  const taskItem = (text: string, itemIdx: number) => {
    const content =
      state.edit !== null && state.edit.idx === itemIdx
        ? editTodo()
        : regularTodo(text);

    const children = [content];
    if (state.edit !== null && state.edit.idx === itemIdx) {
      children.push(saveButton, cancelButton);
    } else {
      children.push(doneButton);
    }
    // } else {
    //   children.push(saveButton, cancelButton);

    return h("li", {}, children);
  };

  const todoItems = state.todos.map((todo, idx) => taskItem(todo, idx));
  return h("ul", {}, todoItems);
}

