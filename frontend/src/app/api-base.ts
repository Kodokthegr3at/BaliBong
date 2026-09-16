/**
 * Resolves the base URL for backend API calls.
 *
 * In the browser this is always a relative path: vercel.json (production)
 * and proxy.conf.json (local `ng serve`) both route `/api` to the backend
 * from the same origin the page was loaded from.
 *
 * During server-side rendering there is no page origin to resolve a relative
 * URL against, so an absolute one is required: Vercel exposes the deployment
 * host as VERCEL_URL, and local SSR (`ng serve` / `node dist/.../server.mjs`)
 * falls back to the backend's default local port.
 */
export function getApiBase(): string {
  if (typeof window !== 'undefined') {
    return '/api';
  }
  const vercelUrl = typeof process !== 'undefined' ? process.env['VERCEL_URL'] : undefined;
  return vercelUrl ? `https://${vercelUrl}/api` : 'http://localhost:5000/api';
}
