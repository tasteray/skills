import type { Env as HubEnv } from '../src/env'

declare global {
  namespace Cloudflare {
    interface Env extends HubEnv {}
    interface GlobalProps {
      mainModule: typeof import('../src/index')
      durableNamespaces: 'UserHub' | 'Directory'
    }
  }
}
