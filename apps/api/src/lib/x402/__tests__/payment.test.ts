import { describe, it, expect } from 'vitest'
import {
  formatUSDC,
  toUSDCUnits,
  fromUSDCUnits,
  generatePaymentRequirement,
} from '../payment.js'

describe('x402 Payment', () => {
  describe('formatUSDC', () => {
    it('formats numbers to 2 decimal places', () => {
      expect(formatUSDC(10)).toBe('10.00')
      expect(formatUSDC(10.5)).toBe('10.50')
      expect(formatUSDC(10.123456)).toBe('10.12')
      expect(formatUSDC(0)).toBe('0.00')
    })

    it('handles string inputs', () => {
      expect(formatUSDC('10')).toBe('10.00')
      expect(formatUSDC('10.5')).toBe('10.50')
    })
  })

  describe('toUSDCUnits', () => {
    it('converts decimal USDC to base units (6 decimals)', () => {
      expect(toUSDCUnits(1)).toBe(BigInt(1000000))
      expect(toUSDCUnits(10)).toBe(BigInt(10000000))
      expect(toUSDCUnits(10.5)).toBe(BigInt(10500000))
      expect(toUSDCUnits(0.01)).toBe(BigInt(10000))
    })

    it('handles zero', () => {
      expect(toUSDCUnits(0)).toBe(BigInt(0))
    })
  })

  describe('fromUSDCUnits', () => {
    it('converts base units to decimal USDC', () => {
      expect(fromUSDCUnits(BigInt(1000000))).toBe(1)
      expect(fromUSDCUnits(BigInt(10000000))).toBe(10)
      expect(fromUSDCUnits(BigInt(10500000))).toBe(10.5)
    })

    it('roundtrips with toUSDCUnits', () => {
      const testValues = [0, 0.01, 0.5, 1, 10, 100]
      for (const value of testValues) {
        expect(fromUSDCUnits(toUSDCUnits(value))).toBeCloseTo(value, 6)
      }
    })
  })

  describe('generatePaymentRequirement', () => {
    const testPayTo = '0x742d35Cc6634C0532925a3b844Bc9e7595f00000' as `0x${string}`
    const testJobId = '550e8400-e29b-41d4-a716-446655440000'

    it('generates valid payment requirement structure', () => {
      const result = generatePaymentRequirement(
        testPayTo,
        10.50,
        testJobId,
        'Payment for test job'
      )

      expect(result).toHaveProperty('payTo', testPayTo)
      expect(result).toHaveProperty('amount', '10500000')
      expect(result).toHaveProperty('asset')
      expect(result).toHaveProperty('chain', 'base-sepolia')
      expect(result).toHaveProperty('chainId', 84532)
      expect(result.metadata.jobId).toBe(testJobId)
    })
  })
})
