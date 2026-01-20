<script setup lang="ts">
import { ref, computed } from 'vue'
import { NButton, NIcon, useMessage } from 'naive-ui'
import { ContentCopyRound, VisibilityRound, VisibilityOffRound } from '@vicons/material'

interface Props {
    text: string
    masked?: boolean
    label?: string
}

const props = withDefaults(defineProps<Props>(), {
    masked: false,
    label: ''
})

const message = useMessage()
const copied = ref(false)
const revealed = ref(false)

// Display text - either full, masked, or revealed
const displayText = computed(() => {
    if (!props.masked) {
        return props.text
    }
    if (revealed.value) {
        return props.text
    }
    // Show masked version: first 8 chars + dots + last 4 chars
    if (props.text.length > 12) {
        return props.text.substring(0, 8) + '••••••••' + props.text.substring(props.text.length - 4)
    }
    return '••••••••••••'
})

const handleCopy = async () => {
    try {
        await navigator.clipboard.writeText(props.text)
        copied.value = true
        message.success('Copied to clipboard!')
        setTimeout(() => {
            copied.value = false
        }, 2000)
    } catch (e) {
        message.error('Failed to copy')
    }
}

const toggleReveal = () => {
    revealed.value = !revealed.value
}
</script>

<template>
    <div class="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2">
        <span v-if="label" class="text-sm text-gray-400 mr-2">{{ label }}</span>
        <code class="flex-1 font-mono text-sm select-all break-all text-gray-200">{{ displayText }}</code>
        
        <!-- Reveal toggle (only for masked) -->
        <n-button 
            v-if="masked"
            size="small" 
            quaternary 
            @click="toggleReveal"
        >
            <template #icon>
                <n-icon :component="revealed ? VisibilityOffRound : VisibilityRound" />
            </template>
        </n-button>
        
        <!-- Copy button -->
        <n-button 
            size="small" 
            :type="copied ? 'success' : 'default'"
            quaternary
            @click="handleCopy"
        >
            <template #icon>
                <n-icon :component="ContentCopyRound" />
            </template>
        </n-button>
    </div>
</template>
