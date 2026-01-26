<script setup lang="ts">
import { ref, onMounted, computed, h } from 'vue'
import { 
    NCard, NButton, NDataTable, NModal, NDatePicker, 
    NSpace, NStatistic, NDrawer, NDrawerContent, NList, NListItem,
    useMessage, type DataTableColumns, NTooltip, NIcon,
    NInput, NSelect, NTag, NPopconfirm
} from 'naive-ui'
import { DescriptionOutlined, CheckCircleOutlined, SearchOutlined } from '@vicons/material'
import { useI18n } from 'vue-i18n'
import MoneyText from '../../../components/Common/MoneyText.vue'
import { renderHeaderWithTooltip } from '../../../utils/renderHelpers'
import type { Invoice } from '../../../types/finance'

const { t } = useI18n()
const message = useMessage()


interface InvoicePreviewItem {
    merchant_id: string
    merchant_name: string
    total_ggr: number
    commission_rate: number
    amount_due: number
}

// State
const invoices = ref<Invoice[]>([])
const loading = ref(false)
const showGenerateModal = ref(false)
const showDetailDrawer = ref(false)
const selectedInvoice = ref<Invoice | null>(null)
const generateDate = ref<number | null>(Date.now())
const previewData = ref<InvoicePreviewItem[]>([])
const generating = ref(false)
const markingPaid = ref(false)

// Filters
const searchQuery = ref('')
const statusFilter = ref<string>('all')
const dateRange = ref<[number, number] | null>(null)

const filteredInvoices = computed(() => {
    return invoices.value.filter(inv => {
        // Status Filter
        if (statusFilter.value !== 'all' && inv.status !== statusFilter.value) return false
        
        // Search Filter
        if (searchQuery.value) {
            const query = searchQuery.value.toLowerCase()
            const matchId = inv.id.toLowerCase().includes(query)
            const matchName = inv.merchant_name.toLowerCase().includes(query)
            if (!matchId && !matchName) return false
        }

        // Date Filter
        if (dateRange.value) {
             // Step 3A says "Date Picker (Month Range)".
             // So I should implement it.
             const [start, end] = dateRange.value
             // Convert invoice period to timestamp
             const pDate = new Date(inv.period + '-01').getTime()
             if (pDate < start || pDate > end) return false
        }
        
        return true
    })
})

const statusOptions = computed(() => [
    { label: t('common.all'), value: 'all' },
    { label: t('finance.statusPending'), value: 'pending' },
    { label: t('finance.statusPaid'), value: 'paid' }
])

// Columns with StatusBadge and MoneyText
const columns = computed<DataTableColumns<Invoice>>(() => [
    { 
        title: t('merchant.merchantId'), 
        key: 'id',
        width: 120,
        align: 'right',
        render: (row) => h('span', { class: 'font-mono text-xs' }, row.id)
    },
    { 
        title: t('merchant.siteCodeLabel'), 
        key: 'merchant_name',
        width: 180,
        align: 'right'
    },
    { 
        title: t('finance.period'), 
        key: 'period',
        width: 100,
        align: 'right'
    },
    { 
        title: () => renderHeaderWithTooltip(t('finance.totalGGR'), 'tips.ggr_formula', 'right'), 
        key: 'total_ggr', 
        width: 140,
        align: 'right',
        render: (row) => h(MoneyText, { value: row.total_ggr, currency: 'USD' })
    },
    { 
        title: () => renderHeaderWithTooltip(t('finance.amountDue'), 'tips.invoice_amount', 'right'), 
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
        align: 'right',
        render: (row) => h(NTag, { 
            type: row.status === 'paid' ? 'success' : 'warning',
            bordered: false,
            round: true
        }, { default: () => row.status === 'paid' ? t('finance.statusPaid') : t('finance.statusPending') })
    },
    {
        title: t('finance.paidAt'),
        key: 'paid_at',
        width: 160,
        align: 'right',
        render: (row) => row.paid_at ? new Date(row.paid_at).toLocaleString() : '-'
    },
    {
        title: t('finance.paidBy'),
        key: 'paid_by',
        width: 120,
        align: 'right',
        render: (row) => row.paid_by || '-'
    },
    {
        title: t('columns.action'),
        key: 'action',
        width: 120,
        align: 'center',
        render: (row) => h(NSpace, { justify: 'center', size: 'small' }, {
            default: () => [
                // Detail Button
                h(NTooltip, { trigger: 'hover' }, {
                    trigger: () => h(NButton, { 
                        size: 'small', 
                        secondary: true,
                        onClick: () => openDetail(row) 
                    }, { icon: () => h(NIcon, null, { default: () => h(DescriptionOutlined) }) }),
                    default: () => t('finance.detail')
                }),
                // Mark Paid Button
                row.status === 'pending' ? h(NPopconfirm, {
                    onPositiveClick: () => markAsPaid(row) // Pass row directly
                }, {
                    trigger: () => h(NTooltip, { trigger: 'hover' }, {
                        trigger: () => h(NButton, {
                            size: 'small',
                            type: 'success',
                            circle: true,
                            secondary: true
                        }, { icon: () => h(NIcon, null, { default: () => h(CheckCircleOutlined) }) }),
                        default: () => t('finance.markAsPaid')
                    }),
                    default: () => t('finance.confirmMarkPaid', { id: row.id })
                }) : null
            ]
        })
    }
])

const previewColumns: DataTableColumns<InvoicePreviewItem> = [
    { title: t('merchant.siteCodeLabel'), key: 'merchant_name', align: 'right' },
    { title: () => renderHeaderWithTooltip('GGR', 'tips.ggr_formula'), key: 'total_ggr', align: 'right', render: (row) => h(MoneyText, { value: row.total_ggr, currency: 'USD' }) },
    { title: t('finance.commissionRate'), key: 'commission_rate', align: 'right', render: (row) => row.commission_rate + '%' },
    { title: t('finance.amountDue'), key: 'amount_due', align: 'right', render: (row) => h(MoneyText, { value: row.amount_due, currency: 'USD' }) }
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

const markAsPaid = async (row?: Invoice) => {
    const target = row || selectedInvoice.value
    if (!target) return
    
    markingPaid.value = true
    try {
        const res = await fetch(`/api/admin/invoices/${target.id}/status`, { 
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'paid' })
        })
        const data = await res.json()
        if (data.code === 0) {
            message.success(t('finance.markedPaid'))
            target.status = 'paid'
            target.paid_at = data.data?.paid_at
            target.paid_by = data.data?.paid_by
            
            const idx = invoices.value.findIndex(i => i.id === target.id)
            if (idx !== -1 && invoices.value[idx]) {
                invoices.value[idx].status = 'paid'
                invoices.value[idx].paid_at = data.data?.paid_at
                invoices.value[idx].paid_by = data.data?.paid_by
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
            <div class="flex gap-4 mb-4">
                <n-input 
                    v-model:value="searchQuery" 
                    :placeholder="t('finance.filterMerchant')" 
                    class="w-64"
                >
                    <template #prefix>
                        <n-icon :component="SearchOutlined" />
                    </template>
                </n-input>
                <n-date-picker 
                    v-model:value="dateRange" 
                    type="monthrange" 
                    clearable 
                    class="w-64" 
                />
                <n-select 
                    v-model:value="statusFilter" 
                    :options="statusOptions" 
                    class="w-40" 
                    :placeholder="t('finance.filterStatus')"
                />
            </div>

            <n-data-table 
                :columns="columns" 
                :data="filteredInvoices" 
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
                        </div>
                        <div class="mt-3 text-sm text-gray-400">
                            {{ t('finance.period') }}: <span class="text-white">{{ selectedInvoice.period }}</span> • 
                            {{ t('merchant.siteCodeLabel') }}: <span class="text-white">{{ selectedInvoice.merchant_name }}</span>
                        </div>
                        <div v-if="selectedInvoice.status === 'paid'" class="mt-2 pt-2 border-t border-slate-700 space-y-1 text-xs text-gray-400">
                            <div class="flex justify-between">
                                <span>{{ t('finance.paidAt') }}:</span>
                                <span class="text-gray-300">{{ new Date(selectedInvoice.paid_at!).toLocaleString() }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span>{{ t('finance.paidBy') }}:</span>
                                <span class="text-gray-300">{{ selectedInvoice.paid_by }}</span>
                            </div>
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
                            @click="() => markAsPaid()"
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
