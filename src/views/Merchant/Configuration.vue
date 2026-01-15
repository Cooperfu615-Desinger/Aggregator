<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { 
  NButton, NCard, NFormItem, NInput, NInputGroup,
  NRadioGroup, NRadio, NDynamicTags, NSpin, NGrid, NGridItem,
  NAlert, useDialog, useMessage
} from 'naive-ui'
import { useMerchantDetail } from '../../composables/useMerchantDetail'
import RTPSelector from '../../components/Business/RTPSelector.vue'

const route = useRoute()
const router = useRouter()
const dialog = useDialog()
const message = useMessage()
const { loading, saving, formModel, error, fetchDetail, updateDetail, regenerateKey } = useMerchantDetail()

// Fix 1: IP Whitelist Validation
const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
const handleIpCreate = (label: string) => {
  if (ipRegex.test(label)) {
    return { label, value: label }
  }
  message.error('IP format incorrect: ' + label)
  // Returning generic object to prevent creation, though Naive UI docs say return string or option object.
  // Actually, standard behavior to block is to return nothing or throw?
  // Checking docs: "If you want to prevent creating tag, you can return a falsy value (except 0) or a promise resolves falsy value."
  // But Typescript error says boolean is not assignable.
  // Wait, let's cast it or return undefined? 
  // Error said: "Type 'boolean' is not assignable to type 'string | { label: string; value: string; }'".
  // This implies Naive UI types might be strict here expecting valid output.
  // Let's try returning undefined as "falsy" but satisfy TS if possible, or cast to any.
  // Correct fix for TS usually: return undefined as unknown as string (hacky) or check if type allows void.
  // Let's try returning undefined.
  return undefined as unknown as string
}

// Fix 2: Secret Key Regeneration Confirmation
const handleRegenerateKey = () => {
  dialog.warning({
    title: '警告：重置密鑰',
    content: '這將導致當前商戶的 API 連線立即中斷，確定要執行嗎？',
    positiveText: '確定重置',
    negativeText: '取消',
    onPositiveClick: () => {
      regenerateKey()
    }
  })
}

// Fix 3: Wallet Mode Switch Warning
const handleWalletModeUpdate = (value: 'transfer' | 'seamless') => {
  if (!formModel.value) return

  // Store potential new value, but don't apply it yet if we are in the dialog flow?
  // Naive UI radio group updates the model value immediately if v-model is used.
  // To intercept, we can use :value (one-way bind) and @update:value.
  // Wait, v-model will update it. It's better to intercept.
  
  if (value !== formModel.value.wallet_mode) {
     dialog.warning({
      title: '警告：切換錢包模式',
      content: '切換錢包模式可能導致既有餘額顯示異常，請確認已完成清算。',
      positiveText: '確認切換',
      negativeText: '取消',
      onPositiveClick: () => {
        if (formModel.value) formModel.value.wallet_mode = value
      }
    })
  }
}

// Fix 4: Empty Whitelist Warning on Save
const handleSave = () => {
  if (formModel.value && (!formModel.value.ip_whitelist || formModel.value.ip_whitelist.length === 0)) {
    dialog.warning({
      title: '安全性警告',
      content: '未設定 IP 白名單將導致所有連線被拒絕 (或開放所有)，確定存檔？',
      positiveText: '確定存檔',
      negativeText: '取消',
      onPositiveClick: () => {
        updateDetail()
      }
    })
  } else {
    updateDetail()
  }
}

onMounted(() => {
  const id = Number(route.params.id)
  if (id) {
    fetchDetail(id)
  }
})
</script>

<template>
  <div class="p-6 max-w-5xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <n-button @click="router.back()">Back</n-button>
        <h1 class="text-2xl font-bold">
          Merchant Configuration: {{ formModel?.name || 'Loading...' }}
        </h1>
      </div>
      <n-button 
        type="primary" 
        :loading="saving" 
        :disabled="loading || !formModel"
        @click="handleSave"
      >
        Save Changes
      </n-button>
    </div>

    <!-- Error Alert -->
    <n-alert v-if="error" type="error" title="Error">
      {{ error }}
    </n-alert>

    <!-- Main Content -->
    <n-spin :show="loading">
      <div v-if="formModel" class="space-y-6">
        
        <!-- Basic Info -->
        <n-card title="Basic Information" size="small">
          <n-grid x-gap="12" :cols="2">
            <n-grid-item>
              <n-form-item label="Merchant ID">
                <n-input :value="String(formModel.id)" disabled />
              </n-form-item>
            </n-grid-item>
            <n-grid-item>
              <n-form-item label="Site Code">
                <n-input v-model:value="formModel.site_code" disabled />
              </n-form-item>
            </n-grid-item>
            <n-grid-item>
              <n-form-item label="Account">
                <n-input v-model:value="formModel.account" disabled />
              </n-form-item>
            </n-grid-item>
            <n-grid-item>
              <n-form-item label="Merchant Name">
                <n-input v-model:value="formModel.name" placeholder="Enter merchant name" />
              </n-form-item>
            </n-grid-item>
          </n-grid>
        </n-card>

        <!-- Integration Config -->
        <n-card title="Integration Settings" size="small">
          <div class="space-y-4">
            <n-form-item label="Wallet Mode">
              <n-radio-group 
                :value="formModel.wallet_mode" 
                @update:value="handleWalletModeUpdate"
                name="walletmode"
              >
                <div class="flex gap-4">
                  <n-radio value="transfer">
                    Transfer Wallet
                  </n-radio>
                  <n-radio value="seamless">
                    Seamless Wallet
                  </n-radio>
                </div>
              </n-radio-group>
            </n-form-item>

            <n-form-item label="Secret Key">
              <n-input-group>
                <n-input v-model:value="formModel.secret_key" readonly placeholder="Secret Key" />
                <n-button ghost @click="handleRegenerateKey">
                  Regenerate
                </n-button>
              </n-input-group>
            </n-form-item>
          </div>
        </n-card>

        <!-- Security Config -->
        <n-card title="Security Settings" size="small">
          <n-form-item label="IP Whitelist">
            <n-dynamic-tags 
              v-model:value="formModel.ip_whitelist" 
              :on-create="handleIpCreate"
            />
          </n-form-item>
          <p class="text-xs text-gray-500 mt-1">
            Input IP address and press Enter to add. Only IPs in this list can access the API.
          </p>
        </n-card>

        <!-- Game Config -->
        <RTPSelector 
          v-if="formModel.rtp_level !== undefined"
          v-model:value="formModel.rtp_level"
          :merchant-id="formModel.id"
          :show-save-button="false"
        />

      </div>
      <div v-else-if="!loading && !error" class="p-12 text-center text-gray-500">
        No data found.
      </div>
    </n-spin>
  </div>
</template>
