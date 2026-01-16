<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { 
    NModal, NForm, NFormItem, NInput, NSelect, 
    NSwitch, NInputNumber, NButton, useMessage 
} from 'naive-ui'
import type { Game } from '../../../types/game'

const props = defineProps<{
    show: boolean
    game: Game | null
}>()

const emit = defineEmits<{
    (e: 'update:show', value: boolean): void
    (e: 'refresh'): void
}>()

const message = useMessage()
const { t } = useI18n()
const loading = ref(false)

// Form State
const formModel = ref({
    status: false,
    rtp: '96.5%',
    max_bet: 0
})

const rtpOptions = computed(() => [
    { label: `99.0% (${t('game.rtpPromo')})`, value: '99.0%' },
    { label: `96.5% (${t('game.rtpStd')})`, value: '96.5%' },
    { label: '95.0%', value: '95.0%' },
    { label: '92.0%', value: '92.0%' },
    { label: `90.0% (${t('game.rtpHigh')})`, value: '90.0%' }
])

// Initialize form when game changes
watch(() => props.game, (newGame) => {
    if (newGame) {
        formModel.value = {
            status: newGame.status === 'active',
            rtp: String(newGame.rtp_default) + '%', // Simple mapping for mock
            max_bet: 1000 // Mock default
        }
    }
}, { immediate: true })

const handleClose = () => {
    emit('update:show', false)
}

const handleSave = async () => {
    if (!props.game) return

    loading.value = true
    try {
        const payload = {
            id: props.game.game_id,
            status: formModel.value.status ? 'active' : 'maintenance',
            rtp: parseFloat(formModel.value.rtp),
            max_bet: formModel.value.max_bet
        }

        // Mock API Call
        const res = await fetch('/api/v2/game/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        const data = await res.json()

        if (data.code === 0) {
            message.success('Game configuration updated successfully')
            emit('refresh')
            handleClose()
        } else {
            message.error(data.msg || 'Update failed')
        }
    } catch (e) {
        console.error('API Error Details:', e)
        message.error('An error occurred while saving')
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
        :title="`${t('game.configTitle')}: ${game?.name_en || ''}`"
        :bordered="false"
        size="huge"
        :mask-closable="false"
    >
        <n-form
            ref="formRef"
            :model="formModel"
            label-placement="left"
            label-width="120"
            require-mark-placement="right-hanging"
        >
            <!-- Read-only Info -->
            <n-form-item :label="t('game.gameId')">
                <n-input :value="game?.game_id" disabled :placeholder="t('game.readOnly')" />
            </n-form-item>
            <n-form-item :label="t('game.provider')">
                <n-input :value="game?.provider" disabled :placeholder="t('game.readOnly')" />
            </n-form-item>

            <!-- Editable Settings -->
            <n-form-item :label="t('common.status')" path="status">
                <n-switch v-model:value="formModel.status">
                    <template #checked>{{ t('status.active') }}</template>
                    <template #unchecked>{{ t('status.maintenance') }}</template>
                </n-switch>
            </n-form-item>

            <n-form-item :label="t('game.rtpSetting')" path="rtp">
                <n-select 
                    v-model:value="formModel.rtp" 
                    :options="rtpOptions" 
                    :placeholder="t('game.selectRtp')"
                />
            </n-form-item>

            <n-form-item :label="t('game.maxBet')" path="max_bet">
                <n-input-number 
                    v-model:value="formModel.max_bet" 
                    :min="0" 
                    :step="10"
                    :placeholder="t('game.enterLimit')"
                    class="w-full"
                >
                    <template #suffix>USD</template>
                </n-input-number>
            </n-form-item>

            <!-- Footer Actions -->
            <div class="flex justify-end gap-3 mt-6">
                <n-button @click="handleClose" :disabled="loading">
                    {{ t('common.cancel') }}
                </n-button>
                <n-button type="primary" @click="handleSave" :loading="loading">
                    {{ t('form.saveChanges') }}
                </n-button>
            </div>
        </n-form>
    </n-modal>
</template>
