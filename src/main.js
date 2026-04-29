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
        Log in / Create account
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
      <button class="todo-input__button" type="submit">Add</button>
    </form>
    <p class="todo-input__status" id="todo-status" aria-live="polite"></p>
  </section>

  <section class="todo-items" aria-label="Todo items">
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

let todos = []
let isLoading = true
let currentUser = null
let isAnonymous = true
let hasBootstrapped = false
let hasHandledInitialChoice = false

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
    authDescription.textContent = 'Signing you in...'
    authEmailInput.disabled = true
    authPasswordInput.disabled = true
    openAuthModalButton.hidden = true
    authLogoutButton.hidden = true
    return
  }

  if (isAnonymous) {
    authDescription.textContent = 'You are using a guest session.'
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
    .select('text, completed, created_at')
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
    if (isAnonymous) {
      openAuthModal({ clearStatus: true })
    }
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

  const { data, error } = await supabase
    .from('todos')
    .insert({ text, completed: false, user_id: currentUser.id })
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
    hasHandledInitialChoice = true
    closeAuthModal()
    setAuthStatus('Account connected and todos merged.', 'success')
  } catch (error) {
    setAuthStatus(`Could not complete auth: ${error.message}`, 'error')
  } finally {
    updateAuthUi()
  }
})

continueGuestButton.addEventListener('click', async () => {
  hasHandledInitialChoice = true
  closeAuthModal()
  setAuthStatus('')
  updateAuthUi()
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
    openAuthModal({ clearStatus: true })
    hasHandledInitialChoice = true
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

supabase.auth.onAuthStateChange(async () => {
  if (!hasBootstrapped) {
    return
  }

  try {
    await refreshAuthState()
    await loadTodos()
    if (isAnonymous && !hasHandledInitialChoice) {
      openAuthModal()
    }
  } catch (error) {
    setAuthStatus(`Could not refresh auth state: ${error.message}`, 'error')
  }
})

bootstrapApp()
