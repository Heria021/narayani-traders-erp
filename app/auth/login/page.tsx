'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { signInWithPassword, signInWithMagicLink } from '@/app/auth/actions'
import { Loader2, Mail, Lock, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function LoginPage() {
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [magicError, setMagicError] = useState<string | null>(null)
  const [magicSuccess, setMagicSuccess] = useState(false)
  const [isPendingPassword, startPasswordTransition] = useTransition()
  const [isPendingMagic, startMagicTransition] = useTransition()

  function handlePasswordLogin(formData: FormData) {
    setPasswordError(null)
    startPasswordTransition(async () => {
      const result = await signInWithPassword(formData)
      if (result?.error) setPasswordError(result.error)
    })
  }

  function handleMagicLink(formData: FormData) {
    setMagicError(null)
    setMagicSuccess(false)
    startMagicTransition(async () => {
      const result = await signInWithMagicLink(formData)
      if (result?.error) setMagicError(result.error)
      else setMagicSuccess(true)
    })
  }

  return (
    <>
      {/* Page-entry keyframe animations */}
      <style>{`
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
        .auth-animate-4 { animation-delay: 180ms; }

        @keyframes tab-content-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        [data-state="active"].tab-panel {
          animation: tab-content-in 0.3s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        @keyframes error-in {
          from { opacity: 0; transform: translateY(-6px); max-height: 0; }
          to   { opacity: 1; transform: translateY(0);  max-height: 80px; }
        }
        .error-animate {
          animation: error-in 0.25s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        @keyframes success-in {
          from { opacity: 0; transform: scale(0.97); }
          to   { opacity: 1; transform: scale(1); }
        }
        .success-animate {
          animation: success-in 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
      `}</style>

      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md space-y-8">

          {/* ── Logo + Header ── */}
          <div className="space-y-1 auth-animate auth-animate-1">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-border flex items-center justify-center mb-4">
              <span className="text-lg font-bold text-primary">N</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-sm text-muted-foreground">
              Sign in to Narayani Traders ERP
            </p>
          </div>

          {/* ── Tabs ── */}
          <div className="auth-animate auth-animate-2">
            <Tabs defaultValue="password" className="space-y-6">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="password" className="gap-2">
                  <Lock className="size-3.5" />
                  Password
                </TabsTrigger>
                <TabsTrigger value="magic" className="gap-2">
                  <Sparkles className="size-3.5" />
                  Magic Link
                </TabsTrigger>
              </TabsList>

              {/* ─ Password tab ─ */}
              <TabsContent value="password" className="tab-panel space-y-4 mt-0">
                <form action={handlePasswordLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email-pw">Email address</Label>
                    <Input
                      id="email-pw"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@narayanitraders.com"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <Link
                        href="/auth/forgot-password"
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-150"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  {passwordError && (
                    <div className="error-animate flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      <AlertCircle className="size-4 shrink-0" />
                      {passwordError}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={isPendingPassword}
                  >
                    {isPendingPassword ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Signing in…
                      </>
                    ) : (
                      'Sign in'
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* ─ Magic Link tab ─ */}
              <TabsContent value="magic" className="tab-panel space-y-4 mt-0">
                {magicSuccess ? (
                  <div className="success-animate rounded-lg border border-border bg-muted/40 p-6 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="size-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">Check your inbox</p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          We sent you a magic link — click it to sign in instantly.
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setMagicSuccess(false)}
                    >
                      Use a different email
                    </Button>
                  </div>
                ) : (
                  <form action={handleMagicLink} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="email-magic">Email address</Label>
                      <Input
                        id="email-magic"
                        name="email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@narayanitraders.com"
                        required
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      We&apos;ll email you a secure one-time link — no password needed.
                    </p>

                    {magicError && (
                      <div className="error-animate flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                        <AlertCircle className="size-4 shrink-0" />
                        {magicError}
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full"
                      size="lg"
                      disabled={isPendingMagic}
                    >
                      {isPendingMagic ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Sending…
                        </>
                      ) : (
                        <>
                          <Mail className="size-4" />
                          Send magic link
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* ── Footer ── */}
          <p className="text-center text-sm text-muted-foreground auth-animate auth-animate-3">
            Don&apos;t have an account?{' '}
            <Link
              href="/auth/signup"
              className="font-medium text-foreground underline underline-offset-4 hover:text-primary transition-colors duration-150"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </>
  )
}
