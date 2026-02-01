import { beforeAll, afterAll, vi } from 'vitest'

// Mock environment variables for tests
beforeAll(() => {
  vi.stubEnv('X402_NETWORK', 'base-sepolia')
  vi.stubEnv('X402_FACILITATOR_URL', 'https://x402.org/facilitator')
  vi.stubEnv('SUPABASE_URL', 'https://test.supabase.co')
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-role-key')
})

afterAll(() => {
  vi.unstubAllEnvs()
})
