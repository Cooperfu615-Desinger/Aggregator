<template>
  <div class="p-6 space-y-8">
    <!-- Top Layer: KPI Cards (Full Width) -->
    <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
      <n-card class="border-l-4 border-green-500">
        <div class="text-sm text-gray-400 mb-1">{{ t('merchantDashboard.kpi.bet') }}</div>
        <div class="text-2xl font-bold"><MoneyText :value="stats.today_kpi.total_bet" :currency="stats.wallet.currency" /></div>
        <TrendValue :value="stats.today_kpi.comparison.bet_pct" class="mt-1" />
      </n-card>
      <n-card class="border-l-4 border-red-500">
        <div class="text-sm text-gray-400 mb-1">{{ t('merchantDashboard.kpi.win') }}</div>
        <div class="text-2xl font-bold"><MoneyText :value="stats.today_kpi.net_win" :currency="stats.wallet.currency" /></div>
        <TrendValue :value="stats.today_kpi.comparison.win_pct" class="mt-1" />
      </n-card>
      <n-card class="border-l-4 border-purple-500">
        <div class="text-sm text-gray-400 mb-1">{{ t('merchantDashboard.kpi.players') }}</div>
        <div class="text-2xl font-bold">{{ stats.today_kpi.active_players.toLocaleString() }}</div>
        <TrendValue :value="stats.today_kpi.comparison.player_pct" class="mt-1" />
      </n-card>
      <n-card class="border-l-4 border-amber-500">
        <div class="text-sm text-gray-400 mb-1">{{ t('merchantDashboard.kpi.tx') }}</div>
        <div class="text-2xl font-bold">{{ stats.today_kpi.tx_count.toLocaleString() }}</div>
      </n-card>
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
          <n-alert v-for="alert in stats.alerts" :key="alert.type" :type="alert.type === 'invoice' ? 'warning' : 'error'" class="mb-2">
            <div class="flex items-center justify-between">
              <span>{{ alert.message }}</span>
              <n-button text size="small" @click="onProcessAlert(alert)">{{ t('merchantDashboard.actions.processAlert') }}</n-button>
            </div>
          </n-alert>
        </div>
      </n-card>
      <n-card :title="t('merchantDashboard.topGames')">
        <div class="flex justify-between items-center px-4 py-2 bg-gray-800 text-xs text-gray-400 font-medium rounded-t border-b border-gray-700">
          <div>遊戲名稱</div>
          <div>總投注 / 總盈虧</div>
        </div>
        <n-list>
          <n-list-item v-for="game in stats.top_games" :key="game.name">
            <div class="flex justify-between items-center">
              <div class="font-medium">{{ game.name }}</div>
              <div class="text-sm">
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
import { useRouter } from 'vue-router'
import { NCard, NButton, NAlert, NList, NListItem, NSkeleton } from 'naive-ui'
import VChart from 'vue-echarts'
import MoneyText from '../../../components/Common/MoneyText.vue'
import TrendValue from '../../../components/Common/TrendValue.vue'

const { t } = useI18n()
const router = useRouter()

const loading = ref(true)
const loadingAlerts = ref(true)
const stats = ref<any>({
  wallet: { balance: 0, credit_limit: 0, currency: 'USD' },
  today_kpi: { total_bet: 0, net_win: 0, active_players: 0, tx_count: 0, comparison: { bet_pct: 0, win_pct: 0, player_pct: 0 } },
  trend_7d: [],
  alerts: [],
  top_games: []
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

function onProcessAlert(alert: any) {
  if (alert.type === 'invoice') {
    router.push('/merchant/finance/invoices')
  } else if (alert.type === 'reject') {
    router.push('/merchant/finance/funds')
  }
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
