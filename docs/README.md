# About

This is a todo list app built with Vite + Vanilla JS and synced to Supabase.

## Features
- Add new todos
- Mark as complete/incomplete
- Delete a todo
- Persist todos in Supabase
- Automatic anonymous guest session on first visit
- Email/password authentication
- Mandatory first-load auth modal (log in, create account, or continue as guest)
- Per-user todo isolation with RLS
- Merge guest-session todos into account on signup/login

## Tech
- Vite
- Vanilla JS
- Supabase (`@supabase/supabase-js`)

## Environment variables

Create a `.env` file in the project root:

```bash
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Supabase CLI workflow (migration-first)

Use CLI migrations instead of dashboard-only SQL edits:

```bash
supabase init
supabase login
supabase link --project-ref tsblhlhyzefkhkibomml
```

Create and edit migration files:

```bash
supabase migration new create_todos_table
```

Apply migrations:

```bash
# Run locally (starts from migration files)
supabase db reset

# Push migrations to hosted Supabase project
supabase db push
```

The first migration for this app lives in `supabase/migrations/20260428102500_create_todos_table.sql`.
The ownership/auth migration lives in `supabase/migrations/20260429103500_add_user_owned_todos.sql`.

## Auth configuration in Supabase

Enable both of the following in your Supabase project:

- **Authentication > Providers > Email**: enabled
- **Authentication > Providers > Anonymous Sign-Ins**: enabled

This app automatically signs visitors in anonymously so they can use todos immediately.
On first load, users see an auth modal with:
- Log in
- Create account
- Continue as guest

If they continue as guest, they can still open auth later from the header button.
When a guest signs up or logs in with email/password, guest todos are merged into the account (duplicates are skipped).

## Run app

```bash
npm install
npm run dev
```