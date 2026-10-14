'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()
  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string

  if (!email || !password) {
    redirect('/auth/login?message=' + encodeURIComponent('Please enter your email and password.'))
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    const msg = error.message?.toLowerCase().includes('email not confirmed')
      ? 'Please confirm your email address before signing in.'
      : error.message || 'Could not authenticate user.'
    redirect('/auth/login?message=' + encodeURIComponent(msg))
  }

  revalidatePath('/', 'layout')
  redirect('/app')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string

  if (!email || !password) {
    redirect('/auth/signup?message=' + encodeURIComponent('Please provide both email and password.'))
  }

  if (password.length < 6) {
    redirect('/auth/signup?message=' + encodeURIComponent('Password must be at least 6 characters long.'))
  }

  const { data, error } = await supabase.auth.signUp({ email, password })

  if (error) {
    const msg = error.message?.toLowerCase().includes('already registered')
      ? 'An account with this email already exists. Please sign in instead.'
      : error.message || 'Could not create user.'
    redirect('/auth/signup?message=' + encodeURIComponent(msg))
  }

  // If email confirmation is enabled, session is null until user clicks confirmation link
  if (!data?.session) {
    redirect('/auth/login?message=' + encodeURIComponent('Account created! Please sign in with your password.'))
  }

  revalidatePath('/', 'layout')
  redirect('/app')
}

export async function signout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/auth/login')
}
