<script setup lang="ts">
import { ref, onMounted, h } from 'vue'
import { 
  NCard, NInput, NSelect, NButton, 
  NDataTable, NTag, NSwitch, useMessage, NSpace
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import type { Game } from '../../types/game'
import GameConfigModal from './components/GameConfigModal.vue'

// State
const message = useMessage()
const loading = ref(false)
const games = ref<Game[]>([])
const showConfigModal = ref(false)
const selectedGame = ref<Game | null>(null)

// Filter
const filter = ref({
    provider: null as string | null,
    keyword: '',
    status: null as string | null
})

// Options
const providerOptions = [
    { label: 'All', value: 'all' },
    { label: 'PGSoft', value: 'PGSoft' },
    { label: 'JILI', value: 'JILI' },
    { label: 'PragmaticPlay', value: 'PragmaticPlay' },
    { label: 'Habanero', value: 'Habanero' }
]

const statusOptions = [
    { label: 'All', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Maintenance', value: 'maintenance' }
]

// Data Fetching
const fetchGames = async () => {
    loading.value = true
    try {
        const res = await fetch('/api/v2/game/list')
        const data = await res.json()
        if (data.code === 0) {
            games.value = data.data.list
            // Client-side filtering simulation
            if (filter.value.provider && filter.value.provider !== 'all') {
                games.value = games.value.filter(g => g.provider === filter.value.provider)
            }
            if (filter.value.status && filter.value.status !== 'all') {
                games.value = games.value.filter(g => g.status === filter.value.status)
            }
             if (filter.value.keyword) {
                const k = filter.value.keyword.toLowerCase()
                games.value = games.value.filter(g => g.name_en.toLowerCase().includes(k) || g.game_id.includes(k))
            }
        }
    } catch (e) {
        message.error('Failed to load games')
    } finally {
        loading.value = false
    }
}

// Actions
const handleStatusChange = (row: Game, value: boolean) => {
    // In real app, call API
    row.status = value ? 'active' : 'maintenance'
    message.success(`${row.name_en} status updated to ${row.status}`)
}

const handleConfig = (row: Game) => {
    selectedGame.value = row
    showConfigModal.value = true
}

const handleRefresh = () => {
    fetchGames()
}

// Columns
const columns: DataTableColumns<Game> = [
    { 
        title: 'Icon', 
        key: 'icon', 
        width: 60,
        render: () => '🎰' 
    },
    { 
        title: 'Game Name', 
        key: 'name_en', 
        width: 200, 
        ellipsis: true,
        sorter: (row1, row2) => row1.name_en.localeCompare(row2.name_en) 
    },
    { 
        title: 'ID', 
        key: 'game_id', 
        width: 150,
        sorter: (row1, row2) => row1.game_id.localeCompare(row2.game_id),
        render: (row) => h(
            'span', 
            { class: 'font-mono text-gray-400 text-xs' }, 
            row.game_id 
        )
    },
    { 
        title: 'Provider', 
        key: 'provider', 
        width: 120,
        sorter: (row1, row2) => row1.provider.localeCompare(row2.provider),
        render: (row) => h(
            NTag,
            { type: row.provider === 'PGSoft' ? 'success' : 'info', bordered: false, size: 'small' },
            { default: () => row.provider }
        )
    },
    { 
        title: 'Type', 
        key: 'type', 
        width: 100,
        sorter: (row1, row2) => (row1.type || '').localeCompare(row2.type || '')
    },
    { 
        title: 'RTP', 
        key: 'rtp_default', 
        width: 100,
        sorter: (row1, row2) => row1.rtp_default - row2.rtp_default,
        render: (row) => row.rtp_default.toFixed(1) + '%'
    },
    {
        title: 'Status',
        key: 'status',
        width: 100,
        sorter: (row1, row2) => (row1.status === 'active' ? 1 : 0) - (row2.status === 'active' ? 1 : 0),
        render: (row) => h(
            NSwitch,
            {
                value: row.status === 'active',
                onUpdateValue: (v) => handleStatusChange(row, v)
            }
        )
    },
    {
        title: 'Action',
        key: 'action',
        width: 100,
        render: (row) => h(
            NButton,
            { size: 'small', secondary: true, onClick: () => handleConfig(row) },
            { default: () => 'Config' }
        )
    }
]

onMounted(() => {
    fetchGames()
})
</script>

<template>
  <div class="p-6 space-y-4">
    <div class="flex justify-between items-center">
        <h1 class="text-2xl font-bold">Game Center</h1>
        <n-button type="primary" dashed>Sync Games</n-button>
    </div>

    <!-- Filter -->
    <!-- Filter -->
    <n-card size="small">
        <n-space align="center" :size="12">
             <div class="flex items-center gap-2">
                <span class="text-sm text-gray-400">Provider:</span>
                <n-select 
                    v-model:value="filter.provider" 
                    :options="providerOptions" 
                    clearable 
                    placeholder="All" 
                    style="width: 160px" 
                />
             </div>
             
             <div class="flex items-center gap-2">
                <span class="text-sm text-gray-400">Status:</span>
                <n-select 
                    v-model:value="filter.status" 
                    :options="statusOptions" 
                    clearable 
                    placeholder="All" 
                    style="width: 140px" 
                />
             </div>

             <div class="flex items-center gap-2">
                <span class="text-sm text-gray-400">Search:</span>
                <n-input 
                    v-model:value="filter.keyword" 
                    placeholder="Game Name / ID" 
                    style="width: 200px"
                />
             </div>

             <n-button type="primary" @click="fetchGames" :loading="loading">
                Search
             </n-button>
        </n-space>
    </n-card>

    <!-- List -->
    <n-data-table
        :columns="columns"
        :data="games"
        :loading="loading"
        :pagination="{ pageSize: 10 }"
        class="bg-[#18181c] rounded-lg"
    />

    <GameConfigModal
        v-model:show="showConfigModal"
        :game="selectedGame"
        @refresh="handleRefresh"
    />
  </div>
</template>
