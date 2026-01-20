<script setup lang="ts">
import { ref, onMounted, computed, h } from 'vue'
import { 
    NCard, NButton, NDataTable, NModal, NDatePicker, 
    NSpace, NStatistic, NDrawer, NDrawerContent, NList, NListItem,
    useMessage, type DataTableColumns 
} from 'naive-ui'
import { useI18n } from 'vue-i18n'
import StatusBadge from '../../../components/Common/StatusBadge.vue'
import MoneyText from '../../../components/Common/MoneyText.vue'
import { renderHeaderWithTooltip } from '../../../utils/renderHelpers'

const { t } = useI18n()
const message = useMessage()

// Models
interface Invoice {
    id: string
    merchant_id: number
    merchant_name: string
    period: string
    total_ggr: number
    commission_rate: number
    amount_due: number
    status: 'pending' | 'paid'
    breakdown?: any[]
}

// State
const invoices = ref<Invoice[]>([])
const loading = ref(false)
const showGenerateModal = ref(false)
const showDetailDrawer = ref(false)
const selectedInvoice = ref<Invoice | null>(null)
const generateDate = ref<number | null>(Date.now())
const previewData = ref<any[]>([])
const generating = ref(false)
const markingPaid = ref(false)

// Columns with StatusBadge and MoneyText
const columns = computed<DataTableColumns<Invoice>>(() => [
    { 
        title: 'ID', 
        key: 'id',
        width: 120,
        render: (row) => h('span', { class: 'font-mono text-xs' }, row.id)
    },
    { 
        title: t('finance.merchant'), 
        key: 'merchant_name',
        width: 180
    },
    { 
        title: t('finance.period'), 
        key: 'period',
        width: 100
    },
    { 
        title: t('finance.totalGGR'), 
        key: 'total_ggr', 
        width: 140,
        align: 'right',
        render: (row) => h(MoneyText, { value: row.total_ggr, currency: 'USD' })
    },
    { 
        title: () => renderHeaderWithTooltip(t('finance.amountDue'), 'tips.invoice_amount'), 
        key: 'amount_due', 
        width: 140,
        align: 'right',
        render: (row) => h('span', { class: 'font-bold' }, [
            h(MoneyText, { value: row.amount_due, currency: 'USD' })
        ])
    },
    { 
        title: t('finance.status'), 
        key: 'status',
        width: 120,
        render: (row) => h(StatusBadge, { 
            status: row.status === 'paid' ? 'Active' : 'Suspended',
            size: 'small'
        })
    },
    {
        title: t('columns.action'),
        key: 'action',
        width: 100,
        render: (row) => h(NButton, { 
            size: 'small', 
            onClick: () => openDetail(row) 
        }, { default: () => t('finance.detail') })
    }
])

const previewColumns = [
    { title: t('finance.merchant'), key: 'merchant_name' },
    { title: 'GGR', key: 'total_ggr', render: (row: any) => h(MoneyText, { value: row.total_ggr, currency: 'USD' }) },
    { title: 'Rate', key: 'commission_rate', render: (row: any) => row.commission_rate + '%' },
    { title: 'Bill', key: 'amount_due', render: (row: any) => h(MoneyText, { value: row.amount_due, currency: 'USD' }) }
]

// Actions
const fetchInvoices = async () => {
    loading.value = true
    try {
        const res = await fetch('/api/v2/finance/invoices')
        const data = await res.json()
        invoices.value = data.data?.list || []
    } finally {
        loading.value = false
    }
}

const handlePreview = async () => {
    if (!generateDate.value) return
    const date = new Date(generateDate.value)
    const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    
    generating.value = true
    try {
        const res = await fetch('/api/v2/finance/invoices/preview', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ month: monthStr })
        })
        const data = await res.json()
        previewData.value = data.data || []
    } finally {
        generating.value = false
    }
}

const confirmGenerate = async () => {
    if (!generateDate.value || previewData.value.length === 0) return
    const date = new Date(generateDate.value)
    const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

    generating.value = true
    try {
        const res = await fetch('/api/v2/finance/invoices/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ month: monthStr, items: previewData.value })
        })
        const data = await res.json()
        if (data.code === 0) {
            message.success(t('finance.invoicesGenerated'))
            showGenerateModal.value = false
            previewData.value = []
            fetchInvoices()
        }
    } finally {
        generating.value = false
    }
}

const openDetail = (invoice: Invoice) => {
    selectedInvoice.value = invoice
    showDetailDrawer.value = true
}

const markAsPaid = async () => {
    if (!selectedInvoice.value) return
    markingPaid.value = true
    try {
        const res = await fetch(`/api/v2/finance/invoices/${selectedInvoice.value.id}/pay`, { method: 'POST' })
        const data = await res.json()
        if (data.code === 0) {
            message.success(t('finance.markedPaid'))
            selectedInvoice.value.status = 'paid'
            // Update in list
            const idx = invoices.value.findIndex(i => i.id === selectedInvoice.value?.id)
            if (idx >= 0 && invoices.value[idx]) {
                invoices.value[idx].status = 'paid'
            }
        }
    } catch (e) {
        message.error(t('common.operationFailed'))
    } finally {
        markingPaid.value = false
    }
}

onMounted(() => {
    fetchInvoices()
})
</script>

<template>
    <div class="p-6 space-y-4">
        <div class="flex justify-between items-center">
            <h1 class="text-2xl font-bold flex items-center gap-2">
                <span>💰</span> {{ t('finance.invoiceManager') }}
            </h1>
            <n-button type="primary" @click="showGenerateModal = true">
                ➕ {{ t('finance.generateInvoice') }}
            </n-button>
        </div>

        <n-card>
            <n-data-table 
                :columns="columns" 
                :data="invoices" 
                :loading="loading" 
                :pagination="{ pageSize: 10 }"
                striped
            />
        </n-card>

        <!-- Generate Modal -->
        <n-modal v-model:show="showGenerateModal" preset="card" :title="t('finance.generateInvoice')" class="w-[650px]">
            <n-space vertical size="large">
                <div class="flex items-center gap-4">
                    <span class="font-medium">{{ t('finance.period') }}:</span>
                    <n-date-picker v-model:value="generateDate" type="month" clearable class="w-40" />
                    <n-button type="primary" @click="handlePreview" :loading="generating">
                        {{ t('finance.preview') }}
                    </n-button>
                </div>

                <div v-if="previewData.length > 0" class="border border-slate-600 rounded-lg p-4 bg-slate-800/30">
                    <n-data-table size="small" :columns="previewColumns" :data="previewData" max-height="300" />
                    <div class="flex justify-between items-center mt-4 pt-4 border-t border-slate-600">
                        <span class="text-gray-400">{{ previewData.length }} {{ t('finance.merchants') }}</span>
                        <span class="font-bold text-lg text-green-400">
                            Total: <MoneyText :value="previewData.reduce((acc, curr) => acc + curr.amount_due, 0)" currency="USD" />
                        </span>
                    </div>
                </div>

                <div class="flex justify-end gap-2">
                    <n-button @click="showGenerateModal = false">{{ t('common.cancel') }}</n-button>
                    <n-button 
                        type="primary" 
                        :disabled="previewData.length === 0" 
                        @click="confirmGenerate" 
                        :loading="generating"
                    >
                        {{ t('finance.confirmGenerate') }}
                    </n-button>
                </div>
            </n-space>
        </n-modal>

        <!-- Detail Drawer -->
        <n-drawer v-model:show="showDetailDrawer" :width="520">
            <n-drawer-content :title="`Invoice: ${selectedInvoice?.id || ''}`" closable>
                <div v-if="selectedInvoice" class="space-y-6">
                    <!-- Summary Card -->
                    <n-card :bordered="false" class="bg-slate-800/50">
                        <div class="flex items-center justify-between">
                            <n-statistic :label="t('finance.amountDue')">
                                <template #default>
                                    <MoneyText :value="selectedInvoice.amount_due" currency="USD" />
                                </template>
                            </n-statistic>
                            <StatusBadge 
                                :status="selectedInvoice.status === 'paid' ? 'Active' : 'Suspended'"
                                size="medium"
                            />
                        </div>
                        <div class="mt-3 text-sm text-gray-400">
                            {{ t('finance.period') }}: <span class="text-white">{{ selectedInvoice.period }}</span> • 
                            {{ t('finance.merchant') }}: <span class="text-white">{{ selectedInvoice.merchant_name }}</span>
                        </div>
                    </n-card>

                    <!-- Breakdown -->
                    <div>
                        <h3 class="font-bold mb-3">{{ t('finance.breakdown') }}</h3>
                        <n-list bordered>
                            <n-list-item v-for="(item, i) in selectedInvoice.breakdown" :key="i">
                                <div class="flex justify-between items-center">
                                    <span class="font-medium">{{ item.provider }}</span>
                                    <MoneyText :value="item.amount" currency="USD" />
                                </div>
                                <div class="text-xs text-gray-500 mt-1">
                                    GGR: <MoneyText :value="item.ggr" currency="USD" /> @ {{ item.rate }}%
                                </div>
                            </n-list-item>
                        </n-list>
                    </div>

                    <!-- Mark as Paid Button -->
                    <div v-if="selectedInvoice.status === 'pending'" class="flex justify-end pt-4 border-t border-slate-600">
                        <n-button 
                            type="success" 
                            size="large" 
                            @click="markAsPaid"
                            :loading="markingPaid"
                        >
                            ✅ {{ t('finance.markAsPaid') }}
                        </n-button>
                    </div>
                </div>
            </n-drawer-content>
        </n-drawer>
    </div>
</template>
