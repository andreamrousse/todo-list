import './style.css'

document.querySelector('#app').innerHTML = `
<main class="todo-app">
  <header class="todo-app__header">
    <h1 class="todo-app__title">Todo List</h1>
  </header>

  <section class="todo-input" aria-label="Add a new todo">
    <form class="todo-input__form" id="todo-form">
      <label class="todo-input__label" for="todo-input">New task</label>
      <input
        class="todo-input__field"
        id="todo-input"
        name="todo"
        type="text"
        placeholder="What needs to be done?"
        autocomplete="off"
      />
      <button class="todo-input__button" type="submit">Add</button>
    </form>
  </section>

  <section class="todo-items" aria-label="Todo items">
    <ul class="todo-items__list" id="todo-list"></ul>
  </section>
</main>
`

const todoForm = document.querySelector('#todo-form')
const todoInput = document.querySelector('#todo-input')
const todoList = document.querySelector('#todo-list')

const todos = []

const escapeHtml = (value) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

const renderTodos = () => {
  if (todos.length === 0) {
    todoList.innerHTML =
      '<li class="todo-item todo-item--empty">No todos yet. Add your first task.</li>'
    return
  }

  todoList.innerHTML = todos
    .map(
      (todo) => `
        <li class="todo-item ${todo.completed ? 'todo-item--completed' : ''}">
          <label class="todo-item__content">
            <input
              class="todo-item__checkbox"
              type="checkbox"
              data-action="toggle"
              data-id="${todo.id}"
              ${todo.completed ? 'checked' : ''}
            />
            <span class="todo-item__text">${escapeHtml(todo.text)}</span>
          </label>
          <button
            class="todo-item__delete"
            type="button"
            data-action="delete"
            data-id="${todo.id}"
          >
            Delete
          </button>
        </li>
      `
    )
    .join('')
}

todoForm.addEventListener('submit', (event) => {
  event.preventDefault()

  const text = todoInput.value.trim()
  if (!text) {
    todoInput.focus()
    return
  }

  todos.push({
    id: crypto.randomUUID(),
    text,
    completed: false,
  })

  todoInput.value = ''
  todoInput.focus()
  renderTodos()
})

todoList.addEventListener('click', (event) => {
  const target = event.target
  if (!(target instanceof HTMLElement)) return

  const action = target.dataset.action
  const id = target.dataset.id
  if (!action || !id) return

  const index = todos.findIndex((todo) => todo.id === id)
  if (index === -1) return

  if (action === 'toggle') {
    todos[index].completed = !todos[index].completed
  }

  if (action === 'delete') {
    todos.splice(index, 1)
  }

  renderTodos()
})

renderTodos()
