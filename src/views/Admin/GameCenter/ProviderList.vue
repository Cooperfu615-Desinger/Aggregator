<script setup lang="ts">
import { ref, onMounted, h } from 'vue'
import { 
    NDataTable, NTag, NButton, NSwitch, useMessage 
} from 'naive-ui'
import { useI18n } from 'vue-i18n'
import type { DataTableColumns } from 'naive-ui'
import type { Provider } from '../../../types/provider'
import ProviderConfigModal from './components/ProviderConfigModal.vue'

const { t } = useI18n()
const message = useMessage()
const loading = ref(false)
const list = ref<Provider[]>([])
const showConfig = ref(false)
const currentProvider = ref<Provider | null>(null)

const fetchList = async () => {
    loading.value = true
    try {
        const res = await fetch('/api/v2/providers').then(r => r.json())
        if (res.code === 0) {
            list.value = res.data.list
        }
    } catch (e) {
        message.error('Failed to load providers')
    } finally {
        loading.value = false
    }
}

const handleStatusChange = async (row: Provider, newVal: boolean) => {
    // Optimistic UI update
    const oldStatus = row.status
    row.status = newVal ? 'active' : 'maintenance'
    
    try {
        const res = await fetch('/api/v2/providers/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: row.id, status: row.status })
        }).then(r => r.json())

        if (res.code === 0) {
            message.success(t('merchantConfig.saveSuccess'))
        } else {
            throw new Error(res.msg)
        }
    } catch (e) {
        row.status = oldStatus // Revert
        message.error('Failed to update status')
    }
}

const handleConfig = (row: Provider) => {
    currentProvider.value = row
    showConfig.value = true
}

const columns: DataTableColumns<Provider> = [
    {
        title: t('provider.name'),
        key: 'name',
        width: 200,
        render: (row) => row.name // Could add logo here
    },
    {
        title: t('provider.code'),
        key: 'code',
        width: 100,
        render: (row) => h(NTag, { type: 'default', size: 'small' }, { default: () => row.code.toUpperCase() })
    },
    {
        title: t('provider.type'),
        key: 'type',
        width: 120
    },
    {
        title: t('provider.status'),
        key: 'status',
        width: 150,
        render: (row) => h(NSwitch, {
            value: row.status === 'active',
            'onUpdate:value': (val: boolean) => handleStatusChange(row, val)
        }, {
            checked: () => t('status.active'),
            unchecked: () => t('status.maintenance')
        })
    },
    {
        title: t('common.action'),
        key: 'actions',
        width: 120,
        render: (row) => h(NButton, {
            size: 'small',
            onClick: () => handleConfig(row)
        }, { default: () => t('provider.config') })
    }
]

onMounted(() => {
    fetchList()
})
</script>

<template>
    <div class="p-6">
        <h1 class="text-2xl font-bold mb-4">{{ t('provider.title') }}</h1>
        
        <n-data-table
            :columns="columns"
            :data="list"
            :loading="loading"
            :pagination="false"
        />

        <provider-config-modal
            v-model:show="showConfig"
            :provider="currentProvider"
            @refresh="fetchList"
        />
    </div>
</template>
