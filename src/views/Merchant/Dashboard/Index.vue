<template>
  <div class="p-6 space-y-8">
    <!-- Top Layer: Wallet and KPI -->
    <div class="flex flex-col md:flex-row md:justify-between gap-6">
      <!-- Wallet Info -->
      <n-card class="flex-1" :title="t('merchantDashboard.walletTitle')">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm text-gray-400 mb-1">{{ t('merchantDashboard.myBalance') }}</div>
            <div class="text-2xl font-bold">
              <MoneyText :value="stats.wallet.balance" :currency="stats.wallet.currency" />
            </div>
          </div>
          <n-button type="primary" size="small" @click="onTopUp">{{ t('merchantDashboard.actions.topUp') }}</n-button>
        </div>
        <div class="mt-4">
          <div class="text-sm text-gray-400 mb-1">{{ t('merchantDashboard.creditUsage') }}</div>
          <n-progress :percentage="creditUsage" />
          <div class="text-xs text-gray-500 mt-1">{{ stats.wallet.credit_limit }} {{ stats.wallet.currency }}</div>
        </div>
      </n-card>
      <!-- KPI Cards -->
      <div class="grid grid-cols-2 gap-4 md:grid-cols-4 flex-1">
        <n-card class="border-l-4 border-green-500">
          <div class="text-sm text-gray-400 mb-1">{{ t('merchantDashboard.kpi.bet') }}</div>
          <div class="text-2xl font-bold"><MoneyText :value="stats.today_kpi.total_bet" :currency="stats.wallet.currency" /></div>
          <div class="text-xs text-gray-400 mt-1">{{ formatPct(stats.today_kpi.comparison.bet_pct) }}</div>
        </n-card>
        <n-card class="border-l-4 border-red-500">
          <div class="text-sm text-gray-400 mb-1">{{ t('merchantDashboard.kpi.win') }}</div>
          <div class="text-2xl font-bold"><MoneyText :value="stats.today_kpi.net_win" :currency="stats.wallet.currency" /></div>
          <div class="text-xs text-gray-400 mt-1">{{ formatPct(stats.today_kpi.comparison.win_pct) }}</div>
        </n-card>
        <n-card class="border-l-4 border-purple-500">
          <div class="text-sm text-gray-400 mb-1">{{ t('merchantDashboard.kpi.players') }}</div>
          <div class="text-2xl font-bold">{{ stats.today_kpi.active_players }}</div>
          <div class="text-xs text-gray-400 mt-1">{{ formatPct(stats.today_kpi.comparison.player_pct) }}</div>
        </n-card>
        <n-card class="border-l-4 border-amber-500">
          <div class="text-sm text-gray-400 mb-1">{{ t('merchantDashboard.kpi.tx') }}</div>
          <div class="text-2xl font-bold">{{ stats.today_kpi.tx_count }}</div>
        </n-card>
      </div>
    </div>

    <!-- Middle Layer: Trend Chart -->
    <n-card :title="t('merchantDashboard.revenueTrend')">
      <div class="h-[350px]">
        <v-chart :option="chartOption" theme="dark" autoresize />
      </div>
    </n-card>

    <!-- Bottom Layer: Alerts and Top Games -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <n-card :title="t('merchantDashboard.alerts')">
        <div v-if="loadingAlerts" class="space-y-2">
          <n-skeleton text :repeat="3" />
        </div>
        <div v-else>
          <n-alert v-for="alert in stats.alerts" :type="alert.type" class="mb-2">
            {{ alert.message }}
            <template #action>
              <n-button text size="small" @click="onProcessAlert(alert)">{{ t('merchantDashboard.quickActions') }}</n-button>
            </template>
          </n-alert>
        </div>
      </n-card>
      <n-card :title="t('merchantDashboard.topGames')">
        <n-list>
          <n-list-item v-for="game in stats.top_games" :key="game.name">
            <div class="flex justify-between items-center">
              <div>{{ game.name }}</div>
              <div class="text-sm text-gray-500">
                <MoneyText :value="game.bet" :currency="stats.wallet.currency" /> / <MoneyText :value="game.win" :currency="stats.wallet.currency" />
              </div>
            </div>
          </n-list-item>
        </n-list>
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { NCard, NButton, NProgress, NAlert, NList, NListItem, NSkeleton } from 'naive-ui'
import VChart from 'vue-echarts'
import MoneyText from '../../../components/Common/MoneyText.vue'

const { t } = useI18n()

const loading = ref(true)
const loadingAlerts = ref(true)
const stats = ref<any>({
  wallet: { balance: 0, credit_limit: 0, currency: 'USD' },
  today_kpi: { total_bet: 0, net_win: 0, active_players: 0, tx_count: 0, comparison: { bet_pct: 0, win_pct: 0, player_pct: 0 } },
  trend_7d: [],
  alerts: [],
  top_games: []
})

const creditUsage = computed(() => {
  const { balance, credit_limit } = stats.value.wallet
  return credit_limit ? Math.min(100, (balance / credit_limit) * 100) : 0
})

const chartOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: stats.value.trend_7d.map((i: any) => i.date) },
  yAxis: { type: 'value' },
  series: [
    { name: t('merchantDashboard.kpi.bet'), type: 'line', data: stats.value.trend_7d.map((i: any) => i.bet) },
    { name: t('merchantDashboard.kpi.win'), type: 'line', data: stats.value.trend_7d.map((i: any) => i.net_win) }
  ]
}))

function formatPct(value: number) {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

function onTopUp() {
  // Placeholder for top‑up modal trigger
  console.log('Top Up clicked')
}

function onProcessAlert(alert: any) {
  // Placeholder for alert processing navigation
  console.log('Process alert', alert)
}

onMounted(async () => {
  try {
    const res = await fetch('/api/v2/merchant/dashboard/stats')
    const data = await res.json()
    if (data.code === 0) {
      stats.value = data.data
    }
  } finally {
    loading.value = false
    loadingAlerts.value = false
  }
})
</script>

<style scoped>
.chart { height: 100%; width: 100%; }
</style>
