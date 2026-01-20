<script setup lang="ts">
import { ref, h, onMounted, computed } from 'vue'
import {
  NCard, NInput, NSelect, NButton,
  NDataTable, NTag, NTooltip
} from 'naive-ui'
import { useI18n } from 'vue-i18n'
import type { DataTableColumns } from 'naive-ui'
import { useRoundSearch } from '../../../composables/useRoundSearch'
import type { BetLog } from '../../../types/report'
import DateRangePicker from '../../../components/Common/DateRangePicker.vue'
import JsonViewer from '../../../components/Common/JsonViewer.vue'
import MoneyText from '../../../components/Common/MoneyText.vue'


const { t } = useI18n()
const { loading, searchModel, logs, handleSearch } = useRoundSearch()

// Initialize
onMounted(() => {
    handleSearch()
})

// Options
const merchantOptions = computed(() => {
    const opts = [{ label: t('betLog.allOptions'), value: '' }]
    for (let i = 1; i <= 20; i++) {
        const id = `OP-${1000 + i}`
        opts.push({ label: id, value: id })
    }
    return opts
})

const providerOptions = computed(() => [
    { label: t('betLog.allOptions'), value: '' },
    { label: 'PG Soft', value: 'pg' },
    { label: 'Evolution', value: 'evo' },
    { label: 'Pragmatic Play', value: 'pp' }
])

// Drawer Control
const showJsonViewer = ref(false)
const selectedBetLog = ref<BetLog | null>(null)

const jsonData = computed(() => {
    if (!selectedBetLog.value) return {}
    return {
        platformId: selectedBetLog.value.id,
        upstreamId: selectedBetLog.value.txId,
        provider: selectedBetLog.value.providerName,
        meta: {
            merchantId: selectedBetLog.value.merchant_code, // Updated key
            merchantName: selectedBetLog.value['merchant_name'],
            currency: selectedBetLog.value.currency,
            exchangeRate: selectedBetLog.value.exchangeRate
        },
        game_detail: selectedBetLog.value.game_detail,
        rawData: {
            created_at: selectedBetLog.value.created_at,
            bet_amount: selectedBetLog.value.bet_amount,
            win_amount: selectedBetLog.value.win_amount,
            originalBet: selectedBetLog.value.originalBet,
            originalWin: selectedBetLog.value.originalWin,
            status: selectedBetLog.value.status
        }
    }
})

const openDetail = (row: BetLog) => {
    selectedBetLog.value = row
    showJsonViewer.value = true
}

const handleReset = () => {
    searchModel.timeRange = null
    searchModel.merchantCode = ''
    searchModel.provider = ''
    searchModel.currency = ''
    searchModel.playerId = ''
    searchModel.roundId = ''
}

// Columns with MoneyText
const columns = computed<DataTableColumns<BetLog>>(() => [
    {
        title: t('betLog.roundId'),
        key: 'id',
        width: 140,
        fixed: 'left',
        render: (row) => h('span', { 
            class: 'font-mono text-xs text-primary cursor-pointer hover:underline',
            onClick: () => openDetail(row)
        }, row.id)
    },
    { 
        title: t('betLog.time'), 
        key: 'created_at', 
        width: 160,
        render: (row) => h('div', { class: 'text-xs text-gray-400' }, new Date(row.created_at).toLocaleString())
    },
    { 
        title: t('betLog.merchant'), 
        key: 'merchant_code', 
        width: 120,
        render: (row) => h(NTag, { size: 'small', bordered: false, type: 'info' }, { default: () => row.merchant_code })
    },
    { 
        title: t('betLog.provider'), 
        key: 'merchant_name', 
        width: 140,
        render: (row) => h('span', { class: 'font-bold text-gray-300' }, row['merchant_name'] || 'Unknown') 
    },
    { 
        title: t('betLog.game'), 
        key: 'game_name', 
        width: 150,
        ellipsis: true
    },
    { 
        title: t('betLog.playerAccount'), 
        key: 'player_id', 
        width: 120,
        render: (row) => h('span', { class: 'font-mono text-xs' }, row.player_id || row.player_account)
    },
    { 
        title: t('betLog.originalAmount'), 
        key: 'originalBet', 
        width: 160,
        align: 'right',
        render: (row) => h('div', { class: 'text-right space-y-1' }, [
            h('div', { class: 'text-xs text-gray-500' }, [
                t('betLog.bet') + ': ',
                h(MoneyText, { value: row.originalBet || 0, currency: row.currency })
            ]),
            h('div', { class: 'text-sm' }, [
                t('betLog.win') + ': ',
                h(MoneyText, { value: row.originalWin || 0, currency: row.currency })
            ])
        ])
    },
    { 
        title: t('betLog.baseAmount') + ' (USD)', 
        key: 'bet_amount', 
        width: 140,
        align: 'right',
        render: (row) => {
            const trigger = h('div', { class: 'cursor-help text-right' }, [
                h('div', { class: 'text-xs text-gray-500' }, [
                    h(MoneyText, { value: row.bet_amount, currency: 'USD' })
                ]),
                h('div', {}, [
                    h(MoneyText, { value: row.win_amount, currency: 'USD' })
                ])
            ])
            
            return h(NTooltip, { trigger: 'hover' }, {
                trigger: () => trigger,
                default: () => `Rate: ${row.exchangeRate} (${row.currency} → USD)`
            })
        }
    },
    {
        title: t('betLog.status'),
        key: 'status',
        width: 90,
        render: (row) => {
            const statusMap: Record<string, 'success' | 'error' | 'warning'> = {
                win: 'success', loss: 'error', refund: 'warning'
            }
            return h(NTag, { type: statusMap[row.status] || 'default', bordered: false, size: 'small' }, 
                { default: () => t(`status.${row.status}`) }
            )
        }
    },
    {
        title: t('common.action'),
        key: 'actions',
        width: 80,
        fixed: 'right',
        render: (row) => h(NButton, { 
            size: 'tiny', secondary: true, onClick: () => openDetail(row) 
        }, { default: () => '🔍' })
    }
])
</script>

<template>
  <div class="p-6 h-full flex flex-col">
    <div class="flex justify-between items-center mb-4">
        <h1 class="text-2xl font-bold flex items-center gap-2">
            <span>📊</span> {{ t('betLog.title') }}
        </h1>
        <n-button type="primary" dashed @click="handleSearch">{{ t('common.refresh') }}</n-button>
    </div>

    <!-- Custom Filter Layout (3 Rows) -->
    <div class="bg-slate-800/50 p-4 rounded-lg mb-6 border border-slate-700/50">
        <div class="flex flex-col gap-4">
            <!-- Row 1: Round ID + Date Range -->
            <div class="flex items-center gap-4">
                <n-input 
                    v-model:value="searchModel.roundId" 
                    :placeholder="t('betLog.roundId') + ' / TX ID...'" 
                    class="w-48" 
                    clearable
                />
                <DateRangePicker v-model:value="searchModel.timeRange" />
            </div>

            <!-- Row 2: Merchant + Provider -->
            <div class="flex items-center gap-4">
                <n-select 
                    v-model:value="searchModel.merchantCode" 
                    :options="merchantOptions" 
                    :placeholder="t('betLog.merchant')"
                    class="w-48"
                    clearable
                />
                <n-select 
                    v-model:value="searchModel.provider" 
                    :options="providerOptions" 
                    :placeholder="t('betLog.vendor')"
                    class="w-48"
                    clearable
                />
            </div>

            <!-- Row 3: Player + Actions -->
            <div class="flex items-center gap-4">
                <n-input 
                    v-model:value="searchModel.playerId" 
                    :placeholder="t('betLog.playerAccount')" 
                    class="w-48"
                    clearable
                />
                <n-button type="primary" @click="handleSearch" :loading="loading" class="px-6">
                    {{ t('betLog.searchLogs') }}
                </n-button>
                <n-button @click="handleReset">
                    {{ t('common.reset') }}
                </n-button>
            </div>
        </div>
    </div>

    <!-- Data Table -->
    <n-data-table
        :columns="columns"
        :data="logs"
        :loading="loading"
        flex-height
        :pagination="{ pageSize: 20 }"
        class="flex-1 bg-slate-900/50 rounded-lg"
        :single-line="false"
        :row-props="(row: BetLog) => ({
            style: 'cursor: pointer',
            onClick: () => openDetail(row)
        })"
    />

    <!-- JSON Viewer Drawer -->
    <JsonViewer
        v-model:show="showJsonViewer"
        :title="`Round Detail: ${selectedBetLog?.id || ''}`"
        :data="jsonData"
        :width="650"
    >
        <template #summary>
            <n-card v-if="selectedBetLog" size="small" class="bg-slate-800/50">
                <div class="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <div class="text-xs text-gray-400">Merchant</div>
                        <div class="font-bold">{{ selectedBetLog.merchant_code }}</div>
                    </div>
                    <div>
                        <div class="text-xs text-gray-400">Provider</div>
                        <div class="font-bold">{{ selectedBetLog.providerName }}</div>
                    </div>
                    <div>
                        <div class="text-xs text-gray-400">Status</div>
                        <n-tag :type="selectedBetLog.status === 'win' ? 'success' : 'error'" size="small">
                            {{ selectedBetLog.status.toUpperCase() }}
                        </n-tag>
                    </div>
                </div>
            </n-card>
        </template>
    </JsonViewer>
  </div>
</template>
