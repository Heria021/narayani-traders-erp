import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface Props {
  searchParams: Promise<{ reason?: string }>
}

const reasonMessages: Record<string, string> = {
  code: 'The sign-in link has expired or is invalid. Please request a new one.',
  otp: 'The verification link has expired. Please request a new link.',
  missing: 'An unexpected error occurred during sign-in. Please try again.',
}

export default async function AuthCodeErrorPage({ searchParams }: Props) {
  const { reason } = await searchParams
  const message =
    reasonMessages[reason ?? ''] ??
    'Something went wrong during sign-in. Please try again.'

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-sm text-center space-y-6">
        <div className="mx-auto w-14 h-14 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center">
          <AlertTriangle className="size-7 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-bold">Authentication Error</h1>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
        <div className="flex flex-col gap-2">
          <Link href="/auth/login">
            <Button className="w-full">Back to sign in</Button>
          </Link>
          <Link href="/auth/forgot-password">
            <Button variant="ghost" size="sm" className="w-full text-muted-foreground">
              Request a new link
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
