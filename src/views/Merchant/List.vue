<script setup lang="ts">
import { onMounted, h } from 'vue'
import { NDataTable, NTag, NAlert, NButton } from 'naive-ui'
import { useRouter } from 'vue-router'
import type { DataTableColumns } from 'naive-ui'
import type { Merchant } from '../../types/merchant'
import { useMerchantList } from '../../composables/useMerchantList'

const { loading, list, error, fetchList } = useMerchantList()
const router = useRouter()

onMounted(() => {
  fetchList()
})

const createColumns = (): DataTableColumns<Merchant> => {
  return [
    {
      title: 'ID',
      key: 'id',
      width: 80,
      sorter: (row1, row2) => row1.id - row2.id
    },
    {
      title: 'Site Code',
      key: 'site_code',
      width: 130,
      sorter: (row1, row2) => row1.site_code.localeCompare(row2.site_code)
    },
    {
      title: 'Account',
      key: 'account',
      width: 150,
      sorter: (row1, row2) => row1.account.localeCompare(row2.account)
    },
    {
      title: 'Name',
      key: 'name',
      width: 180,
      sorter: (row1, row2) => row1.name.localeCompare(row2.name)
    },
    {
      title: 'Currency',
      key: 'currency_type',
      width: 130,
      sorter: (row1, row2) => row1.currency_type.localeCompare(row2.currency_type)
    },
    {
      title: 'Percent',
      key: 'percent',
      width: 100,
      sorter: (row1, row2) => row1.percent - row2.percent,
      render(row) {
        return `${row.percent}%`
      }
    },
    {
      title: 'Status',
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
            default: () => (row.state === 1 ? 'Active' : 'Inactive')
          }
        )
      }
    },
    {
      title: 'Created At',
      key: 'created_at',
      width: 200,
      sorter: (row1, row2) => new Date(row1.created_at).getTime() - new Date(row2.created_at).getTime(),
      render(row) {
        return new Date(row.created_at).toLocaleString()
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render(row) {
        return h(
          NButton,
          {
            size: 'small',
            type: 'primary',
            secondary: true,
            onClick: () => router.push(`/merchant/config/${row.id}`)
          },
          { default: () => 'Config' }
        )
      }
    }
  ]
}

const columns = createColumns()
</script>

<template>
  <div class="p-6 space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">商戶列表 (Merchant List)</h1>
      <n-button type="primary" @click="router.push('/merchant/create')">
        + Create Merchant
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
  </div>
</template>
