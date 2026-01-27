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
import { math } from '../../../utils/math'

const { t } = useI18n()
const message = useMessage()
const loading = ref(true)

// Wallet State
const wallet = ref({
    credit_limit: 0,
    balance: 0,
    outstanding_amount: 0,
    currency: 'USDT',
    exchange_rate: 1,
    credit_request_status: 'none' as 'none' | 'pending' | 'rejected'
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

// Credit Request Modal
const showCreditRequestModal = ref(false)
const desiredLimit = ref<number | null>(null)
const requestReason = ref('')

// Computed: USDT conversion for top-up
const topUpUsdtHint = computed(() => {
    if (!topUpAmount.value || topUpAmount.value <= 0) return ''
    // QA Fix: Use math.div for precision instead of /
    const usdt = math.div(topUpAmount.value, wallet.value.exchange_rate).toFixed(2)
    return t('invoices.payAmountHint', { amount: usdt })
})

// Mock USDT Address
const MOCK_USDT_ADDRESS = 'TXqhWJRPVGDrjLZAfqFJuQB2kZNR5cLcSZ'

const columns = computed<DataTableColumns<Invoice>>(() => [
    {
        title: t('invoices.invoiceNo'),
        key: 'id',
        width: 150,
        align: 'right',
        sorter: (rowA, rowB) => rowA.id.localeCompare(rowB.id),
        render: (row) => h('span', { class: 'font-mono text-sm' }, row.id)
    },
    {
        title: t('invoices.period'),
        key: 'period',
        width: 120,
        align: 'right',
        sorter: (rowA, rowB) => rowA.period.localeCompare(rowB.period)
    },
    {
        title: () => renderHeaderWithTooltip(
            t('invoices.amountDue'), 
            'tips.invoice_amount',
            'right'
        ),
        key: 'amount_due',
        width: 150,
        align: 'right',
        sorter: (rowA, rowB) => (rowA.amount_due || 0) - (rowB.amount_due || 0),
        render: (row) => {
            if (row.amount_due === null || row.amount_due === undefined) {
                return h('span', { class: 'text-gray-500' }, '-')
            }
            return h(MoneyText, { 
                value: row.amount_due, 
                currency: wallet.value.currency 
            })
        }
    },
    {
        title: t('invoices.status'),
        key: 'status',
        width: 120,
        align: 'right',
        sorter: (rowA, rowB) => rowA.status.localeCompare(rowB.status),
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
        align: 'right',
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
        message.warning(t('validation.invalidAmount'))
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
        message.error(t('validation.submitFailed'))
    } finally {
        submitting.value = false
    }
}

const handleSubmitPayment = async () => {
    if (!paymentTxid.value.trim()) {
        message.warning(t('validation.txidRequired'))
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
        message.error(t('validation.submitFailed'))
    } finally {
        submitting.value = false
    }
}

const handleSubmitCreditRequest = async () => {
    if (!desiredLimit.value || desiredLimit.value <= 0) {
        message.warning(t('validation.invalidLimit'))
        return
    }
    submitting.value = true
    try {
        const res = await fetch('/api/v2/merchant/wallet/credit-limit-request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                desired_limit: desiredLimit.value, 
                reason: requestReason.value 
            })
        })
        const data = await res.json()
        if (data.code === 0) {
            message.success(t('invoices.submitRequestSuccess'))
            showCreditRequestModal.value = false
            wallet.value.credit_request_status = 'pending'
            desiredLimit.value = null
            requestReason.value = ''
        }
    } catch (e) {
        message.error(t('validation.submitFailed'))
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
            <div class="flex items-center gap-4">
                <n-tag type="info" size="medium">{{ wallet.currency }}</n-tag>
                <span class="text-sm text-gray-500">
                    {{ t('invoices.exchangeRate') }}: 1 USD ≈ {{ wallet.exchange_rate }} {{ wallet.currency }}
                </span>
            </div>
        </div>

        <!-- 錢包看板 -->
        <n-card>
            <div class="flex items-center justify-between">
                <n-grid :cols="3" gap="24">
                    <n-grid-item>
                        <n-statistic :label="t('invoices.creditLimit') + ' (' + wallet.currency + ')'">
                            <div class="flex items-center gap-2">
                                <span>{{ wallet.credit_limit.toLocaleString() }}</span>
                                <n-button 
                                    v-if="wallet.credit_request_status !== 'pending'"
                                    size="tiny" 
                                    secondary 
                                    @click="showCreditRequestModal = true"
                                >
                                    {{ t('invoices.requestLimit') }}
                                </n-button>
                                <n-tag v-else type="warning" size="small">{{ t('invoices.requestPending') }}</n-tag>
                            </div>
                        </n-statistic>
                    </n-grid-item>
                    <n-grid-item>
                        <n-statistic :label="t('invoices.balance') + ' (' + wallet.currency + ')'">
                            <span class="text-green-500">{{ wallet.balance.toLocaleString() }}</span>
                        </n-statistic>
                    </n-grid-item>
                    <n-grid-item>
                        <n-statistic :label="t('invoices.outstanding') + ' (' + wallet.currency + ')'">
                            <span class="text-red-500">{{ wallet.outstanding_amount.toLocaleString() }}</span>
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
        <n-modal v-model:show="showTopUpModal" preset="card" :title="t('invoices.topUp')" class="w-[400px]">
            <n-form>
                <n-form-item :label="t('invoices.topUpAmount') + ' (' + wallet.currency + ')'">
                    <n-input-number v-model:value="topUpAmount" :min="1" :placeholder="wallet.currency" class="w-full" />
                </n-form-item>
                <div v-if="topUpUsdtHint" class="text-sm text-gray-500 mb-4">{{ topUpUsdtHint }}</div>
                <n-form-item :label="t('invoices.paymentAddress')">
                    <n-input :value="MOCK_USDT_ADDRESS" readonly />
                </n-form-item>
                <n-form-item :label="t('invoices.txid')">
                    <n-input :placeholder="t('invoices.txidPlaceholder')" />
                </n-form-item>
                <div class="flex justify-end gap-2">
                    <n-button @click="showTopUpModal = false">{{ t('common.cancel') }}</n-button>
                    <n-button type="primary" :loading="submitting" @click="handleSubmitTopUp">
                        {{ t('invoices.submit') }}
                    </n-button>
                </div>
            </n-form>
        </n-modal>

        <!-- 付款彈窗 -->
        <n-modal v-model:show="showPaymentModal" preset="card" :title="t('invoices.uploadProof')" class="w-[450px]">
            <n-form v-if="selectedInvoice">
                <n-form-item :label="t('invoices.amountDue')">
                    <span class="text-xl font-bold">{{ selectedInvoice.amount_due?.toLocaleString() }} USDT</span>
                </n-form-item>
                <n-form-item :label="t('invoices.paymentAddress')">
                    <n-input :value="MOCK_USDT_ADDRESS" readonly />
                </n-form-item>
                <n-form-item :label="t('invoices.txid')">
                    <n-input v-model:value="paymentTxid" :placeholder="t('invoices.blockchainTxidPlaceholder')" />
                </n-form-item>
                <n-form-item :label="t('invoices.uploadScreenshot')">
                    <n-button secondary disabled>{{ t('invoices.uploadImageMock') }}</n-button>
                </n-form-item>
                <div class="flex justify-end gap-2">
                    <n-button @click="showPaymentModal = false">{{ t('common.cancel') }}</n-button>
                    <n-button type="primary" :loading="submitting" @click="handleSubmitPayment">
                        {{ t('invoices.submit') }}
                    </n-button>
                </div>
            </n-form>
        </n-modal>

        <!-- 調額申請彈窗 -->
        <n-modal v-model:show="showCreditRequestModal" preset="card" :title="t('invoices.requestLimit')" class="w-[450px]">
            <n-form>
                <n-form-item :label="t('invoices.desiredLimit') + ' (' + wallet.currency + ')'">
                    <n-input-number v-model:value="desiredLimit" :min="1" class="w-full" />
                </n-form-item>
                <n-form-item :label="t('invoices.reason')">
                    <n-input v-model:value="requestReason" type="textarea" :placeholder="t('invoices.creditReasonPlaceholder')" />
                </n-form-item>
                <div class="flex justify-end gap-2">
                    <n-button @click="showCreditRequestModal = false">{{ t('common.cancel') }}</n-button>
                    <n-button type="primary" :loading="submitting" @click="handleSubmitCreditRequest">
                        {{ t('invoices.submit') }}
                    </n-button>
                </div>
            </n-form>
        </n-modal>
    </div>
</template>
