<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import { NDropdown, NButton, NIcon } from 'naive-ui'
import { LanguageOutlined } from '@vicons/material'

const { locale } = useI18n()

const options = [
    { label: '繁體中文', key: 'zh-TW' },
    { label: 'English', key: 'en' }
]

const handleSelect = (key: string) => {
    locale.value = key
    localStorage.setItem('locale', key)
}
</script>

<template>
    <n-dropdown :options="options" @select="handleSelect" trigger="click">
        <n-button quaternary circle>
            <template #icon>
                <n-icon size="24">
                    <LanguageOutlined />
                </n-icon>
            </template>
        </n-button>
    </n-dropdown>
</template>
