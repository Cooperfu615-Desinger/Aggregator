<script setup lang="ts">
import { ref, onMounted, h, computed } from 'vue'
import { 
    NCard, NDataTable, NButton, useMessage, NSpin
} from 'naive-ui'
import { useI18n } from 'vue-i18n'
import type { DataTableColumns } from 'naive-ui'
import MoneyText from '../../../components/Common/MoneyText.vue'
import { renderHeaderWithTooltip } from '../../../utils/renderHelpers'

const { t } = useI18n()
const message = useMessage()
const loading = ref(true)

interface Invoice {
    id: string
    period: string
    total_ggr: number
    commission_rate: number
    amount_due: number | null
    status: 'pending' | 'paid'
    created_at: string
}

const invoices = ref<Invoice[]>([])

const columns = computed<DataTableColumns<Invoice>>(() => [
    {
        title: t('invoices.invoiceNo'),
        key: 'id',
        width: 150,
        render: (row) => h('span', { class: 'font-mono text-sm' }, row.id)
    },
    {
        title: t('invoices.period'),
        key: 'period',
        width: 120
    },
    {
        title: () => renderHeaderWithTooltip(
            t('invoices.amountDue'), 
            'tips.invoice_amount'
        ),
        key: 'amount_due',
        width: 150,
        align: 'right',
        render: (row) => {
            if (row.amount_due === null || row.amount_due === undefined) {
                return h('span', { class: 'text-gray-500' }, '-')
            }
            return h(MoneyText, { 
                value: row.amount_due, 
                currency: 'USD' 
            })
        }
    },
    {
        title: t('invoices.status'),
        key: 'status',
        width: 120,
        render: (row) => {
            const isPaid = row.status === 'paid'
            return h('n-tag', {
                type: isPaid ? 'success' : 'warning',
                size: 'small',
                round: true,
                bordered: false
            }, { default: () => (isPaid ? '🟢 ' : '⏳ ') + t(isPaid ? 'invoices.paid' : 'invoices.pending') })
        }
    },
    {
        title: t('common.action'),
        key: 'actions',
        width: 200,
        render: (row) => h('div', { class: 'flex gap-2' }, [
            h(NButton, {
                size: 'small',
                onClick: () => handleViewDetail(row)
            }, { default: () => t('invoices.viewDetail') }),
            h(NButton, {
                size: 'small',
                secondary: true,
                onClick: () => handleDownloadPdf(row)
            }, { default: () => t('invoices.downloadPdf') })
        ])
    }
])

const fetchInvoices = async () => {
    loading.value = true
    try {
        const res = await fetch('/api/agent/invoices')
        const data = await res.json()
        if (data.code === 0) {
            invoices.value = data.data?.list || []
        }
    } catch (e) {
        message.error(t('invoices.loadError'))
    } finally {
        loading.value = false
    }
}

const handleViewDetail = (invoice: Invoice) => {
    message.info(`${t('invoices.viewDetail')}: ${invoice.id}`)
}

const handleDownloadPdf = (invoice: Invoice) => {
    message.info(`${t('invoices.downloadPdf')}: ${invoice.id}`)
}

onMounted(() => {
    fetchInvoices()
})
</script>

<template>
    <div class="p-6 space-y-4">
        <div class="flex items-center justify-between">
            <h1 class="text-2xl font-bold flex items-center gap-2">
                <span>💰</span> {{ t('invoices.myInvoices') }}
            </h1>
        </div>

        <n-card>
            <div v-if="loading" class="flex justify-center items-center h-64">
                <n-spin size="large" />
            </div>
            <div v-else-if="invoices.length === 0" class="text-center py-12 text-gray-500">
                {{ t('invoices.noInvoices') }}
            </div>
            <n-data-table
                v-else
                :columns="columns"
                :data="invoices"
                :pagination="{ pageSize: 10 }"
                :bordered="false"
                striped
            />
        </n-card>
    </div>
</template>
