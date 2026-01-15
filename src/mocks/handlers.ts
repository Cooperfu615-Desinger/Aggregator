import { http, HttpResponse, delay } from 'msw'
import { faker } from '@faker-js/faker'
import type { Merchant, MerchantDetail } from '../types/merchant'

function createRandomMerchant(id: number): Merchant {
    return {
        id,
        site_code: faker.string.alpha({ length: 3, casing: 'upper' }),
        account: faker.internet.username(),
        name: faker.company.name(),
        currency_type: faker.helpers.arrayElement(['TWD', 'CNY', 'USD']),
        percent: faker.number.int({ min: 90, max: 99 }), // Used for RTP or share? "percent" in Merchant usually means share, but leveraging for initial value if needed.
        state: faker.helpers.arrayElement([0, 1]),
        created_at: faker.date.past().toISOString(),
    }
}

export const handlers = [
    http.get('/api/v2/agent/list', async () => {
        await delay(500) // Simulate network latency

        // Generate 20 mock merchants
        const mockList = Array.from({ length: 20 }).map((_, i) => createRandomMerchant(i + 1))

        // Return standard API response structure (assuming a common wrapper, but user didn't specify, so returning array or basic wrapper)
        // Based on "API_CONTRACT.md" mention, usually there's a { code, data, msg } structure, but looking at user prompt:
        // "Logic: 使用 FakerJS 生成 20 筆資料。" without wrapper details.
        // I will return the list directly or in a 'data' field. Let's assume a simple structure `data: [...]` or just the array.
        // Spec Keeper check: API_CONTRACT.md usually defines this. 
        // To be safe and compliant with typical 'list' endpoints, I'll return { data: mockList, total: 20 }.

        return HttpResponse.json({
            code: 0,
            msg: 'success',
            data: {
                list: mockList,
                total: 20,
                page: 1,
                limit: 20
            }
        })
    }),

    // Get Merchant Detail
    http.get('/api/v2/agent/:id', async ({ params }) => {
        await delay(500)
        const id = Number(params.id)
        const merchant = createRandomMerchant(id) as MerchantDetail

        // Enrich with detail fields
        merchant.secret_key = faker.string.uuid()
        merchant.wallet_mode = faker.helpers.arrayElement(['transfer', 'seamless'])
        merchant.ip_whitelist = [faker.internet.ip(), faker.internet.ip()]
        merchant.rtp_level = faker.number.float({ min: 90, max: 99, fractionDigits: 1 })

        return HttpResponse.json({
            code: 0,
            msg: 'success',
            data: merchant
        })
    }),

    // Update Merchant
    http.post('/api/v2/agent/update', async () => {
        await delay(800)
        return HttpResponse.json({
            code: 0,
            msg: 'success'
        })
    }),

    // Update RTP
    http.post('/api/v2/game/rtp', async () => {
        await delay(1000) // Longer delay for critical change
        // Simulate random failure
        if (Math.random() > 0.9) {
            return HttpResponse.json({
                code: 500,
                msg: 'System busy, please try again.'
            })
        }
        return HttpResponse.json({
            code: 0,
            msg: 'RTP Updated Successfully'
        })
    }),

    // Create Merchant
    http.post('/api/v2/agent/management/agents', async ({ request }) => {
        await delay(1000)
        const body = await request.json() as any

        // Mock Conflict Error (Site Code 'EXIST')
        if (body.site_code === 'EXT') {
            return HttpResponse.json({
                code: 409,
                msg: 'Site Code already exists'
            })
        }

        return HttpResponse.json({
            code: 0,
            msg: 'Merchant Created Successfully',
            data: {
                id: faker.number.int({ min: 100, max: 999 })
            }
        })
    }),

    // Get Bet Logs (Round Search)
    http.post('/api/v2/report/bet-logs', async () => {
        await delay(800)
        // const body = await request.json() // In real app, filter by body

        const generateGameDetail = () => {
            const symbols = ['WILD', 'SCATTER', 'A', 'K', 'Q', 'J', '10', '9']
            const matrix = Array.from({ length: 3 }, () =>
                Array.from({ length: 5 }, () => faker.helpers.arrayElement(symbols))
            )
            return {
                round_id: faker.string.uuid(),
                matrix,
                lines_won: faker.helpers.multiple(() => ({
                    line_id: faker.number.int({ min: 1, max: 25 }),
                    win: faker.number.float({ min: 10, max: 500, fractionDigits: 2 }),
                    symbols: [faker.helpers.arrayElement(symbols), faker.helpers.arrayElement(symbols), faker.helpers.arrayElement(symbols)]
                }), { count: { min: 0, max: 3 } }),
                free_games_triggered: faker.datatype.boolean(0.1),
                multiplier: faker.helpers.arrayElement([1, 2, 5, 10]),
                currency: 'USD'
            }
        }

        const list = faker.helpers.multiple(() => {
            const bet = faker.number.float({ min: 1, max: 100, fractionDigits: 2 })
            const win = faker.number.float({ min: 0, max: 200, fractionDigits: 2 })
            return {
                id: faker.string.numeric(12),
                created_at: faker.date.recent().toISOString(),
                player_account: faker.internet.username(),
                game_name: faker.helpers.arrayElement(['Fortune Tiger', 'Super Ace', 'Golden Empire', 'Crazy 777']),
                bet_amount: bet,
                win_amount: win,
                profit: Number((win - bet).toFixed(2)),
                currency: 'USD',
                game_detail: generateGameDetail()
            }
        }, { count: 20 })

        return HttpResponse.json({
            code: 0,
            msg: 'success',
            data: {
                list,
                total: 100
            }
        })
    }),

    // Dashboard Statistics (War Room)
    http.get('/api/v2/report/dashboard', async () => {
        await delay(500)

        // Generate trend data for 7 days
        const trend = Array.from({ length: 7 }, (_, i) => {
            const date = new Date()
            date.setDate(date.getDate() - (6 - i))
            const bet = faker.number.float({ min: 10000, max: 50000, fractionDigits: 2 })
            const win = bet * faker.number.float({ min: 0.90, max: 1.05, fractionDigits: 2 }) // RTP 90-105%
            return {
                date: date.toISOString().split('T')[0],
                ggr: Number((bet - win).toFixed(2)),
                bet: Number(bet.toFixed(2))
            }
        })

        // Current snapshot stats
        const totalBet = 1500000 + faker.number.float({ min: 100, max: 1000 }) // ~1.5M
        const totalWin = totalBet * 0.965 // ~96.5% RTP
        const ggr = totalBet - totalWin

        return HttpResponse.json({
            code: 0,
            msg: 'success',
            data: {
                total_bet: Number(totalBet.toFixed(2)),
                total_ggr: Number(ggr.toFixed(2)),
                rtp: 96.50,
                active_players: 342,
                trend // [ {date, ggr, bet}, ... ]
            }
        })
    }),
]
