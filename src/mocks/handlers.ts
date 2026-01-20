import { http, HttpResponse, delay } from 'msw'
import { faker } from '@faker-js/faker'
import type { Merchant, MerchantDetail } from '../types/merchant'
import type { Agent } from '../types/agent'
import { mockGames } from './data/games'
import { financeHandlers } from './finance'
import { systemHandlers } from './system'
import { agentHandlers } from './agent'

// ... existing code ...

// Helper Functions
function createRandomAgent(id: number, parentId: number | null = null, level: number = 1): Agent {
    return {
        id,
        account: faker.internet.username(),
        site_code: faker.string.alpha({ length: 4, casing: 'upper' }),
        level,
        parent_id: parentId,
        balance: faker.number.float({ min: 1000, max: 100000, fractionDigits: 2 }),
        percent: faker.number.int({ min: 10, max: 90 }),
        state: faker.helpers.arrayElement(['active', 'disabled']),
        created_at: faker.date.past().toISOString(),
        children_count: level < 3 ? faker.number.int({ min: 0, max: 5 }) : 0
    }
}

function createRandomMerchant(id: number): Merchant {
    const walletMode = faker.helpers.arrayElement(['transfer', 'seamless']) as 'transfer' | 'seamless'
    const displayId = `OP-${(1000 + id).toString()}`

    return {
        id,
        display_id: displayId,
        site_code: faker.string.alpha({ length: 3, casing: 'upper' }),
        account: faker.internet.username(),
        name: faker.company.name(), // Keeping as is, but UI might use this or remarks
        remarks: faker.lorem.sentence({ min: 3, max: 8 }), // New remarks field
        currency_type: faker.helpers.arrayElement(['TWD', 'CNY', 'USD']),
        percent: faker.number.float({ min: 10, max: 90, fractionDigits: 2 }), // Refers to revenue_share
        revenue_share: faker.number.float({ min: 10, max: 90, fractionDigits: 2 }),
        authorized_providers: faker.helpers.arrayElements(['pg', 'evo', 'pp', 'jili', 'habanero'], { min: 0, max: 3 }),
        state: faker.helpers.arrayElement([0, 1]),
        created_at: faker.date.past().toISOString(),
        // Extended fields
        walletMode,
        secretKey: faker.string.uuid(),
        ipWhitelist: [faker.internet.ip(), faker.internet.ip()],
        baseCurrency: 'USD',
        // Balance only for transfer wallet mode
        balance: walletMode === 'transfer'
            ? faker.number.float({ min: 1000, max: 100000, fractionDigits: 2 })
            : undefined
    }
}

// Mock Providers
export const mockProviders: any[] = [
    {
        id: 1,
        code: 'pg',
        name: 'PG Soft',
        status: 'active',
        type: 'Slot',
        gameCount: 128,
        apiConfig: {
            apiUrl: 'https://api.pgsoft.com',
            merchantCode: 'AGG_TEST',
            secretKey: 'sk_pg_123',
            revenueShare: 12,
            currency: 'USD'
        }
    },
    {
        id: 2,
        code: 'evo',
        name: 'Evolution',
        status: 'active',
        type: 'Live',
        gameCount: 85,
        apiConfig: {
            apiUrl: 'https://api.evolution.com',
            merchantCode: 'AGG_EVO',
            secretKey: 'sk_evo_456',
            revenueShare: 10,
            currency: 'EUR'
        }
    },
    {
        id: 3,
        code: 'pp',
        name: 'Pragmatic Play',
        status: 'active',
        type: 'Slot',
        gameCount: 256,
        apiConfig: {
            apiUrl: 'https://api.pragmaticplay.com',
            merchantCode: 'AGG_PP',
            secretKey: 'sk_pp_789',
            revenueShare: 15,
            currency: 'USD'
        }
    },
    {
        id: 4,
        code: 'jili',
        name: 'JILI',
        status: 'maintenance',
        type: 'Slot',
        gameCount: 67,
        apiConfig: {
            apiUrl: 'https://api.jili.com',
            merchantCode: 'AGG_JILI',
            secretKey: 'sk_jili_abc',
            revenueShare: 8,
            currency: 'USD'
        }
    },
    {
        id: 5,
        code: 'habanero',
        name: 'Habanero',
        status: 'active',
        type: 'Slot',
        gameCount: 142,
        apiConfig: {
            apiUrl: 'https://api.habanero.com',
            merchantCode: 'AGG_HAB',
            secretKey: 'sk_hab_xyz',
            revenueShare: 11,
            currency: 'USD'
        }
    }
]

// Merchant Subscription Map: merchantId -> [{ providerId, status, revenueShare, excludedGames }]
const merchantSubscriptionMap = new Map<number, any[]>()

export const handlers = [
    // ================== AUTH HANDLERS ==================
    // Login API - Returns role-based tokens
    http.post('/api/login', async ({ request }) => {
        await delay(500)
        const body = await request.json() as { username: string; password: string }
        const { username, password } = body

        // Scenario A: Master Admin
        if (username === 'admin' && password === 'admin123') {
            return HttpResponse.json({
                success: true,
                token: 'mock-master-token-' + Date.now(),
                role: 'MASTER',
                name: 'Super Admin',
                code: null
            })
        }

        // Scenario B: Merchant
        if (username === 'merchant' && password === '123456') {
            return HttpResponse.json({
                success: true,
                token: 'mock-merchant-token-' + Date.now(),
                role: 'MERCHANT',
                name: 'Golden Dragon',
                code: 'AGT001'
            })
        }

        // Invalid credentials
        return HttpResponse.json({
            success: false,
            message: 'Invalid username or password'
        }, { status: 401 })
    }),

    // ... existing handlers ...

    // Get Merchant Subscriptions
    http.get('/api/v2/merchant/:id/providers', async ({ params }) => {
        await delay(500)
        const merchantId = Number(params.id)

        let subscriptions = merchantSubscriptionMap.get(merchantId)
        if (!subscriptions) {
            // Default: All providers disabled
            subscriptions = mockProviders.map(p => ({
                providerId: p.id,
                status: 'disabled',
                revenueShare: 0,
                excludedGames: []
            }))
            merchantSubscriptionMap.set(merchantId, subscriptions)
        }

        // Merge with current provider list to handle new providers
        const result = mockProviders.map(p => {
            const sub = subscriptions?.find(s => s.providerId === p.id)
            return {
                providerId: p.id,
                name: p.name,
                code: p.code,
                globalStatus: p.status, // Current global status
                status: sub?.status || 'disabled',
                revenueShare: sub?.revenueShare || 0,
                excludedGames: sub?.excludedGames || []
            }
        })

        return HttpResponse.json({
            code: 0,
            msg: 'success',
            data: result
        })
    }),

    // Update Merchant Subscriptions
    http.post('/api/v2/merchant/:id/providers', async ({ params, request }) => {
        await delay(800)
        const merchantId = Number(params.id)
        const body = await request.json() as any[]

        // Update map
        merchantSubscriptionMap.set(merchantId, body)

        return HttpResponse.json({
            code: 0,
            msg: 'Subscriptions Updated'
        })
    }),

    // Game List
    http.get('/api/v2/games', async ({ request }) => {
        await delay(500)
        const url = new URL(request.url)
        const providerId = url.searchParams.get('provider_id')
        const type = url.searchParams.get('type')
        const status = url.searchParams.get('status')
        const search = url.searchParams.get('search')?.toLowerCase()

        let filtered = [...mockGames]

        if (providerId) {
            filtered = filtered.filter(g => g.providerId === Number(providerId))
        }
        if (type) {
            filtered = filtered.filter(g => g.type === type)
        }
        if (status) {
            filtered = filtered.filter(g => g.status === status)
        }
        if (search) {
            filtered = filtered.filter(g =>
                g.name_en.toLowerCase().includes(search) ||
                (g.name_zh && g.name_zh.includes(search)) ||
                g.game_id.toLowerCase().includes(search)
            )
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

    // Game Sync
    http.post('/api/v2/games/sync', async () => {
        await delay(3000)
        return HttpResponse.json({
            code: 0,
            msg: `Synced ${faker.number.int({ min: 5, max: 20 })} new games successfully`,
            data: { count: 15 }
        })
    }),

    // Update Game Status
    http.post('/api/v2/games/update', async ({ request }) => {
        await delay(600)
        const body = await request.json() as any
        const game = mockGames.find(g => g.game_id === body.game_id)
        if (game) {
            Object.assign(game, body)
        }
        return HttpResponse.json({
            code: 0,
            msg: 'Game Updated'
        })
    }),
    // Provider List
    http.get('/api/v2/providers', async () => {
        await delay(600)
        return HttpResponse.json({
            code: 0,
            msg: 'success',
            data: {
                list: mockProviders,
                total: mockProviders.length
            }
        })
    }),

    // Update Provider
    http.post('/api/v2/providers/update', async ({ request }) => {
        await delay(800)
        const body = await request.json() as any
        const providerIndex = mockProviders.findIndex(p => p.id === body.id)

        if (providerIndex !== -1) {
            // Merge updates
            mockProviders[providerIndex] = {
                ...mockProviders[providerIndex],
                ...body,
                apiConfig: {
                    ...mockProviders[providerIndex].apiConfig,
                    ...(body.apiConfig || {})
                }
            }
        }

        return HttpResponse.json({
            code: 0,
            msg: 'Provider Updated Successfully'
        })
    }),
    ...agentHandlers,

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

    // Update Game Config
    http.post('/api/v2/game/update', async () => {
        await delay(1000)
        return HttpResponse.json({
            code: 0,
            msg: 'success',
            data: null
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
    http.post('/api/v2/report/bet-logs', async ({ request }) => {
        await delay(800)
        const body = await request.json() as any
        const { match_roundId, match_playerId, match_merchant, match_provider, timeRange } = {
            match_roundId: body.roundId,
            match_playerId: body.playerId,
            match_merchant: body.merchantCode,
            match_provider: body.provider,
            timeRange: body.timeRange
        }

        const list = faker.helpers.multiple(() => {
            // Determine Provider based on filter or random
            const providerScenario = match_provider
                ? (match_provider === 'pg' ? 'PG' : match_provider === 'evo' ? 'EVO' : 'PP')
                : faker.helpers.weightedArrayElement([
                    { weight: 60, value: 'PG' },
                    { weight: 30, value: 'EVO' },
                    { weight: 10, value: 'PP' }
                ])

            let providerCode, providerName, currency, rate, betRange

            switch (providerScenario) {
                case 'PG':
                    providerCode = 'pg'
                    providerName = 'PG Soft'
                    currency = 'THB'
                    rate = 0.03
                    betRange = { min: 10, max: 500 }
                    break
                case 'EVO':
                    providerCode = 'evo'
                    providerName = 'Evolution'
                    currency = 'USD'
                    rate = 1.0
                    betRange = { min: 1, max: 100 }
                    break
                case 'PP':
                    providerCode = 'pp'
                    providerName = 'Pragmatic Play'
                    currency = 'VND'
                    rate = 0.00004
                    betRange = { min: 10000, max: 500000 }
                    break
                default:
                    providerCode = 'pg'; providerName = 'PG'; currency = 'THB'; rate = 0.03; betRange = { min: 10, max: 100 }
            }

            const bet = faker.number.float({ min: betRange!.min, max: betRange!.max, fractionDigits: 2 })
            const win = faker.number.float({ min: 0, max: bet * 5, fractionDigits: 2 })

            // Generate timestamps within range if provided, else recent
            let created_at = faker.date.recent({ days: 1 }).toISOString()
            if (timeRange && timeRange.length === 2) {
                const start = new Date(timeRange[0])
                const end = new Date(timeRange[1])
                created_at = faker.date.between({ from: start, to: end }).toISOString()
            }

            const mCode = match_merchant || `OP-${faker.number.int({ min: 1001, max: 1020 })}`
            const mName = faker.helpers.arrayElement(['Golden Dragon', 'Silver Tiger', 'Diamond Star', 'Royal Crown', 'Lucky 88', 'Grand Casino'])

            return {
                id: match_roundId || ('PF' + faker.string.numeric(12)),
                txId: faker.string.uuid(),
                created_at,
                player_account: match_playerId || faker.internet.username(),
                merchant_code: mCode,
                merchant_name: mName, // Added Merchant Name
                game_name: faker.helpers.arrayElement(['Fortune Tiger', 'Super Ace', 'Crazy Time', 'Sweet Bonanza']),

                providerCode,
                providerName,
                currency,
                exchangeRate: rate,

                originalBet: bet,
                originalWin: win,

                bet_amount: Number((bet * rate!).toFixed(4)),
                win_amount: Number((win * rate!).toFixed(4)),
                profit: Number(((win - bet) * rate!).toFixed(4)),

                status: win > 0 ? 'win' : 'loss',
                payout: win / (bet || 1),

                game_detail: { round_id: faker.string.uuid() },
                providerId: 1,
                currencyBaseAmount: Number((bet * rate!).toFixed(4))
            }
        }, { count: 50 })

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
                // KPIs
                total_bet: Number(totalBet.toFixed(2)),
                total_ggr: Number(ggr.toFixed(2)),
                rtp: 96.50,
                active_players: faker.number.int({ min: 2500, max: 3500 }),
                total_requests: faker.number.int({ min: 4000000, max: 4500000 }), // ~4.2M
                avg_margin: 3.5, // 3.5%

                // Charts
                trend, // [ {date, ggr, bet}, ... ]
                provider_share: [
                    { name: 'PG Soft', value: 45 },
                    { name: 'Evolution', value: 30 },
                    { name: 'Pragmatic Play', value: 25 }
                ],

                // Top Lists
                top_merchants: [
                    { name: 'Bet365', ggr: 45000 },
                    { name: '1xbet', ggr: 32000 },
                    { name: 'K9Win', ggr: 28000 },
                    { name: 'M88', ggr: 15000 },
                    { name: 'Fun88', ggr: 12000 }
                ],
                top_games: [
                    { name: 'Mahjong Ways 2', bet_count: 50000 },
                    { name: 'Super Ace', bet_count: 42000 },
                    { name: 'Crazy Time', bet_count: 35000 },
                    { name: 'Fortune Tiger', bet_count: 28000 },
                    { name: 'Gates of Olympus', bet_count: 25000 }
                ],

                // System Health
                system_health: [
                    { provider: 'PG Soft', status: 'healthy', latency: 45 },
                    { provider: 'Evolution', status: 'warning', latency: 120 },
                    { provider: 'Pragmatic Play', status: 'critical', latency: 0 } // 0 = timeout
                ]
            }
        })
    }),

    // Game Center - List
    http.get('/api/v2/game/list', async () => {
        await delay(600)

        const list = faker.helpers.multiple(() => {
            const provider = faker.helpers.arrayElement(['PGSoft', 'JILI', 'PragmaticPlay', 'Habanero'])
            return {
                game_id: faker.string.alpha({ length: 6, casing: 'lower' }) + '_' + faker.number.int({ min: 100, max: 999 }),
                name_en: faker.lorem.words({ min: 2, max: 3 }).replace(/^\w/, (c) => c.toUpperCase()),
                provider: provider,
                type: faker.helpers.arrayElement(['Slot', 'Live', 'Fishing']),
                rtp_default: faker.number.float({ min: 95.0, max: 98.0, fractionDigits: 1 }),
                status: faker.helpers.arrayElement(['active', 'maintenance'])
            }
        }, { count: 30 })

        return HttpResponse.json({
            code: 0,
            msg: 'success',
            data: {
                list,
                total: 100
            }
        })
    }),

    // Hierarchical Agent List
    http.get('/api/v2/agents', async ({ request }) => {
        await delay(500)
        const url = new URL(request.url)
        const parentIdParam = url.searchParams.get('parent_id')
        const parentId = parentIdParam ? Number(parentIdParam) : null

        let level = 1
        if (parentId) {
            const levelParam = url.searchParams.get('level')
            level = levelParam ? Number(levelParam) + 1 : 2
        }

        const count = faker.number.int({ min: 5, max: 15 })
        const list = Array.from({ length: count }).map(() =>
            createRandomAgent(
                faker.number.int({ min: 1000, max: 99999 }),
                parentId,
                level
            )
        )

        return HttpResponse.json({
            code: 0,
            msg: 'success',
            data: {
                list,
                total: count
            }
        })
    }),

    // Create Agent
    http.post('/api/v2/agent/create', async () => {
        await delay(1000)
        return HttpResponse.json({
            code: 0,
            msg: 'Agent Created Successfully',
            data: { id: faker.number.int({ min: 10000, max: 99999 }) }
        })
    }),

    // Update Agent
    http.post('/api/v2/agent/update', async () => {
        await delay(800)
        return HttpResponse.json({
            code: 0,
            msg: 'Agent Updated Successfully'
        })
    }),

    // Generate New Key
    http.post('/api/v2/agent/regenerate-key', async () => {
        await delay(500)
        return HttpResponse.json({
            code: 0,
            msg: 'New Secret Key Generated',
            data: {
                secret_key: 'sk_live_' + faker.string.uuid()
            }
        })
    }),

    // Save Merchant Config
    http.post('/api/v2/agent/config/update', async () => {
        await delay(800)
        return HttpResponse.json({
            code: 0,
            msg: 'Configuration Saved Successfully'
        })
    }),

    ...financeHandlers,
    ...systemHandlers
]
