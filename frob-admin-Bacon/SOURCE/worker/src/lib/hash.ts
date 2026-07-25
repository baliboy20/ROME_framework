// Small Web Crypto SHA-256 helper shared by core-auth (password hash
// comparison) and core-consent-audit (IP address hashing, CNA01's
// "hashed evidence" non-functional requirement).

export async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
