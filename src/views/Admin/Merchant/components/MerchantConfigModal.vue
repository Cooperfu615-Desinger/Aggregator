<script setup lang="ts">
import { ref, watch } from 'vue'
import { 
    NModal, NTabs, NTabPane, NForm, NFormItem, 
    NRadioGroup, NRadioButton, NInput, NInputGroup, 
    NButton, NSelect, NDynamicTags, useMessage
} from 'naive-ui'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
    show: boolean
    merchantId: number | null
}>()

const emit = defineEmits<{
    (e: 'update:show', value: boolean): void
    (e: 'refresh'): void
}>()

const { t } = useI18n()
const message = useMessage()
const loading = ref(false)

const originalWalletMode = ref('transfer')

// Form State
const formModel = ref({
    wallet_mode: 'transfer',
    site_code: '',
    secret_key: '',
    callback_url: '',
    currency: 'CNY',
    allowed_ips: [] as string[],
    state: true
})

const currencyOptions = [
    { label: 'CNY', value: 'CNY' },
    { label: 'USD', value: 'USD' },
    { label: 'TWD', value: 'TWD' },
    { label: 'THB', value: 'THB' },
    { label: 'VND', value: 'VND' }
]

// Mock Data Load
watch(() => props.show, (newVal) => {
    if (newVal && props.merchantId) {
        // Mock fetch API call
        const mockData = {
            wallet_mode: 'transfer',
            site_code: 'MOCK' + props.merchantId,
            secret_key: 'sk_live_' + Math.random().toString(36).substring(2),
            callback_url: 'https://api.merchant.com/callback',
            currency: 'TWD',
            allowed_ips: ['10.0.0.1'],
            state: true
        }
        formModel.value = mockData
        originalWalletMode.value = mockData.wallet_mode
    }
})

const handleClose = () => {
    emit('update:show', false)
}

const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    message.success(t('common.copied'))
}

const handleRegenerate = () => {
    if (!window.confirm(t('merchantConfig.confirmRegenerate'))) return
    
    // Mock new key
    formModel.value.secret_key = 'sk_' + Math.random().toString(36).substring(7) + '...'
    message.success(t('merchantConfig.regenerateSuccess'))
}

const handleSave = async () => {
    loading.value = true
    try {
        // Mock API Save
        await new Promise(resolve => setTimeout(resolve, 800))
        message.success(t('merchantConfig.saveSuccess'))
        handleClose()
        emit('refresh')
    } catch (e) {
        message.error('Error saving configuration')
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <n-modal
        :show="show"
        @update:show="$emit('update:show', $event)"
        class="w-[700px]"
        preset="card"
        :title="`${t('merchantConfig.title')} (ID: ${merchantId})`"
        :bordered="false"
        size="huge"
        :mask-closable="false"
    >
        <n-tabs type="line" animated>
            <!-- Tab 1: Integration -->
            <n-tab-pane name="integration" :tab="t('merchantConfig.integration')">
                <n-form
                    label-placement="left"
                    label-width="140"
                    require-mark-placement="right-hanging"
                    class="mt-4"
                >
                    <n-form-item :label="t('merchant.siteCodeLabel')">
                        <n-input :value="formModel.site_code" readonly placeholder="Read Only" />
                    </n-form-item>

                    <n-form-item :label="t('merchantConfig.base_currency')">
                        <n-select v-model:value="formModel.currency" :options="currencyOptions" />
                    </n-form-item>

                    <n-form-item :label="t('merchantConfig.walletMode')">
                        <n-radio-group v-model:value="formModel.wallet_mode">
                            <n-radio-button value="transfer">{{ t('merchantConfig.transfer') }}</n-radio-button>
                            <n-radio-button value="seamless">{{ t('merchantConfig.seamless') }}</n-radio-button>
                        </n-radio-group>
                        <div v-if="formModel.wallet_mode !== originalWalletMode" class="text-amber-500 text-xs mt-1">
                            ⚠️ {{ t('merchantConfig.wallet_mode_warning') }}
                        </div>
                    </n-form-item>
                </n-form>
            </n-tab-pane>

            <!-- Tab 2: Security -->
            <n-tab-pane name="security" :tab="t('merchantConfig.security')">
                <n-form
                    label-placement="left"
                    label-width="140"
                    require-mark-placement="right-hanging"
                    class="mt-4"
                >
                    <n-form-item :label="t('merchantConfig.secretKey')">
                        <n-input-group>
                            <n-input :value="formModel.secret_key" readonly type="password" show-password-on="click" />
                            <n-button @click="handleCopy(formModel.secret_key)">{{ t('common.copy') }}</n-button>
                            <n-button type="warning" ghost @click="handleRegenerate">
                                {{ t('merchantConfig.regenerate') }}
                            </n-button>
                        </n-input-group>
                    </n-form-item>

                    <n-form-item :label="t('merchantConfig.allowedIps')">
                        <n-dynamic-tags v-model:value="formModel.allowed_ips" />
                        <template #feedback>
                            <span class="text-xs text-gray-500">{{ t('merchantConfig.enterIp') }}</span>
                        </template>
                    </n-form-item>
                </n-form>
            </n-tab-pane>

            <!-- Tab 3: Webhooks -->
            <n-tab-pane name="webhooks" :tab="t('merchantConfig.webhooks')" :disabled="formModel.wallet_mode === 'transfer'">
                <n-form
                    label-placement="left"
                    label-width="140"
                    require-mark-placement="right-hanging"
                    class="mt-4"
                >
                    <n-form-item :label="t('merchantConfig.callbackUrl')">
                        <n-input v-model:value="formModel.callback_url" placeholder="https://..." />
                    </n-form-item>
                </n-form>
            </n-tab-pane>
        </n-tabs>

        <!-- Footer -->
        <div class="flex justify-end gap-3 mt-6 border-t border-gray-700 pt-4">
            <n-button @click="handleClose" :disabled="loading">
                {{ t('common.cancel') }}
            </n-button>
            <n-button type="primary" @click="handleSave" :loading="loading">
                {{ t('common.save') }}
            </n-button>
        </div>
    </n-modal>
</template>
