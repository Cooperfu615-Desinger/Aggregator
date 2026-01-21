<script setup lang="ts">
import { ref, onMounted, h, computed } from 'vue'
import { 
    NDataTable, NTag, NSelect, useMessage, NAlert, NButton, NSpace, NTooltip
} from 'naive-ui'
import type { DataTableColumns, DataTableRowKey } from 'naive-ui'
import PageFilterBar from '../../../components/Common/PageFilterBar.vue'
import StatusSwitch from '../../../components/Common/StatusSwitch.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const message = useMessage()
const loading = ref(false)

interface MerchantGame {
    game_id: string
    game_code: string
    name_en: string
    name_zh?: string
    provider: string
    type: string
    rtp: number
    merchant_enabled: boolean
    master_enabled: boolean
    thumbnail?: string
    release_date: string
    admin_status: 'active' | 'maintenance' | 'disabled'
}

const games = ref<MerchantGame[]>([])
const searchValue = ref('')
const typeFilter = ref('all')
const providerFilter = ref('all')
const checkedRowKeys = ref<DataTableRowKey[]>([])

const typeOptions = computed(() => [
    { label: t('merchantGame.allTypes'), value: 'all' },
    { label: t('merchantGame.slots'), value: 'Slot' },
    { label: t('merchantGame.liveCasino'), value: 'Live' },
    { label: t('merchantGame.fishing'), value: 'Fishing' }
])

const providerOptions = computed(() => {
    const providers = Array.from(new Set(games.value.map(g => g.provider)))
    return [
        { label: t('common.all'), value: 'all' },
        ...providers.map(p => ({ label: p, value: p }))
    ]
})

// Track switch states
const switchStates = ref<Record<string, boolean>>({})

const fetchGames = async () => {
    loading.value = true
    try {
        const res = await fetch('/api/v2/agent/games')
        const data = await res.json()
        if (data.code === 0) {
            games.value = data.data.list || []
            games.value.forEach(g => {
                switchStates.value[g.game_id] = g.merchant_enabled
            })
        }
    } catch {
        message.error(t('merchantGame.loadFailed'))
    } finally {
        loading.value = false
    }
}

const handleToggle = async (row: MerchantGame, newVal: boolean) => {
    if (newVal && !row.master_enabled) {
        message.warning(t('merchantGame.disabledByPlatform'))
        return
    }
    
    switchStates.value[row.game_id] = newVal
    row.merchant_enabled = newVal
    
    try {
        await fetch('/api/v2/agent/games/toggle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ game_id: row.game_id, enabled: newVal })
        })
        message.success(newVal ? t('merchantGame.gameEnabled') : t('merchantGame.gameDisabled'))
    } catch {
        switchStates.value[row.game_id] = !newVal
        row.merchant_enabled = !newVal
        message.error(t('merchantGame.updateFailed'))
    }
}

const handleBatchAction = async (enable: boolean) => {
    const selectedIds = checkedRowKeys.value as string[]
    if (selectedIds.length === 0) return

    loading.value = true
    try {
        // Optimistic update
        selectedIds.forEach(id => {
            const game = games.value.find(g => g.game_id === id)
            if (game) {
                // Skip if platform disabled and trying to enable
                if (enable && !game.master_enabled) return
                
                game.merchant_enabled = enable
                switchStates.value[id] = enable
            }
        })

        // In real app, call batch API
        await new Promise(r => setTimeout(r, 800))
        message.success(t('common.success'))
        checkedRowKeys.value = []
    } catch {
        message.error(t('merchantGame.updateFailed'))
        await fetchGames() // Revert
    } finally {
        loading.value = false
    }
}

const handleReset = () => {
    searchValue.value = ''
    typeFilter.value = 'all'
    providerFilter.value = 'all'
}

const filteredGames = computed(() => {
    return games.value.filter(g => {
        const matchesSearch = !searchValue.value || 
            g.name_en.toLowerCase().includes(searchValue.value.toLowerCase()) ||
            g.game_code.toLowerCase().includes(searchValue.value.toLowerCase())
        const matchesType = typeFilter.value === 'all' || g.type === typeFilter.value
        const matchesProvider = providerFilter.value === 'all' || g.provider === providerFilter.value
        return matchesSearch && matchesType && matchesProvider
    })
})

const columns: DataTableColumns<MerchantGame> = [
    { type: 'selection' },
    {
        title: t('merchantGame.game'),
        key: 'name_en',
        width: 250,
        sorter: 'default',
        render: (row) => h('div', { class: 'flex items-center gap-3' }, [
            h('img', { 
                src: row.thumbnail || 'https://placehold.co/60x60?text=Game', 
                class: 'w-10 h-10 rounded-lg object-cover bg-gray-200',
                onError: (e: Event) => (e.target as HTMLImageElement).src = 'https://placehold.co/60x60?text=Game'
            }),
            h('div', {}, [
                h('div', { class: 'font-medium text-sm' }, row.name_en),
                h('div', { class: 'text-xs text-gray-400 font-mono' }, row.game_code)
            ])
        ])
    },
    {
        title: t('merchantGame.provider'),
        key: 'provider',
        width: 120,
        sorter: 'default',
        render: (row) => h(NTag, { size: 'small', bordered: false }, { default: () => row.provider })
    },
    {
        title: t('merchantGame.releaseDate'),
        key: 'release_date',
        width: 120,
        sorter: (row1, row2) => new Date(row1.release_date).getTime() - new Date(row2.release_date).getTime()
    },
    {
        title: 'RTP',
        key: 'rtp',
        width: 80,
        sorter: (row1, row2) => row1.rtp - row2.rtp,
        render: (row) => h('span', { class: 'font-mono text-green-600' }, `${row.rtp}%`)
    },
    {
        title: t('merchantGame.platformStatus'),
        key: 'admin_status',
        width: 130,
        render: (row) => {
            const type = row.admin_status === 'active' ? 'success' : 
                         row.admin_status === 'maintenance' ? 'warning' : 'error'
            const label = row.admin_status === 'active' ? t('merchantGame.available') :
                          row.admin_status === 'maintenance' ? t('status.maintenance') : t('merchantGame.disabledByAdmin')
            
            return h(NTag, { type, size: 'small', bordered: false }, { default: () => label })
        }
    },
    {
        title: t('merchantGame.myStatus'),
        key: 'merchant_enabled',
        width: 140,
        render: (row) => {
            const switchComp = h(StatusSwitch, {
                value: switchStates.value[row.game_id] ?? row.merchant_enabled,
                disabled: !row.master_enabled,
                'onUpdate:value': (val: boolean) => {
                     // Optimistic update
                    if (row.master_enabled) switchStates.value[row.game_id] = val
                },
                onConfirm: (val: boolean) => handleToggle(row, val)
            }, {
                checked: () => t('merchantGame.enabled'),
                unchecked: () => t('merchantGame.disabled')
            })

            if (!row.master_enabled) {
                return h(NTooltip, null, {
                    trigger: () => h('div', { class: 'inline-block cursor-not-allowed opacity-60' }, [switchComp]),
                    default: () => t('merchantGame.disabledByPlatform')
                })
            }
            
            return switchComp
        }
    }
]

onMounted(fetchGames)
</script>

<template>
    <div class="p-6">
        <h1 class="text-2xl font-bold mb-6 flex items-center gap-2">
            <span>🎮</span> {{ t('merchantGame.title') }}
        </h1>

        <n-alert type="info" class="mb-4" :bordered="false">
            {{ t('merchantGame.alertInfo') }}
        </n-alert>

        <PageFilterBar
            v-model:searchValue="searchValue"
            :searchPlaceholder="t('merchantGame.searchPlaceholder')"
            @reset="handleReset"
        >
            <template #filters>
                <n-select 
                    v-model:value="typeFilter" 
                    :options="typeOptions"
                    class="w-36"
                    placeholder="Type"
                />
                <n-select 
                    v-model:value="providerFilter" 
                    :options="providerOptions"
                    class="w-40"
                    placeholder="Provider"
                />
            </template>
        </PageFilterBar>

        <!-- Batch Action Bar -->
        <div v-if="checkedRowKeys.length > 0" class="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-between">
            <span class="text-blue-700 font-medium ml-2">
                {{ t('merchantGame.selectedCount', { count: checkedRowKeys.length }) }}
            </span>
            <n-space>
                <n-button size="small" type="error" ghost @click="handleBatchAction(false)">
                    {{ t('merchantGame.disableSelected') }}
                </n-button>
                <n-button size="small" type="primary" @click="handleBatchAction(true)">
                    {{ t('merchantGame.enableSelected') }}
                </n-button>
            </n-space>
        </div>

        <n-data-table
            v-model:checked-row-keys="checkedRowKeys"
            :columns="columns"
            :data="filteredGames"
            :loading="loading"
            :pagination="{ pageSize: 15 }"
            :row-key="(row) => row.game_id"
            striped
        />
    </div>
</template>
