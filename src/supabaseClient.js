import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const ensureSession = async () => {
  const {
    data: { session },
    error
  } = await supabase.auth.getSession()

  if (error) {
    throw error
  }

  if (session) {
    return session
  }

  const { data: signInData, error: signInError } = await supabase.auth.signInAnonymously()
  if (signInError) {
    throw signInError
  }

  return signInData.session
}

export const signUpWithEmail = async (email, password) => {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) {
    throw error
  }
  return data
}

export const signInWithEmail = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    throw error
  }
  return data
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) {
    throw error
  }
}

export const getCurrentUser = async () => {
  const {
    data: { user },
    error
  } = await supabase.auth.getUser()

  if (error) {
    throw error
  }

  return user
}
