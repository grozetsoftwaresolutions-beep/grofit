'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAdminSupabaseClient } from '@/lib/supabase/admin'

export async function login(formData: FormData) {
  const supabase = await createClient()
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const password = formData.get('password') as string

  if (!email || !password) {
    redirect('/auth/login?message=' + encodeURIComponent('Please enter your email and password.'))
  }

  let { error } = await supabase.auth.signInWithPassword({ email, password })

  // If user signed up previously without confirmation or email confirmation is pending
  if (error && error.message?.toLowerCase().includes('email not confirmed')) {
    try {
      const adminClient = getAdminSupabaseClient()
      const { data: usersData } = await adminClient.auth.admin.listUsers()
      const matched = usersData?.users?.find((u) => u.email?.toLowerCase() === email)
      if (matched) {
        await adminClient.auth.admin.updateUserById(matched.id, { email_confirm: true })
        const retryResult = await supabase.auth.signInWithPassword({ email, password })
        if (!retryResult.error) {
          error = null
        }
      }
    } catch {
      // If admin resolution fails, continue with default error display
    }
  }

  if (error) {
    const msg = error.message?.toLowerCase().includes('invalid login credentials')
      ? 'Invalid email or password. Please try again.'
      : error.message || 'Could not authenticate user.'
    redirect('/auth/login?message=' + encodeURIComponent(msg))
  }

  revalidatePath('/', 'layout')
  redirect('/app')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const password = formData.get('password') as string

  if (!email || !password) {
    redirect('/auth/signup?message=' + encodeURIComponent('Please provide both email and password.'))
  }

  if (password.length < 6) {
    redirect('/auth/signup?message=' + encodeURIComponent('Password must be at least 6 characters long.'))
  }

  let userReady = false

  // Try creating user via Admin API with email_confirm: true to bypass Supabase SMTP rate limits (429 over_email_send_rate_limit)
  try {
    const adminClient = getAdminSupabaseClient()
    const { error: adminErr } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (!adminErr) {
      userReady = true
    } else if (
      adminErr.message?.toLowerCase().includes('already') ||
      (adminErr as any).code === 'email_exists'
    ) {
      // User exists. Try signing in with the provided password!
      const { data: signinData, error: signinErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (!signinErr && signinData?.session) {
        revalidatePath('/', 'layout')
        redirect('/app')
      }

      // If signin failed due to unconfirmed email, confirm and retry
      if (signinErr?.message?.toLowerCase().includes('email not confirmed')) {
        const { data: usersData } = await adminClient.auth.admin.listUsers()
        const matched = usersData?.users?.find((u) => u.email?.toLowerCase() === email)
        if (matched) {
          await adminClient.auth.admin.updateUserById(matched.id, { email_confirm: true })
          const { error: retryErr } = await supabase.auth.signInWithPassword({ email, password })
          if (!retryErr) {
            revalidatePath('/', 'layout')
            redirect('/app')
          }
        }
      }

      redirect(
        '/auth/login?message=' +
          encodeURIComponent('An account with this email already exists. Please sign in.')
      )
    } else {
      // Other admin error: fall through to standard signUp
    }
  } catch (err: any) {
    // If Next.js redirect threw NEXT_REDIRECT, let it propagate
    if (err?.message === 'NEXT_REDIRECT' || err?.digest?.startsWith('NEXT_REDIRECT')) {
      throw err
    }
    // Otherwise fallback to client signUp below
  }

  // If user was created via admin, sign them in immediately to establish session cookies
  if (userReady) {
    const { error: sessionErr } = await supabase.auth.signInWithPassword({ email, password })
    if (sessionErr) {
      redirect(
        '/auth/login?message=' +
          encodeURIComponent('Account created! Please sign in with your password.')
      )
    }

    revalidatePath('/', 'layout')
    redirect('/app')
  }

  // Fallback: standard signUp if adminClient was unavailable
  const { data, error } = await supabase.auth.signUp({ email, password })

  if (error) {
    const msg = error.message?.toLowerCase().includes('already registered')
      ? 'An account with this email already exists. Please sign in instead.'
      : error.message?.toLowerCase().includes('rate limit')
      ? 'Rate limit reached. If you already registered, please sign in.'
      : error.message || 'Could not create user.'
    redirect('/auth/signup?message=' + encodeURIComponent(msg))
  }

  // If session was established
  if (data?.session) {
    revalidatePath('/', 'layout')
    redirect('/app')
  }

  // If session is null (email confirmation required), try signing in
  const { error: immediateSignInErr } = await supabase.auth.signInWithPassword({ email, password })
  if (!immediateSignInErr) {
    revalidatePath('/', 'layout')
    redirect('/app')
  }

  redirect(
    '/auth/login?message=' +
      encodeURIComponent('Account created! Please check your email to confirm or sign in.')
  )
}

export async function signout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/auth/login')
}
