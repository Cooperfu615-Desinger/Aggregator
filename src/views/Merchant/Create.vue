<script setup lang="ts">
import { 
  NCard, NForm, NFormItem, NInput, NInputNumber, 
  NSelect, NButton, NDivider
} from 'naive-ui'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useMerchantCreate } from '../../composables/useMerchantCreate'

const router = useRouter()
const { t } = useI18n()
// @ts-ignore
const { formRef, formModel, rules, loading, currencies, handleSubmit } = useMerchantCreate()
</script>

<template>
  <div class="p-6 max-w-4xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-4">
      <n-button @click="router.back()">{{ t('common.back') }}</n-button>
      <h1 class="text-2xl font-bold">{{ t('merchant.createTitle') }}</h1>
    </div>

    <n-card>
      <n-form
        ref="formRef"
        :model="formModel"
        :rules="rules"
        label-placement="top"
        require-mark-placement="right-hanging"
        size="medium"
      >
        <div class="md:grid md:grid-cols-2 md:gap-6">
          
          <!-- Basic Info Column -->
          <div class="space-y-2">
            <h3 class="text-lg font-semibold mb-4 text-gray-300">{{ t('merchant.basicInfo') }}</h3>
            
            <n-form-item :label="t('merchant.siteCodeLabel')" path="site_code">
              <n-input 
                v-model:value="formModel.site_code" 
                :placeholder="t('merchant.siteCodePlaceholder')" 
                :maxlength="3"
                @input="(v) => formModel.site_code = v.toUpperCase()"
              />
            </n-form-item>

            <n-form-item :label="t('merchant.name')" path="name">
              <n-input v-model:value="formModel.name" :placeholder="t('merchant.displayName')" />
            </n-form-item>

            <n-form-item :label="t('merchant.adminAccount')" path="account">
              <n-input v-model:value="formModel.account" :placeholder="t('merchant.loginAccount')" />
            </n-form-item>

            <n-form-item :label="t('form.password')" path="password">
              <n-input 
                v-model:value="formModel.password" 
                type="password"
                show-password-on="click"
                :placeholder="t('merchant.initialPassword')" 
              />
            </n-form-item>
          </div>

          <!-- Finance Column -->
          <div class="space-y-2 mt-8 md:mt-0">
            <h3 class="text-lg font-semibold mb-4 text-gray-300">{{ t('merchant.financeConfig') }}</h3>
            
            <n-form-item :label="t('merchant.currencyType')" path="currency_type">
              <n-select v-model:value="formModel.currency_type" :options="currencies" />
            </n-form-item>

            <n-form-item :label="t('merchant.profitShare')" path="percent">
              <n-input-number 
                v-model:value="formModel.percent" 
                :min="0" 
                :max="100"
                class="w-full"
              >
                <template #suffix>%</template>
              </n-input-number>
            </n-form-item>
            
            <n-divider />
            
            <div class="bg-gray-800 p-4 rounded text-sm text-gray-400">
              <p>{{ t('merchant.noteInherit') }}</p>
              <p class="mt-2">{{ t('merchant.initialState') }}: <span class="text-green-400">{{ t('status.active') }}</span></p>
            </div>
          </div>
        
        </div>

        <n-divider />

        <div class="flex justify-end gap-4 mt-6">
           <n-button @click="router.back()">{{ t('common.cancel') }}</n-button>
           <n-button 
             type="primary" 
             attr-type="submit" 
             :loading="loading"
             @click="handleSubmit"
           >
             {{ t('merchant.create') }}
           </n-button>
        </div>

      </n-form>
    </n-card>
  </div>
</template>
