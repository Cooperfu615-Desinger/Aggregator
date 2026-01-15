import { faker } from '@faker-js/faker'

export function setupManualMock() {
    const originalFetch = window.fetch

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = input.toString()
        const method = init?.method || 'GET'

        console.log(`[Manual Mock] ${method} ${url}`)

        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

        // --- Auth: Login ---
        if (url.includes('/api/v2/auth/login') && method === 'POST') {
            await delay(800)
            // Parse body to check credentials (simplified)
            let body: any = {}
            if (init?.body) {
                try {
                    body = JSON.parse(init.body as string)
                } catch (e) { }
            }

            if (body.account === 'admin' && body.password === 'admin') {
                return new Response(JSON.stringify({
                    code: 0,
                    msg: 'Login Successful',
                    data: {
                        token: 'mock-jwt-token-' + faker.string.uuid(),
                        user: {
                            name: 'Super Admin',
                            avatar: faker.image.avatar(),
                            roles: ['admin']
                        }
                    }
                }), { status: 200, headers: { 'Content-Type': 'application/json' } })
            }
            return new Response(JSON.stringify({ code: 401, msg: 'Invalid credentials' }), { status: 200 })
        }

        // --- Agent: List ---
        if (url.includes('/api/v2/agents') && method === 'GET') {
            await delay(500)
            const list = Array.from({ length: 15 }).map(() => ({
                id: faker.number.int({ min: 10000, max: 99999 }),
                account: faker.internet.username(),
                site_code: faker.string.alphanumeric(4).toUpperCase(),
                level: 1,
                parent_id: null,
                balance: parseFloat(faker.finance.amount()),
                percent: faker.number.int({ min: 10, max: 90 }),
                state: faker.helpers.arrayElement(['active', 'disabled']),
                created_at: faker.date.recent().toISOString(),
                children_count: faker.number.int({ min: 0, max: 20 })
            }))
            return new Response(JSON.stringify({
                code: 0,
                msg: 'success',
                data: { list, total: 50 }
            }), { status: 200 })
        }

        // --- Bet Logs ---
        if (url.includes('/api/v2/report/bet-logs') && method === 'POST') {
            await delay(600)
            const list = Array.from({ length: 50 }).map(() => {
                const bet = parseFloat(faker.finance.amount({ min: 1, max: 500, dec: 2 }))

                // Scenarios:
                // 0: Loss (40%)
                // 1: Small Win (40%)
                // 2: Big Win (10%)
                // 3: Refund (5%)
                // 4: Free Game (5%)
                const scenario = faker.helpers.weightedArrayElement([
                    { weight: 40, value: 'loss' },
                    { weight: 40, value: 'small_win' },
                    { weight: 10, value: 'big_win' },
                    { weight: 5, value: 'refund' },
                    { weight: 5, value: 'free_game' }
                ])

                let win = 0
                let status = 'loss'
                let isFreeGame = false

                if (scenario === 'loss') {
                    win = 0
                    status = 'loss'
                } else if (scenario === 'small_win') {
                    win = bet * faker.number.float({ min: 1.1, max: 10 })
                    status = 'win'
                } else if (scenario === 'big_win') {
                    win = bet * faker.number.float({ min: 100, max: 5000 })
                    status = 'win'
                } else if (scenario === 'refund') {
                    win = bet
                    status = 'refund'
                } else if (scenario === 'free_game') {
                    win = bet * faker.number.float({ min: 20, max: 50 })
                    status = 'win'
                    isFreeGame = true
                }

                const payout = bet > 0 ? (win / bet) : 0

                return {
                    id: faker.string.numeric(12),
                    created_at: faker.date.recent({ days: 1 }).toISOString(),
                    player_account: faker.internet.username(),
                    game_name: faker.helpers.arrayElement(['Fortune Tiger', 'Super Ace', 'Gates of Olympus', 'Sugar Rush']),
                    bet_amount: bet,
                    win_amount: win,
                    profit: win - bet,
                    currency: 'CNY',
                    payout: parseFloat(payout.toFixed(2)),
                    status: status,
                    game_detail: {
                        round_id: faker.string.uuid(),
                        matrix: [
                            ['A', 'K', 'Q', 'J'],
                            ['10', '9', '8', '7'],
                            ['SCC', 'WILD', 'A', 'K']
                        ],
                        lines_won: status === 'win' ? [{ line_id: 1, win: win, symbols: ['A', 'A', 'A'] }] : [],
                        free_games_triggered: isFreeGame,
                        multiplier: payout,
                        currency: 'CNY'
                    }
                }
            })
            // Sort by time desc
            list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

            return new Response(JSON.stringify({
                code: 0,
                msg: 'success',
                data: { list, total: 50 }
            }), { status: 200 })
        }

        // --- Financial Report ---
        if (url.includes('/api/v2/report/financial') && method === 'POST') {
            await delay(800)

            // Parse body to get groupBy
            let groupBy = 'date'
            if (init?.body) {
                try {
                    const body = JSON.parse(init.body as string)
                    if (body.groupBy) groupBy = body.groupBy
                } catch (e) { }
            }

            const count = groupBy === 'date' ? 30 : 15
            const list = Array.from({ length: count }).map((_, index) => {
                let key = ''
                if (groupBy === 'date') {
                    const d = new Date()
                    d.setDate(d.getDate() - (count - index - 1))
                    key = d.toISOString().split('T')[0] || ''
                } else {
                    key = faker.company.name()
                }

                const bet = parseFloat(faker.finance.amount({ min: 10000, max: 500000, dec: 2 }))
                // Random RTP between 80% and 120% (some loss scenarios for house)
                const rtp = faker.number.float({ min: 80, max: 120 })
                const win = bet * (rtp / 100)
                const ggr = bet - win

                return {
                    key: key,
                    total_bet: bet,
                    total_win: parseFloat(win.toFixed(2)),
                    ggr: parseFloat(ggr.toFixed(2)),
                    rtp: parseFloat(rtp.toFixed(2)),
                    round_count: faker.number.int({ min: 500, max: 5000 })
                }
            })

            return new Response(JSON.stringify({
                code: 0,
                msg: 'success',
                data: { list }
            }), { status: 200 })
        }

        // --- Agent: Create ---
        if (url.includes('/api/v1/agent/create') && method === 'POST') {
            await delay(800)
            return new Response(JSON.stringify({
                code: 0,
                msg: 'Agent Created Successfully',
                data: { id: 12345 }
            }), { status: 200 })
        }

        // --- Agent: Update ---
        if (url.includes('/api/v1/agent/update') && method === 'PUT') {
            await delay(800)
            return new Response(JSON.stringify({
                code: 0,
                msg: 'Agent Updated Successfully',
                data: null
            }), { status: 200 })
        }

        // Pass through to original fetch (network)
        return originalFetch(input, init)
    }

    console.log('[Manual Mock] Initialized fail-safe interceptor')
}
