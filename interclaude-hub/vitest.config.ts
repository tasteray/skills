import { defineConfig } from 'vitest/config'
import { cloudflareTest } from '@cloudflare/vitest-plugin'

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: './wrangler.jsonc' },
      miniflare: {
        bindings: {
          LINEAR_WEBHOOK_SECRET: 'test-webhook-secret',
          DEBUG_TOKEN: 'test-debug-token',
          LINEAR_OAUTH_CLIENT_ID: 'test-client-id',
          LINEAR_OAUTH_CLIENT_SECRET: 'test-client-secret',
        },
      },
    }),
  ],
})
