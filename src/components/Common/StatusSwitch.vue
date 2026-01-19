<script setup lang="ts">
import { ref, watch } from 'vue'
import { NSwitch, NModal, NIcon } from 'naive-ui'
import { WarningRound } from '@vicons/material'

interface Props {
    value: boolean
    warningMessage?: string
    warningTitle?: string
    disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    warningMessage: 'Are you sure? This action may impact all downstream merchants.',
    warningTitle: '⚠️ Confirm Status Change',
    disabled: false
})

const emit = defineEmits<{
    (e: 'update:value', value: boolean): void
    (e: 'confirm', value: boolean): void
}>()

const showConfirmModal = ref(false)
const pendingValue = ref(false)

// Local value to track switch state
const localValue = ref(props.value)

// Sync with parent value
watch(() => props.value, (newVal) => {
    localValue.value = newVal
})

const handleChange = (newValue: boolean) => {
    // If turning OFF (true -> false), show confirmation modal
    if (!newValue && props.value) {
        pendingValue.value = newValue
        showConfirmModal.value = true
        return
    }
    
    // If turning ON, proceed without confirmation
    emit('update:value', newValue)
    emit('confirm', newValue)
}

const handleConfirm = () => {
    localValue.value = pendingValue.value
    emit('update:value', pendingValue.value)
    emit('confirm', pendingValue.value)
    showConfirmModal.value = false
}

const handleCancel = () => {
    // Reset switch state visually
    localValue.value = props.value
    showConfirmModal.value = false
}
</script>

<template>
    <div>
        <n-switch
            :value="localValue"
            :disabled="disabled"
            @update:value="handleChange"
        >
            <template #checked>
                <slot name="checked">ON</slot>
            </template>
            <template #unchecked>
                <slot name="unchecked">OFF</slot>
            </template>
        </n-switch>

        <!-- Confirmation Modal -->
        <n-modal
            v-model:show="showConfirmModal"
            preset="dialog"
            type="warning"
            :title="warningTitle"
            :positive-text="'Confirm'"
            :negative-text="'Cancel'"
            @positive-click="handleConfirm"
            @negative-click="handleCancel"
            @close="handleCancel"
        >
            <template #icon>
                <n-icon size="28" color="#f0a020">
                    <WarningRound />
                </n-icon>
            </template>
            <p class="text-gray-300">{{ warningMessage }}</p>
        </n-modal>
    </div>
</template>
