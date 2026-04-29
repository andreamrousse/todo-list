import './style.css'
import {
  ensureSession,
  getCurrentUser,
  signInWithEmail,
  signOut,
  signUpWithEmail,
  supabase
} from './supabaseClient'

document.querySelector('#app').innerHTML = `
<main class="todo-app">
  <header class="todo-app__header">
    <h1 class="todo-app__title">Todo List</h1>
    <p class="todo-app__subtitle" id="auth-description"></p>
    <div class="todo-app__auth-actions">
      <button class="todo-app__auth-button" type="button" id="open-auth-modal">
        Log in
      </button>
      <button class="todo-app__auth-button todo-app__auth-button--ghost" type="button" id="auth-logout">
        Log out
      </button>
    </div>
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
      <select class="todo-input__priority" id="todo-priority" name="priority" aria-label="Priority">
        <option value="high">High</option>
        <option value="medium" selected>Medium</option>
        <option value="low">Low</option>
      </select>
      <button class="todo-input__button" type="submit">Add</button>
    </form>
    <p class="todo-input__status" id="todo-status" aria-live="polite"></p>
  </section>

  <section class="todo-items" aria-label="Todo items">
    <div class="todo-items__toolbar">
      <div class="todo-filter" id="todo-filter" role="group" aria-label="Filter by priority">
        <button class="todo-filter__button todo-filter__button--active" data-filter="all">All</button>
        <button class="todo-filter__button" data-filter="high">High</button>
        <button class="todo-filter__button" data-filter="medium">Medium</button>
        <button class="todo-filter__button" data-filter="low">Low</button>
      </div>
      <div class="todo-search-wrapper">
        <div class="todo-search" id="todo-search-panel">
          <input
            class="todo-search__input"
            id="todo-search"
            type="search"
            placeholder="Search tasks..."
            autocomplete="off"
            aria-label="Search tasks"
          />
        </div>
        <button
          class="todo-items__search-toggle"
          id="todo-search-toggle"
          type="button"
          aria-label="Toggle search"
          aria-expanded="false"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
            <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" stroke-width="1.5"/>
            <path d="M10.5 10.5L14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    </div>
    <ul class="todo-items__list" id="todo-list"></ul>
  </section>
</main>

<section class="auth-modal" id="auth-modal" aria-label="Authentication">
  <div class="auth-modal__backdrop"></div>
  <div class="auth-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
    <h2 class="auth-modal__title" id="auth-modal-title">Welcome</h2>
    <p class="auth-modal__description">Log in or create an account. You can also continue as a guest.</p>
    <form class="auth-modal__form" id="auth-form">
      <label class="auth-modal__label" for="auth-email">Email</label>
      <input class="auth-modal__field" id="auth-email" name="email" type="email" autocomplete="email" />
      <label class="auth-modal__label" for="auth-password">Password</label>
      <input
        class="auth-modal__field"
        id="auth-password"
        name="password"
        type="password"
        autocomplete="current-password"
      />
      <div class="auth-modal__actions">
        <button class="auth-modal__button auth-modal__button--primary" type="submit" data-auth-action="login">
          Log in
        </button>
        <button class="auth-modal__button auth-modal__button--secondary" type="submit" data-auth-action="signup">
          Create account
        </button>
      </div>
    </form>
    <button class="auth-modal__button auth-modal__button--ghost" type="button" id="continue-guest">
      Continue as guest
    </button>
    <p class="auth-modal__status" id="auth-status" aria-live="polite"></p>
  </div>
</section>
`

const todoForm = document.querySelector('#todo-form')
const todoInput = document.querySelector('#todo-input')
const todoPrioritySelect = document.querySelector('#todo-priority')
const todoSearchToggle = document.querySelector('#todo-search-toggle')
const todoSearchPanel = document.querySelector('#todo-search-panel')
const todoSearchInput = document.querySelector('#todo-search')
const todoFilter = document.querySelector('#todo-filter')
const todoList = document.querySelector('#todo-list')
const todoStatus = document.querySelector('#todo-status')
const authForm = document.querySelector('#auth-form')
const authEmailInput = document.querySelector('#auth-email')
const authPasswordInput = document.querySelector('#auth-password')
const authStatus = document.querySelector('#auth-status')
const authDescription = document.querySelector('#auth-description')
const authModal = document.querySelector('#auth-modal')
const openAuthModalButton = document.querySelector('#open-auth-modal')
const continueGuestButton = document.querySelector('#continue-guest')
const authLogoutButton = document.querySelector('#auth-logout')

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 }

let todos = []
let activeFilter = 'all'
let searchQuery = ''
let isSearchOpen = false
let isLoading = true
let currentUser = null
let isAnonymous = true
let hasBootstrapped = false

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

const setAuthStatus = (message = '', type = '') => {
  authStatus.textContent = message
  authStatus.classList.remove('auth-modal__status--error', 'auth-modal__status--success')

  if (type === 'error') {
    authStatus.classList.add('auth-modal__status--error')
  }

  if (type === 'success') {
    authStatus.classList.add('auth-modal__status--success')
  }
}

const getTodoDedupeKey = (todo) => `${todo.text}::${todo.completed ? '1' : '0'}::${todo.created_at}`

const openAuthModal = (options = {}) => {
  const { clearStatus = false } = options
  authModal.classList.add('auth-modal--open')
  if (clearStatus) {
    setAuthStatus('')
  }
}

const closeAuthModal = () => {
  authModal.classList.remove('auth-modal--open')
}

const updateAuthUi = () => {
  if (!currentUser) {
    authDescription.textContent = ''
    authEmailInput.disabled = true
    authPasswordInput.disabled = true
    openAuthModalButton.hidden = true
    authLogoutButton.hidden = true
    return
  }

  if (isAnonymous) {
    authDescription.textContent = ''
    authEmailInput.disabled = false
    authPasswordInput.disabled = false
    openAuthModalButton.hidden = false
    authLogoutButton.hidden = true
    return
  }

  authDescription.textContent = `Logged in as ${currentUser.email ?? 'your account'}.`
  authEmailInput.disabled = true
  authPasswordInput.disabled = true
  openAuthModalButton.hidden = true
  authLogoutButton.hidden = false
}

const renderTodos = () => {
  if (isLoading) {
    todoList.innerHTML = '<li class="todo-item todo-item--empty">Loading todos...</li>'
    return
  }

  let visible = [...todos].sort(
    (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
  )
  if (activeFilter !== 'all') {
    visible = visible.filter((t) => t.priority === activeFilter)
  }

  if (searchQuery) {
    visible = visible.filter((t) => t.text.toLowerCase().includes(searchQuery))
  }

  if (visible.length === 0) {
    todoList.innerHTML = `<li class="todo-item todo-item--empty">${
      searchQuery ? 'No todos match your search.' : 'No todos yet. Add your first task.'
    }</li>`
    return
  }

  todoList.innerHTML = visible
    .map(
      (todo) => `
        <li class="todo-item todo-item--priority-${todo.priority} ${todo.completed ? 'todo-item--completed' : ''}">
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
  if (!currentUser) return

  isLoading = true
  renderTodos()

  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .eq('user_id', currentUser.id)
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

const mergeAnonymousTodosIntoUser = async (anonTodos, destinationUserId) => {
  if (!anonTodos.length) {
    return
  }

  const { data: destinationTodos, error: destinationError } = await supabase
    .from('todos')
    .select('text, completed, created_at')
    .eq('user_id', destinationUserId)

  if (destinationError) {
    throw destinationError
  }

  const existingKeys = new Set((destinationTodos ?? []).map(getTodoDedupeKey))
  const todosToInsert = anonTodos
    .filter((todo) => !existingKeys.has(getTodoDedupeKey(todo)))
    .map((todo) => ({
      text: todo.text,
      priority: todo.priority ?? 'medium',
      completed: todo.completed,
      created_at: todo.created_at,
      user_id: destinationUserId
    }))

  if (todosToInsert.length) {
    const { error: insertError } = await supabase.from('todos').insert(todosToInsert)
    if (insertError) {
      throw insertError
    }
  }
}

const collectCurrentAnonymousTodos = async () => {
  if (!currentUser?.id || !isAnonymous) {
    return []
  }

  const { data, error } = await supabase
    .from('todos')
    .select('text, priority, completed, created_at')
    .eq('user_id', currentUser.id)

  if (error) {
    throw error
  }

  return data ?? []
}

const refreshAuthState = async () => {
  currentUser = await getCurrentUser()
  isAnonymous = Boolean(currentUser?.is_anonymous)
  updateAuthUi()
}

const bootstrapApp = async () => {
  try {
    await ensureSession()
    await refreshAuthState()
    await loadTodos()
  } catch (error) {
    setAuthStatus(`Could not start session: ${error.message}`, 'error')
  } finally {
    hasBootstrapped = true
    updateAuthUi()
  }
}

todoForm.addEventListener('submit', async (event) => {
  event.preventDefault()

  const text = todoInput.value.trim()
  if (!text) {
    todoInput.focus()
    return
  }

  const priority = todoPrioritySelect.value

  const { data, error } = await supabase
    .from('todos')
    .insert({ text, priority, completed: false, user_id: currentUser.id })
    .select()
    .single()

  if (error) {
    setStatus(`Could not add todo: ${error.message}`, 'error')
    return
  }

  todos.unshift(data)
  todoInput.value = ''
  todoPrioritySelect.value = 'medium'
  todoInput.focus()
  setStatus('Todo added.', 'success')
  renderTodos()
})

authForm.addEventListener('submit', async (event) => {
  event.preventDefault()

  if (!hasBootstrapped) {
    return
  }

  const submitter = event.submitter
  if (!(submitter instanceof HTMLButtonElement)) {
    return
  }

  const authAction = submitter.dataset.authAction
  if (!authAction) {
    return
  }

  const email = authEmailInput.value.trim()
  const password = authPasswordInput.value
  if (!email || !password) {
    setAuthStatus('Enter both email and password.', 'error')
    return
  }

  const startedAsAnonymous = isAnonymous
  let anonymousTodos = []

  try {
    if (startedAsAnonymous) {
      anonymousTodos = await collectCurrentAnonymousTodos()
    }

    if (authAction === 'signup') {
      await signUpWithEmail(email, password)
    }

    if (authAction === 'login') {
      await signInWithEmail(email, password)
    }

    await refreshAuthState()

    if (!currentUser || isAnonymous) {
      setAuthStatus('Check your credentials and try again.', 'error')
      return
    }

    if (startedAsAnonymous) {
      await mergeAnonymousTodosIntoUser(anonymousTodos, currentUser.id)
    }
    await loadTodos()
    authPasswordInput.value = ''
    closeAuthModal()
    setAuthStatus('Account connected and todos merged.', 'success')
  } catch (error) {
    setAuthStatus(`Could not complete auth: ${error.message}`, 'error')
  } finally {
    updateAuthUi()
  }
})

continueGuestButton.addEventListener('click', () => {
  closeAuthModal()
  setAuthStatus('')
})

openAuthModalButton.addEventListener('click', () => {
  openAuthModal({ clearStatus: true })
})

authLogoutButton.addEventListener('click', async () => {
  try {
    await signOut()
    await ensureSession()
    await refreshAuthState()
    await loadTodos()
  } catch (error) {
    setAuthStatus(`Could not sign out: ${error.message}`, 'error')
  } finally {
    updateAuthUi()
  }
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
      .eq('user_id', currentUser.id)

    if (error) {
      setStatus(`Could not update todo: ${error.message}`, 'error')
      return
    }

    todos[index].completed = nextCompleted
    setStatus('Todo updated.', 'success')
  }

  if (action === 'delete') {
    const { error } = await supabase.from('todos').delete().eq('id', id).eq('user_id', currentUser.id)

    if (error) {
      setStatus(`Could not delete todo: ${error.message}`, 'error')
      return
    }

    todos.splice(index, 1)
    setStatus('Todo deleted.', 'success')
  }

  renderTodos()
})

todoSearchToggle.addEventListener('click', () => {
  isSearchOpen = !isSearchOpen
  todoSearchPanel.classList.toggle('todo-search--open', isSearchOpen)
  todoSearchToggle.setAttribute('aria-expanded', String(isSearchOpen))
  if (isSearchOpen) {
    todoSearchInput.focus()
  } else {
    todoSearchInput.value = ''
    searchQuery = ''
    renderTodos()
  }
})

todoSearchInput.addEventListener('input', () => {
  searchQuery = todoSearchInput.value.trim().toLowerCase()
  renderTodos()
})

todoFilter.addEventListener('click', (event) => {
  const target = event.target
  if (!(target instanceof HTMLButtonElement)) return
  const filter = target.dataset.filter
  if (!filter) return

  activeFilter = filter
  todoFilter.querySelectorAll('.todo-filter__button').forEach((btn) => {
    btn.classList.toggle('todo-filter__button--active', btn.dataset.filter === filter)
  })
  renderTodos()
})

supabase.auth.onAuthStateChange(async () => {
  if (!hasBootstrapped) {
    return
  }

  try {
    await refreshAuthState()
    await loadTodos()
  } catch (error) {
    setAuthStatus(`Could not refresh auth state: ${error.message}`, 'error')
  }
})

bootstrapApp()
