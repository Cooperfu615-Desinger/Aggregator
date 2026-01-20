<script setup lang="ts">
import { onMounted, h, computed, ref } from 'vue'
import { NDataTable, NTag, NAlert, NButton, NSpace, NIcon } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { SettingsOutlined, SportsEsportsOutlined } from '@vicons/material'

import type { DataTableColumns } from 'naive-ui'
import type { Merchant } from '../../../types/merchant'
import { useMerchantList } from '../../../composables/useMerchantList'
import CreateMerchantDrawer from './components/CreateMerchantDrawer.vue'
import ConfigMerchantDrawer from './components/ConfigMerchantDrawer.vue'
import MerchantGameSettingsDrawer from './components/MerchantGameSettingsDrawer.vue'
import MoneyText from '../../../components/Common/MoneyText.vue'
import StatusBadge from '../../../components/Common/StatusBadge.vue'

const { list, loading, error, fetchList } = useMerchantList()
const { t } = useI18n()

const showCreate = ref(false)
const showConfig = ref(false)
const showGameSettings = ref(false)
const currentMerchant = ref<Merchant | null>(null)

const handleConfig = (row: Merchant) => {
    currentMerchant.value = row
    showConfig.value = true
}

const handleGameSettings = (row: Merchant) => {
    currentMerchant.value = row
    showGameSettings.value = true
}

onMounted(() => {
  fetchList({ level: 1 })
})

const columns = computed<DataTableColumns<Merchant>>(() => [
    {
      title: '#',
      key: 'id',
      width: 60,
      render: (_, index) => index + 1
    },
    {
      title: t('merchant.merchantId'),
      key: 'display_id',
      width: 120,
      sorter: (a, b) => (a.display_id || '').localeCompare(b.display_id || ''),
      render: (row) => h(
        'span',
        { 
            class: 'font-mono cursor-pointer hover:text-primary',
            onClick: () => {
                navigator.clipboard.writeText(row.display_id || '')
            },
            title: 'Click to Copy'
        },
        row.display_id || `OP-${row.id}`
      )
    },
    {
      title: t('merchant.siteCodeLabel'),
      key: 'site_code',
      width: 150,
      sorter: (a, b) => (a.site_code || '').localeCompare(b.site_code || ''),
      render: (row) => h('span', { class: 'font-bold' }, row.site_code)
    },
    {
      title: t('merchant.walletType'),
      key: 'walletMode',
      width: 120,
      sorter: (a, b) => (a.walletMode || '').localeCompare(b.walletMode || ''),
      render(row) {
        return h(
          NTag,
          {
            color: row.walletMode === 'seamless' ? { color: '#6b21a8', textColor: '#ffffff', borderColor: '#6b21a8' } : undefined,
            type: row.walletMode === 'transfer' ? 'info' : undefined,
            bordered: false,
            size: 'small'
          },
          { default: () => row.walletMode === 'seamless' ? t('merchant.seamless') : t('merchant.transfer') }
        )
      }
    },
    {
      title: t('merchant.currency'),
      key: 'currency_type',
      width: 100,
      sorter: (a, b) => (a.currency_type || '').localeCompare(b.currency_type || ''),
      render: (row) => h(NTag, { size: 'small', bordered: false }, { default: () => row.currency_type })
    },
    {
      title: t('merchant.revenueShare'),
      key: 'revenue_share',
      width: 120,
      align: 'right',
      sorter: (a, b) => (a.revenue_share || a.percent || 0) - (b.revenue_share || b.percent || 0),
      render: (row) => `${(row.revenue_share || row.percent || 0).toFixed(2)}%`
    },
    {
      title: t('columns.balance'),
      key: 'balance',
      width: 150,
      align: 'right',
      sorter: (a, b) => (a.balance || 0) - (b.balance || 0),
      render(row) {
        if (row.walletMode === 'transfer' && row.balance !== undefined) {
          return h(MoneyText, {
            value: row.balance,
            currency: row.currency_type || 'USD'
          })
        }
        return h('span', { class: 'text-gray-400' }, '-')
      }
    },
    {
      title: t('columns.state'),
      key: 'state',
      width: 100,
      align: 'center',
      sorter: (a, b) => (a.state || 0) - (b.state || 0),
      render(row) {
        return h(StatusBadge, {
          status: row.state === 1 ? 'Active' : 'Suspended'
        })
      }
    },
    {
      title: t('columns.createdAt'),
      key: 'created_at',
      width: 180,
      sorter: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      render(row) {
        return new Date(row.created_at).toLocaleString()
      }
    },
    {
      title: t('merchant.remarks'),
      key: 'remarks',
      width: 200,
      ellipsis: { tooltip: true },
      render: (row) => row.remarks || row.name || '-'
    },
    {
      title: t('common.action'),
      key: 'actions',
      width: 140,
      fixed: 'right',
      render: (row) => h(NSpace, { size: 'small' }, {
        default: () => [
            h(NButton, {
                size: 'small',
                secondary: true,
                onClick: () => handleConfig(row),
                title: t('merchantConfig.config')
            }, { icon: () => h(NIcon, null, { default: () => h(SettingsOutlined) }) }),
            h(NButton, {
                size: 'small',
                secondary: true,
                onClick: () => handleGameSettings(row),
                title: t('merchant.gameAuthorization')
            }, { icon: () => h(NIcon, null, { default: () => h(SportsEsportsOutlined) }) })
        ]
      })
    }
])
</script>

<template>
  <div class="p-6 space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">{{ t('merchant.listTitle') }}</h1>
      <n-button type="primary" @click="showCreate = true">
        + {{ t('merchant.create') }}
      </n-button>
    </div>

    <!-- Debug Alert -->
    <n-alert type="error" v-if="error" title="Data Load Error">
      {{ error }}
    </n-alert>

    <n-data-table
      :columns="columns"
      :data="list"
      :loading="loading"
      :pagination="false"
      class="mt-4"
    />

    <create-merchant-drawer
        v-model:show="showCreate"
        @refresh="fetchList"
    />

    <config-merchant-drawer
        v-model:show="showConfig"
        :merchant="currentMerchant"
        @refresh="fetchList"
    />

    <merchant-game-settings-drawer
        v-model:show="showGameSettings"
        :merchant="currentMerchant"
        @refresh="fetchList"
    />
  </div>
</template>
