<script setup lang="ts">
import { ref, reactive, onMounted, h, computed } from 'vue'
import { 
    NCard, NSpace, NInput, NSelect, NButton, NDataTable, NTag,
    NModal, NForm, NFormItem, NInputNumber, useMessage, NImage
} from 'naive-ui'
import { useI18n } from 'vue-i18n'
import type { DataTableColumns } from 'naive-ui'
import type { FundRecord } from '../../../types/finance'
import { SearchOutlined, PlusOutlined, CheckCircleOutlined, CancelOutlined } from '@vicons/material'

const { t } = useI18n()
const message = useMessage()

// State
const loading = ref(false)
const list = ref<FundRecord[]>([])
const searchParams = reactive({
    dateRange: null as [number, number] | null,
    merchantName: '',
    type: 'all',
    status: 'all'
})

// Review Dialog State
const showReview = ref(false)
const currentRecord = ref<FundRecord | null>(null)
const reviewReason = ref('')
const reviewAction = ref<'approve' | 'reject'>('approve')
const reviewing = ref(false)

// Manual Adjust State
const showManual = ref(false)
const adjusting = ref(false)
const manualForm = reactive({
    merchant_id: '', // In real app, this would be a select from merchant list
    // For mock, we'll simulate merchant selection by just entering ID or selecting from a hardcoded list
    // Improve: Fetch merchant list to select. For now simple input/mock select.
    merchant_id_select: null as string | null,
    amount: 0,
    reason: ''
})

// Options
const typeOptions = computed(() => [
    { label: t('common.all'), value: 'all' },
    { label: t('finance.funds.types.top-up'), value: 'top-up' },
    { label: t('finance.funds.types.credit-limit'), value: 'credit-limit' },
    { label: t('finance.funds.types.manual-adjust'), value: 'manual-adjust' }
])

const statusOptions = computed(() => [
    { label: t('common.all'), value: 'all' },
    { label: t('finance.funds.statusLabel.pending'), value: 'pending' },
    { label: t('finance.funds.statusLabel.approved'), value: 'approved' },
    { label: t('finance.funds.statusLabel.rejected'), value: 'rejected' }
])

const merchantOptions = [
    { label: 'Bet365 (OP-1001)', value: '1001' },
    { label: '1xbet (OP-1002)', value: '1002' },
    { label: 'K9Win (OP-1003)', value: '1003' }
]

// API
const fetchList = async () => {
    loading.value = true
    try {
        const query = new URLSearchParams()
        if (searchParams.type !== 'all') query.append('type', searchParams.type)
        if (searchParams.status !== 'all') query.append('status', searchParams.status)
        if (searchParams.merchantName) query.append('merchant_name', searchParams.merchantName)
        
        const res = await fetch(`/api/admin/funds?${query.toString()}`)
        const data = await res.json()
        if (data.code === 0) {
            list.value = data.data.list
        }
    } catch (e) {
        message.error(t('common.failed'))
    } finally {
        loading.value = false
    }
}

const handleReview = (record: FundRecord, action: 'approve' | 'reject') => {
    currentRecord.value = record
    reviewAction.value = action
    reviewReason.value = ''
    showReview.value = true
}

const submitReview = async () => {
    if (!currentRecord.value) return
    reviewing.value = true
    try {
        const res = await fetch(`/api/admin/funds/${currentRecord.value.id}/review`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: reviewAction.value,
                reason: reviewReason.value
            })
        })
        const data = await res.json()
        if (data.code === 0) {
            message.success(t('common.success'))
            showReview.value = false
            fetchList()
        } else {
            message.error(data.msg)
        }
    } catch (e) {
        message.error(t('common.failed'))
    } finally {
        reviewing.value = false
    }
}

const submitManual = async () => {
    if (!manualForm.merchant_id_select || !manualForm.amount || !manualForm.reason) {
        message.error(t('form.required', { field: '' }))
        return
    }
    adjusting.value = true
    try {
        // Find merchant name from options for mock consistency
        const mButton = merchantOptions.find(m => m.value === manualForm.merchant_id_select)
        const mName = mButton ? mButton.label.split(' (')[0] : 'Unknown'

        const payload = {
            merchant_id: manualForm.merchant_id_select,
            merchant_name: mName,
            type: 'manual-adjust',
            amount: manualForm.amount,
            reason: manualForm.reason
        }

        const res = await fetch(`/api/admin/funds/adjust`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        const data = await res.json()
        if (data.code === 0) {
            message.success(t('common.success'))
            showManual.value = false
            fetchList()
            // Reset form
            manualForm.merchant_id_select = null
            manualForm.amount = 0
            manualForm.reason = ''
        } else {
            message.error(data.msg)
        }
    } catch (e) {
        message.error(t('common.failed'))
    } finally {
        adjusting.value = false
    }
}

// Columns
const columns = computed<DataTableColumns<FundRecord>>(() => [
    { title: t('finance.funds.createdAt'), key: 'created_at', width: 160, 
      render: (row) => new Date(row.created_at).toLocaleString() },
    { title: t('finance.funds.merchant'), key: 'merchant_name', width: 140,
      render: (row) => h('div', [
          h('div', { class: 'font-bold' }, row.merchant_name),
          h('div', { class: 'text-xs text-gray-400 font-mono' }, `ID: ${row.merchant_id}`)
      ])
    },
    { title: t('finance.funds.type'), key: 'type', width: 120,
      render: (row) => {
          const typeKey = row.type as string
          return h(NTag, { type: row.type === 'top-up' ? 'success' : row.type === 'credit-limit' ? 'info' : 'warning' }, 
            { default: () => t(`finance.funds.types.${typeKey}`) }
          )
      }
    },
    { title: t('finance.funds.amount'), key: 'amount', width: 120, align: 'right',
      render: (row) => {
          const isCredit = row.type === 'credit-limit'
          const prefix = isCredit ? 'Limit: ' : row.amount > 0 ? '+' : ''
          const style = isCredit ? 'text-blue-600' : row.amount > 0 ? 'text-green-600' : 'text-red-600'
          return h('div', { class: `font-mono font-bold ${style}` }, `${prefix}${row.amount.toLocaleString()}`)
      }
    },
    { title: t('finance.funds.proof'), key: 'proof', width: 200,
      render: (row) => {
          if (row.type === 'top-up' && row.proof && row.proof.startsWith('http')) {
              return h(NImage, { width: 40, src: row.proof })
          }
          return row.proof || row.reason || '-'
      }
    },
    { title: t('finance.funds.status'), key: 'status', width: 100, align: 'center',
      render: (row) => {
          const statusKey = row.status as string
          const color = row.status === 'pending' ? 'warning' : row.status === 'approved' ? 'success' : 'error'
          return h(NTag, { type: color, bordered: false }, { default: () => t(`finance.funds.statusLabel.${statusKey}`) })
      }
    },
    { title: t('finance.funds.action'), key: 'actions', width: 160, fixed: 'right',
      render: (row) => {
          if (row.status !== 'pending') {
              return h('span', { class: 'text-xs text-gray-400' }, 
                  `${row.reviewer || 'System'} @ ${row.updated_at ? new Date(row.updated_at).toLocaleDateString() : ''}`
              )
          }
          return h(NSpace, { size: 'small' }, {
              default: () => [
                  h(NButton, { 
                      size: 'small', type: 'success', ghost: true,
                      onClick: () => handleReview(row, 'approve')
                  }, { icon: () => h(CheckCircleOutlined) }),
                  h(NButton, { 
                      size: 'small', type: 'error', ghost: true,
                      onClick: () => handleReview(row, 'reject')
                  }, { icon: () => h(CancelOutlined) }),
              ]
          })
      }
    }
])

onMounted(() => {
    fetchList()
})
</script>

<template>
    <div class="p-4 space-y-4">
        <!-- Header & Toolbar -->
        <div class="flex justify-between items-center">
            <h1 class="text-2xl font-bold">{{ t('finance.funds.title') }}</h1>
            <NButton type="primary" @click="showManual = true">
                <template #icon><PlusOutlined /></template>
                {{ t('finance.funds.manualAdjust') }}
            </NButton>
        </div>

        <NCard>
            <NSpace vertical size="large">
                <!-- Filter -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <NInput v-model:value="searchParams.merchantName" :placeholder="t('finance.filterMerchant')" clearable>
                        <template #prefix><SearchOutlined class="text-gray-400" /></template>
                    </NInput>
                    <NSelect v-model:value="searchParams.type" :options="typeOptions" />
                    <NSelect v-model:value="searchParams.status" :options="statusOptions" />
                    <NButton type="info" @click="fetchList">{{ t('common.search') }}</NButton>
                </div>

                <!-- Table -->
                <NDataTable
                    :columns="columns"
                    :data="list"
                    :loading="loading"
                    :pagination="{ pageSize: 10 }"
                    scroll-x="1000"
                />
            </NSpace>
        </NCard>

        <!-- Review Dialog -->
        <NModal v-model:show="showReview" preset="dialog" :title="t('finance.funds.dialog.reviewTitle')">
            <template #header>
                <div>{{ reviewAction === 'approve' ? t('finance.funds.dialog.approve') : t('finance.funds.dialog.reject') }}</div>
            </template>
            <div class="py-4 space-y-4">
                <div class="bg-[#18181c] p-4 rounded border border-gray-800">
                    <div class="flex justify-between mb-2">
                        <span class="text-gray-400">{{ t('finance.funds.merchant') }}</span>
                        <span class="font-bold text-white">{{ currentRecord?.merchant_name }}</span>
                    </div>
                    <div class="flex justify-between mb-2">
                        <span class="text-gray-400">{{ t('finance.funds.type') }}</span>
                        <span class="text-gray-200">{{ currentRecord?.type ? t(`finance.funds.types.${currentRecord.type}`) : '' }}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-400">{{ t('finance.funds.amount') }}</span>
                        <span class="font-mono text-lg font-bold text-emerald-400">{{ currentRecord?.amount.toLocaleString() }}</span>
                    </div>
                </div>

                <NFormItem :label="t('finance.funds.reason')">
                    <NInput v-model:value="reviewReason" type="textarea" :placeholder="reviewAction === 'reject' ? t('form.required', {field: ''}) : t('form.memo')" />
                </NFormItem>
            </div>
            <template #action>
                <NButton @click="showReview = false">{{ t('common.cancel') }}</NButton>
                <NButton 
                    :type="reviewAction === 'approve' ? 'success' : 'error'" 
                    :loading="reviewing"
                    @click="submitReview"
                >
                    {{ t('common.confirm') }}
                </NButton>
            </template>
        </NModal>

        <!-- Manual Adjust Dialog -->
        <NModal v-model:show="showManual" preset="card" :title="t('finance.funds.dialog.adjustTitle')" class="w-[500px]">
            <NForm label-placement="left" label-width="100" require-mark-placement="right-hanging">
                <NFormItem :label="t('finance.funds.merchant')" required>
                    <NSelect v-model:value="manualForm.merchant_id_select" :options="merchantOptions" />
                </NFormItem>
                <NFormItem :label="t('finance.funds.dialog.adjustment')" required>
                    <NInputNumber v-model:value="manualForm.amount" class="w-full" :show-button="false">
                        <template #prefix>$</template>
                    </NInputNumber>
                    <div class="text-xs text-gray-400 mt-1 w-full">Negative to deduct, Positive to add</div>
                </NFormItem>
                <NFormItem :label="t('finance.funds.reason')" required>
                    <NInput v-model:value="manualForm.reason" type="textarea" />
                </NFormItem>
            </NForm>
            <template #footer>
                <div class="flex justify-end gap-2">
                    <NButton @click="showManual = false">{{ t('common.cancel') }}</NButton>
                    <NButton type="primary" :loading="adjusting" @click="submitManual">{{ t('finance.funds.dialog.confirmAdjust') }}</NButton>
                </div>
            </template>
        </NModal>
    </div>
</template>
