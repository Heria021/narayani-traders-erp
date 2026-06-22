import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Auth callback handler for:
 * - OAuth sign-in (Google, GitHub, etc.)  → uses `code`
 * - Magic link / email OTP confirmation    → uses `token_hash` + `type`
 *
 * Supabase redirects here after external authentication.
 * The redirect URL must be allow-listed in Supabase Dashboard →
 * Authentication → URL Configuration → Redirect URLs.
 *
 * URL detection is fully automatic — no hardcoded localhost.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)

  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as
    | 'email'
    | 'recovery'
    | 'invite'
    | 'magiclink'
    | null

  // Where to send the user after a successful sign-in
  const next = searchParams.get('next') ?? '/dashboard'

  // Resolve the production-safe redirect base.
  // In development `origin` = http://localhost:3000 which is fine.
  // In production we prefer x-forwarded-host (behind a proxy / Vercel).
  const forwardedHost = request.headers.get('x-forwarded-host')
  const base =
    process.env.NODE_ENV === 'production' && forwardedHost
      ? `https://${forwardedHost}`
      : origin

  const supabase = await createClient()

  // ── OAuth / PKCE code flow ──────────────────────────────────────────
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${base}${next}`)
    }
    console.error('[auth/callback] code exchange error:', error.message)
    return NextResponse.redirect(`${base}/auth/auth-code-error?reason=code`)
  }

  // ── Magic link / Email OTP / Recovery token flow ────────────────────
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
    if (!error) {
      // For password-recovery links, send to update-password page
      const destination = type === 'recovery' ? '/auth/update-password' : next
      return NextResponse.redirect(`${base}${destination}`)
    }
    console.error('[auth/callback] OTP verification error:', error.message)
    return NextResponse.redirect(`${base}/auth/auth-code-error?reason=otp`)
  }

  // No valid params — something went wrong upstream
  return NextResponse.redirect(`${base}/auth/auth-code-error?reason=missing`)
}
