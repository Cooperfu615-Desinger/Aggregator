<script setup lang="ts">
import { ref, onMounted, h } from 'vue'
import { 
    NCard, NStatistic, NGrid, NGridItem, NDataTable, NButton, useMessage, NDatePicker
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import TransactionDetailDrawer from './components/TransactionDetailDrawer.vue'
import type { RevenueReportRow } from '../../../types/table'
import { exportToCSV } from '../../../utils/csvExport'

const { t } = useI18n()
const message = useMessage()
const loading = ref(false)

// State
const dateRange = ref<[number, number]>([
    new Date().setDate(new Date().getDate() - 30),
    new Date().getTime()
])

// Local interface removed, using RevenueReportRow
type DailyReportItem = RevenueReportRow

const items = ref<DailyReportItem[]>([])
const summary = ref({
    total_bet: 0,
    total_payout: 0,
    net_win: 0,
    tx_count: 0,
    active_players: 0,
    rtp: 0
})

// Drawer State
const showDrawer = ref(false)
const selectedDate = ref('')

// Fetch Data
const fetchData = async () => {
    loading.value = true
    try {
        const [start, end] = dateRange.value
        const startDate = new Date(start).toISOString().split('T')[0]
        const endDate = new Date(end).toISOString().split('T')[0]

        const res = await fetch(`/api/v2/merchant/reports/daily?startDate=${startDate}&endDate=${endDate}`)
        const data = await res.json()
        
        if (data.code === 0) {
            items.value = data.data.items
            summary.value = data.data.summary
        }
    } catch {
        message.error('Failed to load report')
    } finally {
        loading.value = false
    }
}

const handleViewDetails = (date: string) => {
    selectedDate.value = date
    showDrawer.value = true
}

const exportLoading = ref(false)

const handleExportSummary = () => {
    const filename = `Revenue_Summary_${new Date().toISOString().split('T')[0]}`
    const headers = {
        date: t('merchantReports.dailySummary'),
        active_players: t('merchantReports.activePlayers'),
        tx_count: t('merchantReports.txCount'),
        total_bet: t('merchantReports.totalBet'),
        total_payout: t('merchantReports.totalPayout'),
        net_win: t('merchantReports.netWin')
    }
    
    // Flatten or filter to only primary date rows if needed, or just export current items
    // Current items includes children, for CSV we might want to flatten or only take top level
    const exportData = items.value.map(row => ({
        date: row.children ? row.date : `  - ${t(`merchantReports.${row.date}`)}`,
        active_players: row.active_players,
        tx_count: row.children ? row.tx_count : '-',
        total_bet: row.total_bet,
        total_payout: row.total_payout,
        net_win: row.net_win
    }))
    
    exportToCSV(exportData, filename, headers)
    message.success(t('common.success'))
}

const handleExportDetails = async () => {
    exportLoading.value = true
    try {
        const [start, end] = dateRange.value
        const startDate = new Date(start).toISOString().split('T')[0]
        const endDate = new Date(end).toISOString().split('T')[0]
        
        // Fetch all transactions for the date range (simulated via API)
        const res = await fetch(`/api/v2/merchant/reports/transactions?startDate=${startDate}&endDate=${endDate}&all=true`)
        const data = await res.json()
        
        if (data.code === 0) {
            const filename = `Transaction_Details_${startDate}_${endDate}`
            const headers = {
                created_at: t('merchantReports.betTime'),
                player_id: t('merchantReports.player'),
                game_name: t('merchantReports.game'),
                bet_amount: t('merchantReports.totalBet'),
                payout_amount: t('merchantReports.totalPayout'),
                net_win: t('merchantReports.netWin')
            }
            
            const exportData = data.data.list.map((row: any) => ({
                ...row,
                created_at: new Date(row.created_at).toLocaleString()
            }))
            
            exportToCSV(exportData, filename, headers)
            message.success(t('common.success'))
        }
    } catch {
        message.error('Export failed')
    } finally {
        exportLoading.value = false
    }
}

const columns: DataTableColumns<DailyReportItem> = [
    {
        title: t('merchantReports.dailySummary'), // Date or Category
        key: 'date',
        width: 180,
        align: 'right',
        render: (row) => {
            if (row.children) {
                return row.date 
            } else {
                return t(`merchantReports.${row.date}`)
            }
        }
    },
    {
        title: t('merchantReports.activePlayers'),
        key: 'active_players',
        align: 'right',
        render: (row) => row.active_players.toLocaleString()
    },
    {
        title: t('merchantReports.txCount'),
        key: 'tx_count',
        align: 'right',
        render: (row) => row.children ? row.tx_count.toLocaleString() : '-'
    },
    {
        title: t('merchantReports.totalBet'),
        key: 'total_bet',
        align: 'right',
        render: (row) => row.total_bet.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    },
    {
        title: t('merchantReports.totalPayout'),
        key: 'total_payout',
        align: 'right',
        render: (row) => row.total_payout.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    },
    {
        title: t('merchantReports.netWin'),
        key: 'net_win',
        align: 'right',
        render: (row) => {
            const val = row.net_win
            const formatted = val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            return h(
                'span',
                { class: val >= 0 ? 'text-green-500 font-bold' : 'text-red-500 font-bold' },
                val > 0 ? `+${formatted}` : formatted
            )
        }
    },
    {
        title: t('merchantReports.details'),
        key: 'actions',
        width: 100,
        align: 'right',
        render: (row) => {
            // Only show Action for Date rows
            if (row.children) {
                return h(
                    NButton,
                    {
                        size: 'small',
                        secondary: true,
                        onClick: (e) => {
                            e.stopPropagation()
                            handleViewDetails(row.date)
                        }
                    },
                    { default: () => t('merchantReports.view') }
                )
            }
            return null
        }
    }
]

onMounted(fetchData)
</script>

<template>
    <div class="p-6 space-y-6">
        <div class="flex items-center justify-between">
            <h1 class="text-2xl font-bold flex items-center gap-2">
                <span>📈</span> {{ t('merchantReports.title') }}
            </h1>
            <div class="flex items-center gap-3">
                <n-date-picker 
                    v-model:value="dateRange" 
                    type="daterange" 
                    clearable 
                    @update:value="fetchData" 
                />
                <n-button secondary type="primary" @click="handleExportSummary">
                    📥 {{ t('merchantReports.exportSummary') }}
                </n-button>
                <n-button secondary type="info" :loading="exportLoading" @click="handleExportDetails">
                    📊 {{ t('merchantReports.exportDetails') }}
                </n-button>
            </div>
        </div>

        <!-- Summary Cards -->
        <n-card :title="t('merchantReports.summaryTitle')" size="small">
            <n-grid :cols="5" gap="12">
                <n-grid-item>
                    <n-statistic :label="t('merchantReports.activePlayers')">
                        {{ summary.active_players.toLocaleString() }}
                    </n-statistic>
                </n-grid-item>
                <n-grid-item>
                    <n-statistic :label="t('merchantReports.txCount')">
                        {{ summary.tx_count.toLocaleString() }}
                    </n-statistic>
                </n-grid-item>
                <n-grid-item>
                    <n-statistic :label="t('merchantReports.totalBet')">
                        {{ summary.total_bet.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
                    </n-statistic>
                </n-grid-item>
                <n-grid-item>
                    <n-statistic :label="t('merchantReports.totalPayout')">
                        {{ summary.total_payout.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
                    </n-statistic>
                </n-grid-item>
                <n-grid-item>
                    <n-statistic :label="t('merchantReports.netWin')">
                        <template #default>
                            <span :class="summary.net_win >= 0 ? 'text-green-500' : 'text-red-500'">
                                {{ summary.net_win > 0 ? '+' : '' }}{{ summary.net_win.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
                            </span>
                        </template>
                    </n-statistic>
                </n-grid-item>
            </n-grid>
        </n-card>

        <n-data-table
            :columns="columns"
            :data="items"
            :loading="loading"
            :pagination="{ pageSize: 10 }"
            :row-key="(row: DailyReportItem) => row.key"
            striped
        />

        <TransactionDetailDrawer
            v-model:show="showDrawer"
            :date="selectedDate"
        />
    </div>
</template>
