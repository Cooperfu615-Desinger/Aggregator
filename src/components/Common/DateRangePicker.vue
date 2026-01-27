<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { NDatePicker, NSpace, NButton } from 'naive-ui'
import { useI18n } from 'vue-i18n'

interface Props {
    value?: [number, number] | null
    placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
    value: null,
    placeholder: 'Select date range'
})

const emit = defineEmits<{
    (e: 'update:value', value: [number, number] | null): void
    (e: 'change', value: { start: string; end: string } | null): void
}>()

const { t } = useI18n()

// Internal value
const internalValue = ref<[number, number] | null>(props.value)

// Sync with parent value
watch(() => props.value, (newVal) => {
    internalValue.value = newVal
})

// Shortcuts
const shortcuts = computed(() => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
    
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    const yesterdayEnd = new Date(today.getTime() - 1)
    
    const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    
    return {
        [t('dateRange.today') || 'Today']: [today.getTime(), todayEnd.getTime()] as [number, number],
        [t('dateRange.yesterday') || 'Yesterday']: [yesterday.getTime(), yesterdayEnd.getTime()] as [number, number],
        [t('dateRange.last7Days') || 'Last 7 Days']: [last7Days.getTime(), todayEnd.getTime()] as [number, number],
        [t('dateRange.thisMonth') || 'This Month']: [thisMonthStart.getTime(), todayEnd.getTime()] as [number, number]
    }
})

const handleChange = (val: [number, number] | null) => {
    internalValue.value = val
    emit('update:value', val)
    
    // Emit ISO string format for API calls
    if (val) {
        emit('change', {
            start: new Date(val[0]).toISOString(),
            end: new Date(val[1]).toISOString()
        })
    } else {
        emit('change', null)
    }
}

const handleShortcut = (range: [number, number]) => {
    handleChange(range)
}
</script>

<template>
    <div class="flex items-center gap-2">
        <n-date-picker
            :value="internalValue"
            type="datetimerange"
            clearable
            :placeholder="placeholder"
            class="w-96"
            @update:value="handleChange"
        />
        <n-space size="small">
            <n-button 
                v-for="(range, label) in shortcuts" 
                :key="label"
                size="small"
                tertiary
                @click="handleShortcut(range)"
            >
                {{ label }}
            </n-button>
        </n-space>
    </div>
</template>
