import { http, HttpResponse, delay } from 'msw'
import { faker } from '@faker-js/faker'

// Mock Data for specific Merchant (ID: 999 for testing)
const merchantStats = {
    balance: 15420.50,
    currency: 'USD',
    today_ggr: 1250.00,
    active_players: 142,
    chart_data: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - (6 - i) * 86400000).toISOString().split('T')[0],
        ggr: faker.number.float({ min: 500, max: 2000, fractionDigits: 2 })
    }))
}

let merchantCredentials = {
    merchant_code: 'AGG_TEST_999',
    secret_key: 'sk_live_' + faker.string.uuid(),
    whitelist: ['1.1.1.1', '203.0.113.1']
}

export const agentHandlers = [
    // Dashboard Stats
    http.get('/api/v2/agent/stats', async () => {
        await delay(500)
        return HttpResponse.json({
            code: 0,
            msg: 'success',
            data: merchantStats
        })
    }),

    // Get Credentials & Whitelist
    http.get('/api/v2/agent/credentials', async () => {
        await delay(400)
        return HttpResponse.json({
            code: 0,
            msg: 'success',
            data: merchantCredentials
        })
    }),

    // Update Whitelist
    http.post('/api/v2/agent/whitelist', async ({ request }) => {
        await delay(800)
        const body = await request.json() as any
        merchantCredentials.whitelist = body.whitelist
        return HttpResponse.json({
            code: 0,
            msg: 'Whitelist updated successfully'
        })
    }),

    // Regenerate Key (Mock)
    http.post('/api/v2/agent/regenerate-key', async () => {
        await delay(1000)
        merchantCredentials.secret_key = 'sk_live_' + faker.string.uuid()
        return HttpResponse.json({
            code: 0,
            msg: 'New Secret Key Generated',
            data: { secret_key: merchantCredentials.secret_key }
        })
    }),

    // Win/Loss Report (Isolated)
    http.post('/api/v2/agent/report/win-loss', async () => {
        await delay(600)
        const list = Array.from({ length: 15 }, () => ({
            id: 'TX-' + faker.string.numeric(10),
            time: faker.date.recent().toISOString(),
            game_name: faker.helpers.arrayElement(['Fortune Tiger', 'Crazy Time', 'Super Ace']),
            bet: faker.number.float({ min: 1, max: 100, fractionDigits: 2 }),
            win: faker.number.float({ min: 0, max: 200, fractionDigits: 2 }),
            status: faker.helpers.arrayElement(['win', 'loss'])
        }))

        return HttpResponse.json({
            code: 0,
            msg: 'success',
            data: {
                list,
                total: 15
            }
        })
    }),

    // Sub Agent List
    http.get('/api/v2/agent/sub-agents', async () => {
        await delay(500)
        const list = Array.from({ length: 8 }, () => ({
            id: faker.number.int({ min: 100, max: 999 }),
            account: faker.internet.username(),
            level: 2,
            balance: faker.number.float({ min: 100, max: 5000, fractionDigits: 2 }),
            status: faker.helpers.arrayElement(['active', 'disabled']),
            created_at: faker.date.past().toISOString(),
            commission_rate: faker.number.int({ min: 20, max: 50 }),
            player_count: faker.number.int({ min: 0, max: 500 }),
            monthly_performance: faker.number.float({ min: 0, max: 100000, fractionDigits: 2 }),
            promotion_code: faker.string.alphanumeric(8).toUpperCase(),
            percent: 30
        }))
        return HttpResponse.json({
            code: 0,
            msg: 'success',
            data: { list, total: 8 }
        })
    }),

    // Create Agent
    http.post('/api/v2/merchant/agents', async () => {
        await delay(600)
        return HttpResponse.json({ code: 0, msg: 'Agent created successfully' })
    }),

    // Update Agent
    http.put('/api/v2/merchant/agents/:id', async () => {
        await delay(500)
        return HttpResponse.json({ code: 0, msg: 'Agent updated successfully' })
    }),

    // Transfer
    http.post('/api/v2/merchant/agents/:id/transfer', async ({ request }) => {
        await delay(600)
        const body = await request.json() as any

        // Simple logic simulation
        if (body.type === 'deposit') {
            merchantStats.balance -= body.amount
        } else {
            merchantStats.balance += body.amount
        }

        return HttpResponse.json({ code: 0, msg: 'Transfer successful' })
    }),

    // My Games List
    http.get('/api/v2/agent/games', async () => {
        await delay(600)
        const providers = ['PG Soft', 'Evolution', 'Pragmatic Play', 'JILI']
        // Create 15 mock games
        const list = Array.from({ length: 15 }, (_, i) => {
            const provider = faker.helpers.arrayElement(providers)
            // Hardcode specific scenario for testing
            if (i === 0) {
                return {
                    game_id: 'pg-mahjong-ways',
                    game_code: 'mahjong-ways',
                    name_en: 'Mahjong Ways',
                    provider: 'PG Soft',
                    type: 'Slot',
                    rtp: 96.92,
                    merchant_enabled: true,
                    master_enabled: true,
                    thumbnail: 'https://placehold.co/60x60?text=MW',
                    release_date: faker.date.past({ years: 1 }).toISOString(),
                    admin_status: 'active'
                }
            }
            if (i === 1) {
                return {
                    game_id: 'maintenance-slot',
                    game_code: 'maintenance-slot',
                    name_en: 'Maintenance Slot',
                    provider: 'JILI',
                    type: 'Slot',
                    rtp: 95.00,
                    merchant_enabled: false,
                    master_enabled: false, // Disabled by platform
                    thumbnail: 'https://placehold.co/60x60?text=X',
                    release_date: faker.date.past({ years: 1 }).toISOString(),
                    admin_status: 'disabled'
                }
            }
            return {
                game_id: faker.string.uuid(),
                game_code: faker.string.alpha({ length: 6, casing: 'lower' }),
                name_en: faker.commerce.productName(),
                provider,
                type: faker.helpers.arrayElement(['Slot', 'Live', 'Fishing']),
                rtp: faker.number.float({ min: 90, max: 98, fractionDigits: 2 }),
                merchant_enabled: faker.datatype.boolean(),
                master_enabled: true,
                thumbnail: `https://placehold.co/60x60?text=${provider.substring(0, 2)}`,
                release_date: faker.date.past({ years: 2 }).toISOString(),
                admin_status: 'active'
            }
        })

        return HttpResponse.json({
            code: 0,
            msg: 'success',
            data: { list, total: 15 }
        })
    }),

    // Toggle Game Status
    http.post('/api/v2/agent/games/toggle', async () => {
        await delay(400)
        // In a real mock, we might update state, but for now just success
        return HttpResponse.json({
            code: 0,
            msg: 'Update success'
        })
    }),

    // Daily Report
    http.post('/api/v2/agent/report/daily', async () => {
        await delay(800)
        // Generate last 7 days
        const list = Array.from({ length: 7 }, (_, i) => {
            const date = new Date()
            date.setDate(date.getDate() - i)
            const bets = faker.number.float({ min: 1000, max: 50000, fractionDigits: 2 })
            // Simulate mixed GGR (some wins for players implies negative GGR, but usually GGR is positive)
            // Let's make it occasionally negative to test red color
            const winRate = faker.helpers.arrayElement([0.9, 0.95, 0.98, 1.05, 0.8])
            const wins = bets * winRate

            return {
                date: date.toISOString().split('T')[0],
                currency: 'USD',
                total_bet: bets,
                total_win: wins,
                ggr: bets - wins,
                round_count: faker.number.int({ min: 50, max: 1000 }),
                player_count: faker.number.int({ min: 10, max: 200 })
            }
        })

        return HttpResponse.json({
            code: 0,
            msg: 'success',
            data: { list, total: 7 }
        })
    }),

    // Bet Query (Sanitized - No Provider)
    http.post('/api/v2/merchant/reports/bet-logs', async ({ request }) => {
        await delay(700)
        const body = await request.json() as any
        const count = body.pageSize || 15

        const list = Array.from({ length: count }, () => {
            const bet = faker.number.float({ min: 1, max: 500, fractionDigits: 2 })
            const isWin = faker.datatype.boolean()
            const win = isWin ? bet * faker.number.float({ min: 1.1, max: 50 }) : 0

            return {
                id: 'R-' + faker.string.alphanumeric(12).toUpperCase(),
                created_at: faker.date.recent().toISOString(),
                player_id: 'user_' + faker.string.numeric(4),
                game_name: faker.helpers.arrayElement(['Mahjong Ways', 'Super Ace', 'Crazy Time', 'Baccarat']),
                bet: bet,
                win: win,
                currency: 'USD',
                status: isWin ? 'win' : 'loss',
                // No detailed breakdown in list to simulate privacy
                detail: {}
            }
        })

        return HttpResponse.json({
            code: 0,
            msg: 'success',
            data: {
                list,
                total: 100,
                page: body.page || 1,
                pageSize: count
            }
        })
    }),

    // Merchant Invoices - Historical billing records
    http.get('/api/agent/invoices', async () => {
        await delay(600)

        // Generate 6 months of invoice history
        const list = Array.from({ length: 6 }, (_, i) => {
            const date = new Date()
            date.setMonth(date.getMonth() - i)
            const yearMonth = date.toISOString().substring(0, 7)

            const totalGgr = faker.number.float({ min: 5000, max: 50000, fractionDigits: 2 })
            const commissionRate = 0.15 // 15% commission
            const amountDue = totalGgr * commissionRate

            // First 2 invoices are paid, rest are pending
            const status = i < 2 ? 'paid' : 'pending'

            return {
                id: `INV-${yearMonth.replace('-', '')}-${faker.string.numeric(4)}`,
                period: yearMonth,
                total_ggr: totalGgr,
                commission_rate: commissionRate,
                amount_due: amountDue,
                status,
                created_at: date.toISOString()
            }
        })

        return HttpResponse.json({
            code: 0,
            msg: 'success',
            data: { list, total: list.length }
        })
    })
]
