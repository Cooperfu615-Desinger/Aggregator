import { http, HttpResponse, delay } from 'msw'
import { faker } from '@faker-js/faker'

// In-memory store for invoices
let invoices: any[] = []

// Helper to generate initial mock data
const generateInitialInvoices = () => {
    if (invoices.length > 0) return

    const months = ['2025-10', '2025-11', '2025-12']
    const merchants = [
        { id: 'OP-1001', name: 'Bet365', code: 'B365' },
        { id: 'OP-1002', name: '1xbet', code: '1X' },
        { id: 'OP-1003', name: 'K9Win', code: 'K9' }
    ]

    months.forEach(month => {
        merchants.forEach(m => {
            const ggr = faker.number.float({ min: 10000, max: 100000, fractionDigits: 2 })
            const rate = 10 // 10% commission
            const commission = ggr * (rate / 100)

            invoices.push({
                id: `INV-${m.code}-${month.replace('-', '')}`,
                merchant_id: m.id,
                merchant_name: m.name,
                period: month,
                total_ggr: Number(ggr.toFixed(2)),
                commission_rate: rate,
                amount_due: Number(commission.toFixed(2)),
                status: 'paid', // History is paid
                created_at: new Date(month + '-05').toISOString(),
                breakdown: [
                    { provider: 'PG Soft', ggr: ggr * 0.6, rate: 10, amount: ggr * 0.6 * 0.1 },
                    { provider: 'Evolution', ggr: ggr * 0.4, rate: 10, amount: ggr * 0.4 * 0.1 }
                ]
            })
        })
    })
}

generateInitialInvoices()

export const financeHandlers = [
    // Get Invoices
    http.get('/api/v2/finance/invoices', async () => {
        await delay(500)
        return HttpResponse.json({
            code: 0,
            msg: 'success',
            data: {
                list: invoices.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
                total: invoices.length
            }
        })
    }),

    // Generate Invoices (Preview)
    http.post('/api/v2/finance/invoices/preview', async () => {
        await delay(800)
        // const body = await request.json() as any
        // const month = body.month // '2026-01'

        // Simulate fetching GGR for all merchants for this month
        const merchants = [
            { id: 'OP-1001', name: 'Bet365', code: 'B365' },
            { id: 'OP-1002', name: '1xbet', code: '1X' },
            { id: 'OP-1003', name: 'K9Win', code: 'K9' },
            { id: 'OP-1004', name: 'M88', code: 'M88' }
        ]

        const previewData = merchants.map(m => {
            const ggr = faker.number.float({ min: 5000, max: 80000, fractionDigits: 2 })
            const rate = 10
            return {
                merchant_id: m.id,
                merchant_name: m.name,
                total_ggr: Number(ggr.toFixed(2)),
                commission_rate: rate,
                amount_due: Number((ggr * rate / 100).toFixed(2))
            }
        })

        return HttpResponse.json({
            code: 0,
            msg: 'success',
            data: previewData
        })
    }),

    // Confirm Generate (Create)
    http.post('/api/v2/finance/invoices/generate', async ({ request }) => {
        await delay(1000)
        const body = await request.json() as any
        const { month, items } = body // items = previewData array

        const newInvoices = items.map((item: any) => ({
            id: `INV-${item.merchant_name.substring(0, 3).toUpperCase()}-${month.replace('-', '')}-${faker.string.numeric(4)}`,
            merchant_id: item.merchant_id,
            merchant_name: item.merchant_name,
            period: month,
            total_ggr: item.total_ggr,
            commission_rate: item.commission_rate,
            amount_due: item.amount_due,
            status: 'pending',
            created_at: new Date().toISOString(),
            breakdown: [
                { provider: 'PG Soft', ggr: item.total_ggr * 0.7, rate: 10, amount: item.total_ggr * 0.7 * 0.1 },
                { provider: 'Evolution', ggr: item.total_ggr * 0.3, rate: 10, amount: item.total_ggr * 0.3 * 0.1 }
            ]
        }))

        invoices = [...newInvoices, ...invoices]

        return HttpResponse.json({
            code: 0,
            msg: 'Invoices Generated Successfully',
            data: { count: newInvoices.length }
        })
    }),

    // Pay Invoice
    http.post('/api/v2/finance/invoices/:id/pay', async ({ params }) => {
        await delay(600)
        const id = params.id
        const invoice = invoices.find(i => i.id === id)

        if (invoice) {
            invoice.status = 'paid'
            return HttpResponse.json({
                code: 0,
                msg: 'Invoice Marked as Paid'
            })
        }

        return HttpResponse.json({
            code: 404,
            msg: 'Invoice not found'
        })
    })
]
