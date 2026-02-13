const todos = ["Walk the dog", "Water the plants", "Sand the chairs"];

const todosList = document.getElementById("todos-list");
const addTodoInput = document.getElementById('todo-input') as HTMLInputElement
const addTodoButton = document.getElementById('add-todo-btn') as HTMLButtonElement
addTodoButton.disabled = true;

for (const todo of todos) {
  todosList?.append(renderTodoInReadMode(todo));
}

addTodoInput.addEventListener('input', () => {
  addTodoButton.disabled = addTodoInput.value.length < 3
})

addTodoButton.addEventListener("click", () => {
    addTodo()
})

addTodoInput.addEventListener('keydown', ({ key }) => {
  if (key === 'Enter' && addTodoInput.value.length >= 3) {
    addTodo()
  }
})

function renderTodoInReadMode(todo: string): Node {
  const li = document.createElement("li");
  const span = document.createElement("span");
  span.textContent = todo;
  span.addEventListener("dblclick", () => {
    const idx = todos.indexOf(todo);

    todosList?.replaceChild(
      renderTodoInEditMode(todo),
      todosList.children[idx],
    );
  });
  li.appendChild(span);

  const button = document.createElement("button");
  button.textContent = "Done";
  button.addEventListener("click", () => {
    const idx = todos.indexOf(todo);
    removeTodo(idx);
  });
  li.appendChild(button);

  return li;
}

function renderTodoInEditMode(todo: string): Node {
  const li = document.createElement("li");

  const input = document.createElement("input");
  input.type = "text";
  input.value = todo;
  li.appendChild(input);

  const saveBtn = document.createElement("button");
  saveBtn.textContent = "Save";
  saveBtn.addEventListener("click", () => {
    const idx = todos.indexOf(todo);
    updateTodo(idx, input.value);
  });
  li.append(saveBtn);

  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "Cancel";
  cancelBtn.addEventListener("click", () => {
    const idx = todos.indexOf(todo);
    todosList!.replaceChild(
      renderTodoInReadMode(todo),
      todosList!.children[idx],
    );
  });
  li.append(cancelBtn);

  return li;
}

function addTodo() {
    const description = addTodoInput.value || ""

    todos.push(description)
    const todo = renderTodoInReadMode(description)
    todosList?.append(todo)

    addTodoInput.value = ''
    addTodoButton.disabled = true
}

function removeTodo(index: number) {
  todos.splice(index, 1);
  todosList?.children[index].remove();
}

function updateTodo(index, description) {
  todos[index] = description
  const todo = renderTodoInReadMode(description)
  todosList!.replaceChild(todo, todosList!.children[index])
}