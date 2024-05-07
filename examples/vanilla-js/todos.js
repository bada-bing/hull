// Application State
const todos = ['borrow checker', 'lend money', 'mark down']

const todosList = document.getElementById("todos-list")
const todoInput = document.getElementById("todo-input")
const addTodoButton = document.getElementById("add-todo")

resetUI()

function resetUI() {
    todosList.innerHTML = "";
    todos.forEach(todo => todosList.appendChild(renderTodoInReadMode(todo)))
}

// render - transform the app state into a visual representation
function renderTodoInReadMode(text) {
    const newTodo = document.createElement('li');

    const span = document.createElement('span');
    span.textContent = text

    const button = document.createElement('button')
    button.addEventListener('click', () => {
        const idx = todos.indexOf(text)
        todos.splice(idx, 1)
        todosList.removeChild(button.parentElement)
    })
    button.textContent = "Done"

    newTodo.append(span, button);

    span.addEventListener('dblclick', () => {
        todosList.replaceChild(renderTodoInEditMode(text), span.parentElement)
    })

    return newTodo
}

// add new todo (only if the input has more than 3 characters)
todoInput.addEventListener('input', () => {
    addTodoButton.disabled = todoInput.value?.length < 3
})

todoInput.addEventListener('keydown', ({ key }) => {
    if (key.toLowerCase() === "enter") createNewTodo()
})

addTodoButton.addEventListener('click', createNewTodo)

function createNewTodo() {
    todos.push(todoInput.value)
    resetUI()
}

function renderTodoInEditMode(text) {
    const editTodo = document.createElement('li');

    const input = document.createElement('input');
    input.type = "text"
    input.value = text


    const saveButton = document.createElement('button')
    saveButton.addEventListener('click', () => {
        const idx = todos.indexOf(text)
        todos[idx] = input.value
        todosList.replaceChild(renderTodoInReadMode(todos[idx]), editTodo)
    })
    saveButton.textContent = "Save"

    const cancelButton = document.createElement('button')
    cancelButton.addEventListener('click', () => {
        todosList.replaceChild(renderTodoInReadMode(text), editTodo)
    })
    cancelButton.textContent = "Cancel"

    editTodo.append(input, saveButton, cancelButton);

    return editTodo
}