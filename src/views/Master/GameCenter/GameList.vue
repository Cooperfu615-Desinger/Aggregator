<script setup lang="ts">
import { ref, onMounted, h, watch } from 'vue'
import { 
    NDataTable, NTag, NButton, useMessage, NSelect
} from 'naive-ui'
import { useI18n } from 'vue-i18n'
import type { DataTableColumns } from 'naive-ui'
import type { Game } from '../../../types/game'
import PageFilterBar from '../../../components/Common/PageFilterBar.vue'
import StatusSwitch from '../../../components/Common/StatusSwitch.vue'

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

// Track switch states
const switchStates = ref<Record<string, boolean>>({})

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
            // Initialize switch states
            list.value.forEach(game => {
                switchStates.value[game.game_id] = game.status === 'active'
            })
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
            message.success(`✅ Synced ${res.data?.count || 15} new games from upstream`)
            fetchList()
        }
    } catch (e) {
        message.error('Sync failed')
    } finally {
        syncing.value = false
    }
}

const handleStatusConfirm = async (row: Game, newVal: boolean) => {
    const oldStatus = row.status
    row.status = newVal ? 'active' : 'maintenance'
    switchStates.value[row.game_id] = newVal
    
    try {
        const res = await fetch('/api/v2/games/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ game_id: row.game_id, status: row.status })
        }).then(r => r.json())

        if (res.code !== 0) throw new Error(res.msg)
        message.success(newVal ? 'Game enabled' : 'Game set to maintenance')
    } catch (e) {
        row.status = oldStatus
        switchStates.value[row.game_id] = oldStatus === 'active'
        message.error('Update failed')
    }
}

const handleReset = () => {
    filters.value = { provider_id: 'all', type: 'all', status: 'all', search: '' }
}

const columns: DataTableColumns<Game> = [
    {
        title: t('game.name'),
        key: 'name_en',
        width: 280,
        render: (row) => h('div', { class: 'flex items-center gap-3' }, [
            h('img', { 
                src: row.thumbnail || 'https://placehold.co/80x80?text=Game', 
                class: 'w-12 h-12 rounded-lg object-cover bg-gray-700',
                onError: (e: Event) => (e.target as HTMLImageElement).src = 'https://placehold.co/80x80?text=Err'
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
        width: 130,
        render: (row) => h(NTag, { size: 'small', type: 'info' }, { default: () => row.provider })
    },
    {
        title: t('game.type'),
        key: 'type',
        width: 100,
        render: (row) => {
            const typeColors: Record<string, string> = {
                'Slot': 'success',
                'Live': 'warning',
                'Fishing': 'info',
                'Sports': 'default'
            }
            return h(NTag, { 
                size: 'small', 
                type: typeColors[row.type] as any || 'default',
                bordered: false
            }, { default: () => row.type })
        }
    },
    {
        title: t('game.rtp'),
        key: 'rtp_default',
        width: 90,
        render: (row) => h('span', { class: 'font-mono text-green-400' }, `${row.rtp_default}%`)
    },
    {
        title: t('common.status'),
        key: 'status',
        width: 150,
        render: (row) => h(StatusSwitch, {
            value: switchStates.value[row.game_id] ?? (row.status === 'active'),
            warningMessage: `Disabling "${row.name_en}" will hide it from all merchants.`,
            warningTitle: '⚠️ Disable Game',
            'onUpdate:value': (val: boolean) => {
                switchStates.value[row.game_id] = val
            },
            onConfirm: (val: boolean) => handleStatusConfirm(row, val)
        }, {
            checked: () => 'Active',
            unchecked: () => 'Off'
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
            <h1 class="text-2xl font-bold flex items-center gap-2">
                <span>🎮</span> {{ t('game.gameList') }}
            </h1>
            <n-button type="primary" :loading="syncing" @click="handleSync">
                🔄 {{ syncing ? 'Syncing...' : t('game.sync') }}
            </n-button>
        </div>

        <!-- Filter Bar -->
        <PageFilterBar
            v-model:searchValue="filters.search"
            searchPlaceholder="Search game name..."
            @reset="handleReset"
        >
            <template #filters>
                <n-select 
                    v-model:value="filters.provider_id" 
                    :options="providerOptions" 
                    placeholder="Provider"
                    class="w-36"
                />
                <n-select 
                    v-model:value="filters.type" 
                    :options="typeOptions" 
                    placeholder="Type"
                    class="w-32"
                />
                <n-select 
                    v-model:value="filters.status" 
                    :options="statusOptions" 
                    placeholder="Status"
                    class="w-32"
                />
            </template>
        </PageFilterBar>

        <n-data-table
            :columns="columns"
            :data="list"
            :loading="loading"
            :pagination="{ pageSize: 15 }"
            :bordered="false"
            striped
        />
    </div>
</template>
