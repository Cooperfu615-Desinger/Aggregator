<script setup lang="ts">
import { ref, onMounted, h } from 'vue'
import { 
    NDataTable, NTag, NButton, useMessage, NSpace
} from 'naive-ui'
import { useI18n } from 'vue-i18n'
import type { DataTableColumns } from 'naive-ui'
import type { Provider } from '../../../types/provider'
import ProviderConfigModal from './components/ProviderConfigModal.vue'
import StatusSwitch from '../../../components/Common/StatusSwitch.vue'

const { t } = useI18n()
const message = useMessage()
const loading = ref(false)
const list = ref<Provider[]>([])
const showConfig = ref(false)
const currentProvider = ref<Provider | null>(null)

// Track switch states for each provider
const switchStates = ref<Record<number, boolean>>({})

const fetchList = async () => {
    loading.value = true
    try {
        const res = await fetch('/api/v2/providers').then(r => r.json())
        if (res.code === 0) {
            list.value = res.data.list
            // Initialize switch states
            list.value.forEach(provider => {
                switchStates.value[provider.id] = provider.status === 'active'
            })
        }
    } catch (e) {
        message.error('Failed to load providers')
    } finally {
        loading.value = false
    }
}

const handleStatusConfirm = async (row: Provider, newVal: boolean) => {
    const oldStatus = row.status
    row.status = newVal ? 'active' : 'maintenance'
    switchStates.value[row.id] = newVal
    
    try {
        const res = await fetch('/api/v2/providers/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: row.id, status: row.status })
        }).then(r => r.json())

        if (res.code === 0) {
            message.success(newVal ? 'Provider enabled' : 'Provider set to maintenance mode')
        } else {
            throw new Error(res.msg)
        }
    } catch (e) {
        row.status = oldStatus
        switchStates.value[row.id] = oldStatus === 'active'
        message.error('Failed to update status')
    }
}

const handleConfig = (row: Provider) => {
    currentProvider.value = row
    showConfig.value = true
}

const columns: DataTableColumns<Provider> = [
    {
        title: 'Logo',
        key: 'logo',
        width: 80,
        render: (row) => h('div', { 
            class: 'w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center text-xl font-bold'
        }, row.code.charAt(0).toUpperCase())
    },
    {
        title: t('provider.name'),
        key: 'name',
        width: 180,
        render: (row) => h('div', {}, [
            h('div', { class: 'font-medium' }, row.name),
            h('div', { class: 'text-xs text-gray-500' }, row.type)
        ])
    },
    {
        title: t('provider.code'),
        key: 'code',
        width: 100,
        render: (row) => h(NTag, { type: 'default', size: 'small', class: 'font-mono' }, { default: () => row.code.toUpperCase() })
    },
    {
        title: 'Game Count',
        key: 'gameCount',
        width: 120,
        render: (row) => h('span', { class: 'font-mono' }, row.gameCount || '—')
    },
    {
        title: t('provider.status'),
        key: 'status',
        width: 180,
        render: (row) => h(StatusSwitch, {
            value: switchStates.value[row.id] ?? (row.status === 'active'),
            warningMessage: `Are you sure you want to disable ${row.name}? This will affect all merchants using this provider.`,
            warningTitle: '⚠️ Disable Provider',
            'onUpdate:value': (val: boolean) => {
                switchStates.value[row.id] = val
            },
            onConfirm: (val: boolean) => handleStatusConfirm(row, val)
        }, {
            checked: () => 'Active',
            unchecked: () => 'Maintenance'
        })
    },
    {
        title: t('common.action'),
        key: 'actions',
        width: 120,
        render: (row) => h(NSpace, { size: 'small' }, {
            default: () => [
                h(NButton, {
                    size: 'small',
                    onClick: () => handleConfig(row)
                }, { default: () => '⚙️ Config' })
            ]
        })
    }
]

onMounted(() => {
    fetchList()
})
</script>

<template>
    <div class="p-6">
        <div class="flex items-center justify-between mb-6">
            <h1 class="text-2xl font-bold flex items-center gap-2">
                <span>🏢</span> {{ t('provider.title') }}
            </h1>
            <n-tag type="info" size="small">
                {{ list.length }} Providers
            </n-tag>
        </div>
        
        <n-data-table
            :columns="columns"
            :data="list"
            :loading="loading"
            :pagination="false"
            :bordered="false"
            striped
        />

        <provider-config-modal
            v-model:show="showConfig"
            :provider="currentProvider"
            @refresh="fetchList"
        />
    </div>
</template>
