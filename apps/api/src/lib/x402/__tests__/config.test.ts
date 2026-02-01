import { describe, it, expect } from 'vitest'
import {
  isValidEVMAddress,
  USDC_ADDRESSES,
  X402_HEADERS,
  EVM_ADDRESS_REGEX,
} from '../config.js'

describe('x402 Config', () => {
  describe('isValidEVMAddress', () => {
    it('validates correct EVM addresses', () => {
      expect(isValidEVMAddress('0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913')).toBe(true)
      expect(isValidEVMAddress('0x833589fcd6edb6e08f4c7c32d4f71b54bda02913')).toBe(true)
      expect(isValidEVMAddress('0x0000000000000000000000000000000000000000')).toBe(true)
    })

    it('rejects invalid EVM addresses', () => {
      expect(isValidEVMAddress('833589fCD6eDb6E08f4c7C32D4f71b54bdA02913')).toBe(false)
      expect(isValidEVMAddress('0x833589fCD6eDb6E08f4c7C32D4f71b54bdA0291')).toBe(false)
      expect(isValidEVMAddress('')).toBe(false)
      expect(isValidEVMAddress('not-an-address')).toBe(false)
    })
  })

  describe('USDC_ADDRESSES', () => {
    it('has correct Base mainnet USDC address', () => {
      expect(USDC_ADDRESSES['base']).toBe('0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913')
    })

    it('has correct Base Sepolia USDC address', () => {
      expect(USDC_ADDRESSES['base-sepolia']).toBe('0x036CbD53842c5426634e7929541eC2318f3dCF7e')
    })
  })

  describe('X402_HEADERS', () => {
    it('has correct header names', () => {
      expect(X402_HEADERS.PAYMENT_REQUIRED).toBe('x-payment-required')
      expect(X402_HEADERS.PAYMENT_SIGNATURE).toBe('x-payment')
      expect(X402_HEADERS.RECEIPT).toBe('x-receipt')
    })
  })
})
