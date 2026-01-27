<script setup lang="ts">
import { ref, h, onMounted, computed, watch } from 'vue'
import {
  NCard, NDatePicker, NButton, NRadioGroup, NRadioButton,
  NDataTable, useMessage, NTag
} from 'naive-ui'
import { useI18n } from 'vue-i18n'
import type { DataTableColumns } from 'naive-ui'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent, DataZoomComponent } from 'echarts/components'
import type { FinancialReportItem } from '../../../types/report'
import { useSessionStorage } from '@vueuse/core'
import { format } from 'date-fns'

// Register ECharts modules
use([CanvasRenderer, LineChart, BarChart, GridComponent, TooltipComponent, LegendComponent, DataZoomComponent])

const message = useMessage()
const { t } = useI18n()
const loading = ref(false)
const reportData = ref<FinancialReportItem[]>([])

// QA Fix: State Persistence
const filter = useSessionStorage('master-financial-report-filter', {
    timeRange: [Date.now() - 30 * 24 * 3600 * 1000, Date.now()] as [number, number],
    groupBy: 'date' as 'date' | 'agent'
})

// Fetch Data
const fetchData = async () => {
    loading.value = true
    try {
        // QA Fix: Format dates
        let startTime = undefined
        let endTime = undefined
        if (filter.value.timeRange) {
            startTime = format(filter.value.timeRange[0], 'yyyy-MM-dd')
            endTime = format(filter.value.timeRange[1], 'yyyy-MM-dd')
        }

        const res = await fetch('/api/v2/report/financial', {
            method: 'POST',
            body: JSON.stringify({
                timeRange: filter.value.timeRange, // Keep for backward compat if needed, or remove
                startTime,
                endTime,
                groupBy: filter.value.groupBy
            })
        })
        const data = await res.json()
        if (data.code === 0) {
            reportData.value = data.data.list
        }
    } catch (e) {
        message.error('Failed to load financial report')
    } finally {
        loading.value = false
    }
}

        watch(() => filter.value.groupBy, () => {
    fetchData()
})

onMounted(() => {
    fetchData()
})

// Chart Option
const chartOption = computed(() => {
    return {
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' }
        },
        legend: {
            data: [t('dashboard.totalGGR'), t('report.betCount')],
            top: 0,
            right: 20
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: reportData.value.map(i => i.key),
            axisLabel: {
                rotate: filter.value.groupBy === 'agent' ? 45 : 0
            }
        },
        yAxis: [
            {
                type: 'value',
                name: t('dashboard.totalGGR'),
                axisLabel: { formatter: '{value}' }
            },
            {
                type: 'value',
                name: t('report.betCount'),
                position: 'right',
                alignTicks: true,
                axisLine: { show: true, lineStyle: { color: '#91cc75' } }
            }
        ],
        series: [
            {
                name: t('dashboard.totalGGR'),
                type: 'bar',
                data: reportData.value.map(i => i.ggr),
                itemStyle: {
                    color: (params: any) => {
                        return params.value >= 0 ? '#5470c6' : '#ee6666'
                    }
                }
            },
            {
                name: t('report.betCount'),
                type: 'line',
                yAxisIndex: 1,
                data: reportData.value.map(i => i.round_count),
                itemStyle: { color: '#91cc75' }
            }
        ]
    }
})

// Columns
const columns = computed<DataTableColumns<FinancialReportItem>>(() => [
    { 
        title: (_: any) => filter.value.groupBy === 'date' ? t('report.date') : t('report.agentName'), 
        key: 'key',
        sorter: (a, b) => a.key.localeCompare(b.key)
    },
    { 
        title: t('report.totalBet'), 
        key: 'total_bet', 
        align: 'right',
        sorter: (a, b) => a.total_bet - b.total_bet,
        render: row => row.total_bet.toLocaleString()
    },
    { 
        title: t('report.totalWin'), 
        key: 'total_win', 
        align: 'right',
        sorter: (a, b) => a.total_win - b.total_win,
        render: row => row.total_win.toLocaleString()
    },
    { 
        title: t('dashboard.totalGGR'), 
        key: 'ggr', 
        align: 'right',
        sorter: (a, b) => a.ggr - b.ggr,
        render: row => h(
            'span',
            { class: row.ggr >= 0 ? 'text-green-400 font-bold' : 'text-red-400 font-bold' },
            row.ggr.toLocaleString()
        )
    },
    { 
        title: t('game.rtp'), 
        key: 'rtp', 
        align: 'center',
        sorter: (a, b) => a.rtp - b.rtp,
        render: row => h(
            NTag,
            { type: row.rtp > 100 ? 'error' : row.rtp > 95 ? 'warning' : 'success', bordered: false },
            { default: () => row.rtp.toFixed(2) + '%' }
        )
    },
    { 
        title: t('report.rounds'), 
        key: 'round_count', 
        align: 'right',
        sorter: (a, b) => a.round_count - b.round_count,
        render: row => row.round_count.toLocaleString()
    }
])

const handleExport = () => {
    message.success(t('report.exportStarted'))
}
</script>

<template>
    <div class="p-6 space-y-4">
        <div class="flex justify-between items-center">
            <h1 class="text-2xl font-bold">{{ t('report.title') }}</h1>
            <n-button type="info" dashed @click="handleExport">{{ t('common.exportCSV') }}</n-button>
        </div>

        <n-card size="small">
            <div class="flex items-center gap-4 flex-wrap">
                <n-radio-group v-model:value="filter.groupBy">
                    <n-radio-button value="date">{{ t('report.byDate') }}</n-radio-button>
                    <n-radio-button value="agent">{{ t('report.byAgent') }}</n-radio-button>
                </n-radio-group>
                <div class="w-[1px] h-[24px] bg-gray-700 mx-2"></div>
                <n-date-picker 
                    v-model:value="filter.timeRange" 
                    type="daterange" 
                    clearable 
                />
                <n-button type="primary" @click="fetchData" :loading="loading">
                    {{ t('common.analyze') }}
                </n-button>
            </div>
        </n-card>

        <!-- Chart -->
        <n-card :title="t('report.revenueTrend')" size="small">
             <div class="h-[350px] w-full">
                 <v-chart :option="chartOption" autoresize />
             </div>
        </n-card>

        <!-- Data Table -->
        <n-data-table
            :columns="columns"
            :data="reportData"
            :loading="loading"
            :pagination="{ pageSize: 20 }"
            class="bg-[#18181c] rounded-lg mt-4"
        />
    </div>
</template>
