<script setup lang="ts">
import { ref, h, onMounted, computed } from 'vue'
import {
  NGrid, NGridItem, NInput, NSelect, NButton,
  NDataTable, NTag, NTooltip, NIcon
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

// Merchant Options with Name (ID)
const merchantOptions = computed(() => {
    const opts = [{ label: t('betLog.allOptions'), value: '' }]
    const names = ['Golden Dragon', 'Silver Tiger', 'Diamond Star', 'Royal Crown', 'Lucky 88', 'Grand Casino']
    for (let i = 1; i <= 20; i++) {
        const id = `OP-${1000 + i}`
        const name = names[(i - 1) % names.length]
        opts.push({ label: `${name} (${id})`, value: id })
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
        round_id: selectedBetLog.value.round_id,
        platform_id: selectedBetLog.value.id,
        merchant: {
            id: selectedBetLog.value.merchant_display_id,
            name: selectedBetLog.value.merchant_name
        },
        game: {
            provider: selectedBetLog.value.provider_name,
            name: selectedBetLog.value.game_name
        },
        players: {
            platform_id: selectedBetLog.value.agg_player_id,
            merchant_member_id: selectedBetLog.value.merchant_member_id
        },
        financial: {
            bet_amount: selectedBetLog.value.bet_amount,
            payout_amount: selectedBetLog.value.payout_amount,
            net_win: selectedBetLog.value.net_win,
            currency: selectedBetLog.value.currency
        },
        status: selectedBetLog.value.status,
        game_detail: selectedBetLog.value.game_detail
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
    searchModel.playerId = ''
    searchModel.roundId = ''
}

// Helper function to render header with tooltip
const renderHeaderWithTooltip = (labelKey: string, tooltipKey: string) => {
    return () => h('div', { class: 'flex items-center gap-2' }, [
        h('span', {}, t(labelKey)),
        h(NTooltip, {}, {
            trigger: () => h(NIcon, { size: 16, class: 'cursor-help text-gray-400' }, {
                default: () => h('svg', {
                    xmlns: 'http://www.w3.org/2000/svg',
                    viewBox: '0 0 24 24',
                    fill: 'currentColor'
                }, [
                    h('path', {
                        d: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z'
                    })
                ])
            }),
            default: () => t(tooltipKey)
        })
    ])
}

// Helper function to copy text
const copyToClipboard = async (text: string) => {
    try {
        await navigator.clipboard.writeText(text)
        // Simple alert since we don't have $message globally
        console.log('Copied:', text)
    } catch (err) {
        console.error('Failed to copy:', err)
    }
}

// Columns Definition
const columns = computed<DataTableColumns<BetLog>>(() => [
    {
        title: t('betLog.roundId'),
        key: 'round_id',
        width: 160,
        fixed: 'left',
        render: (row) => h('span', {
            class: 'font-mono text-xs cursor-pointer hover:text-primary',
            onClick: (e: Event) => {
                e.stopPropagation()
                copyToClipboard(row.round_id)
            }
        }, row.round_id)
    },
    {
        title: t('betLog.time'),
        key: 'created_at',
        width: 140,
        render: (row) => {
            const date = new Date(row.created_at)
            return h('div', { class: 'text-xs' }, [
                h('div', { class: 'text-gray-300' }, date.toLocaleDateString()),
                h('div', { class: 'text-gray-500' }, date.toLocaleTimeString())
            ])
        }
    },
    {
        title: t('betLog.merchantId'),
        key: 'merchant_display_id',
        width: 110,
        render: (row) => h(NTag, { size: 'small', bordered: false, type: 'info' }, {
            default: () => row.merchant_display_id
        })
    },
    {
        title: t('betLog.merchantName'),
        key: 'merchant_name',
        width: 140,
        render: (row) => h('span', { class: 'font-medium' }, row.merchant_name)
    },
    {
        title: t('betLog.provider'),
        key: 'provider_name',
        width: 130,
        render: (row) => {
            const typeMap: Record<string, any> = {
                'PG Soft': 'error',
                'Evolution': 'warning',
                'Pragmatic Play': 'success'
            }
            return h(NTag, {
                size: 'small',
                type: typeMap[row.provider_name] || 'default'
            }, { default: () => row.provider_name })
        }
    },
    {
        title: t('betLog.game'),
        key: 'game_name',
        width: 150,
        ellipsis: true
    },
    {
        title: t('betLog.aggPlayer'),
        key: 'agg_player_id',
        width: 120,
        render: (row) => h('span', { class: 'font-mono text-xs text-cyan-400' }, row.agg_player_id)
    },
    {
        title: t('betLog.merchantPlayer'),
        key: 'merchant_member_id',
        width: 140,
        render: (row) => h('span', { class: 'font-mono text-xs text-purple-400' }, row.merchant_member_id)
    },
    {
        title: t('betLog.bet'),
        key: 'bet_amount',
        width: 110,
        align: 'right',
        render: (row) => h(MoneyText, { value: row.bet_amount, currency: row.currency })
    },
    {
        title: renderHeaderWithTooltip('betLog.netWin', 'betLog.netWinFormula'),
        key: 'net_win',
        width: 120,
        align: 'right',
        render: (row) => {
            const value = row.net_win
            const color = value > 0 ? 'text-green-500' : value < 0 ? 'text-red-500' : 'text-gray-400'
            const prefix = value > 0 ? '+' : ''
            return h('span', { class: `font-bold ${color}` }, [
                prefix,
                h(MoneyText, { value: Math.abs(value), currency: row.currency })
            ])
        }
    },
    {
        title: t('betLog.status'),
        key: 'status',
        width: 100,
        render: (row) => {
            const statusMap: Record<string, { type: 'success' | 'warning' | 'default', label: string }> = {
                settled: { type: 'success', label: t('betLog.statusSettled') },
                unsettled: { type: 'warning', label: t('betLog.statusUnsettled') },
                cancelled: { type: 'default', label: t('betLog.statusCancelled') }
            }
            const config = statusMap[row.status] || { type: 'default', label: row.status }
            return h(NTag, {
                type: config.type,
                size: 'small',
                bordered: false
            }, { default: () => config.label })
        }
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

    <!-- Grid Filter Layout (2 Rows) -->
    <n-card class="mb-6" :bordered="false" content-style="padding: 20px;">
        <n-grid :cols="24" :x-gap="12" :y-gap="12">
            <!-- Row 1 -->
            <n-grid-item :span="6">
                <DateRangePicker v-model:value="searchModel.timeRange" />
            </n-grid-item>
            <n-grid-item :span="5">
                <n-select
                    v-model:value="searchModel.merchantCode"
                    :options="merchantOptions"
                    :placeholder="t('betLog.merchantName')"
                    filterable
                    clearable
                />
            </n-grid-item>
            <n-grid-item :span="5">
                <n-select
                    v-model:value="searchModel.provider"
                    :options="providerOptions"
                    :placeholder="t('betLog.provider')"
                    clearable
                />
            </n-grid-item>
            <n-grid-item :span="8">
                <!-- Empty space for future filters -->
            </n-grid-item>
            <n-grid-item :span="4">
                <!-- Empty space for alignment -->
            </n-grid-item>

            <!-- Row 2 -->
            <n-grid-item :span="5">
                <n-input
                    v-model:value="searchModel.roundId"
                    :placeholder="t('betLog.roundId')"
                    clearable
                />
            </n-grid-item>
            <n-grid-item :span="5">
                <n-input
                    v-model:value="searchModel.playerId"
                    :placeholder="t('betLog.aggPlayer') + ' / ' + t('betLog.merchantPlayer')"
                    clearable
                />
            </n-grid-item>
            <n-grid-item :span="10">
                <!-- Empty space -->
            </n-grid-item>
            <n-grid-item :span="4" class="flex justify-end gap-2">
                <n-button type="primary" @click="handleSearch" :loading="loading" class="flex-1">
                    {{ t('betLog.searchLogs') }}
                </n-button>
                <n-button @click="handleReset">
                    {{ t('common.reset') }}
                </n-button>
            </n-grid-item>
        </n-grid>
    </n-card>

    <!-- Data Table -->
    <n-data-table
        :columns="columns"
        :data="logs"
        :loading="loading"
        flex-height
        :pagination="{ pageSize: 20 }"
        class="flex-1"
        :single-line="false"
        :row-props="(row: BetLog) => ({
            style: 'cursor: pointer',
            onClick: () => openDetail(row)
        })"
    />

    <!-- JSON Viewer Drawer -->
    <JsonViewer
        v-model:show="showJsonViewer"
        :title="`${t('betLog.roundId')}: ${selectedBetLog?.round_id || ''}`"
        :data="jsonData"
        :width="700"
    >
        <template #summary>
            <n-card v-if="selectedBetLog" size="small" class="bg-slate-800/50">
                <div class="grid grid-cols-4 gap-4 text-center">
                    <div>
                        <div class="text-xs text-gray-400">{{ t('betLog.merchantName') }}</div>
                        <div class="font-bold">{{ selectedBetLog.merchant_name }}</div>
                    </div>
                    <div>
                        <div class="text-xs text-gray-400">{{ t('betLog.provider') }}</div>
                        <div class="font-bold">{{ selectedBetLog.provider_name }}</div>
                    </div>
                    <div>
                        <div class="text-xs text-gray-400">{{ t('betLog.bet') }}</div>
                        <div class="font-bold">
                            <MoneyText :value="selectedBetLog.bet_amount" :currency="selectedBetLog.currency" />
                        </div>
                    </div>
                    <div>
                        <div class="text-xs text-gray-400">{{ t('betLog.netWin') }}</div>
                        <div :class="['font-bold', selectedBetLog.net_win > 0 ? 'text-green-500' : selectedBetLog.net_win < 0 ? 'text-red-500' : 'text-gray-400']">
                            {{ selectedBetLog.net_win > 0 ? '+' : '' }}<MoneyText :value="Math.abs(selectedBetLog.net_win)" :currency="selectedBetLog.currency" />
                        </div>
                    </div>
                </div>
            </n-card>
        </template>
    </JsonViewer>
  </div>
</template>
