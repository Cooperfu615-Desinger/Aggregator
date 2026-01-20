<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { NCard, NGrid, NGridItem, NTag, NSkeleton } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import MoneyText from '../../../components/Common/MoneyText.vue'

use([CanvasRenderer, LineChart, GridComponent, TooltipComponent])

const { t } = useI18n()

const loading = ref(true)
const stats = ref<any>({
    balance: 0,
    currency: 'USD',
    wallet_mode: 'transfer',
    today_ggr: 0,
    yesterday_ggr: 0,
    active_players: 0,
    total_games: 0,
    chart_data: []
})

const chartOption = computed(() => ({
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
        type: 'category',
        boundaryGap: false,
        data: stats.value.chart_data.map((i: any) => i.date),
        axisLine: { lineStyle: { color: '#94a3b8' } }
    },
    yAxis: { 
        type: 'value',
        axisLine: { lineStyle: { color: '#94a3b8' } },
        splitLine: { lineStyle: { color: '#e2e8f0' } }
    },
    series: [
        {
            name: 'GGR',
            type: 'line',
            data: stats.value.chart_data.map((i: any) => i.ggr),
            areaStyle: { 
                opacity: 0.2,
                color: {
                    type: 'linear',
                    x: 0, y: 0, x2: 0, y2: 1,
                    colorStops: [
                        { offset: 0, color: '#10b981' },
                        { offset: 1, color: 'rgba(16, 185, 129, 0)' }
                    ]
                }
            },
            smooth: true,
            itemStyle: { color: '#10b981' },
            lineStyle: { width: 3 }
        }
    ]
}))

onMounted(async () => {
    try {
        const res = await fetch('/api/v2/agent/stats')
        const data = await res.json()
        if (data.code === 0) {
            stats.value = { ...stats.value, ...data.data }
        }
    } finally {
        loading.value = false
    }
})
</script>

<template>
    <div class="p-6 space-y-6">
        <div class="flex items-center justify-between">
            <h1 class="text-2xl font-bold flex items-center gap-2">
                <span>📊</span> {{ t('dashboard.title') }}
            </h1>
            <n-tag type="info" size="small">
                {{ stats.wallet_mode === 'transfer' ? t('dashboard.transferWallet') : t('dashboard.seamless') }}
            </n-tag>
        </div>


            <!-- KPI Cards -->
            <n-grid :x-gap="16" :y-gap="16" cols="1 s:2 m:4" responsive="screen" class="mb-6">
                <!-- Balance (Transfer mode only) -->
                <n-grid-item v-if="stats.wallet_mode === 'transfer'">
                    <n-card class="border-l-4 border-blue-500">
                        <div class="text-sm text-gray-400 mb-1">{{ t('dashboard.myBalance') }}</div>
                        <div v-if="loading" class="h-10 flex items-center">
                            <n-skeleton text width="60%" />
                        </div>
                        <div v-else class="text-2xl font-bold">
                            <MoneyText :value="stats.balance" :currency="stats.currency" />
                        </div>
                    </n-card>
                </n-grid-item>

                <!-- Today GGR -->
                <n-grid-item>
                    <n-card :class="stats.today_ggr >= 0 ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'">
                        <div class="text-sm text-gray-400 mb-1">{{ t('dashboard.todayGgr') }}</div>
                        <div v-if="loading" class="h-10 flex items-center">
                            <n-skeleton text width="60%" />
                        </div>
                        <template v-else>
                            <div class="text-2xl font-bold">
                                <MoneyText :value="stats.today_ggr" :currency="stats.currency" />
                            </div>
                            <div class="text-xs text-gray-400 mt-1">
                                {{ t('dashboard.yesterday') }}: <MoneyText :value="stats.yesterday_ggr" :currency="stats.currency" />
                            </div>
                        </template>
                    </n-card>
                </n-grid-item>

                <!-- Active Players -->
                <n-grid-item>
                    <n-card class="border-l-4 border-purple-500">
                        <div class="text-sm text-gray-400 mb-1">{{ t('dashboard.activePlayers') }}</div>
                        <div v-if="loading" class="h-10 flex items-center">
                            <n-skeleton text width="60%" />
                        </div>
                        <template v-else>
                            <div class="text-2xl font-bold">
                                {{ stats.active_players?.toLocaleString() }}
                            </div>
                            <div class="text-xs text-gray-400 mt-1">{{ t('dashboard.last24h') }}</div>
                        </template>
                    </n-card>
                </n-grid-item>

                <!-- Enabled Games -->
                <n-grid-item>
                    <n-card class="border-l-4 border-amber-500">
                        <div class="text-sm text-gray-400 mb-1">{{ t('dashboard.enabledGames') }}</div>
                        <div v-if="loading" class="h-10 flex items-center">
                            <n-skeleton text width="60%" />
                        </div>
                        <template v-else>
                            <div class="text-2xl font-bold">
                                {{ stats.total_games }}
                            </div>
                            <div class="text-xs text-gray-400 mt-1">{{ t('dashboard.acrossAllProviders') }}</div>
                        </template>
                    </n-card>
                </n-grid-item>
            </n-grid>

            <!-- GGR Trend Chart -->
            <n-card :title="t('dashboard.ggrTrend')">
                <div class="h-[350px]">
                    <n-skeleton v-if="loading" text :repeat="5" />
                    <v-chart v-else class="chart" :option="chartOption" theme="dark" :style="{ backgroundColor: 'transparent' }" autoresize />
                </div>
            </n-card>

    </div>
</template>

<style scoped>
.chart {
    height: 100%;
    width: 100%;
}
</style>
