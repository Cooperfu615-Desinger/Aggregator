<script setup lang="ts">
import { darkTheme } from 'naive-ui'
import { NConfigProvider, NMessageProvider, NGlobalStyle, zhTW, dateZhTW, enUS, dateEnUS } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'

// Lead Dev Note:
// Using NConfigProvider to enforce Dark Theme globally.
// NMessageProvider is required for useMessage() composable.
// NGlobalStyle handles global style resets from Naive UI.

const { locale } = useI18n()

const naiveLocale = computed(() => {
  return locale.value === 'zh-TW' ? zhTW : enUS
})

const naiveDateLocale = computed(() => {
  return locale.value === 'zh-TW' ? dateZhTW : dateEnUS
})
</script>

<template>
  <n-config-provider :theme="darkTheme" :locale="naiveLocale" :date-locale="naiveDateLocale">
    <n-global-style />
    <n-message-provider>
      <div class="min-h-screen bg-[#18181c] text-white">
        <router-view />
      </div>
    </n-message-provider>
  </n-config-provider>
</template>
