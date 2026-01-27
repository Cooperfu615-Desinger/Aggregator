export interface Invoice {
    id: string
    merchant_id: string
    merchant_name: string
    period: string
    total_ggr: number
    commission_rate: number
    amount_due: number
    status: 'pending' | 'paid' | 'verifying'
    payment_proof?: string
    created_at: string
    paid_at?: string
    paid_by?: string
    breakdown: InvoiceBreakdown[]
}

export interface InvoiceBreakdown {
    provider: string
    ggr: number
    rate: number
    amount: number
}

// Fund Management Types
export type FundType = 'top-up' | 'credit-limit' | 'manual-adjust'
export type FundStatus = 'pending' | 'approved' | 'rejected'

export interface FundRecord {
    id: string
    merchant_id: string
    merchant_name: string
    type: FundType
    amount: number

    // Additional fields
    proof?: string
    reason?: string
    reviewer?: string

    status: FundStatus
    created_at: string
    updated_at?: string
}
