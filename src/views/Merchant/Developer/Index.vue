<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { 
    NCard, NButton, NTag, useMessage, NDynamicTags, NSpace, NAlert, NDivider
} from 'naive-ui'
import { useI18n } from 'vue-i18n'
import CopyableText from '../../../components/Common/CopyableText.vue'

const { t } = useI18n()
const message = useMessage()

const credentials = ref({
    merchant_code: '',
    secret_key: '',
    whitelist: [] as string[]
})
const loading = ref(false)

const fetchCreds = async () => {
    loading.value = true
    try {
        const res = await fetch('/api/v2/agent/credentials')
        const data = await res.json()
        credentials.value = data.data || { merchant_code: '', secret_key: '', whitelist: [] }
    } finally {
        loading.value = false
    }
}

const updateWhitelist = async (newList: string[]) => {
    credentials.value.whitelist = newList
    try {
        await fetch('/api/v2/agent/whitelist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ whitelist: newList })
        })
        message.success(t('developerCenter.whitelistUpdated'))
    } catch {
        message.error(t('developerCenter.whitelistFailed'))
    }
}

const openDocs = () => {
    window.open('https://docs.example.com/api', '_blank')
}

onMounted(() => fetchCreds())
</script>

<template>
    <div class="p-6 max-w-4xl">
        <h1 class="text-2xl font-bold mb-6 flex items-center gap-2">
            <span>🔧</span> {{ t('developerCenter.title') }}
        </h1>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- API Credentials Card -->
            <n-card :title="t('developerCenter.apiCredentials')" class="h-fit">
                <div class="space-y-5">
                    <!-- Merchant Code -->
                    <div>
                        <div class="text-sm text-gray-400 mb-2">{{ t('developerCenter.merchantCode') }}</div>
                        <CopyableText 
                            :text="credentials.merchant_code || 'Loading...'" 
                        />
                    </div>

                    <!-- Secret Key (Masked by default) -->
                    <div>
                        <div class="text-sm text-gray-400 mb-2">
                            {{ t('developerCenter.secretKey') }}
                            <n-tag size="small" type="warning" class="ml-2">{{ t('developerCenter.sensitive') }}</n-tag>
                        </div>
                        <CopyableText 
                            :text="credentials.secret_key || 'Loading...'" 
                            :masked="true"
                        />
                    </div>

                    <n-alert type="warning" :bordered="false">
                        <template #header>{{ t('developerCenter.securityNotice') }}</template>
                        {{ t('developerCenter.securityWarning') }}
                    </n-alert>
                </div>
            </n-card>

            <!-- IP Whitelist Card -->
            <n-card :title="t('developerCenter.ipWhitelist')" class="h-fit">
                <div class="space-y-4">
                    <p class="text-sm text-gray-400">
                        {{ t('developerCenter.ipWhitelistDesc') }}
                    </p>

                    <n-dynamic-tags
                        :value="credentials.whitelist"
                        @update:value="updateWhitelist"
                        :max="10"
                        :input-props="{ placeholder: t('developerCenter.addIpPlaceholder') }"
                    />

                    <p class="text-xs text-gray-500">
                        {{ t('developerCenter.ipTip') }}
                    </p>
                </div>
            </n-card>
        </div>

        <n-divider />

        <!-- API Documentation Section -->
        <n-card :title="t('developerCenter.apiDocs')">
            <div class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="bg-gray-800 border border-gray-700 p-4 rounded-lg">
                        <h4 class="font-medium mb-1 text-white">{{ t('developerCenter.quickStart') }}</h4>
                        <p class="text-sm text-gray-400">{{ t('developerCenter.quickStartDesc') }}</p>
                    </div>
                    <div class="bg-gray-800 border border-gray-700 p-4 rounded-lg">
                        <h4 class="font-medium mb-1 text-white">{{ t('developerCenter.apiReference') }}</h4>
                        <p class="text-sm text-gray-400">{{ t('developerCenter.apiReferenceDesc') }}</p>
                    </div>
                    <div class="bg-gray-800 border border-gray-700 p-4 rounded-lg">
                        <h4 class="font-medium mb-1 text-white">{{ t('developerCenter.sdkDownloads') }}</h4>
                        <p class="text-sm text-gray-400">{{ t('developerCenter.sdkDownloadsDesc') }}</p>
                    </div>
                </div>

                <n-space>
                    <n-button type="primary" @click="openDocs">
                        {{ t('developerCenter.viewDocs') }}
                    </n-button>
                    <n-button secondary>
                        {{ t('developerCenter.contactSupport') }}
                    </n-button>
                </n-space>
            </div>
        </n-card>
    </div>
</template>
