<script setup lang="ts">
import { onMounted, h, computed } from 'vue'
import { NDataTable, NTag, NAlert, NButton } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { ref } from 'vue'

import type { DataTableColumns } from 'naive-ui'
import type { Merchant } from '../../../types/merchant'
import { useMerchantList } from '../../../composables/useMerchantList'
import CreateMerchantDrawer from './components/CreateMerchantDrawer.vue'
import ConfigMerchantDrawer from './components/ConfigMerchantDrawer.vue'
import MoneyText from '../../../components/Common/MoneyText.vue'
import StatusBadge from '../../../components/Common/StatusBadge.vue'

const { list, loading, error, fetchList } = useMerchantList()
const { t } = useI18n()

const showCreate = ref(false)
const showConfig = ref(false)
const currentMerchant = ref<Merchant | null>(null)

const handleConfig = (row: Merchant) => {
    currentMerchant.value = row
    showConfig.value = true
}

onMounted(() => {
  fetchList({ level: 1 }) // Default Level 1
})

const columns = computed<DataTableColumns<Merchant>>(() => [
    {
      title: '#',
      key: 'id',
      width: 60,
      render: (_, index) => index + 1
    },
    {
      title: t('merchant.merchantId'), // OP-xxxx
      key: 'display_id',
      width: 120,
      render: (row) => h(
        'span',
        { 
            class: 'font-mono cursor-pointer hover:text-primary',
            onClick: () => {
                navigator.clipboard.writeText(row.display_id || '')
                // optional: message.success('Copied')
            },
            title: 'Click to Copy'
        },
        row.display_id || `OP-${row.id}` // Fallback if mock hasn't updated yet? Mock should have it.
      )
    },
    {
      title: t('merchant.siteCodeLabel'), // Merchant Name (site_code)
      key: 'site_code',
      width: 150,
      render: (row) => h('span', { class: 'font-bold' }, row.site_code)
    },
    {
      title: t('merchant.walletType'),
      key: 'walletMode',
      width: 120,
      render(row) {
        return h(
          NTag,
          {
            color: row.walletMode === 'seamless' ? { color: '#f3e8ff', textColor: '#9333ea', borderColor: '#f3e8ff' } : undefined,
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
      render: (row) => h(NTag, { size: 'small', bordered: false }, { default: () => row.currency_type })
    },
    {
      title: t('merchant.revenueShare'),
      key: 'revenue_share',
      width: 120,
      align: 'right',
      render: (row) => `${(row.revenue_share || row.percent || 0).toFixed(2)}%`
    },
    {
      title: t('columns.balance'),
      key: 'balance',
      width: 150,
      align: 'right',
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
      width: 100,
      fixed: 'right',
      render: (row) => h(NButton, {
        size: 'small',
        onClick: () => handleConfig(row)
      }, { default: () => t('merchantConfig.config') })
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
  </div>
</template>
