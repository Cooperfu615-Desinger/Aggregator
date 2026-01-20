<script setup lang="ts">
import { ref, onMounted, computed, h } from 'vue'
import { NDataTable, NButton, NCard, NInput, NTag } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import DateRangePicker from '../../../components/Common/DateRangePicker.vue'
import PageFilterBar from '../../../components/Common/PageFilterBar.vue'
import MoneyText from '../../../components/Common/MoneyText.vue'
import JsonViewer from '../../../components/Common/JsonViewer.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

interface BetLog {
    id: string
    time: string
    player_id: string
    game_name: string
    bet: number
    win: number
    currency: string
    status: 'win' | 'loss' | 'refund'
    detail?: any
}

const loading = ref(false)
const list = ref<BetLog[]>([])
const dateRange = ref<[number, number] | null>(null)
const playerId = ref('')
const roundId = ref('')
const showDetail = ref(false)
const selectedLog = ref<BetLog | null>(null)

const columns = computed<DataTableColumns<BetLog>>(() => [
    { 
        title: t('betQuery.time'), 
        key: 'time',
        width: 160,
        render: (row) => h('span', { class: 'text-sm' }, new Date(row.time).toLocaleString())
    },
    { 
        title: t('betQuery.roundId'), 
        key: 'id',
        width: 140,
        render: (row) => h('span', { class: 'font-mono text-xs' }, row.id)
    },
    { 
        title: t('betQuery.player'), 
        key: 'player_id',
        width: 120,
        render: (row) => h('span', { class: 'font-mono' }, row.player_id)
    },
    { 
        title: t('betQuery.game'), 
        key: 'game_name',
        width: 150,
        ellipsis: { tooltip: true }
    },
    { 
        title: t('betQuery.bet'), 
        key: 'bet',
        width: 120,
        align: 'right',
        render: (row) => h(MoneyText, { value: row.bet, currency: row.currency })
    },
    { 
        title: t('betQuery.win'), 
        key: 'win',
        width: 120,
        align: 'right',
        render: (row) => h(MoneyText, { value: row.win, currency: row.currency })
    },
    {
        title: t('betQuery.status'),
        key: 'status',
        width: 90,
        render: (row) => {
            const typeMap: Record<string, any> = {
                win: 'success', loss: 'error', refund: 'warning'
            }
            return h(NTag, { type: typeMap[row.status], size: 'small', bordered: false }, 
                { default: () => row.status.toUpperCase() }
            )
        }
    },
    {
        title: '',
        key: 'action',
        width: 60,
        render: (row) => h(NButton, { 
            size: 'tiny', 
            quaternary: true,
            onClick: () => openDetail(row)
        }, { default: () => '🔍' })
    }
])

const openDetail = (row: BetLog) => {
    selectedLog.value = row
    showDetail.value = true
}

const handleReset = () => {
    dateRange.value = null
    playerId.value = ''
    roundId.value = ''
}

const fetchData = async () => {
    loading.value = true
    try {
        const res = await fetch('/api/v2/agent/report/bet-query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                date_start: dateRange.value?.[0],
                date_end: dateRange.value?.[1],
                player_id: playerId.value || undefined,
                round_id: roundId.value || undefined
            })
        })
        const data = await res.json()
        list.value = data.data?.list || []
    } finally {
        loading.value = false
    }
}

onMounted(() => fetchData())
</script>

<template>
    <div class="p-6 space-y-4">
        <div class="flex justify-between items-center">
            <h1 class="text-2xl font-bold flex items-center gap-2">
                <span>🔎</span> {{ t('betQuery.title') }}
            </h1>
        </div>

        <!-- Filter Bar -->
        <PageFilterBar
            v-model:searchValue="roundId"
            :searchPlaceholder="t('betQuery.searchRound')"
            @reset="handleReset"
        >
            <template #filters>
                <DateRangePicker v-model:value="dateRange" />
                <n-input 
                    v-model:value="playerId" 
                    :placeholder="t('betQuery.playerId')"
                    class="w-36"
                    clearable
                />
            </template>
            <template #actions>
                <n-button type="primary" @click="fetchData" :loading="loading">
                    {{ t('betQuery.search') }}
                </n-button>
            </template>
        </PageFilterBar>

        <!-- Data Table -->
        <n-card>
            <n-data-table 
                :columns="columns" 
                :data="list" 
                :loading="loading" 
                :pagination="{ pageSize: 15 }"
                striped
            />
        </n-card>

        <!-- Detail Drawer -->
        <JsonViewer
            v-model:show="showDetail"
            :title="`${t('betQuery.roundId')}: ${selectedLog?.id || ''}`"
            :data="selectedLog"
            :width="550"
        >
            <template #summary>
                <n-card v-if="selectedLog" size="small" class="mb-4">
                    <div class="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <div class="text-xs text-gray-400">{{ t('betQuery.player') }}</div>
                            <div class="font-bold font-mono">{{ selectedLog.player_id }}</div>
                        </div>
                        <div>
                            <div class="text-xs text-gray-400">{{ t('betQuery.game') }}</div>
                            <div class="font-medium">{{ selectedLog.game_name }}</div>
                        </div>
                        <div>
                            <div class="text-xs text-gray-400">{{ t('betQuery.status') }}</div>
                            <n-tag :type="selectedLog.status === 'win' ? 'success' : 'error'" size="small">
                                {{ selectedLog.status.toUpperCase() }}
                            </n-tag>
                        </div>
                    </div>
                </n-card>
            </template>
        </JsonViewer>
    </div>
</template>
