import './style.css'
import 'flatpickr/dist/flatpickr.min.css'
import flatpickr from 'flatpickr'
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
    <div class="todo-brand">
      <div class="todo-brand__icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
          <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
          <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
          <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
        </svg>
      </div>
      <h1 class="todo-app__title">Taskly</h1>
    </div>
    <div class="todo-app__auth-actions" data-auth-hidden>
      <button class="todo-app__auth-button" type="button" id="open-auth-modal" hidden>Log in</button>
      <div class="user-menu" id="user-menu" hidden>
        <button class="user-menu__avatar" id="user-menu-toggle" type="button" aria-haspopup="true" aria-expanded="false" aria-label="Account menu">
          <span class="user-menu__initial" id="user-menu-initial"></span>
        </button>
        <div class="user-menu__dropdown" id="user-menu-dropdown" role="menu">
          <p class="user-menu__email" id="user-menu-email"></p>
          <hr class="user-menu__divider" />
          <button class="user-menu__logout" type="button" id="auth-logout" role="menuitem">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Log out
          </button>
        </div>
      </div>
    </div>
  </header>
  <p class="todo-app__subtitle" id="auth-description"></p>

  <section class="todo-input" aria-label="Add a new todo">
    <h2 class="todo-section__title">Create task</h2>
    <form class="todo-input__form" id="todo-form">
      <div class="todo-input__group todo-input__group--field">
        <label class="todo-input__field-label" for="todo-input">Task</label>
        <textarea
          class="todo-input__field"
          id="todo-input"
          name="todo"
          placeholder="What needs to be done?"
          autocomplete="off"
          rows="1"
        ></textarea>
      </div>
      <p class="todo-input__status" id="todo-status" aria-live="polite"></p>
      <div class="todo-input__group todo-input__group--date">
        <label class="todo-input__field-label" for="todo-due-date-btn">Due date</label>
        <div class="todo-input__date-wrap" id="todo-due-date-wrap">
          <input id="todo-due-date" type="text" data-input readonly aria-label="Due date (optional)" />
          <button class="todo-input__date-btn" id="todo-due-date-btn" type="button" data-toggle aria-label="Set due date" title="Set due date">
              <span class="todo-input__date-label" id="todo-due-date-label">mm/dd/yyyy</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
              <path d="M8 2v4"/>
              <path d="M16 2v4"/>
              <rect width="18" height="18" x="3" y="4" rx="2"/>
              <path d="M3 10h18"/>
              <path d="M8 14h.01"/>
              <path d="M12 14h.01"/>
              <path d="M16 14h.01"/>
              <path d="M8 18h.01"/>
              <path d="M12 18h.01"/>
              <path d="M16 18h.01"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="todo-input__group todo-input__group--priority">
        <label class="todo-input__field-label" for="todo-priority-toggle">Priority</label>
        <div class="todo-priority-picker" id="todo-priority-picker">
          <input type="hidden" id="todo-priority" name="priority" value="" />
          <button class="todo-priority-picker__toggle" id="todo-priority-toggle" type="button"
                  aria-haspopup="listbox" aria-expanded="false" aria-label="Select priority">
            <span class="todo-priority-picker__dot" id="todo-priority-dot" data-priority=""></span>
            <span class="todo-priority-picker__label" id="todo-priority-label">None</span>
            <svg class="todo-priority-picker__chevron" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
          </button>
          <div class="todo-priority-picker__menu" id="todo-priority-menu" role="listbox" aria-label="Priority">
            <button class="todo-priority-picker__option todo-priority-picker__option--active" data-priority="" role="option" type="button">
              <span class="todo-priority-picker__option-dot" data-priority=""></span>
              <span class="todo-priority-picker__option-text">None</span>
              <svg class="todo-priority-picker__check" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>
            </button>
            <button class="todo-priority-picker__option" data-priority="high" role="option" type="button">
              <span class="todo-priority-picker__option-dot" data-priority="high"></span>
              <span class="todo-priority-picker__option-text">High</span>
              <svg class="todo-priority-picker__check" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>
            </button>
            <button class="todo-priority-picker__option" data-priority="medium" role="option" type="button">
              <span class="todo-priority-picker__option-dot" data-priority="medium"></span>
              <span class="todo-priority-picker__option-text">Medium</span>
              <svg class="todo-priority-picker__check" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>
            </button>
            <button class="todo-priority-picker__option" data-priority="low" role="option" type="button">
              <span class="todo-priority-picker__option-dot" data-priority="low"></span>
              <span class="todo-priority-picker__option-text">Low</span>
              <svg class="todo-priority-picker__check" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>
            </button>
            <button class="todo-priority-picker__option" data-priority="trivial" role="option" type="button">
              <span class="todo-priority-picker__option-dot" data-priority="trivial"></span>
              <span class="todo-priority-picker__option-text">Trivial</span>
              <svg class="todo-priority-picker__check" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>
            </button>
          </div>
        </div>
      </div>
      <button class="todo-input__button" type="submit">
        Add
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </button>
    </form>
  </section>

  <section class="todo-items" aria-label="Todo items" hidden>
    <div class="todo-items__toolbar">
      <h2 class="todo-section__title">My tasks</h2>
      <div class="todo-sort" id="todo-sort">
        <button
          class="todo-sort__toggle"
          id="todo-sort-toggle"
          type="button"
          aria-haspopup="menu"
          aria-expanded="false"
          aria-label="Sort tasks"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
            <path d="M3 6h18"/>
            <path d="M7 12h10"/>
            <path d="M10 18h4"/>
          </svg>
          <span class="todo-toolbar-btn__label">Sort</span>
          <span class="todo-sort__active-label" id="todo-sort-active-label">Priority</span>
        </button>
        <div class="todo-sort__menu" id="todo-sort-menu" role="menu">
          <button class="todo-sort__option todo-sort__option--active" data-sort="priority" role="menuitemradio" aria-checked="true" type="button">
            <span class="todo-sort__option-label">Priority</span>
            <svg class="todo-sort__check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>
          </button>
          <button class="todo-sort__option" data-sort="due" role="menuitemradio" aria-checked="false" type="button">
            <span class="todo-sort__option-label">Due date</span>
            <svg class="todo-sort__check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>
          </button>
          <button class="todo-sort__option" data-sort="alpha" role="menuitemradio" aria-checked="false" type="button">
            <span class="todo-sort__option-label">Alphabetically</span>
            <svg class="todo-sort__check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>
          </button>
          <button class="todo-sort__option" data-sort="created" role="menuitemradio" aria-checked="false" type="button">
            <span class="todo-sort__option-label">Creation date</span>
            <svg class="todo-sort__check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>
          </button>
        </div>
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
          <span class="todo-toolbar-btn__label">Search</span>
        </button>
      </div>
    </div>
    <details class="todo-pending-section" id="todo-pending-section" open hidden>
      <summary class="todo-completed-section__summary">
        <svg class="todo-section-chevron todo-section-chevron--down" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
        <svg class="todo-section-chevron todo-section-chevron--up" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 15l-6-6-6 6"/></svg>
        Pending <span class="todo-completed-section__count" id="todo-pending-count">0</span>
      </summary>
      <ul class="todo-items__list" id="todo-list"></ul>
    </details>
    <details class="todo-completed-section" id="todo-completed-section" open hidden>
      <summary class="todo-completed-section__summary">
        <svg class="todo-section-chevron todo-section-chevron--down" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
        <svg class="todo-section-chevron todo-section-chevron--up" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 15l-6-6-6 6"/></svg>
        Completed <span class="todo-completed-section__count" id="todo-completed-count">0</span>
      </summary>
      <ul class="todo-items__list todo-items__list--completed" id="todo-list-completed"></ul>
    </details>
  </section>
</main>

<section class="auth-modal" id="auth-modal" aria-label="Authentication">
  <div class="auth-modal__backdrop"></div>
  <div class="auth-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
    <button class="auth-modal__close" id="auth-modal-close" type="button" aria-label="Close">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
    </button>
    <div class="auth-modal__header">
      <div class="todo-brand__icon" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
          <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
          <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
          <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
        </svg>
      </div>
      <h2 class="auth-modal__title" id="auth-modal-title">Welcome to Taskly</h2>
      <p class="auth-modal__description">Sign in or create an account to keep your tasks in sync.</p>
    </div>
    <div class="auth-modal__tabs" role="tablist" id="auth-tabs">
      <button class="auth-modal__tab auth-modal__tab--active" type="button" data-tab="login" role="tab" aria-selected="true">Log in</button>
      <button class="auth-modal__tab" type="button" data-tab="signup" role="tab" aria-selected="false">Create account</button>
    </div>
    <form class="auth-modal__form" id="auth-form">
      <div class="auth-modal__field-group">
        <label class="auth-modal__label" for="auth-email">Email</label>
        <input
          class="auth-modal__field"
          id="auth-email"
          name="email"
          type="email"
          autocomplete="email"
          placeholder="you@example.com"
        />
      </div>
      <div class="auth-modal__field-group">
        <label class="auth-modal__label" for="auth-password">Password</label>
        <input
          class="auth-modal__field"
          id="auth-password"
          name="password"
          type="password"
          autocomplete="current-password"
          placeholder="Enter your password"
        />
      </div>
      <div class="auth-modal__field-group" id="auth-confirm-group" hidden>
        <label class="auth-modal__label" for="auth-confirm-password">Confirm Password</label>
        <input
          class="auth-modal__field"
          id="auth-confirm-password"
          name="confirm-password"
          type="password"
          autocomplete="new-password"
          placeholder="Re-enter your password"
        />
        <p class="auth-modal__field-error" id="auth-confirm-error" aria-live="polite"></p>
      </div>
      <button class="auth-modal__button auth-modal__button--primary" type="submit" id="auth-submit" data-auth-action="login">
        Log in
      </button>
    </form>
    <div class="auth-modal__divider" aria-hidden="true"><span>or</span></div>
    <button class="auth-modal__button auth-modal__button--secondary" type="button" id="continue-guest">
      Continue as guest
    </button>
    <p class="auth-modal__status" id="auth-status" aria-live="polite"></p>
  </div>
</section>
`

const todoForm = document.querySelector('#todo-form')
const todoInput = document.querySelector('#todo-input')

const todoInputSingleLineHeight = todoInput.scrollHeight

todoInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    todoForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  }
})

todoInput.addEventListener('input', () => {
  setStatus('')
  todoInput.style.height = 'auto'
  todoInput.style.height = todoInput.scrollHeight + 'px'

  const isExpanded = todoForm.classList.contains('todo-input__form--expanded')
  if (!isExpanded && todoInput.scrollHeight > todoInputSingleLineHeight) {
    todoForm.classList.add('todo-input__form--expanded')
  } else if (isExpanded && !todoInput.value) {
    todoForm.classList.remove('todo-input__form--expanded')
    todoInput.style.height = ''
  }
})

const todoPrioritySelect = document.querySelector('#todo-priority')
const todoPriorityPicker = document.querySelector('#todo-priority-picker')
const todoPriorityToggle = document.querySelector('#todo-priority-toggle')
const todoPriorityMenu = document.querySelector('#todo-priority-menu')
const todoPriorityDot = document.querySelector('#todo-priority-dot')
const todoPriorityLabel = document.querySelector('#todo-priority-label')
const todoDueDateInput = document.querySelector('#todo-due-date')
const todoDueDateWrap = document.querySelector('#todo-due-date-wrap')
const todoDueDateBtn = document.querySelector('#todo-due-date-btn')
const todoDueDateLabel = document.querySelector('#todo-due-date-label')
const todoListCompleted = document.querySelector('#todo-list-completed')
const todoItemsSection = document.querySelector('.todo-items')
const todoPendingSection = document.querySelector('#todo-pending-section')
const todoPendingCount = document.querySelector('#todo-pending-count')
const todoCompletedSection = document.querySelector('#todo-completed-section')
const todoCompletedCount = document.querySelector('#todo-completed-count')
const todoSearchToggle = document.querySelector('#todo-search-toggle')
const todoSearchPanel = document.querySelector('#todo-search-panel')
const todoSearchInput = document.querySelector('#todo-search')
const todoSort = document.querySelector('#todo-sort')
const todoSortToggle = document.querySelector('#todo-sort-toggle')
const todoSortMenu = document.querySelector('#todo-sort-menu')
const todoSortActiveLabel = document.querySelector('#todo-sort-active-label')
const todoList = document.querySelector('#todo-list')
const todoStatus = document.querySelector('#todo-status')
const authForm = document.querySelector('#auth-form')
const authEmailInput = document.querySelector('#auth-email')
const authPasswordInput = document.querySelector('#auth-password')
const authStatus = document.querySelector('#auth-status')
const authDescription = document.querySelector('#auth-description')
const authModal = document.querySelector('#auth-modal')
const authTabs = document.querySelector('#auth-tabs')
const authSubmitBtn = document.querySelector('#auth-submit')
const authConfirmGroup = document.querySelector('#auth-confirm-group')
const authConfirmInput = document.querySelector('#auth-confirm-password')
const authConfirmError = document.querySelector('#auth-confirm-error')
const openAuthModalButton = document.querySelector('#open-auth-modal')
const continueGuestButton = document.querySelector('#continue-guest')
const authLogoutButton = document.querySelector('#auth-logout')
const authModalCloseButton = document.querySelector('#auth-modal-close')
const userMenu = document.querySelector('#user-menu')
const userMenuToggle = document.querySelector('#user-menu-toggle')
const userMenuDropdown = document.querySelector('#user-menu-dropdown')
const userMenuInitial = document.querySelector('#user-menu-initial')
const userMenuEmail = document.querySelector('#user-menu-email')
const snackbarContainer = document.querySelector('#snackbar-container')

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2, trivial: 3 }

const comparePriority = (a, b) => {
  const av = PRIORITY_ORDER[a.priority] ?? Infinity
  const bv = PRIORITY_ORDER[b.priority] ?? Infinity
  return av - bv
}
const compareDue = (a, b) => {
  if (!a.due_date && !b.due_date) return 0
  if (!a.due_date) return 1
  if (!b.due_date) return -1
  return a.due_date.localeCompare(b.due_date)
}
const compareAlpha = (a, b) => a.text.localeCompare(b.text, undefined, { sensitivity: 'base' })
const compareCreated = (a, b) => {
  if (!a.created_at && !b.created_at) return 0
  if (!a.created_at) return 1
  if (!b.created_at) return -1
  return new Date(b.created_at) - new Date(a.created_at)
}

let todos = []
let activeSort = 'priority'
let isSortOpen = false
let isPriorityOpen = false
let shouldAnimateAdd = false
let highlightId = null
let highlightDelay = 0
let isAddHighlight = false
let searchQuery = ''
let isSearchOpen = false
let isLoading = true
let isNetworkError = false
let currentUser = null
let isAnonymous = true
let hasBootstrapped = false
let hasEverHadTodos = false
const pendingDeletes = new Map()

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

const removeSnackbar = (el) => {
  if (!el || !el.parentNode) return
  el.classList.add('snackbar--hiding')
  el.addEventListener('animationend', () => el.remove(), { once: true })
}

const createSnackbar = (message, onUndo) => {
  const el = document.createElement('div')
  el.className = 'snackbar'
  el.setAttribute('role', 'status')
  const msgSpan = document.createElement('span')
  msgSpan.className = 'snackbar__message'
  msgSpan.textContent = message
  const undoBtn = document.createElement('button')
  undoBtn.className = 'snackbar__undo'
  undoBtn.type = 'button'
  undoBtn.textContent = 'Undo'
  undoBtn.addEventListener('click', onUndo)
  el.appendChild(msgSpan)
  el.appendChild(undoBtn)
  snackbarContainer.appendChild(el)
  return el
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
  authConfirmInput.value = ''
}

const authActionsEl = document.querySelector('.todo-app__auth-actions')

const updateAuthUi = () => {
  if (!currentUser) {
    authDescription.textContent = ''
    authEmailInput.disabled = true
    authPasswordInput.disabled = true
    openAuthModalButton.hidden = true
    userMenu.hidden = true
    authActionsEl?.removeAttribute('data-auth-hidden')
    return
  }

  if (isAnonymous) {
    authDescription.textContent = ''
    authEmailInput.disabled = false
    authPasswordInput.disabled = false
    openAuthModalButton.hidden = false
    userMenu.hidden = true
    authActionsEl?.removeAttribute('data-auth-hidden')
    return
  }

  authDescription.textContent = ''
  authEmailInput.disabled = true
  authPasswordInput.disabled = true
  openAuthModalButton.hidden = true
  userMenu.hidden = false
  const email = currentUser.email ?? ''
  userMenuInitial.textContent = email.charAt(0).toUpperCase()
  userMenuEmail.textContent = email
  authActionsEl?.removeAttribute('data-auth-hidden')
}

const todayIsoDate = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const formatDueDate = (iso) => {
  const today = todayIsoDate()
  if (iso === today) return 'Today'
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowIso = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`
  if (iso === tomorrowIso) return 'Tomorrow'
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

const dueDateChip = (todo) => {
  if (!todo.due_date) return ''
  const today = todayIsoDate()
  const overdue = !todo.completed && todo.due_date < today
  const soon = !overdue && !todo.completed && (() => {
    const d = new Date()
    d.setDate(d.getDate() + 7)
    const in7 = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    return todo.due_date >= today && todo.due_date <= in7
  })()
  const cls = overdue ? ' todo-item__due--overdue' : soon ? ' todo-item__due--soon' : ''
  return `<span class="todo-item__due${cls}">${formatDueDate(todo.due_date)}</span>`
}

const buildTodoItem = (todo) => `
  <li class="todo-item ${todo.priority ? `todo-item--priority-${todo.priority}` : ''} ${todo.completed ? 'todo-item--completed' : ''}">
    <label class="todo-item__content">
      <input
        class="todo-item__checkbox"
        type="checkbox"
        data-action="toggle"
        data-id="${todo.id}"
        ${todo.completed ? 'checked' : ''}
      />
      <span class="todo-item__text">${escapeHtml(todo.text)}</span>
      ${dueDateChip(todo)}
    </label>
    <button
      class="todo-item__delete"
      type="button"
      data-action="delete"
      data-id="${todo.id}"
      aria-label="Delete task"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
        <path d="M3 6h18"/>
        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
        <line x1="10" x2="10" y1="11" y2="17"/>
        <line x1="14" x2="14" y1="11" y2="17"/>
      </svg>
    </button>
  </li>
`

const duePicker = flatpickr(todoDueDateWrap, {
  wrap: true,
  disableMobile: true,
  dateFormat: 'Y-m-d',
  minDate: 'today',
  maxDate: new Date(new Date().getFullYear() + 100, 11, 31),
  monthSelectorType: 'static',
  onReady(_selectedDates, _dateStr, instance) {
    const yearInput = instance.yearElements[0]
    yearInput.addEventListener('keydown', (e) => e.preventDefault())
  },
  onChange(selectedDates) {
    if (selectedDates.length > 0) {
      todoDueDateLabel.textContent = formatDueDate(duePicker.formatDate(selectedDates[0], 'Y-m-d'))
      todoDueDateBtn.classList.add('todo-input__date-btn--active')
    } else {
      todoDueDateLabel.textContent = 'mm/dd/yyyy'
      todoDueDateBtn.classList.remove('todo-input__date-btn--active')
    }
  },
})

const renderTodos = () => {
  if (isLoading) {
    todoItemsSection.hidden = true
    return
  }

  if (isNetworkError) {
    todoItemsSection.hidden = false
    todoPendingSection.hidden = false
    todoCompletedSection.hidden = true
    todoList.innerHTML = `
      <li class="todo-item todo-item--empty-state">
        <img src="/network-error.png" alt="" class="todo-item__empty-img" aria-hidden="true" />
        <p class="todo-item__empty-title">Connection problem</p>
        <p class="todo-item__empty-subtitle">We couldn't reach the server. Check your connection and try again.</p>
        <button class="todo-item__retry-btn" data-action="retry-load" type="button">Try again</button>
      </li>`
    return
  }

  if (todos.length === 0) {
    if (!hasEverHadTodos) {
      todoItemsSection.hidden = true
    } else {
      todoItemsSection.hidden = false
      todoPendingSection.hidden = false
      todoPendingCount.textContent = '0'
      if (!todoList.querySelector('.todo-item--empty-state')) {
        todoList.innerHTML = `
          <li class="todo-item todo-item--empty-state">
            <img src="/empty-state.png" alt="" class="todo-item__empty-img" aria-hidden="true" />
            <p class="todo-item__empty-title">All done!</p>
            <p class="todo-item__empty-subtitle">You have no tasks. Enjoy your day.</p>
          </li>`
      }
      todoCompletedSection.hidden = true
      todoListCompleted.innerHTML = ''
    }
    return
  }

  todoItemsSection.hidden = false

  const sorters = { priority: comparePriority, due: compareDue, alpha: compareAlpha, created: compareCreated }
  const sorter = sorters[activeSort] ?? comparePriority
  let visible = [...todos].sort(sorter)
  if (searchQuery) {
    visible = visible.filter((t) => t.text.toLowerCase().includes(searchQuery))
  }

  const active = visible.filter((t) => !t.completed)
  const done = visible.filter((t) => t.completed)

  todoPendingSection.hidden = false
  todoPendingCount.textContent = active.length

  todoList.classList.toggle('todo-items__list--animate', shouldAnimateAdd)
  shouldAnimateAdd = false

  if (active.length === 0) {
    const emptyType = searchQuery ? 'search' : 'all-done'
    const existingEmpty = todoList.querySelector('.todo-item--empty-state')
    if (!existingEmpty || existingEmpty.dataset.emptyType !== emptyType) {
      todoList.innerHTML = searchQuery
        ? `<li class="todo-item todo-item--empty-state" data-empty-type="search">
            <img src="/empty-search.png" alt="" class="todo-item__empty-img" aria-hidden="true" />
            <p class="todo-item__empty-title">No results found</p>
            <p class="todo-item__empty-subtitle">No tasks match your search. Try a different keyword.</p>
          </li>`
        : `<li class="todo-item todo-item--empty-state" data-empty-type="all-done">
            <img src="/empty-state.png" alt="" class="todo-item__empty-img" aria-hidden="true" />
            <p class="todo-item__empty-title">All done!</p>
            <p class="todo-item__empty-subtitle">You have no tasks. Enjoy your day.</p>
          </li>`
    }
  } else {
    todoList.innerHTML = active.map(buildTodoItem).join('')
  }

  if (done.length > 0) {
    todoCompletedSection.hidden = false
    todoCompletedCount.textContent = done.length
    todoListCompleted.innerHTML = done.map(buildTodoItem).join('')
  } else {
    todoCompletedSection.hidden = true
    todoListCompleted.innerHTML = ''
  }

  if (highlightId) {
    const id = highlightId
    const delay = highlightDelay
    const useAddAnim = isAddHighlight
    highlightId = null
    highlightDelay = 0
    isAddHighlight = false
    setTimeout(() => {
      const li = todoItemsSection.querySelector(`[data-id="${id}"]`)?.closest('.todo-item')
      if (li) {
        const cls = useAddAnim ? 'todo-item--add-highlight' : 'todo-item--highlight'
        const expectedAnim = useAddAnim ? 'todoAddHighlight' : 'todoHighlight'
        li.classList.add(cls)
        const onHighlightEnd = (e) => {
          if (e.animationName === expectedAnim) {
            li.classList.remove(cls)
            li.removeEventListener('animationend', onHighlightEnd)
          }
        }
        li.addEventListener('animationend', onHighlightEnd)
      }
    }, delay)
  }
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
    isNetworkError = true
    renderTodos()
    return
  }

  isNetworkError = false
  todos = data ?? []
  if (todos.length > 0) hasEverHadTodos = true
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
    isLoading = false
    isNetworkError = true
    renderTodos()
  } finally {
    hasBootstrapped = true
    updateAuthUi()
  }
}

todoForm.addEventListener('submit', async (event) => {
  event.preventDefault()

  const text = todoInput.value.trim()
  if (!text) {
    setStatus('Task cannot be empty.', 'error')
    todoInput.focus()
    return
  }

  const priority = todoPrioritySelect.value || null
  const due_date = todoDueDateInput.value || null

  const { data, error } = await supabase
    .from('todos')
    .insert({ text, priority, due_date, completed: false, user_id: currentUser.id })
    .select()
    .single()

  if (error) {
    setStatus(`Could not add todo: ${error.message}`, 'error')
    return
  }

  todos.unshift(data)
  hasEverHadTodos = true
  todoInput.value = ''
  todoInput.style.height = ''
  todoForm.classList.remove('todo-input__form--expanded')
  setSelectedPriority('')
  duePicker.clear()
  todoInput.focus()
  setStatus('')
  highlightId = data.id
  highlightDelay = 0
  isAddHighlight = true
  renderTodos()
})

authTabs.addEventListener('click', (e) => {
  const tab = e.target.closest('[data-tab]')
  if (!tab) return
  const action = tab.dataset.tab
  authTabs.querySelectorAll('[data-tab]').forEach((t) => {
    const active = t.dataset.tab === action
    t.classList.toggle('auth-modal__tab--active', active)
    t.setAttribute('aria-selected', String(active))
  })
  const isSignup = action === 'signup'
  authConfirmGroup.hidden = !isSignup
  authPasswordInput.autocomplete = isSignup ? 'new-password' : 'current-password'
  authSubmitBtn.dataset.authAction = action
  authSubmitBtn.textContent = isSignup ? 'Create account' : 'Log in'
  authConfirmInput.value = ''
  authConfirmError.textContent = ''
  authEmailInput.value = ''
  authPasswordInput.value = ''
  setAuthStatus('')
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

  if (authAction === 'signup' && password !== authConfirmInput.value) {
    authConfirmError.textContent = 'Passwords do not match.'
    authConfirmInput.focus()
    return
  }
  authConfirmError.textContent = ''

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
      if (authAction === 'signup') {
        setAuthStatus('Check your email to confirm your account.', 'success')
      } else {
        setAuthStatus('Check your credentials and try again.', 'error')
      }
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
    const msg = error?.message ?? ''
    if (msg.toLowerCase().includes('rate limit')) {
      setAuthStatus('Too many attempts — please wait a moment and try again.', 'error')
    } else {
      setAuthStatus(`Could not complete auth: ${msg}`, 'error')
    }
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

authModalCloseButton.addEventListener('click', () => {
  closeAuthModal()
})

authLogoutButton.addEventListener('click', async () => {
  setUserMenuOpen(false)
  try {
    await signOut()
  } catch {
    // local session is already cleared by Supabase even if the server call fails
  } finally {
    try {
      await ensureSession()
      await refreshAuthState()
      await loadTodos()
    } catch (cleanupError) {
      setAuthStatus(`Could not sign out: ${cleanupError.message}`, 'error')
    }
    updateAuthUi()
  }
})

let isUserMenuOpen = false

const setUserMenuOpen = (open) => {
  isUserMenuOpen = open
  userMenuDropdown.classList.toggle('user-menu__dropdown--open', open)
  userMenuToggle.setAttribute('aria-expanded', String(open))
}

userMenuToggle.addEventListener('click', (e) => {
  e.stopPropagation()
  setUserMenuOpen(!isUserMenuOpen)
})

document.addEventListener('click', (e) => {
  if (isUserMenuOpen && !userMenu.contains(e.target)) setUserMenuOpen(false)
})

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && isUserMenuOpen) setUserMenuOpen(false)
})

todoItemsSection.addEventListener('click', async (event) => {
  const target = event.target.closest('[data-action]')
  if (!(target instanceof HTMLElement)) return

  const action = target.dataset.action
  const id = target.dataset.id

  if (action === 'retry-load') {
    isNetworkError = false
    await loadTodos()
    return
  }

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
    highlightId = id
    highlightDelay = 200
    setStatus('')
  }

  if (action === 'delete') {
    const deletedTodo = todos[index]

    // Animate the row out
    const li = target.closest('.todo-item')
    if (li) {
      li.classList.remove('todo-item--highlight')
      li.classList.add('todo-item--removing')
      await new Promise((resolve) => setTimeout(resolve, 200))
    }

    // Optimistically remove from state
    todos.splice(index, 1)
    renderTodos()

    // Truncate long task names for the snackbar label
    const label = deletedTodo.text.length > 32
      ? deletedTodo.text.slice(0, 32) + '\u2026'
      : deletedTodo.text

    const entry = { todo: deletedTodo, timerId: null, el: null }
    pendingDeletes.set(deletedTodo.id, entry)

    entry.el = createSnackbar(`"${label}" deleted`, () => {
      const e = pendingDeletes.get(deletedTodo.id)
      if (!e) return
      clearTimeout(e.timerId)
      pendingDeletes.delete(deletedTodo.id)
      todos.push(deletedTodo)
      renderTodos()
      removeSnackbar(e.el)
    })

    entry.timerId = setTimeout(async () => {
      pendingDeletes.delete(deletedTodo.id)
      removeSnackbar(entry.el)

      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', deletedTodo.id)
        .eq('user_id', currentUser.id)

      if (error) {
        todos.push(deletedTodo)
        renderTodos()
        setStatus(`Could not delete task: ${error.message}`, 'error')
      }
    }, 5000)

    return
  }

  renderTodos()
})

const closeSearch = () => {
  isSearchOpen = false
  todoSearchPanel.classList.remove('todo-search--open')
  todoSearchToggle.setAttribute('aria-expanded', 'false')
  todoSearchInput.value = ''
  searchQuery = ''
  renderTodos()
}

todoSearchToggle.addEventListener('click', () => {
  isSearchOpen = !isSearchOpen
  todoSearchPanel.classList.toggle('todo-search--open', isSearchOpen)
  todoSearchToggle.setAttribute('aria-expanded', String(isSearchOpen))
  if (isSearchOpen) {
    todoSearchInput.focus()
  } else {
    closeSearch()
  }
})

document.addEventListener('click', (event) => {
  if (!isSearchOpen) return
  if (todoSearchInput.value.trim()) return
  if (!todoSearchPanel.contains(event.target) && !todoSearchToggle.contains(event.target)) {
    closeSearch()
  }
})

todoSearchInput.addEventListener('input', () => {
  searchQuery = todoSearchInput.value.trim().toLowerCase()
  renderTodos()
})

const setSortOpen = (open) => {
  isSortOpen = open
  todoSort.classList.toggle('todo-sort--open', open)
  todoSortToggle.setAttribute('aria-expanded', String(open))
}

todoSortToggle.addEventListener('click', (event) => {
  event.stopPropagation()
  setSortOpen(!isSortOpen)
})

const SORT_LABELS = { priority: 'Priority', due: 'Due date', alpha: 'Alphabetically', created: 'Creation date' }

const setActiveSort = (btn) => {
  activeSort = btn.dataset.sort
  todoSortActiveLabel.textContent = SORT_LABELS[activeSort] ?? activeSort
  todoSortMenu.querySelectorAll('.todo-sort__option').forEach((b) => {
    const isActive = b === btn
    b.classList.toggle('todo-sort__option--active', isActive)
    b.setAttribute('aria-checked', String(isActive))
  })
  setSortOpen(false)
  renderTodos()
}

todoSortMenu.addEventListener('click', (event) => {
  const btn = event.target.closest('.todo-sort__option')
  if (!btn) return
  setActiveSort(btn)
})

document.addEventListener('click', (event) => {
  if (!isSortOpen) return
  if (!todoSort.contains(event.target)) setSortOpen(false)
})

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && isSortOpen) setSortOpen(false)
  if (event.key === 'Escape' && isSearchOpen && !todoSearchInput.value.trim()) closeSearch()
  if (isSortOpen && event.key.length === 1 && /[a-z]/i.test(event.key)) {
    const key = event.key.toLowerCase()
    const match = [...todoSortMenu.querySelectorAll('.todo-sort__option')].find(
      (btn) => btn.dataset.sort.startsWith(key)
    )
    if (match) setActiveSort(match)
  }
})

const PRIORITY_LABELS = { '': 'None', high: 'High', medium: 'Medium', low: 'Low', trivial: 'Trivial' }

const setSelectedPriority = (value) => {
  todoPrioritySelect.value = value
  todoPriorityDot.dataset.priority = value
  todoPriorityLabel.textContent = PRIORITY_LABELS[value] ?? 'Priority'
  todoPriorityLabel.dataset.placeholder = value === '' ? 'true' : 'false'
  todoPriorityMenu.querySelectorAll('.todo-priority-picker__option').forEach((btn) => {
    btn.classList.toggle('todo-priority-picker__option--active', btn.dataset.priority === value)
  })
}

const setPriorityOpen = (open) => {
  isPriorityOpen = open
  todoPriorityPicker.classList.toggle('todo-priority-picker--open', open)
  todoPriorityToggle.setAttribute('aria-expanded', String(open))
}

todoPriorityToggle.addEventListener('click', (event) => {
  event.stopPropagation()
  setPriorityOpen(!isPriorityOpen)
})

todoPriorityMenu.addEventListener('click', (event) => {
  const btn = event.target.closest('.todo-priority-picker__option')
  if (!btn) return
  setSelectedPriority(btn.dataset.priority)
  setPriorityOpen(false)
})

document.addEventListener('click', (event) => {
  if (!isPriorityOpen) return
  if (!todoPriorityPicker.contains(event.target)) setPriorityOpen(false)
})

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && isPriorityOpen) {
    setPriorityOpen(false)
    return
  }
  if (isPriorityOpen && event.key.length === 1 && /[a-z]/i.test(event.key)) {
    const key = event.key.toLowerCase()
    const match = [...todoPriorityMenu.querySelectorAll('.todo-priority-picker__option')].find(
      (btn) => (btn.dataset.priority || 'none').startsWith(key)
    )
    if (match) {
      setSelectedPriority(match.dataset.priority)
      setPriorityOpen(false)
    }
  }
})

supabase.auth.onAuthStateChange(async (event) => {
  if (!hasBootstrapped) {
    return
  }

  if (event === 'SIGNED_OUT') {
    return
  }

  try {
    await refreshAuthState()
    await loadTodos()
  } catch (error) {
    setAuthStatus(`Could not refresh auth state: ${error.message}`, 'error')
  }
})

window.addEventListener('pageshow', (e) => {
  if (e.persisted) {
    refreshAuthState().catch(() => {})
  }
})

bootstrapApp()
