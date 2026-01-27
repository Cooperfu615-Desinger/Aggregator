import Big from 'big.js'

/**
 * QA Protocol 3-A: Financial Precision Strategy
 * Wraps big.js for consistent, high-precision financial calculations.
 * Avoids native JS floating point errors (e.g. 0.1 + 0.2 !== 0.3).
 */

// Set strict rounding mode if needed, default is half-up
Big.DP = 10
Big.RM = Big.roundHalfUp

export const math = {
    // Basic arithmetic
    add: (a: number | string, b: number | string): number => Number(new Big(a || 0).plus(b || 0)),
    optAdd: (a: number | string | null | undefined, b: number | string | null | undefined): number => Number(new Big(a || 0).plus(b || 0)),

    sub: (a: number | string, b: number | string): number => Number(new Big(a || 0).minus(b || 0)),

    mul: (a: number | string, b: number | string): number => Number(new Big(a || 0).times(b || 0)),

    div: (a: number | string, b: number | string): number => {
        const divisor = new Big(b || 0)
        if (divisor.eq(0)) return 0 // Guard against division by zero
        return Number(new Big(a || 0).div(divisor))
    },

    // Percentage handling (e.g., 0.05 -> 5)
    toPercent: (vals: number | string, decimals = 2): string => {
        return new Big(vals || 0).times(100).toFixed(decimals)
    },

    // Currency formatting helper (wrapper for consistency)
    // Note: display logic should usually be in renderHelpers, but calc logic here
    calcExchange: (amount: number, rate: number): number => {
        if (!rate || rate === 0) return 0
        return Number(new Big(amount || 0).div(rate))
    }
}
