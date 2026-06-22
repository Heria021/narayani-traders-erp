'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { forgotPassword } from '@/app/auth/actions'
import { Loader2, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react'

const sharedStyles = `
  @keyframes auth-fade-up {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .auth-animate {
    opacity: 0;
    animation: auth-fade-up 0.45s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }
  .auth-animate-1 { animation-delay: 0ms; }
  .auth-animate-2 { animation-delay: 60ms; }
  .auth-animate-3 { animation-delay: 120ms; }
  @keyframes error-in {
    from { opacity: 0; transform: translateY(-6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .error-animate { animation: error-in 0.25s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
  @keyframes success-in {
    from { opacity: 0; transform: scale(0.97); }
    to   { opacity: 1; transform: scale(1); }
  }
  .success-animate { animation: success-in 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
`

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleForgotPassword(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await forgotPassword(formData)
      if (result?.error) setError(result.error)
      else setSuccess(true)
    })
  }

  return (
    <>
      <style>{sharedStyles}</style>
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md space-y-8">

          {/* Back link */}
          <Link
            href="/auth/login"
            className="auth-animate auth-animate-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-150"
          >
            <ArrowLeft className="size-4" />
            Back to sign in
          </Link>

          {/* Header */}
          <div className="space-y-1 auth-animate auth-animate-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-border flex items-center justify-center mb-4">
              <span className="text-lg font-bold text-primary">N</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Reset your password</h1>
            <p className="text-sm text-muted-foreground">
              Enter your email and we&apos;ll send you a secure reset link.
            </p>
          </div>

          {/* Form / Success */}
          <div className="auth-animate auth-animate-3">
            {success ? (
              <div className="success-animate rounded-lg border border-border bg-muted/40 p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="size-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Check your inbox</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      If that email is registered, you&apos;ll receive a reset link shortly.
                    </p>
                  </div>
                </div>
                <Link href="/auth/login">
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    Back to sign in
                  </Button>
                </Link>
              </div>
            ) : (
              <form action={handleForgotPassword} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@narayanitraders.com"
                    required
                  />
                </div>

                {error && (
                  <div className="error-animate flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    <AlertCircle className="size-4 shrink-0" />
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full" size="lg" disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Sending reset link…
                    </>
                  ) : (
                    'Send reset link'
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
