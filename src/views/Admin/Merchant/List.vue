<script setup lang="ts">
import { onMounted, h, computed } from 'vue'
import { NDataTable, NTag, NAlert, NButton } from 'naive-ui'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

import type { DataTableColumns } from 'naive-ui'
import type { Merchant } from '../../../types/merchant'
import { useMerchantList } from '../../../composables/useMerchantList'
import MerchantConfigModal from './components/MerchantConfigModal.vue'
import { ref } from 'vue'

const { loading, list, error, fetchList } = useMerchantList()
const router = useRouter()
const { t } = useI18n()

const showConfig = ref(false)
const currentMerchantId = ref<number | null>(null)

const openConfig = (id: number) => {
    currentMerchantId.value = id
    showConfig.value = true
}

const handleViewSubs = (merchantId: number) => {
    // Navigate to sub-list or refetch with parent_id
    // Here we simply refetch with level=2 and parent_id for demo/simplicity
    // In a real app we might want breadcrumbs or drill-down UI
    // For this task Requirement: "Click View Subs -> Fetch Level 2+"
    fetchList({ level: 2, parent_id: merchantId })
}

onMounted(() => {
  fetchList({ level: 1 }) // Default Level 1
})

const columns = computed<DataTableColumns<Merchant>>(() => [
    {
      title: t('columns.id'),
      key: 'id',
      width: 80,
      sorter: (row1, row2) => row1.id - row2.id
    },
    {
      title: t('merchant.siteCodeLabel'), // Merchant Code
      key: 'site_code',
      width: 130,
      sorter: (row1, row2) => row1.site_code.localeCompare(row2.site_code)
    },
    {
      title: t('merchant.merchantId'), // Merchant ID
      key: 'account',
      width: 150,
      sorter: (row1, row2) => row1.account.localeCompare(row2.account)
    },
    {
      title: t('merchant.name'),
      key: 'name',
      width: 180,
      sorter: (row1, row2) => row1.name.localeCompare(row2.name)
    },
    {
      title: t('merchantConfig.walletMode'),
      key: 'walletMode',
      width: 120,
      render(row) {
        return h(
          NTag,
          {
            type: row.walletMode === 'seamless' ? 'success' : 'info',
            bordered: false,
            size: 'small'
          },
          { default: () => row.walletMode === 'seamless' ? t('merchantConfig.seamless') : t('merchantConfig.transfer') }
        )
      }
    },
    {
      title: t('merchant.currency'),
      key: 'currency_type',
      width: 130,
      sorter: (row1, row2) => row1.currency_type.localeCompare(row2.currency_type)
    },
    {
      title: t('agent.percent'),
      key: 'percent',
      width: 100,
      sorter: (row1, row2) => row1.percent - row2.percent,
      render(row) {
        return `${row.percent}%`
      }
    },
    {
      title: t('columns.state'),
      key: 'state',
      width: 100,
      sorter: (row1, row2) => row1.state - row2.state,
      render(row) {
        return h(
          NTag,
          {
            type: row.state === 1 ? 'success' : 'error',
            bordered: false
          },
          {
            default: () => (row.state === 1 ? t('status.active') : t('status.inactive'))
          }
        )
      }
    },
    {
      title: t('columns.createdAt'),
      key: 'created_at',
      width: 200,
      sorter: (row1, row2) => new Date(row1.created_at).getTime() - new Date(row2.created_at).getTime(),
      render(row) {
        return new Date(row.created_at).toLocaleString()
      }
    },
    {
      title: t('agent.actions'),
      key: 'actions',
      render(row) {
        return [
          h(
            NButton,
            {
              size: 'small',
              type: 'default',
              class: 'mr-2',
              onClick: () => handleViewSubs(row.id)
            },
            { default: () => t('merchant.viewSubs') }
          ),
          h(
            NButton,
            {
              size: 'small',
              type: 'primary',
              secondary: true,
              onClick: () => openConfig(row.id)
            },
            { default: () => t('merchant.config') }
          )
        ]
      }
    }
])


</script>

<template>
  <div class="p-6 space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">{{ t('merchant.listTitle') }}</h1>
      <n-button type="primary" @click="router.push('/merchant/create')">
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

    <merchant-config-modal 
        v-model:show="showConfig" 
        :merchant-id="currentMerchantId"
        @refresh="fetchList"
    />
  </div>
</template>
