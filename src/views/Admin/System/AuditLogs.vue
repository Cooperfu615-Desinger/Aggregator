<script setup lang="ts">
import { ref, onMounted, computed, h } from 'vue'
import { 
    NCard, NDataTable, NTag, NDrawer, NDrawerContent, NCode,
    type DataTableColumns 
} from 'naive-ui'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

interface AuditLog {
    id: string
    time: string
    operator: string
    action: string
    target: string
    ip: string
    changes: any
}

const logs = ref<AuditLog[]>([])
const loading = ref(false)
const showDetail = ref(false)
const selectedLog = ref<AuditLog | null>(null)

const columns = computed<DataTableColumns<AuditLog>>(() => [
    { title: t('system.time'), key: 'time' },
    { title: t('system.operator'), key: 'operator' },
    { 
        title: t('system.action'), 
        key: 'action',
        render: (row) => h(
            NTag, 
            { type: 'info', bordered: false, size: 'small' }, 
            { default: () => row.action }
        )
    },
    { title: t('system.target'), key: 'target' },
    { title: 'IP', key: 'ip' },
    {
        title: t('system.changes'),
        key: 'changes',
        render: (row) => h(
            'a', 
            { 
                class: 'text-blue-500 cursor-pointer hover:underline',
                onClick: () => viewDetail(row)
            }, 
            { default: () => 'View Detail' }
        )
    }
])

const fetchLogs = async () => {
    loading.value = true
    const res = await fetch('/api/v2/system/audit-logs')
    const data = await res.json()
    logs.value = data.data.list
    loading.value = false
}

const viewDetail = (row: AuditLog) => {
    selectedLog.value = row
    showDetail.value = true
}

onMounted(() => fetchLogs())
</script>

<template>
    <div class="p-6 space-y-4">
        <h1 class="text-2xl font-bold">{{ t('system.auditLogs') }}</h1>

        <n-card>
            <n-data-table 
                :columns="columns" 
                :data="logs" 
                :loading="loading" 
                :pagination="{ pageSize: 15 }"
            />
        </n-card>

        <n-drawer v-model:show="showDetail" :width="500">
            <n-drawer-content :title="t('system.changes')">
                <div v-if="selectedLog" class="space-y-4">
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div class="text-gray-500">Action ID</div>
                        <div>{{ selectedLog.id }}</div>
                        <div class="text-gray-500">Operator</div>
                        <div class="font-bold">{{ selectedLog.operator }}</div>
                        <div class="text-gray-500">Target</div>
                        <div>{{ selectedLog.target }}</div>
                    </div>
                    
                    <n-card :title="t('system.changes')" size="small" class="bg-gray-50/5">
                        <n-code :code="JSON.stringify(selectedLog.changes, null, 2)" language="json" />
                    </n-card>
                </div>
            </n-drawer-content>
        </n-drawer>
    </div>
</template>
