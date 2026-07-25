/**
 * Static header guard for admin routes (S7). Good enough for a POC — a production admin surface
 * would need real auth, not a shared secret header.
 */
export function isAdminAuthorized(request: Request, adminApiKey: string): boolean {
  return request.headers.get('X-Admin-Key') === adminApiKey;
}
