'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updatePassword } from '@/app/auth/actions'
import { Loader2, AlertCircle } from 'lucide-react'

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
`

export default function UpdatePasswordPage() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleUpdate(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await updatePassword(formData)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <>
      <style>{sharedStyles}</style>
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md space-y-8">

          {/* Header */}
          <div className="space-y-1 auth-animate auth-animate-1">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-border flex items-center justify-center mb-4">
              <span className="text-lg font-bold text-primary">N</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Set new password</h1>
            <p className="text-sm text-muted-foreground">
              Choose a strong password for your account.
            </p>
          </div>

          {/* Form */}
          <form action={handleUpdate} className="space-y-4 auth-animate auth-animate-2">
            <div className="space-y-1.5">
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="Min. 8 characters"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Repeat your password"
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
                  Updating…
                </>
              ) : (
                'Update password'
              )}
            </Button>
          </form>
        </div>
      </div>
    </>
  )
}
