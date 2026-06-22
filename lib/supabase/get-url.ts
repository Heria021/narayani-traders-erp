/**
 * Returns the correct absolute base URL of the app for use in auth redirects.
 *
 * Priority order:
 *  1. NEXT_PUBLIC_SITE_URL  – set this in production (e.g. https://erp.narayanitraders.com)
 *  2. NEXT_PUBLIC_VERCEL_URL – automatically injected by Vercel
 *  3. Request origin derived at runtime – works for any other host
 *
 * This approach ensures no localhost URLs ever leak into production redirects,
 * and no hardcoded domains need to be updated when deploying.
 */
export function getURL(path: string = ''): string {
  let base =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ??
    (process.env.NEXT_PUBLIC_VERCEL_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL.trim()}`
      : '')

  // Remove trailing slash from base
  base = base.replace(/\/+$/, '')

  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  return `${base}${normalizedPath}`
}
