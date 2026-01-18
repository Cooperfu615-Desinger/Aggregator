<script setup lang="ts">
import { ref, onMounted, h, watch } from 'vue'
import { 
    NDataTable, NTag, NButton, NSwitch, useMessage, NInput, NSelect
} from 'naive-ui'
import { useI18n } from 'vue-i18n'
import type { DataTableColumns } from 'naive-ui'
import type { Game } from '../../../types/game'

const { t } = useI18n()
const message = useMessage()
const loading = ref(false)
const list = ref<Game[]>([])
const syncing = ref(false)

// Filters
const filters = ref({
    provider_id: 'all' as number | string,
    type: 'all' as string,
    status: 'all' as string,
    search: ''
})

const providerOptions = [
    { label: t('common.all'), value: 'all' },
    { label: 'PG Soft', value: 1 },
    { label: 'Evolution', value: 2 },
    { label: 'Pragmatic Play', value: 3 },
    { label: 'JILI', value: 4 }
]

const typeOptions = [
    { label: t('common.all'), value: 'all' },
    { label: t('game.slot'), value: 'Slot' },
    { label: t('game.live'), value: 'Live' },
    { label: t('game.fishing'), value: 'Fishing' },
    { label: t('game.sports'), value: 'Sports' }
]

const statusOptions = [
    { label: t('common.all'), value: 'all' },
    { label: t('status.active'), value: 'active' },
    { label: t('status.maintenance'), value: 'maintenance' }
]

const fetchList = async () => {
    loading.value = true
    try {
        const params = new URLSearchParams()
        if (filters.value.provider_id !== 'all') params.append('provider_id', String(filters.value.provider_id))
        if (filters.value.type !== 'all') params.append('type', filters.value.type)
        if (filters.value.status !== 'all') params.append('status', filters.value.status)
        if (filters.value.search) params.append('search', filters.value.search)

        const res = await fetch(`/api/v2/games?${params.toString()}`).then(r => r.json())
        if (res.code === 0) {
            list.value = res.data.list
        }
    } catch (e) {
        message.error('Failed to load games')
    } finally {
        loading.value = false
    }
}

const handleSync = async () => {
    syncing.value = true
    try {
        const res = await fetch('/api/v2/games/sync', { method: 'POST' }).then(r => r.json())
        if (res.code === 0) {
            message.success(t('common.syncCplt', { count: res.data.count }))
            fetchList()
        }
    } catch (e) {
        message.error('Sync failed')
    } finally {
        syncing.value = false
    }
}

const handleStatusChange = async (row: Game, newVal: boolean) => {
    const oldStatus = row.status
    row.status = newVal ? 'active' : 'maintenance'
    
    try {
        const res = await fetch('/api/v2/games/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ game_id: row.game_id, status: row.status })
        }).then(r => r.json())

        if (res.code !== 0) throw new Error(res.msg)
    } catch (e) {
        row.status = oldStatus
        message.error('Update failed')
    }
}

const columns: DataTableColumns<Game> = [
    {
        title: t('game.name'),
        key: 'name_en',
        width: 250,
        render: (row) => h('div', { class: 'flex items-center gap-3' }, [
            h('img', { 
                src: row.thumbnail || 'https://placehold.co/100x100?text=Game', 
                class: 'w-10 h-10 rounded object-cover bg-gray-100',
                onError: (e: Event) => (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=Err'
            }),
            h('div', {}, [
                h('div', { class: 'font-medium' }, row.name_en),
                row.name_zh && h('div', { class: 'text-xs text-gray-500' }, row.name_zh)
            ])
        ])
    },
    {
        title: t('game.provider'),
        key: 'provider',
        width: 120,
        render: (row) => h(NTag, { size: 'small' }, { default: () => row.provider })
    },
    {
        title: t('game.type'),
        key: 'type',
        width: 120,
        render: (row) => {
            const map: Record<string, string> = {
                'Slot': t('game.slot'),
                'Live': t('game.live'),
                'Fishing': t('game.fishing'),
                'Sports': t('game.sports')
            }
            return map[row.type] || row.type
        }
    },
    {
        title: t('game.rtp'),
        key: 'rtp_default',
        width: 100,
        render: (row) => `${row.rtp_default}%`
    },
    {
        title: t('common.status'),
        key: 'status',
        width: 100,
        render: (row) => h(NSwitch, {
            value: row.status === 'active',
            'onUpdate:value': (val: boolean) => handleStatusChange(row, val)
        })
    }
]

watch(filters, () => {
    fetchList()
}, { deep: true })

onMounted(() => {
    fetchList()
})
</script>

<template>
    <div class="p-6">
        <div class="flex items-center justify-between mb-6">
            <h1 class="text-2xl font-bold">{{ t('game.gameList') }}</h1>
            <n-button type="primary" :loading="syncing" @click="handleSync">
                🔄 {{ t('game.sync') }}
            </n-button>
        </div>

        <div class="bg-gray-800/50 p-4 rounded-lg mb-6 flex flex-wrap gap-4 items-center">
            <n-input v-model:value="filters.search" placeholder="Search..." class="w-64" clearable />
            <n-select v-model:value="filters.provider_id" :options="providerOptions" class="w-40" />
            <n-select v-model:value="filters.type" :options="typeOptions" class="w-40" />
            <n-select v-model:value="filters.status" :options="statusOptions" class="w-40" />
            <n-button @click="filters = { provider_id: 'all', type: 'all', status: 'all', search: '' }">
                {{ t('common.reset') }}
            </n-button>
        </div>

        <n-data-table
            :columns="columns"
            :data="list"
            :loading="loading"
            :pagination="{ pageSize: 15 }"
        />
    </div>
</template>
