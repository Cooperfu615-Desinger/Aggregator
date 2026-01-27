<template>
    <div class="fund-management p-6">
        <h1 class="text-2xl font-bold mb-6 flex items-center gap-2">
            <span>💰</span> {{ t('merchant.fundRecord.title') }}
        </h1>

        <!-- Top Section: Wallet Info & Actions -->
        <n-card class="mb-6 !bg-[#101014] !border-gray-800" :bordered="false">
            <div class="flex justify-between items-center">
                <div class="flex gap-12">
                    <!-- Balance -->
                    <div>
                        <div class="text-gray-400 text-sm mb-2 font-medium">{{ t('finance.currentBalance') }}</div>
                        <div class="text-3xl font-bold text-[#4ade80] tracking-wide">
                            {{ formatCurrency(walletInfo.balance) }} 
                            <span class="text-sm text-gray-500 font-normal">{{ walletInfo.currency }}</span>
                        </div>
                    </div>
                    <!-- Credit Limit -->
                    <div>
                        <div class="text-gray-400 text-sm mb-2 font-medium">{{ t('finance.creditLimit') }}</div>
                        <div class="text-3xl font-bold text-white tracking-wide">
                            {{ formatCurrency(walletInfo.credit_limit) }}
                        </div>
                    </div>
                </div>
                <div class="flex gap-4">
                    <n-button type="info" ghost size="large" @click="showCreditModal = true">
                        + {{ t('merchant.fundRecord.applyCredit') }}
                    </n-button>
                    <n-button type="primary" size="large" @click="showTopUpModal = true">
                        + {{ t('merchant.fundRecord.applyTopUp') }}
                    </n-button>
                </div>
            </div>
        </n-card>

        <!-- Fund Records List -->
        <n-card>
            <n-data-table
                :columns="columns"
                :data="data"
                :loading="loading"
                :pagination="pagination"
            />
        </n-card>

        <!-- Top Up Modal (Reused Logic) -->
        <n-modal
            v-model:show="showTopUpModal"
            preset="card"
            :title="t('merchant.fundRecord.applyTopUp')"
            class="w-[500px]"
        >
            <n-form>
                <n-form-item :label="t('finance.amount')">
                    <n-input-number v-model:value="topUpAmount" class="w-full" :min="100" />
                </n-form-item>
                <div class="bg-yellow-50 p-3 rounded mb-4 text-xs text-yellow-700">
                    Mock: Picture upload skipped for demo
                </div>
            </n-form>
            <template #footer>
                <div class="flex justify-end gap-2">
                    <n-button @click="showTopUpModal = false">{{ t('common.cancel') }}</n-button>
                    <n-button type="primary" :loading="submitting" @click="submitTopUp">{{ t('common.submit') }}</n-button>
                </div>
            </template>
        </n-modal>

        <!-- Credit Limit Modal -->
        <n-modal
            v-model:show="showCreditModal"
            preset="card"
            :title="t('merchant.fundRecord.applyCredit')"
            class="w-[500px]"
        >
             <n-form>
                <n-form-item :label="t('finance.requestedAmount')">
                    <n-input-number v-model:value="creditAmount" class="w-full" :min="0" />
                </n-form-item>
                <n-form-item :label="t('common.reason')">
                    <n-input v-model:value="creditReason" type="textarea" />
                </n-form-item>
            </n-form>
             <template #footer>
                <div class="flex justify-end gap-2">
                    <n-button @click="showCreditModal = false">{{ t('common.cancel') }}</n-button>
                    <n-button type="primary" :loading="submitting" @click="submitCredit">{{ t('common.submit') }}</n-button>
                </div>
            </template>
        </n-modal>

    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, h } from 'vue'
import { useI18n } from 'vue-i18n'
import {
    NCard, NButton, NDataTable, NTag, NModal, NForm, NFormItem, 
    NInputNumber, NInput, useMessage
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import type { FundManagementRow } from '../../../types/table'

const { t } = useI18n()
const message = useMessage()

// State
const walletInfo = ref({ balance: 0, credit_limit: 0, currency: 'USD' })
const data = ref([])
const loading = ref(false)
const showTopUpModal = ref(false)
const showCreditModal = ref(false)
const topUpAmount = ref(1000)
const creditAmount = ref(0)
const creditReason = ref('')
const submitting = ref(false)

const pagination = { pageSize: 10 }

type TagType = 'success' | 'info' | 'warning' | 'error' | 'default' | 'primary'

const typeMap: Record<string, TagType> = {
    'top-up': 'success',
    'credit-limit': 'info',
    'manual-adjust': 'warning'
}

const statusMap: Record<string, TagType> = {
    'pending': 'warning',
    'approved': 'success',
    'rejected': 'error'
}

const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString()
}

// Columns
const columns: DataTableColumns<FundManagementRow> = [
    {
        title: t('common.createdAt'),
        key: 'created_at',
        width: 200,
        align: 'center',
        sorter: (rowA, rowB) => new Date(rowA.created_at).getTime() - new Date(rowB.created_at).getTime(),
        render: (row: FundManagementRow) => h('span', { class: 'text-xs' }, formatDate(row.created_at))
    },
    {
        title: t('merchant.fundRecord.type'),
        key: 'type',
        width: 120,
        align: 'center',
        // Type is categorical, sorting by string value or specific order is possible, string sort is basic
        sorter: (rowA, rowB) => rowA.type.localeCompare(rowB.type),
        render: (row: FundManagementRow) => h(NTag, { type: typeMap[row.type] || 'default', bordered: false, size: 'small' }, 
            { default: () => {
                const map: Record<string, string> = { 'top-up': 'topUp', 'credit-limit': 'credit', 'manual-adjust': 'manual' }
                return t(`merchant.fundRecord.types.${map[row.type] || 'manual'}`)
            }}
        )
    },
    {
        title: t('merchant.fundRecord.amount'),
        key: 'amount',
        width: 150,
        align: 'right',
        sorter: (rowA, rowB) => rowA.amount - rowB.amount,
        render: (row: FundManagementRow) => h('span', { class: 'font-mono' }, row.amount.toLocaleString(undefined, { minimumFractionDigits: 2 }))
    },
    {
        title: t('merchant.fundRecord.status'),
        key: 'status',
        width: 100,
        align: 'center',
        sorter: (rowA, rowB) => rowA.status.localeCompare(rowB.status),
        render: (row: FundManagementRow) => h(NTag, { type: statusMap[row.status] || 'default', size: 'small' },
            { default: () => t(`merchant.fundRecord.statusLabel.${row.status}`) }
        )
    },
    {
        title: t('merchant.fundRecord.remarks'),
        key: 'remarks',
        align: 'left',
        render: (row: FundManagementRow) => {
            // Priority: Admin Reply > Reason > '-'
            if (row.reason && (row.status === 'rejected' || row.type === 'manual-adjust')) {
                return h(NTag, { type: 'error', bordered: false, size: 'small' }, { default: () => `${t('merchant.fundRecord.adminNote')}: ${row.reason}` })
            }
            return h('span', { class: 'text-xs text-gray-400' }, row.reason || '-')
        }
    }
]

// Fetch Data
const fetchData = async () => {
    loading.value = true
    try {
        // Fetch Wallet
        const walletRes = await fetch('/api/v2/merchant/wallet').then(r => r.json())
        if (walletRes.code === 0) {
            walletInfo.value = walletRes.data
        }

        // Fetch Records
        const listRes = await fetch('/api/v2/merchant/funds').then(r => r.json())
        if (listRes.code === 0) {
            data.value = listRes.data.list
        }
    } catch (e) {
        message.error('Failed to load data')
    } finally {
        loading.value = false
    }
}

const formatCurrency = (val: number) => val?.toLocaleString() || '0'

// Submit Top Up
const submitTopUp = async () => {
    submitting.value = true
    try {
        await new Promise(r => setTimeout(r, 600)) // Mock delay
        // In real app, call API
        message.success(t('common.submitSuccess'))
        showTopUpModal.value = false
        fetchData()
    } finally {
        submitting.value = false
    }
}

// Submit Credit
const submitCredit = async () => {
    submitting.value = true
    try {
        await new Promise(r => setTimeout(r, 600)) // Mock delay
        // In real app, call API
        message.success(t('common.submitSuccess'))
        showCreditModal.value = false
        fetchData()
    } finally {
        submitting.value = false
    }
}

onMounted(fetchData)

</script>
