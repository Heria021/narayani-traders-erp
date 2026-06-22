'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getURL } from '@/lib/supabase/get-url'

// ── Sign In with Email & Password ──────────────────────────────────────────
export async function signInWithPassword(formData: FormData) {
  const supabase = await createClient()

  const email = (formData.get('email') as string).trim().toLowerCase()
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

// ── Sign Up with Email & Password ──────────────────────────────────────────
export async function signUp(formData: FormData) {
  const supabase = await createClient()

  const email = (formData.get('email') as string).trim().toLowerCase()
  const password = formData.get('password') as string
  const fullName = (formData.get('fullName') as string | null)?.trim() ?? ''

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      // emailRedirectTo must be allow-listed in Supabase Dashboard
      emailRedirectTo: getURL('/auth/callback?next=/dashboard'),
    },
  })

  if (error) {
    return { error: error.message }
  }

  // If email confirmation is required, stay on page and show the message
  return { success: true }
}

// ── Magic Link (passwordless) ──────────────────────────────────────────────
export async function signInWithMagicLink(formData: FormData) {
  const supabase = await createClient()

  const email = (formData.get('email') as string).trim().toLowerCase()

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false, // only allow existing users via magic link
      emailRedirectTo: getURL('/auth/callback?next=/dashboard'),
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

// ── Forgot Password ────────────────────────────────────────────────────────
export async function forgotPassword(formData: FormData) {
  const supabase = await createClient()

  const email = (formData.get('email') as string).trim().toLowerCase()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getURL('/auth/callback?next=/auth/update-password'),
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

// ── Update Password (after reset) ─────────────────────────────────────────
export async function updatePassword(formData: FormData) {
  const supabase = await createClient()

  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match.' }
  }

  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters.' }
  }

  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

// ── Sign Out ───────────────────────────────────────────────────────────────
export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/auth/login')
}
