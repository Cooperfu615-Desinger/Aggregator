import { http, HttpResponse, delay } from 'msw'
import { faker } from '@faker-js/faker'

// Mock Data Stores
let staffList = [
    { id: 1, account: 'admin', role: 'Super Admin', last_login: faker.date.recent().toISOString(), status: 'active' },
    { id: 2, account: 'tech_lead', role: 'Tech Lead', last_login: faker.date.recent().toISOString(), status: 'active' },
    { id: 3, account: 'finance_01', role: 'Finance', last_login: faker.date.past().toISOString(), status: 'active' },
    { id: 4, account: 'support_team', role: 'Support', last_login: faker.date.recent().toISOString(), status: 'disabled' }
]

interface AuditLogMock {
    id: string
    time: string
    operator: string
    action: string
    target: string
    ip: string
    changes: any
}

const auditLogs: AuditLogMock[] = Array.from({ length: 25 }, () => ({
    id: faker.string.uuid(),
    time: faker.date.recent({ days: 10 }).toISOString(),
    operator: faker.helpers.arrayElement(['admin', 'tech_lead', 'system']),
    action: faker.helpers.arrayElement([
        'UPDATE_PROVIDER_STATUS', 'GENERATE_INVOICE', 'CREATE_MERCHANT', 'UPDATE_GAME_RTP', 'SYSTEM_MAINTENANCE'
    ]),
    target: faker.helpers.arrayElement(['PG Soft', 'Bet365', 'Global Settings', 'Invoice #202510']),
    ip: faker.internet.ip(),
    changes: {
        before: { status: 'active' },
        after: { status: 'maintenance' }
    }
})).sort((a: any, b: any) => new Date(b.time).getTime() - new Date(a.time).getTime())

let globalSettings = {
    maintenance_mode: false,
    admin_whitelist: ['127.0.0.1', '192.168.1.100']
}

export const systemHandlers = [
    // Staff Management
    http.get('/api/v2/system/staff', async () => {
        await delay(400)
        return HttpResponse.json({
            code: 0,
            msg: 'success',
            data: { list: staffList, total: staffList.length }
        })
    }),

    http.post('/api/v2/system/staff', async ({ request }) => {
        await delay(600)
        const body = await request.json() as any
        if (body.id) {
            // Update
            const idx = staffList.findIndex(s => s.id === body.id)
            if (idx !== -1) staffList[idx] = { ...staffList[idx], ...body }
        } else {
            // Create
            staffList.unshift({
                id: faker.number.int({ min: 100, max: 999 }),
                account: body.account,
                role: body.role,
                last_login: '-',
                status: 'active'
            })
        }
        return HttpResponse.json({ code: 0, msg: 'Saved successfully' })
    }),

    // Audit Logs
    http.get('/api/v2/system/audit-logs', async () => {
        await delay(500)
        return HttpResponse.json({
            code: 0,
            msg: 'success',
            data: { list: auditLogs, total: auditLogs.length }
        })
    }),

    // Global Settings
    http.get('/api/v2/system/settings', async () => {
        await delay(300)
        return HttpResponse.json({
            code: 0,
            msg: 'success',
            data: globalSettings
        })
    }),

    http.post('/api/v2/system/settings', async ({ request }) => {
        await delay(800)
        const body = await request.json() as any
        globalSettings = { ...globalSettings, ...body }

        // Audit this action
        auditLogs.unshift({
            id: faker.string.uuid(),
            time: new Date().toISOString(),
            operator: 'admin', // Mock current user
            action: 'UPDATE_SETTINGS',
            target: 'Global Config',
            ip: '127.0.0.1',
            changes: body
        })

        return HttpResponse.json({ code: 0, msg: 'Settings updated' })
    })
]
