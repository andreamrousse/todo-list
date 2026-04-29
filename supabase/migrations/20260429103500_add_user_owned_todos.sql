alter table public.todos
  add column if not exists user_id uuid references auth.users (id) on delete cascade;

-- Legacy rows created before auth ownership cannot be mapped reliably.
-- Remove them so we can enforce strict per-user ownership.
delete from public.todos where user_id is null;

alter table public.todos
  alter column user_id set not null;

create index if not exists todos_user_id_created_at_idx
  on public.todos (user_id, created_at desc);

drop policy if exists "Allow anon select todos" on public.todos;
drop policy if exists "Allow anon insert todos" on public.todos;
drop policy if exists "Allow anon update todos" on public.todos;
drop policy if exists "Allow anon delete todos" on public.todos;

drop policy if exists "Users can select own todos" on public.todos;
create policy "Users can select own todos"
  on public.todos
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users can insert own todos" on public.todos;
create policy "Users can insert own todos"
  on public.todos
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Users can update own todos" on public.todos;
create policy "Users can update own todos"
  on public.todos
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Users can delete own todos" on public.todos;
create policy "Users can delete own todos"
  on public.todos
  for delete
  to authenticated
  using (user_id = auth.uid());
