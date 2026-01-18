<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { 
    NCard, NSwitch, NInput, NSpace, NTag, NButton, useMessage 
} from 'naive-ui'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const message = useMessage()

const settings = ref({
    maintenance_mode: false,
    admin_whitelist: [] as string[]
})
const loading = ref(false)
const ipInput = ref('')

const fetchSettings = async () => {
    loading.value = true
    const res = await fetch('/api/v2/system/settings')
    const data = await res.json()
    settings.value = data.data
    loading.value = false
}

const saveSettings = async () => {
    loading.value = true
    await fetch('/api/v2/system/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings.value)
    })
    message.success('Settings updated successfully')
    loading.value = false
}

const addIp = () => {
    if (ipInput.value && !settings.value.admin_whitelist.includes(ipInput.value)) {
        settings.value.admin_whitelist.push(ipInput.value)
        ipInput.value = ''
    }
}

const removeIp = (ip: string) => {
    settings.value.admin_whitelist = settings.value.admin_whitelist.filter(i => i !== ip)
}

onMounted(() => fetchSettings())
</script>

<template>
    <div class="p-6 space-y-6 max-w-2xl">
        <div class="flex justify-between items-center">
            <h1 class="text-2xl font-bold">{{ t('system.settings') }}</h1>
            <n-button type="primary" :loading="loading" @click="saveSettings">
                {{ t('common.save') }}
            </n-button>
        </div>

        <n-card :title="t('system.maintenanceMode')">
            <div class="flex items-center justify-between">
                <span class="text-gray-400">
                    Enable maintenance mode to block all API requests (Service Unavailable 503).
                </span>
                <n-switch v-model:value="settings.maintenance_mode">
                    <template #checked>ON</template>
                    <template #unchecked>OFF</template>
                </n-switch>
            </div>
        </n-card>

        <n-card :title="t('system.whitelist')">
            <n-space vertical>
                <n-input 
                    v-model:value="ipInput" 
                    :placeholder="t('system.whitelistPlaceholder')" 
                    @keydown.enter="addIp"
                />
                <div class="flex flex-wrap gap-2 mt-2">
                    <n-tag 
                        v-for="ip in settings.admin_whitelist" 
                        :key="ip" 
                        closable 
                        @close="removeIp(ip)"
                    >
                        {{ ip }}
                    </n-tag>
                </div>
            </n-space>
        </n-card>
    </div>
</template>
