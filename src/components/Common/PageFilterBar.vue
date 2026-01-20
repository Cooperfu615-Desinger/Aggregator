<script setup lang="ts">
import { NSpace, NButton, NInput, NIcon } from 'naive-ui'
import { SearchRound, RefreshRound } from '@vicons/material'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

interface Props {
    searchPlaceholder?: string
    searchValue?: string
    showSearch?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    searchPlaceholder: 'Search...',
    searchValue: '',
    showSearch: true
})

const emit = defineEmits<{
    (e: 'update:searchValue', value: string): void
    (e: 'search'): void
    (e: 'reset'): void
}>()

const handleSearchInput = (value: string) => {
    emit('update:searchValue', value)
}

const handleSearch = () => {
    emit('search')
}

const handleReset = () => {
    emit('reset')
}
</script>

<template>
    <div class="bg-slate-800/50 p-4 rounded-lg mb-6 border border-slate-700/50">
        <div class="flex flex-wrap gap-4 items-center">
            <!-- Search Input -->
            <div v-if="showSearch" class="flex-shrink-0">
                <n-input
                    :value="props.searchValue"
                    :placeholder="searchPlaceholder"
                    clearable
                    class="w-64"
                    @update:value="handleSearchInput"
                    @keydown.enter="handleSearch"
                >
                    <template #prefix>
                        <n-icon :component="SearchRound" class="text-gray-400" />
                    </template>
                </n-input>
            </div>

            <!-- Filter Slots -->
            <div class="flex flex-wrap gap-3 items-center flex-1">
                <slot name="filters"></slot>
            </div>

            <!-- Action Buttons -->
            <n-space class="flex-shrink-0">
                <slot name="actions"></slot>
                <n-button @click="handleReset" tertiary>
                    <template #icon>
                        <n-icon :component="RefreshRound" />
                    </template>
                    {{ t('common.reset') }}
                </n-button>
            </n-space>
        </div>
    </div>
</template>
