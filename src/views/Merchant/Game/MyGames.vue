<script setup lang="ts">
import { ref, onMounted, h, computed } from 'vue'
import { 
    NDataTable, NTag, NSelect, useMessage, NAlert
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
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
    merchant_enabled: boolean  // Merchant's own toggle
    master_enabled: boolean    // Master's global toggle (readonly)
    thumbnail?: string
}

const games = ref<MerchantGame[]>([])
const searchValue = ref('')
const typeFilter = ref('all')

const typeOptions = computed(() => [
    { label: t('myGames.allTypes'), value: 'all' },
    { label: t('myGames.slots'), value: 'Slot' },
    { label: t('myGames.liveCasino'), value: 'Live' },
    { label: t('myGames.fishing'), value: 'Fishing' }
])

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
        message.error(t('myGames.loadFailed'))
    } finally {
        loading.value = false
    }
}

const handleToggle = async (row: MerchantGame, newVal: boolean) => {
    // Cannot enable if Master disabled
    if (newVal && !row.master_enabled) {
        message.warning(t('myGames.disabledByPlatform'))
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
        message.success(newVal ? t('myGames.gameEnabled') : t('myGames.gameDisabled'))
    } catch {
        // Revert on error
        switchStates.value[row.game_id] = !newVal
        row.merchant_enabled = !newVal
        message.error(t('myGames.updateFailed'))
    }
}

const handleReset = () => {
    searchValue.value = ''
    typeFilter.value = 'all'
}

const filteredGames = computed(() => {
    return games.value.filter(g => {
        const matchesSearch = !searchValue.value || 
            g.name_en.toLowerCase().includes(searchValue.value.toLowerCase()) ||
            g.game_code.toLowerCase().includes(searchValue.value.toLowerCase())
        const matchesType = typeFilter.value === 'all' || g.type === typeFilter.value
        return matchesSearch && matchesType
    })
})

const columns: DataTableColumns<MerchantGame> = [
    {
        title: t('myGames.game'),
        key: 'name_en',
        width: 280,
        render: (row) => h('div', { class: 'flex items-center gap-3' }, [
            h('img', { 
                src: row.thumbnail || 'https://placehold.co/60x60?text=Game', 
                class: 'w-12 h-12 rounded-lg object-cover bg-gray-200',
                onError: (e: Event) => (e.target as HTMLImageElement).src = 'https://placehold.co/60x60?text=Game'
            }),
            h('div', {}, [
                h('div', { class: 'font-medium' }, row.name_en),
                h('div', { class: 'text-xs text-gray-500 font-mono' }, row.game_code)
            ])
        ])
    },
    {
        title: t('myGames.provider'),
        key: 'provider',
        width: 120,
        render: (row) => h(NTag, { size: 'small', type: 'info' }, { default: () => row.provider })
    },
    {
        title: t('myGames.type'),
        key: 'type',
        width: 100,
        render: (row) => h(NTag, { size: 'small', bordered: false }, { default: () => row.type })
    },
    {
        title: 'RTP',
        key: 'rtp',
        width: 80,
        render: (row) => h('span', { class: 'font-mono text-green-600' }, `${row.rtp}%`)
    },
    {
        title: t('myGames.platformStatus'),
        key: 'master_enabled',
        width: 130,
        render: (row) => row.master_enabled 
            ? h(NTag, { type: 'success', size: 'small' }, { default: () => t('myGames.available') })
            : h(NTag, { type: 'error', size: 'small' }, { default: () => t('myGames.disabledByAdmin') })
    },
    {
        title: t('myGames.myStatus'),
        key: 'merchant_enabled',
        width: 140,
        render: (row) => h(StatusSwitch, {
            value: switchStates.value[row.game_id] ?? row.merchant_enabled,
            disabled: !row.master_enabled,
            'onUpdate:value': (val: boolean) => {
                if (row.master_enabled) {
                    switchStates.value[row.game_id] = val
                }
            },
            onConfirm: (val: boolean) => handleToggle(row, val)
        }, {
            checked: () => t('myGames.enabled'),
            unchecked: () => t('myGames.disabled')
        })
    }
]

onMounted(fetchGames)
</script>

<template>
    <div class="p-6">
        <h1 class="text-2xl font-bold mb-6 flex items-center gap-2">
            <span>🎮</span> {{ t('myGames.title') }}
        </h1>

        <n-alert type="info" class="mb-4" :bordered="false">
            {{ t('myGames.alert') }}
        </n-alert>

        <PageFilterBar
            v-model:searchValue="searchValue"
            :searchPlaceholder="t('myGames.search')"
            @reset="handleReset"
        >
            <template #filters>
                <n-select 
                    v-model:value="typeFilter" 
                    :options="typeOptions"
                    class="w-36"
                />
            </template>
        </PageFilterBar>

        <n-data-table
            :columns="columns"
            :data="filteredGames"
            :loading="loading"
            :pagination="{ pageSize: 15 }"
            striped
        />
    </div>
</template>
