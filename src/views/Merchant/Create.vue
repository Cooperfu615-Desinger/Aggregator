<script setup lang="ts">
import { 
  NCard, NForm, NFormItem, NInput, NInputNumber, 
  NSelect, NButton, NDivider
} from 'naive-ui'
import { useRouter } from 'vue-router'
import { useMerchantCreate } from '../../composables/useMerchantCreate'

const router = useRouter()
// @ts-ignore
const { formRef, formModel, rules, loading, currencies, handleSubmit } = useMerchantCreate()
</script>

<template>
  <div class="p-6 max-w-4xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-4">
      <n-button @click="router.back()">Back / Cancel</n-button>
      <h1 class="text-2xl font-bold">Create New Merchant</h1>
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
            <h3 class="text-lg font-semibold mb-4 text-gray-300">Basic Information</h3>
            
            <n-form-item label="Site Code (3 Uppercase Letters)" path="site_code">
              <n-input 
                v-model:value="formModel.site_code" 
                placeholder="e.g. ABC" 
                :maxlength="3"
                @input="(v) => formModel.site_code = v.toUpperCase()"
              />
            </n-form-item>

            <n-form-item label="Merchant Name" path="name">
              <n-input v-model:value="formModel.name" placeholder="Display Name" />
            </n-form-item>

            <n-form-item label="Admin Account" path="account">
              <n-input v-model:value="formModel.account" placeholder="Login Account" />
            </n-form-item>

            <n-form-item label="Password" path="password">
              <n-input 
                v-model:value="formModel.password" 
                type="password"
                show-password-on="click"
                placeholder="Initial Password" 
              />
            </n-form-item>
          </div>

          <!-- Finance Column -->
          <div class="space-y-2 mt-8 md:mt-0">
            <h3 class="text-lg font-semibold mb-4 text-gray-300">Finance Configuration</h3>
            
            <n-form-item label="Currency" path="currency_type">
              <n-select v-model:value="formModel.currency_type" :options="currencies" />
            </n-form-item>

            <n-form-item label="Profit Share (Percent)" path="percent">
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
              <p>Note: The created merchant will inherit games from the parent agent by default.</p>
              <p class="mt-2">Initial State: <span class="text-green-400">Active</span></p>
            </div>
          </div>
        
        </div>

        <n-divider />

        <div class="flex justify-end gap-4 mt-6">
           <n-button @click="router.back()">Cancel</n-button>
           <n-button 
             type="primary" 
             attr-type="submit" 
             :loading="loading"
             @click="handleSubmit"
           >
             Create Merchant
           </n-button>
        </div>

      </n-form>
    </n-card>
  </div>
</template>
