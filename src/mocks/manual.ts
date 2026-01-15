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

        // --- Agent: Create ---
        if (url.includes('/api/v2/agent/create') && method === 'POST') {
            await delay(800)
            return new Response(JSON.stringify({
                code: 0,
                msg: 'Agent Created Successfully',
                data: { id: 12345 }
            }), { status: 200 })
        }

        // --- Agent: Update ---
        if (url.includes('/api/v2/agent/update') && method === 'POST') {
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
