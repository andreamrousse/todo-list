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
