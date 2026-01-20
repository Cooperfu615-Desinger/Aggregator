<script setup lang="ts">
import { ref, watch } from 'vue'
import { 
    NModal, NCard, NForm, NFormItem, NSwitch, 
    NDatePicker, NButton, useMessage, NAlert
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

const formModel = ref({
    isEmergency: false,
    periodicRange: null as [number, number] | null
})

watch(() => props.show, (newVal) => {
    if (newVal && props.provider) {
        // Initialize from provider data or defaults
        const config = props.provider.maintenanceConfig || { 
            isEmergency: false, 
            startTime: undefined, 
            endTime: undefined 
        }
        formModel.value = {
            isEmergency: config.isEmergency || false,
            periodicRange: (config.startTime && config.endTime) 
                ? [config.startTime, config.endTime] 
                : null
        }
    }
})

const handleSave = async () => {
    loading.value = true
    try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800))
        
        // In a real app, we would send this data to the backend
        /*
        const payload = {
            providerId: props.provider?.id,
            ...formModel.value
        }
        await api.updateMaintenance(payload)
        */
       
        message.success(t('merchantConfig.saveSuccess'))
        emit('update:show', false)
        emit('refresh')
    } catch (e) {
        message.error(t('common.saveFailed'))
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <n-modal :show="show" @update:show="$emit('update:show', $event)">
        <n-card
            style="width: 500px"
            :title="`${t('provider.maintenanceSchedule')} - ${provider?.name}`"
            :bordered="false"
            size="huge"
            role="dialog"
            aria-modal="true"
        >
            <n-alert type="info" class="mb-6" show-icon>
                {{ t('provider.maintenanceDesc') }}
            </n-alert>

            <n-form label-placement="left" label-width="140" require-mark-placement="right-hanging">
                <!-- Emergency Maintenance -->
                <n-form-item :label="t('provider.emergencyMaintenance')">
                    <n-switch v-model:value="formModel.isEmergency">
                        <template #checked>{{ t('status.on') }}</template>
                        <template #unchecked>{{ t('status.off') }}</template>
                    </n-switch>
                </n-form-item>

                <!-- Periodic Maintenance -->
                <n-form-item :label="t('provider.periodicMaintenance')">
                    <n-date-picker
                        v-model:value="formModel.periodicRange"
                        type="datetimerange"
                        clearable
                        class="w-full"
                    />
                </n-form-item>
            </n-form>

            <template #footer>
                <div class="flex justify-end gap-3">
                    <n-button @click="$emit('update:show', false)" :disabled="loading">
                        {{ t('common.cancel') }}
                    </n-button>
                    <n-button type="primary" @click="handleSave" :loading="loading">
                        {{ t('common.save') }}
                    </n-button>
                </div>
            </template>
        </n-card>
    </n-modal>
</template>
