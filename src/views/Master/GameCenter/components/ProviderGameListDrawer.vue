<script setup lang="ts">
import { ref, watch, h } from 'vue'
import { NDrawer, NDrawerContent, NDataTable, NTag, NInput, NSpace, NIcon } from 'naive-ui'
import { SearchOutlined } from '@vicons/material'
import { useI18n } from 'vue-i18n'
import type { DataTableColumns } from 'naive-ui'
import type { Provider } from '../../../../types/provider'

interface Game {
    id: number
    name: string
    type: string
    rtp: number
    status: 'active' | 'inactive'
}

const props = defineProps<{
    show: boolean
    provider: Provider | null
}>()

const emit = defineEmits<{
    (e: 'update:show', value: boolean): void
}>()

const { t } = useI18n()
const loading = ref(false)
const searchText = ref('')
const games = ref<Game[]>([])

// Mock fetch games
const fetchGames = async () => {
    loading.value = true
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Generate mock games based on provider
    games.value = Array.from({ length: 15 }).map((_, i) => ({
        id: i + 1,
        name: `${props.provider?.name} Game ${i + 1}`,
        type: ['Slots', 'Live', 'Fishing'][i % 3] || 'Slots',
        rtp: 95 + Math.random() * 4,
        status: Math.random() > 0.1 ? 'active' : 'inactive'
    }))
    loading.value = false
}

watch(() => props.show, (newVal) => {
    if (newVal && props.provider) {
        fetchGames()
    }
})

const columns: DataTableColumns<Game> = [
    {
        title: t('provider.games'),
        key: 'name',
        render: (row) => h('span', { class: 'font-bold' }, row.name)
    },
    {
        title: t('provider.gameType'),
        key: 'type',
        render: (row) => h(NTag, { size: 'small', bordered: false }, { default: () => row.type })
    },
    {
        title: t('provider.rtp'),
        key: 'rtp',
        render: (row) => `${row.rtp.toFixed(2)}%`
    },
    {
        title: t('provider.status'),
        key: 'status',
        render: (row) => h(NTag, { 
            type: row.status === 'active' ? 'success' : 'error', 
            size: 'small', 
            bordered: false 
        }, { 
            default: () => row.status === 'active' ? t('status.active') : t('status.disabled') 
        })
    }
]
</script>

<template>
    <n-drawer 
        :show="show" 
        @update:show="$emit('update:show', $event)" 
        width="600"
        placement="right"
    >
        <n-drawer-content :title="`${provider?.name} - ${t('provider.gameList')}`">
            <n-space vertical size="large">
                <n-input v-model:value="searchText" :placeholder="t('provider.searchGame')">
                    <template #prefix>
                        <n-icon :component="SearchOutlined" />
                    </template>
                </n-input>

                <n-data-table
                    :columns="columns"
                    :data="games.filter(g => g.name.toLowerCase().includes(searchText.toLowerCase()))"
                    :loading="loading"
                    :pagination="{ pageSize: 10 }"
                />
            </n-space>
        </n-drawer-content>
    </n-drawer>
</template>
