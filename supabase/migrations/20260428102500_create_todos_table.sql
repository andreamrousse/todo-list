create extension if not exists pgcrypto;

create table if not exists public.todos (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists todos_created_at_idx on public.todos (created_at desc);

alter table public.todos enable row level security;

drop policy if exists "Allow anon select todos" on public.todos;
create policy "Allow anon select todos"
  on public.todos
  for select
  to anon
  using (true);

drop policy if exists "Allow anon insert todos" on public.todos;
create policy "Allow anon insert todos"
  on public.todos
  for insert
  to anon
  with check (true);

drop policy if exists "Allow anon update todos" on public.todos;
create policy "Allow anon update todos"
  on public.todos
  for update
  to anon
  using (true)
  with check (true);

drop policy if exists "Allow anon delete todos" on public.todos;
create policy "Allow anon delete todos"
  on public.todos
  for delete
  to anon
  using (true);
