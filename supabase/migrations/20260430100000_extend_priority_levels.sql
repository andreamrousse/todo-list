alter table public.todos
  drop constraint if exists todos_priority_check;

alter table public.todos
  alter column priority drop not null,
  alter column priority drop default;

alter table public.todos
  add constraint todos_priority_check
  check (priority is null or priority in ('high', 'medium', 'low', 'trivial'));
