# About

This is a todo list app built with Vite + Vanilla JS and synced to Supabase.

## Features
- Add new todos
- Mark as complete/incomplete
- Delete a todo
- Persist todos in Supabase

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

## Run app

```bash
npm install
npm run dev
```