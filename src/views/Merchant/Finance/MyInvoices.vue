<script setup lang="ts">
import { ref, onMounted, h, computed } from 'vue'
import { 
    NCard, NDataTable, NButton, useMessage, NSpin, NTag, NStatistic, NGrid, NGridItem,
    NModal, NForm, NFormItem, NInput, NInputNumber
} from 'naive-ui'
import { useI18n } from 'vue-i18n'
import type { DataTableColumns } from 'naive-ui'
import MoneyText from '../../../components/Common/MoneyText.vue'
import { renderHeaderWithTooltip } from '../../../utils/renderHelpers'

const { t } = useI18n()
const message = useMessage()
const loading = ref(true)

// Wallet State
const wallet = ref({
    credit_limit: 0,
    balance: 0,
    outstanding_amount: 0
})

interface Invoice {
    id: string
    period: string
    total_ggr: number
    commission_rate: number
    amount_due: number | null
    status: 'pending' | 'paid'
    verification_status: 'none' | 'verifying' | 'verified'
    created_at: string
}

const invoices = ref<Invoice[]>([])

// Modal States
const showTopUpModal = ref(false)
const showPaymentModal = ref(false)
const topUpAmount = ref<number | null>(null)
const selectedInvoice = ref<Invoice | null>(null)
const paymentTxid = ref('')
const submitting = ref(false)

// Mock USDT Address
const MOCK_USDT_ADDRESS = 'TXqhWJRPVGDrjLZAfqFJuQB2kZNR5cLcSZ'

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
            // 判斷驗證狀態
            if (row.verification_status === 'verifying') {
                return h(NTag, { type: 'info', size: 'small', round: true, bordered: false }, 
                    { default: () => '🔄 ' + t('invoices.verifying') })
            }
            const isPaid = row.status === 'paid'
            return h(NTag, {
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
        render: (row) => {
            // 審核中狀態不顯示付款按鈕
            if (row.verification_status === 'verifying') {
                return null
            }
            // 待付款狀態顯示付款按鈕
            if (row.status === 'pending' && row.verification_status === 'none') {
                return h(NButton, {
                    size: 'small',
                    type: 'primary',
                    onClick: () => handlePayNow(row)
                }, { default: () => t('invoices.payNow') })
            }
            // 已付款顯示查看詳情
            return h(NButton, {
                size: 'small',
                onClick: () => handleViewDetail(row)
            }, { default: () => t('invoices.viewDetail') })
        }
    }
])

const fetchWallet = async () => {
    try {
        const res = await fetch('/api/v2/merchant/wallet')
        const data = await res.json()
        if (data.code === 0) {
            wallet.value = data.data
        }
    } catch (e) {
        console.error('Failed to load wallet')
    }
}

const fetchInvoices = async () => {
    loading.value = true
    try {
        const res = await fetch('/api/v2/merchant/invoices')
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

const handlePayNow = (invoice: Invoice) => {
    selectedInvoice.value = invoice
    paymentTxid.value = ''
    showPaymentModal.value = true
}

const handleSubmitTopUp = async () => {
    if (!topUpAmount.value || topUpAmount.value <= 0) {
        message.warning('請輸入有效金額')
        return
    }
    submitting.value = true
    try {
        const res = await fetch('/api/v2/merchant/wallet/top-up', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: topUpAmount.value, txid: '' })
        })
        const data = await res.json()
        if (data.code === 0) {
            message.success(t('invoices.topUpSuccess'))
            showTopUpModal.value = false
            topUpAmount.value = null
        }
    } catch (e) {
        message.error('提交失敗')
    } finally {
        submitting.value = false
    }
}

const handleSubmitPayment = async () => {
    if (!paymentTxid.value.trim()) {
        message.warning('請輸入交易序號')
        return
    }
    if (!selectedInvoice.value) return
    
    submitting.value = true
    try {
        const res = await fetch(`/api/v2/merchant/invoices/${selectedInvoice.value.id}/payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ txid: paymentTxid.value })
        })
        const data = await res.json()
        if (data.code === 0) {
            message.success(t('invoices.submitSuccess'))
            showPaymentModal.value = false
            // 更新本地資料狀態
            const idx = invoices.value.findIndex(inv => inv.id === selectedInvoice.value?.id)
            if (idx !== -1 && invoices.value[idx]) {
                invoices.value[idx].verification_status = 'verifying'
            }
        }
    } catch (e) {
        message.error('提交失敗')
    } finally {
        submitting.value = false
    }
}

onMounted(() => {
    fetchWallet()
    fetchInvoices()
})
</script>

<template>
    <div class="p-6 space-y-6">
        <div class="flex items-center justify-between">
            <h1 class="text-2xl font-bold flex items-center gap-2">
                <span>💰</span> {{ t('invoices.financeCenter') }}
            </h1>
        </div>

        <!-- 錢包看板 -->
        <n-card>
            <div class="flex items-center justify-between">
                <n-grid :cols="3" gap="24">
                    <n-grid-item>
                        <n-statistic :label="t('invoices.creditLimit')">
                            {{ wallet.credit_limit.toLocaleString() }} USDT
                        </n-statistic>
                    </n-grid-item>
                    <n-grid-item>
                        <n-statistic :label="t('invoices.balance')">
                            <span class="text-green-500">{{ wallet.balance.toLocaleString() }} USDT</span>
                        </n-statistic>
                    </n-grid-item>
                    <n-grid-item>
                        <n-statistic :label="t('invoices.outstanding')">
                            <span class="text-red-500">{{ wallet.outstanding_amount.toLocaleString() }} USDT</span>
                        </n-statistic>
                    </n-grid-item>
                </n-grid>
                <n-button type="primary" @click="showTopUpModal = true">
                    {{ t('invoices.topUp') }}
                </n-button>
            </div>
        </n-card>

        <!-- 帳單列表 -->
        <n-card :title="t('invoices.myInvoices')">
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

        <!-- 充值彈窗 -->
        <n-modal v-model:show="showTopUpModal" preset="card" :title="t('invoices.topUp')" style="width: 400px;">
            <n-form>
                <n-form-item :label="t('invoices.topUpAmount')">
                    <n-input-number v-model:value="topUpAmount" :min="1" placeholder="USDT" style="width: 100%;" />
                </n-form-item>
                <n-form-item :label="t('invoices.paymentAddress')">
                    <n-input :value="MOCK_USDT_ADDRESS" readonly />
                </n-form-item>
                <n-form-item :label="t('invoices.txid')">
                    <n-input placeholder="請輸入交易序號" />
                </n-form-item>
                <div class="flex justify-end gap-2">
                    <n-button @click="showTopUpModal = false">取消</n-button>
                    <n-button type="primary" :loading="submitting" @click="handleSubmitTopUp">
                        {{ t('invoices.submit') }}
                    </n-button>
                </div>
            </n-form>
        </n-modal>

        <!-- 付款彈窗 -->
        <n-modal v-model:show="showPaymentModal" preset="card" :title="t('invoices.uploadProof')" style="width: 450px;">
            <n-form v-if="selectedInvoice">
                <n-form-item :label="t('invoices.amountDue')">
                    <span class="text-xl font-bold">{{ selectedInvoice.amount_due?.toLocaleString() }} USDT</span>
                </n-form-item>
                <n-form-item :label="t('invoices.paymentAddress')">
                    <n-input :value="MOCK_USDT_ADDRESS" readonly />
                </n-form-item>
                <n-form-item :label="t('invoices.txid')">
                    <n-input v-model:value="paymentTxid" placeholder="請輸入區塊鏈交易序號" />
                </n-form-item>
                <n-form-item :label="t('invoices.uploadScreenshot')">
                    <n-button secondary disabled>上傳圖片 (模擬)</n-button>
                </n-form-item>
                <div class="flex justify-end gap-2">
                    <n-button @click="showPaymentModal = false">取消</n-button>
                    <n-button type="primary" :loading="submitting" @click="handleSubmitPayment">
                        {{ t('invoices.submit') }}
                    </n-button>
                </div>
            </n-form>
        </n-modal>
    </div>
</template>
