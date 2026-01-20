<script setup lang="ts">
import { ref, watch } from 'vue'
import { 
    NDrawer, NDrawerContent, NTransfer, NButton, useMessage
} from 'naive-ui'
import { useI18n } from 'vue-i18n'
import type { Merchant } from '../../../../types/merchant'

const props = defineProps<{
    show: boolean
    merchant: Merchant | null
}>()

const emit = defineEmits<{
    (e: 'update:show', value: boolean): void
    (e: 'refresh'): void
}>()

const { t } = useI18n()
const message = useMessage()
const loading = ref(false)
const authorizedProviders = ref<string[]>([])

const allProviders = [
    { label: 'PG Soft', value: 'pg' },
    { label: 'Evolution', value: 'evo' },
    { label: 'Pragmatic Play', value: 'pp' },
    { label: 'JILI', value: 'jili' },
    { label: 'Habanero', value: 'habanero' }
]

watch(() => props.show, (newVal) => {
    if (newVal && props.merchant) {
        // Load existing
        authorizedProviders.value = props.merchant.authorized_providers || []
    }
})

const handleClose = () => {
    emit('update:show', false)
}

const handleSave = async () => {
    loading.value = true
    try {
        // Mock API Call
        await new Promise(r => setTimeout(r, 800))
        
        // In real app: call API to update providers
        // const payload = { id: props.merchant?.id, providers: authorizedProviders.value }
        
        message.success(t('common.saveSuccess'))
        emit('refresh')
        handleClose()
    } catch (e) {
        message.error('Error')
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <n-drawer :show="show" :width="600" @update:show="(v) => emit('update:show', v)">
        <n-drawer-content :title="t('merchant.gameAuthorization')" closable>
            
            <div class="mb-4" v-if="merchant">
                <div class="text-gray-500 mb-2">{{ t('merchant.merchantId') }}: {{ merchant.display_id || merchant.account }}</div>
                <div class="text-lg font-bold">{{ merchant.site_code }}</div>
            </div>

            <n-transfer
                v-model:value="authorizedProviders"
                :options="allProviders"
                source-filterable
                target-filterable
                :titles="[t('common.available'), t('common.selected')]"
            />
            
            <template #footer>
                <div class="flex justify-end gap-2">
                    <n-button @click="handleClose">{{ t('common.cancel') }}</n-button>
                    <n-button type="primary" :loading="loading" @click="handleSave">{{ t('common.save') }}</n-button>
                </div>
            </template>
        </n-drawer-content>
    </n-drawer>
</template>
