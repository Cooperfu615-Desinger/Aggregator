import { faker } from '@faker-js/faker'
import type { Game } from '../../types/game'

export const mockGames: Game[] = [
    // PG Soft Games
    {
        game_id: 'PG-001',
        name_en: 'Mahjong Ways 2',
        name_zh: '麻將胡了2',
        provider: 'PG Soft',
        providerId: 1,
        type: 'Slot',
        rtp_default: 96.95,
        status: 'active',
        thumbnail: 'https://placehold.co/100x100?text=MW2'
    },
    {
        game_id: 'PG-002',
        name_en: 'Lucky Neko',
        name_zh: '招財貓',
        provider: 'PG Soft',
        providerId: 1,
        type: 'Slot',
        rtp_default: 96.73,
        status: 'active',
        thumbnail: 'https://placehold.co/100x100?text=Neko'
    },
    {
        game_id: 'PG-003',
        name_en: 'Treasure of Aztec',
        name_zh: '阿茲特克寶藏',
        provider: 'PG Soft',
        providerId: 1,
        type: 'Slot',
        rtp_default: 96.71,
        status: 'maintenance',
        thumbnail: 'https://placehold.co/100x100?text=Aztec'
    },
    // Evolution Games
    {
        game_id: 'EVO-001',
        name_en: 'Crazy Time',
        name_zh: '瘋狂時光',
        provider: 'Evolution',
        providerId: 2,
        type: 'Live',
        rtp_default: 96.08,
        status: 'active',
        thumbnail: 'https://placehold.co/100x100?text=CrazyTime'
    },
    {
        game_id: 'EVO-002',
        name_en: 'Lightning Roulette',
        name_zh: '閃電輪盤',
        provider: 'Evolution',
        providerId: 2,
        type: 'Live',
        rtp_default: 97.30,
        status: 'active',
        thumbnail: 'https://placehold.co/100x100?text=Roulette'
    },
    // More Random Games
    ...Array.from({ length: 15 }).map((_, i) => ({
        game_id: `RND-${i + 1}`,
        name_en: faker.commerce.productName(),
        name_zh: '隨機遊戲 ' + (i + 1),
        provider: faker.helpers.arrayElement(['PG Soft', 'Evolution', 'Pragmatic Play', 'JILI']),
        providerId: faker.helpers.arrayElement([1, 2, 3, 4]),
        type: faker.helpers.arrayElement(['Slot', 'Live', 'Fishing', 'Sports']),
        rtp_default: faker.number.float({ min: 90, max: 99, fractionDigits: 2 }),
        status: faker.helpers.arrayElement(['active', 'maintenance'] as const),
        thumbnail: `https://placehold.co/100x100?text=Game${i + 1}`
    }))
]
