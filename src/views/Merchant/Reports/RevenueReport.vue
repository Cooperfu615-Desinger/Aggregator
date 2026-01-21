<script setup lang="ts">
import { ref, onMounted, h } from 'vue'
import { 
    NCard, NStatistic, NGrid, NGridItem, NDataTable, NButton, NTag, useMessage, NDatePicker
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import TransactionDetailDrawer from './components/TransactionDetailDrawer.vue'

const { t } = useI18n()
const message = useMessage()
const loading = ref(false)

// State
const dateRange = ref<[number, number]>([
    new Date().setDate(new Date().getDate() - 30),
    new Date().getTime()
])

interface DailyReportItem {
    key?: string
    date: string
    tx_count: number
    total_bet: number
    total_payout: number
    net_win: number
    rtp: number
    children?: DailyReportItem[]
}

const items = ref<DailyReportItem[]>([])
const summary = ref({
    total_bet: 0,
    total_payout: 0,
    net_win: 0,
    tx_count: 0,
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

const columns: DataTableColumns<DailyReportItem> = [
    {
        title: t('merchantReports.dailySummary'), // Date or Category
        key: 'date',
        width: 180,
        render: (row: any) => {
            // Check if it's a category row (has no children but is a child of a date row strictly in this context? 
            // Actually our data structure: DateRow has children. CategoryRow has NO children.
            // If row has children -> It's a Date row.
            // If row has NO children -> It's a Category row.
            
            // Wait, we need a better way to distinguish.
            // In our mock data:
            // Date row: { key: '2023-01-01', date: '2023-01-01', children: [...] }
            // Category row: { key: '2023-01-01-Slot', date: 'Slot', ... } (We put category name in 'date' field in mock)

            if (row.children) {
                return row.date 
            } else {
                // It's a category. Translate it.
                return t(`merchantReports.${row.date}`)
            }
        }
    },
    {
        title: t('merchantReports.txCount'),
        key: 'tx_count',
        align: 'right',
        render: (row: any) => row.children ? row.tx_count : '-'
    },
    {
        title: t('merchantReports.totalBet'),
        key: 'total_bet',
        align: 'right',
        render: (row) => row.total_bet.toFixed(2)
    },
    {
        title: t('merchantReports.totalPayout'),
        key: 'total_payout',
        align: 'right',
        render: (row) => row.total_payout.toFixed(2)
    },
    {
        title: t('merchantReports.netWin'),
        key: 'net_win',
        align: 'right',
        render: (row) => {
            const val = row.net_win
            return h(
                'span',
                { class: val >= 0 ? 'text-green-500 font-bold' : 'text-red-500 font-bold' },
                val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2)
            )
        }
    },
    {
        title: t('merchantReports.rtp'), // Changed Title
        key: 'rtp',
        align: 'right',
        render: (row: any) => {
            // Only show RTP for Category rows (no children)
            if (!row.children) {
                 return h(
                    NTag,
                    { type: row.rtp > 100 ? 'error' : 'success', bordered: false, size: 'small' },
                    { default: () => `${row.rtp}%` }
                )
            }
            return '' // Parent (Date) row shows nothing
        }
    },
    {
        title: '',
        key: 'actions',
        width: 100,
        render: (row: any) => {
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
                    { default: () => t('merchantReports.viewDetails') }
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
            <n-date-picker 
                v-model:value="dateRange" 
                type="daterange" 
                clearable 
                @update:value="fetchData" 
            />
        </div>

        <!-- Summary Cards -->
        <n-card :title="t('merchantReports.summaryTitle')" size="small">
            <n-grid :cols="4" gap="12">
                <n-grid-item>
                    <n-statistic :label="t('merchantReports.totalBet')">
                        {{ summary.total_bet.toLocaleString() }}
                    </n-statistic>
                </n-grid-item>
                <n-grid-item>
                    <n-statistic :label="t('merchantReports.totalPayout')">
                        {{ summary.total_payout.toLocaleString() }}
                    </n-statistic>
                </n-grid-item>
                <n-grid-item>
                    <n-statistic :label="t('merchantReports.netWin')">
                        <template #default>
                            <span :class="summary.net_win >= 0 ? 'text-green-500' : 'text-red-500'">
                                {{ summary.net_win > 0 ? '+' : '' }}{{ summary.net_win.toLocaleString() }}
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
            :row-key="(row: any) => row.key"
            striped
        />

        <TransactionDetailDrawer
            v-model:show="showDrawer"
            :date="selectedDate"
        />
    </div>
</template>
