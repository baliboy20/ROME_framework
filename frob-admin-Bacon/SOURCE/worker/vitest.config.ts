import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// `cloudflare:email` is a Workers-runtime built-in that the test bundler can't
// resolve. Alias it to a lightweight stub so send-path code (which imports
// EmailMessage) loads and runs under Vitest; the real module is used at
// deploy time.
export default defineConfig({
  resolve: {
    alias: {
      "cloudflare:email": fileURLToPath(new URL("./test/stubs/cloudflare-email.ts", import.meta.url)),
    },
  },
});
