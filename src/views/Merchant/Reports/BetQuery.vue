<script setup lang="ts">
import { ref, onMounted, computed, h } from 'vue'
import { NDataTable, NButton, NCard, NInput, NTag, NSpace, NIcon } from 'naive-ui'
import { SearchRound, RefreshRound } from '@vicons/material'
import type { DataTableColumns } from 'naive-ui'
import DateRangePicker from '../../../components/Common/DateRangePicker.vue'
import MoneyText from '../../../components/Common/MoneyText.vue'
import JsonViewer from '../../../components/Common/JsonViewer.vue'
import { useI18n } from 'vue-i18n'
import { useSessionStorage } from '@vueuse/core'
import { format } from 'date-fns'

const { t } = useI18n()

interface BetLog {
    id: string
    created_at: string
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

// QA Fix: State Persistence using SessionStorage
const dateRange = useSessionStorage<[number, number] | null>('betQuery-dateRange', null)
const playerId = useSessionStorage('betQuery-playerId', '')
const roundId = useSessionStorage('betQuery-roundId', '')

const showDetail = ref(false)
const selectedLog = ref<BetLog | null>(null)

const columns = computed<DataTableColumns<BetLog>>(() => [
    { 
        title: t('betQuery.time'), 
        key: 'created_at',
        width: 160,
        align: 'right',
        sorter: (rowA, rowB) => new Date(rowA.created_at).getTime() - new Date(rowB.created_at).getTime(),
        render: (row) => h('span', { class: 'text-sm' }, new Date(row.created_at).toLocaleString())
    },
    { 
        title: t('betQuery.roundId'), 
        key: 'id',
        width: 140,
        align: 'right',
        sorter: (rowA, rowB) => rowA.id.localeCompare(rowB.id),
        render: (row) => h('span', { class: 'font-mono text-xs' }, row.id)
    },
    { 
        title: t('betQuery.player'), 
        key: 'player_id',
        width: 120,
        align: 'right',
        sorter: (rowA, rowB) => rowA.player_id.localeCompare(rowB.player_id),
        render: (row) => h('span', { class: 'font-mono' }, row.player_id)
    },
    { 
        title: t('betQuery.game'), 
        key: 'game_name',
        width: 150,
        align: 'right',
        sorter: (rowA, rowB) => rowA.game_name.localeCompare(rowB.game_name),
        ellipsis: { tooltip: true }
    },
    { 
        title: t('betQuery.bet'), 
        key: 'bet',
        width: 120,
        align: 'right',
        sorter: (rowA, rowB) => rowA.bet - rowB.bet,
        render: (row) => h(MoneyText, { value: row.bet, currency: row.currency })
    },
    { 
        title: t('betQuery.win'), 
        key: 'win',
        width: 120,
        align: 'right',
        sorter: (rowA, rowB) => rowA.win - rowB.win,
        render: (row) => h(MoneyText, { value: row.win, currency: row.currency })
    },
    {
        title: t('betQuery.status'),
        key: 'status',
        width: 90,
        align: 'right',
        sorter: (rowA, rowB) => rowA.status.localeCompare(rowB.status),
        render: (row) => {
            const typeMap: Record<string, any> = {
                win: 'success', loss: 'error', refund: 'warning'
            }
            return h(NTag, { type: typeMap[row.status], size: 'small', bordered: false }, 
                { default: () => t(`status.${row.status}`) }
            )
        }
    },
    {
        title: '',
        key: 'action',
        width: 60,
        align: 'right',
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
        let startStr = undefined
        let endStr = undefined
        
        // QA Fix: Use date-fns for timezone consistency
        if (dateRange.value) {
            startStr = format(dateRange.value[0], 'yyyy-MM-dd')
            endStr = format(dateRange.value[1], 'yyyy-MM-dd')
        }

        const res = await fetch('/api/v2/merchant/reports/bet-logs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                date_start: startStr,
                date_end: endStr,
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

        <!-- Custom Filter Section -->
        <div class="bg-slate-800/50 p-4 rounded-lg mb-6 border border-slate-700/50 space-y-4">
            <!-- Row 1: Date Range -->
            <div class="flex items-center">
                <DateRangePicker v-model:value="dateRange" />
            </div>

            <!-- Row 2: Inputs & Actions -->
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <!-- Round ID Input (Width set to match User ID) -->
                    <n-input 
                        v-model:value="roundId" 
                        :placeholder="t('betQuery.searchRound')"
                        class="w-64"
                        clearable
                        @keydown.enter="fetchData"
                    >
                        <template #prefix>
                            <n-icon :component="SearchRound" class="text-gray-400" />
                        </template>
                    </n-input>

                    <!-- Player ID Input (Width set to w-64 as requested) -->
                    <n-input 
                        v-model:value="playerId" 
                        :placeholder="t('betQuery.playerId')"
                        class="w-64"
                        clearable
                        @keydown.enter="fetchData"
                    />
                </div>
                
                <n-space>
                    <!-- Search Button -->
                    <n-button type="primary" @click="fetchData" :loading="loading">
                        <template #icon>
                            <n-icon :component="SearchRound" />
                        </template>
                        {{ t('betQuery.search') }}
                    </n-button>
                    <!-- Reset Button -->
                    <n-button @click="handleReset" tertiary>
                        <template #icon>
                            <n-icon :component="RefreshRound" />
                        </template>
                        {{ t('common.reset') }}
                    </n-button>
                </n-space>
            </div>
        </div>

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
                                {{ t(`status.${selectedLog.status}`) }}
                            </n-tag>
                        </div>
                    </div>
                </n-card>
            </template>
        </JsonViewer>
    </div>
</template>
