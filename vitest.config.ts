import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globalSetup: ["./src/test/globalSetup.ts"],
    testTimeout: 15000,
    maxWorkers: 1,
    server: {
      // next-auth (and its next/server import) must go through Vite's own
      // resolver instead of Node's native ESM loader: Next 14's package.json
      // has no "exports" map, so next-auth's extensionless `next/server`
      // import fails under native Node ESM resolution when Vitest
      // externalizes the package.
      deps: { inline: ["next-auth", "@auth/core"] },
    },
  },
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
});
