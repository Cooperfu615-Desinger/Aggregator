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
]
