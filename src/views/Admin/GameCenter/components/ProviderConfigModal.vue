<script setup lang="ts">
import { ref, watch } from 'vue'
import { 
    NModal, NTabs, NTabPane, NForm, NFormItem, 
    NInput, NButton, NSelect, NInputNumber,
    useMessage
} from 'naive-ui'
import { useI18n } from 'vue-i18n'
import type { Provider } from '../../../../types/provider'

const props = defineProps<{
    show: boolean
    provider: Provider | null
}>()

const emit = defineEmits<{
    (e: 'update:show', value: boolean): void
    (e: 'refresh'): void
}>()

const { t } = useI18n()
const message = useMessage()
const loading = ref(false)

const formModel = ref<Partial<Provider>>({
    apiConfig: {}
})

// Deep copy provider data when modal opens
watch(() => props.show, (newVal) => {
    if (newVal && props.provider) {
        formModel.value = JSON.parse(JSON.stringify(props.provider))
        if (!formModel.value.apiConfig) {
            formModel.value.apiConfig = {}
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
        const response = await fetch('/api/v2/providers/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formModel.value)
        })
        
        if (!response.ok) throw new Error('API Error')
        
        message.success(t('merchantConfig.saveSuccess'))
        handleClose()
        emit('refresh')
    } catch (e) {
        message.error('Error saving provider config')
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
        :title="`${t('provider.config')} - ${provider?.name}`"
        :bordered="false"
        size="huge"
    >
        <n-tabs type="line" animated>
            <!-- Tab 1: API Connection -->
            <n-tab-pane name="integration" :tab="t('provider.integration')">
                <n-form
                    label-placement="left"
                    label-width="160"
                    require-mark-placement="right-hanging"
                    class="mt-4"
                >
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

            <!-- Tab 2: Finance -->
            <n-tab-pane name="finance" :tab="t('provider.finance')">
                <n-form
                    label-placement="left"
                    label-width="160"
                    require-mark-placement="right-hanging"
                    class="mt-4"
                >
                    <n-form-item :label="t('provider.revenueShare')">
                        <n-input-number 
                            v-model:value="formModel.apiConfig!.revenueShare" 
                            :min="0" 
                            :max="100"
                        >
                            <template #suffix>%</template>
                        </n-input-number>
                    </n-form-item>

                    <n-form-item :label="t('provider.currency')">
                        <n-select 
                            v-model:value="formModel.apiConfig!.currency" 
                            :options="currencyOptions" 
                        />
                    </n-form-item>
                </n-form>
            </n-tab-pane>
        </n-tabs>

        <div class="flex justify-end gap-3 mt-6 border-t border-gray-700 pt-4">
            <n-button @click="handleClose" :disabled="loading">{{ t('common.cancel') }}</n-button>
            <n-button type="primary" @click="handleSave" :loading="loading">{{ t('common.save') }}</n-button>
        </div>
    </n-modal>
</template>
