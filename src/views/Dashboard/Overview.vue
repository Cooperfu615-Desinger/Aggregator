<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { 
  NCard, NGrid, NGridItem, NStatistic, NButton, 
  useMessage, NTag, NSkeleton
} from 'naive-ui'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'

// ECharts Composition
use([CanvasRenderer, LineChart, GridComponent, TooltipComponent, LegendComponent])

const router = useRouter()
const message = useMessage()
const { t } = useI18n()
const loading = ref(true)

// Data State
const stats = ref({
    total_bet: 0,
    total_ggr: 0,
    rtp: 0,
    active_players: 0,
    trend: [] as any[]
})

// Chart Option Computed
const chartOption = computed(() => ({
    tooltip: { trigger: 'axis' },
    legend: { data: [t('dashboard.totalGGR'), t('dashboard.totalBet')], textStyle: { color: '#ccc' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { 
        type: 'category', 
        data: stats.value.trend.map(t => t.date),
        axisLine: { lineStyle: { color: '#555' } }
    },
    yAxis: { 
        type: 'value',
        axisLine: { lineStyle: { color: '#555' } },
        splitLine: { lineStyle: { color: '#333' } }
    },
    series: [
        {
            name: t('dashboard.totalGGR'),
            type: 'line',
            data: stats.value.trend.map(t => t.ggr),
            smooth: true,
            itemStyle: { color: '#63e2b7' },
            areaStyle: { opacity: 0.1, color: '#63e2b7' }
        },
        {
            name: t('dashboard.totalBet'),
            type: 'line',
            data: stats.value.trend.map(t => t.bet),
            smooth: true,
            itemStyle: { color: '#70c0e8' }
        }
    ]
}))

const fetchDashboard = async () => {
    try {
        const res = await fetch('/api/v2/report/dashboard')
        const data = await res.json()
        if (data.code === 0) {
            stats.value = data.data
        }
    } catch (e) {
        message.error('Failed to load dashboard data')
    } finally {
        loading.value = false
    }
}

onMounted(() => {
    fetchDashboard()
})
</script>

<template>
  <div class="p-6 space-y-6">
    <div class="flex items-center justify-between">
       <h1 class="text-2xl font-bold">{{ t('dashboard.title') }} ({{ t('dashboard.warRoom') }})</h1>
       <n-tag type="info" size="small" bordered>{{ t('dashboard.realTime') }}</n-tag>
    </div>

    <!-- Top Row: Metrics -->
    <n-grid x-gap="12" y-gap="12" cols="1 s:2 m:4" responsive="screen">
        <n-grid-item>
            <n-card size="small">
                <n-statistic :label="t('dashboard.totalBet')" :value="stats.total_bet">
                    <template #prefix>$</template>
                </n-statistic>
            </n-card>
        </n-grid-item>
        <n-grid-item>
             <n-card size="small" class="border-green-500/30">
                <n-statistic :label="t('dashboard.totalGGR')" :value="stats.total_ggr">
                    <template #prefix>$</template>
                    <template #suffix>
                         <span class="text-xs text-green-400 ml-2">({{ t('dashboard.net') }})</span>
                    </template>
                </n-statistic>
            </n-card>
        </n-grid-item>
        <n-grid-item>
             <n-card size="small">
                <n-statistic :label="t('dashboard.rtp')" :value="stats.rtp">
                    <template #suffix>%</template>
                    <template #prefix>
                         <div :class="{'text-red-500': stats.rtp > 100, 'text-green-500': stats.rtp < 95, 'text-gray-200': stats.rtp >= 95 && stats.rtp <= 100}">
                            ●
                         </div>
                    </template>
                </n-statistic>
            </n-card>
        </n-grid-item>
        <n-grid-item>
             <n-card size="small">
                <n-statistic :label="t('dashboard.activePlayers')" :value="stats.active_players">
                    <template #suffix>{{ t('dashboard.online') }}</template>
                </n-statistic>
            </n-card>
        </n-grid-item>
    </n-grid>

    <!-- Middle Row: Charts -->
    <n-card :title="t('dashboard.revenueTrend')">
        <div class="h-[350px] w-full">
            <n-skeleton v-if="loading" text :repeat="5" />
            <v-chart v-else class="chart" :option="chartOption" autoresize />
        </div>
    </n-card>

    <!-- Bottom Row: Quick Nav -->
    <n-grid x-gap="12" cols="1 s:2" responsive="screen">
        <n-grid-item>
             <n-button block size="large" secondary @click="router.push('/merchant/list')">
                Manage Merchants
             </n-button>
        </n-grid-item>
        <n-grid-item>
             <n-button block size="large" secondary @click="router.push('/data-center/bet-log')">
                Search Round Logs
             </n-button>
        </n-grid-item>
    </n-grid>
  </div>
</template>

<style scoped>
.chart {
  height: 100%;
  width: 100%;
}
</style>
