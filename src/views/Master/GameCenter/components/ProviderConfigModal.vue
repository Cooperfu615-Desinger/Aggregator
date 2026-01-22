<script setup lang="ts">
import { ref, watch } from 'vue'
import { 
    NModal, NTabs, NTabPane, NForm, NFormItem, 
    NInput, NButton, NSelect, NInputNumber,
    useMessage, NDatePicker, NIcon, NSwitch, NCard, NTooltip
} from 'naive-ui'
import { SettingsOutlined, InfoOutlined } from '@vicons/material'
import { useI18n } from 'vue-i18n'
import type { Provider } from '../../../../types/provider'
import MaintenanceSettingsModal from './MaintenanceSettingsModal.vue'

const props = withDefaults(defineProps<{
    show: boolean
    provider?: Provider | null
    mode?: 'create' | 'edit'
}>(), {
    mode: 'edit',
    provider: null
})

const emit = defineEmits<{
    (e: 'update:show', value: boolean): void
    (e: 'refresh'): void
}>()

const { t } = useI18n()
const message = useMessage()
const loading = ref(false)
const showMaintenance = ref(false)

const formModel = ref<Partial<Provider>>({
    name: '',
    code: '',
    apiConfig: {},
    contract: {
        costPercent: 0,
        expiryDate: Date.now()
    },
    contractConfig: {
        settlement_currency: 'USD',
        rules: {
            slot_free_spin: { enabled: false, provider_share: 0 },
            live_tip: { enabled: false, provider_share: 0 },
            card_fee: { enabled: false, provider_share: 0 }
        }
    }
})

// Deep copy provider data when modal opens
watch(() => props.show, (newVal) => {
    if (newVal) {
        if (props.mode === 'create') {
            // Reset for create
            formModel.value = {
                name: '',
                code: '',
                status: 'active',
                type: 'Slot',
                apiConfig: {},
                contract: { costPercent: 0, expiryDate: Date.now() },
                contractConfig: {
                    settlement_currency: 'USD',
                    rules: {
                        slot_free_spin: { enabled: false, provider_share: 0 },
                        live_tip: { enabled: false, provider_share: 0 },
                        card_fee: { enabled: false, provider_share: 0 }
                    }
                }
            }
        } else if (props.provider) {
            // Edit mode: copy provider
            formModel.value = JSON.parse(JSON.stringify(props.provider))
            // Ensure nested objects exist
            if (!formModel.value.apiConfig) formModel.value.apiConfig = {}
            if (!formModel.value.contract) formModel.value.contract = { costPercent: 0, expiryDate: Date.now() }
            if (!formModel.value.contractConfig) {
                formModel.value.contractConfig = {
                    settlement_currency: 'USD',
                    rules: {
                        slot_free_spin: { enabled: false, provider_share: 0 },
                        live_tip: { enabled: false, provider_share: 0 },
                        card_fee: { enabled: false, provider_share: 0 }
                    }
                }
            }
        }
    }
})

const currencyOptions = [
    { label: 'USD', value: 'USD' },
    { label: 'EUR', value: 'EUR' },
    { label: 'CNY', value: 'CNY' },
    { label: 'TWD', value: 'TWD' }
]

const handleClose = () => {
    emit('update:show', false)
}

const handleSave = async () => {
    loading.value = true
    try {
        const url = props.mode === 'create' ? '/api/admin/providers' : '/api/v2/providers/update'
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formModel.value)
        })
        
        if (!response.ok) {
            const res = await response.json()
            throw new Error(res.msg || 'API Error')
        }
        
        const res = await response.json()
        if (res.code !== 0) throw new Error(res.msg)

        message.success(props.mode === 'create' ? t('provider.createSuccess') : t('merchantConfig.saveSuccess'))
        handleClose()
        emit('refresh')
    } catch (e: any) {
        message.error(e.message || 'Error saving provider config')
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <n-modal
        :show="show"
        @update:show="$emit('update:show', $event)"
        class="w-[600px]"
        preset="card"
        :title="mode === 'create' ? t('provider.addProvider') : `${t('provider.config')} - ${provider?.name}`"
        :bordered="false"
        size="huge"
    >
        <template #header-extra>
            <n-button v-if="mode === 'edit'" size="small" secondary type="warning" @click="showMaintenance = true">
                <template #icon>
                    <n-icon :component="SettingsOutlined" />
                </template>
                {{ t('provider.maintenanceSchedule') }}
            </n-button>
        </template>

        <n-tabs type="line" animated>
            <!-- Tab 1: Basic & API Connection -->
            <n-tab-pane name="integration" :tab="t('provider.integration')">
                <n-form
                    label-placement="left"
                    label-width="160"
                    require-mark-placement="right-hanging"
                    class="mt-4"
                >
                    <!-- Basic Info -->
                    <n-form-item :label="t('provider.name')" required>
                        <n-input v-model:value="formModel.name" :placeholder="t('provider.namePlaceholder')" />
                    </n-form-item>

                    <n-form-item :label="t('provider.code')" required>
                        <n-input 
                            v-model:value="formModel.code" 
                            :disabled="mode === 'edit'"
                            :placeholder="t('provider.codePlaceholder')" 
                        />
                    </n-form-item>

                    <n-form-item :label="t('provider.apiUrl')">
                        <n-input v-model:value="formModel.apiConfig!.apiUrl" placeholder="https://api.provider.com" />
                    </n-form-item>

                    <n-form-item :label="t('provider.merchantCode')">
                        <n-input v-model:value="formModel.apiConfig!.merchantCode" />
                    </n-form-item>

                    <n-form-item :label="t('provider.secretKey')">
                         <n-input 
                            v-model:value="formModel.apiConfig!.secretKey" 
                            type="password" 
                            show-password-on="click" 
                        />
                    </n-form-item>
                </n-form>
            </n-tab-pane>

            <!-- Tab 2: Contract & Finance -->
            <n-tab-pane name="contract" :tab="t('provider.contract')">
                <n-form
                    label-placement="left"
                    label-width="160"
                    require-mark-placement="right-hanging"
                    class="mt-4"
                >
                    <!-- Settlement Currency -->
                    <n-form-item :label="t('provider.settlementCurrency')">
                        <n-select 
                            v-model:value="formModel.contractConfig!.settlement_currency" 
                            :options="currencyOptions" 
                        />
                    </n-form-item>

                    <!-- Revenue Share (Base) -->
                    <n-form-item :label="t('provider.revenueShare')">
                        <n-input-number 
                            v-model:value="formModel.apiConfig!.revenueShare" 
                            :min="0" 
                            :max="100"
                        >
                            <template #suffix>%</template>
                        </n-input-number>
                    </n-form-item>

                    <!-- Advanced Rules -->
                    <n-card :title="t('provider.advancedRules')" size="small" class="mt-4 bg-gray-50 border-gray-200">
                        <!-- Slot Free Spin -->
                        <div class="mb-4 pb-4 border-b border-gray-200">
                            <div class="flex justify-between items-center mb-2">
                                <div class="font-medium flex items-center gap-2">
                                    {{ t('provider.rules.slotFreeSpin') }}
                                    <n-tooltip trigger="hover">
                                        <template #trigger><n-icon :component="InfoOutlined" class="text-gray-400 cursor-pointer" /></template>
                                        {{ t('provider.rules.slotHelp') }}
                                    </n-tooltip>
                                </div>
                                <n-switch v-model:value="formModel.contractConfig!.rules.slot_free_spin.enabled" />
                            </div>
                            <div v-if="formModel.contractConfig!.rules.slot_free_spin.enabled" class="flex gap-4 items-center pl-6">
                                <n-form-item :label="t('provider.rules.providerShare')" :show-label="true" label-placement="left" class="mb-0">
                                    <n-input-number v-model:value="formModel.contractConfig!.rules.slot_free_spin.provider_share" :min="0" :max="100" size="small">
                                        <template #suffix>%</template>
                                    </n-input-number>
                                </n-form-item>
                                <div class="text-gray-500 text-sm">
                                    {{ t('provider.rules.aggregatorShare') }}: 
                                    <span class="font-bold text-primary">{{ 100 - (formModel.contractConfig?.rules.slot_free_spin.provider_share || 0) }}%</span>
                                </div>
                            </div>
                        </div>

                        <!-- Live Tip -->
                        <div class="mb-4 pb-4 border-b border-gray-200">
                            <div class="flex justify-between items-center mb-2">
                                <div class="font-medium flex items-center gap-2">
                                    {{ t('provider.rules.liveTip') }}
                                </div>
                                <n-switch v-model:value="formModel.contractConfig!.rules.live_tip.enabled" />
                            </div>
                            <div v-if="formModel.contractConfig!.rules.live_tip.enabled" class="flex gap-4 items-center pl-6">
                                <n-form-item :label="t('provider.rules.providerShare')" :show-label="true" label-placement="left" class="mb-0">
                                    <n-input-number v-model:value="formModel.contractConfig!.rules.live_tip.provider_share" :min="0" :max="100" size="small">
                                        <template #suffix>%</template>
                                    </n-input-number>
                                </n-form-item>
                                <div class="text-gray-500 text-sm">
                                    {{ t('provider.rules.aggregatorShare') }}: 
                                    <span class="font-bold text-primary">{{ 100 - (formModel.contractConfig?.rules.live_tip.provider_share || 0) }}%</span>
                                </div>
                            </div>
                        </div>

                        <!-- Card Fee -->
                        <div>
                            <div class="flex justify-between items-center mb-2">
                                <div class="font-medium flex items-center gap-2">
                                    {{ t('provider.rules.cardFee') }}
                                </div>
                                <n-switch v-model:value="formModel.contractConfig!.rules.card_fee.enabled" />
                            </div>
                            <div v-if="formModel.contractConfig!.rules.card_fee.enabled" class="flex gap-4 items-center pl-6">
                                <n-form-item :label="t('provider.rules.providerShare')" :show-label="true" label-placement="left" class="mb-0">
                                    <n-input-number v-model:value="formModel.contractConfig!.rules.card_fee.provider_share" :min="0" :max="100" size="small">
                                        <template #suffix>%</template>
                                    </n-input-number>
                                </n-form-item>
                                <div class="text-gray-500 text-sm">
                                    {{ t('provider.rules.aggregatorShare') }}: 
                                    <span class="font-bold text-primary">{{ 100 - (formModel.contractConfig?.rules.card_fee.provider_share || 0) }}%</span>
                                </div>
                            </div>
                        </div>
                    </n-card>

                    <!-- Expiry Date (Existing) -->
                    <n-form-item :label="t('provider.expiryDate')" class="mt-4">
                        <n-date-picker 
                            v-model:value="formModel.contract!.expiryDate as number" 
                            type="date"
                            class="w-full"
                        />
                    </n-form-item>
                </n-form>
            </n-tab-pane>
        </n-tabs>

        <div class="flex justify-end gap-3 mt-6 border-t border-gray-700 pt-4">
            <n-button @click="handleClose" :disabled="loading">{{ t('common.cancel') }}</n-button>
            <n-button type="primary" @click="handleSave" :loading="loading">{{ t('common.save') }}</n-button>
        </div>

        <maintenance-settings-modal
            v-model:show="showMaintenance"
            :provider="provider"
            @refresh="$emit('refresh')"
        />
    </n-modal>
</template>
