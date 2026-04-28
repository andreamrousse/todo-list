import './style.css'
import { supabase } from './supabaseClient'

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
    <p class="todo-input__status" id="todo-status" aria-live="polite"></p>
  </section>

  <section class="todo-items" aria-label="Todo items">
    <ul class="todo-items__list" id="todo-list"></ul>
  </section>
</main>
`

const todoForm = document.querySelector('#todo-form')
const todoInput = document.querySelector('#todo-input')
const todoList = document.querySelector('#todo-list')
const todoStatus = document.querySelector('#todo-status')

let todos = []
let isLoading = true

const escapeHtml = (value) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

const setStatus = (message = '', type = '') => {
  todoStatus.textContent = message
  todoStatus.classList.remove('todo-input__status--error', 'todo-input__status--success')

  if (type === 'error') {
    todoStatus.classList.add('todo-input__status--error')
  }

  if (type === 'success') {
    todoStatus.classList.add('todo-input__status--success')
  }
}

const renderTodos = () => {
  if (isLoading) {
    todoList.innerHTML = '<li class="todo-item todo-item--empty">Loading todos...</li>'
    return
  }

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

const loadTodos = async () => {
  isLoading = true
  renderTodos()

  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .order('created_at', { ascending: false })

  isLoading = false

  if (error) {
    setStatus(`Could not load todos: ${error.message}`, 'error')
    renderTodos()
    return
  }

  todos = data ?? []
  setStatus('')
  renderTodos()
}

todoForm.addEventListener('submit', async (event) => {
  event.preventDefault()

  const text = todoInput.value.trim()
  if (!text) {
    todoInput.focus()
    return
  }

  const { data, error } = await supabase
    .from('todos')
    .insert({ text, completed: false })
    .select()
    .single()

  if (error) {
    setStatus(`Could not add todo: ${error.message}`, 'error')
    return
  }

  todos.unshift(data)
  todoInput.value = ''
  todoInput.focus()
  setStatus('Todo added.', 'success')
  renderTodos()
})

todoList.addEventListener('click', async (event) => {
  const target = event.target
  if (!(target instanceof HTMLElement)) return

  const action = target.dataset.action
  const id = target.dataset.id
  if (!action || !id) return

  const index = todos.findIndex((todo) => todo.id === id)
  if (index === -1) return

  if (action === 'toggle') {
    const nextCompleted = !todos[index].completed
    const { error } = await supabase
      .from('todos')
      .update({ completed: nextCompleted })
      .eq('id', id)

    if (error) {
      setStatus(`Could not update todo: ${error.message}`, 'error')
      return
    }

    todos[index].completed = nextCompleted
    setStatus('Todo updated.', 'success')
  }

  if (action === 'delete') {
    const { error } = await supabase.from('todos').delete().eq('id', id)

    if (error) {
      setStatus(`Could not delete todo: ${error.message}`, 'error')
      return
    }

    todos.splice(index, 1)
    setStatus('Todo deleted.', 'success')
  }

  renderTodos()
})

loadTodos()
