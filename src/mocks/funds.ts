import { http, HttpResponse, delay } from 'msw'
import { faker } from '@faker-js/faker'

export type FundType = 'top-up' | 'credit-limit' | 'manual-adjust'
export type FundStatus = 'pending' | 'approved' | 'rejected'

export interface FundRecord {
    id: string
    merchant_id: string
    merchant_name: string
    type: FundType
    amount: number
    // For credit-limit, amount is the requested NEW limit
    // For top-up, amount is the top-up amount
    // For manual-adjust, amount is the adjustment amount (can be negative)

    previous_balance?: number // Snapshot
    previous_credit_limit?: number // Snapshot

    proof?: string // URL or text
    reason?: string // For manual adjust or rejection reason

    status: FundStatus
    created_at: string
    updated_at?: string
    reviewer?: string
}

let fundRecords: FundRecord[] = []

// Generate initial mock data
const generateMockFunds = () => {
    if (fundRecords.length > 0) return

    const merchants = [
        { id: '1001', name: 'Bet365' },
        { id: '1002', name: '1xbet' },
        { id: '1003', name: 'K9Win' }
    ]

    // Generate 30 records
    for (let i = 0; i < 30; i++) {
        const merchant = faker.helpers.arrayElement(merchants)
        const type = faker.helpers.arrayElement(['top-up', 'credit-limit', 'manual-adjust'] as FundType[])
        const status = faker.helpers.weightedArrayElement([
            { weight: 20, value: 'pending' },
            { weight: 60, value: 'approved' },
            { weight: 20, value: 'rejected' }
        ]) as FundStatus

        let amount = 0
        let proof = undefined
        if (type === 'top-up') {
            amount = Number(faker.finance.amount({ min: 1000, max: 50000, dec: 2 }))
            proof = faker.image.url()
        } else if (type === 'credit-limit') {
            amount = Number(faker.finance.amount({ min: 100000, max: 1000000, dec: 0 })) // Round numbers for limits usually
            proof = faker.lorem.sentence()
        } else {
            amount = Number(faker.finance.amount({ min: -5000, max: 5000, dec: 2 }))
        }

        fundRecords.push({
            id: `FUND-${faker.string.alphanumeric(8).toUpperCase()}`,
            merchant_id: merchant.id,
            merchant_name: merchant.name,
            type,
            amount,
            proof,
            status,
            created_at: faker.date.recent({ days: 30 }).toISOString(),
            updated_at: status !== 'pending' ? faker.date.recent({ days: 5 }).toISOString() : undefined,
            reviewer: status !== 'pending' ? 'admin' : undefined
        })
    }
}

generateMockFunds()

export const fundsHandlers = [
    // List Funds
    http.get('/api/admin/funds', async ({ request }) => {
        await delay(500)
        const url = new URL(request.url)
        const type = url.searchParams.get('type')
        const status = url.searchParams.get('status')
        const merchantName = url.searchParams.get('merchant_name')?.toLowerCase()

        let filtered = [...fundRecords].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

        if (type && type !== 'all') {
            filtered = filtered.filter(r => r.type === type)
        }
        if (status && status !== 'all') {
            filtered = filtered.filter(r => r.status === status)
        }
        if (merchantName) {
            filtered = filtered.filter(r => r.merchant_name.toLowerCase().includes(merchantName))
        }

        return HttpResponse.json({
            code: 0,
            msg: 'success',
            data: {
                list: filtered,
                total: filtered.length
            }
        })
    }),

    // Review Fund Request
    http.post('/api/admin/funds/:id/review', async ({ params, request }) => {
        await delay(800)
        const id = params.id
        const body = await request.json() as { action: 'approve' | 'reject', reason?: string }
        const record = fundRecords.find(r => r.id === id)

        if (!record) {
            return HttpResponse.json({ code: 404, msg: 'Record not found' })
        }

        if (record.status !== 'pending') {
            return HttpResponse.json({ code: 400, msg: 'Record already processed' })
        }

        record.status = body.action === 'approve' ? 'approved' : 'rejected'
        record.updated_at = new Date().toISOString()
        record.reviewer = 'admin'
        if (body.reason) record.reason = body.reason

        // In a real system, we would update the merchant's wallet here.
        // For mock, we assume it's done.

        return HttpResponse.json({
            code: 0,
            msg: 'Review submitted successfully'
        })
    }),

    // Manual Adjustment
    http.post('/api/admin/funds/adjust', async ({ request }) => {
        await delay(800)
        const body = await request.json() as { merchant_id: string, merchant_name: string, type: 'manual-adjust', amount: number, reason: string }

        const newRecord: FundRecord = {
            id: `FUND-${faker.string.alphanumeric(8).toUpperCase()}`,
            merchant_id: body.merchant_id,
            merchant_name: body.merchant_name,
            type: 'manual-adjust',
            amount: body.amount,
            reason: body.reason,
            status: 'approved', // Auto-approved for manual adjustment
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            reviewer: 'admin'
        }

        fundRecords.unshift(newRecord)

        return HttpResponse.json({
            code: 0,
            msg: 'Adjustment applied successfully',
            data: newRecord
        })
    })
]
