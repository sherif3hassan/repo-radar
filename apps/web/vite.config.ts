import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./src/test/setup.ts'],
    /**
     * Vitest's 5s default is too tight for this suite. These are integration
     * tests: a full MUI dialog render plus a keystroke-by-keystroke `user.type`
     * costs ~1.8s for the token test on a developer machine, and a two-core CI
     * runner is comfortably 3x slower — which is how it timed out in CI while
     * passing everywhere else.
     *
     * Raising it is not hiding a slow test so much as refusing a false failure:
     * a timed-out `user.type` keeps running and types the rest of its string
     * into the next test's DOM, so one timeout reports as two unrelated
     * failures and sends you looking in the wrong file.
     */
    testTimeout: 20_000,
  },
})
