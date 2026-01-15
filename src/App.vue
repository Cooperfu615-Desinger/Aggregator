<script setup lang="ts">
import { darkTheme } from 'naive-ui'
import { NConfigProvider, NMessageProvider, NGlobalStyle } from 'naive-ui'

/**
 * Lead Dev Note:
 * Using NConfigProvider to enforce Dark Theme globally.
 * NMessageProvider is required for useMessage() composable.
 * NGlobalStyle handles global style resets from Naive UI.
 */
</script>

<template>
  <n-config-provider :theme="darkTheme">
    <n-global-style />
    <n-message-provider>
      <div class="min-h-screen bg-[#18181c] text-white">
        <router-view />
      </div>
    </n-message-provider>
  </n-config-provider>
</template>
