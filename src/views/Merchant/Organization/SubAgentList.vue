<script setup lang="ts">
import { ref, onMounted, computed, h } from 'vue'
import { NCard, NDataTable, NTag, NButton, useMessage } from 'naive-ui'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const message = useMessage()

interface SubAgent {
    id: number
    account: string
    level: number
    balance: number
    status: string
    created_at: string
}

const list = ref<SubAgent[]>([])
const loading = ref(false)

const columns = computed(() => [
    { title: 'ID', key: 'id' },
    { title: t('agent.account'), key: 'account' },
    { 
        title: t('agent.balance'), 
        key: 'balance',
        render: (row: SubAgent) => row.balance.toFixed(2)
    },
    { 
        title: t('agent.state'), 
        key: 'status',
        render: (row: SubAgent) => h(
            NTag,
            { type: row.status === 'active' ? 'success' : 'error', bordered: false },
            { default: () => row.status.toUpperCase() }
        )
    },
    { title: t('subAgents.created'), key: 'created_at' }
])

const fetchData = async () => {
    loading.value = true
    const res = await fetch('/api/v2/agent/sub-agents')
    const data = await res.json()
    list.value = data.data.list
    loading.value = false
}

const createSub = () => {
    message.info(t('subAgents.createPending'))
}

onMounted(() => fetchData())
</script>

<template>
    <div class="p-6 space-y-4">
        <div class="flex justify-between items-center">
            <h1 class="text-2xl font-bold">{{ t('subAgents.title') }}</h1>
            <n-button type="primary" @click="createSub">{{ t('subAgents.createSub') }}</n-button>
        </div>

        <n-card>
            <n-data-table 
                :columns="columns" 
                :data="list" 
                :loading="loading" 
            />
        </n-card>
    </div>
</template>
