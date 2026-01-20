<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { 
    NDrawer, NDrawerContent, NForm, NFormItem, NInput, 
    NSelect, NInputNumber, NButton, useMessage 
} from 'naive-ui'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
    show: boolean
}>()

const emit = defineEmits<{
    (e: 'update:show', value: boolean): void
    (e: 'refresh'): void
}>()

const { t } = useI18n()
const message = useMessage()
const formRef = ref()
const loading = ref(false)

const formValue = reactive({
    site_code: '', // Merchant Name (3 chars)
    account: '', // Merchant Login ID (auto generated or input?) -> "商戶代碼 (Login Code, Required)". Wait, user prompt said: "商戶代碼(3位大小字母)名稱改為"商戶名稱"". But prompt step 4 says: "商戶代碼 (Login Code, Required)".
    // So "Site Code" is "Merchant Name" (Display Name?).
    // And "Merchant Login Code" is needed.
    // Let's re-read Step 4:
    // "商戶名稱 (Required)" -> usually Name/Display Name.
    // "商戶代碼 (Login Code, Required)" -> This is likely `account` or a new field?
    // In Mock: `site_code` is 3 chars. `account` is username.
    // User Step 4: "商戶名稱", "商戶代碼(Login Code)".
    // In List View, I mapped `site_code` to "Merchant Name".
    // So "商戶名稱" in form -> `site_code`?
    // "商戶代碼 (Login Code)" -> `account`?
    // Let's assume:
    // Form Field "Merchant Name" -> `site_code` (validated as 3 uppercase chars? User said "3位大小字母" for the column "Merchant Name").
    // Form Field "Login Account" -> `account`.
    // But `name` field? User prompt "Remarks (原 name 欄位用途)". So `name` is remarks.
    // Form Field "Remarks" -> `remarks` (or `name` in payload).
    
    // Actually, looking at Step 2: `merchantId`: "商戶 ID" -> `display_id` (OP-xxxx auto gen).
    // `siteCodeLabel`: "商戶名稱" (Merchant Name).
    
    // So:
    // 1. Merchant Name (Input) -> `site_code` (3 chars uppercase).
    // 2. Login Code (Input) -> `account`.
    // 3. Currency
    // 4. Wallet Mode
    // 5. Revenue Share (InputNumber) -> `percent` (or revenue_share).
    // 6. Initial Password -> `password`.
    // 7. Remarks -> `remarks` (or `name` in payload if reusing).
    
    // In Create Payload:
    // site_code: string (Merchant Name)
    // account: string (Login Code)
    // password: string
    // currency_type: 'TWD'|'CNY'|'USD'
    // walletMode: 'seamless'|'transfer'
    // percent: number
    // remarks: string
    // name: string (map remarks to this?)
    
    password: '',
    currency_type: 'USD',
    walletMode: 'transfer',
    percent: 90.0,
    remarks: ''
})

const rules = {
    site_code: [
        { required: true, message: 'Required', trigger: 'blur' },
        { min: 3, max: 3, message: 'Must be 3 chars', trigger: 'blur' },
        { pattern: /^[A-Z]{3}$/, message: 'Must be uppercase letters', trigger: 'blur' }
    ],
    account: [
        { required: true, message: 'Required', trigger: 'blur' },
        { min: 4, message: 'Min 4 chars', trigger: 'blur' }
    ],
    password: [
        { required: true, message: 'Required', trigger: 'blur' }
    ],
    percent: [
        { required: true, type: 'number', min: 0, max: 100, message: '0-100', trigger: 'blur' }
    ]
}

const currencyOptions = [
    { label: 'USD', value: 'USD' },
    { label: 'CNY', value: 'CNY' },
    { label: 'TWD', value: 'TWD' }
]

const walletOptions = [
    { label: t('merchant.transfer'), value: 'transfer' },
    { label: t('merchant.seamless'), value: 'seamless' }
]

const handleClose = () => {
    emit('update:show', false)
}

const handleSubmit = async () => {
    formRef.value?.validate(async (errors: any) => {
        if (!errors) {
            loading.value = true
            try {
                // Mock API call
                const payload = {
                    ...formValue,
                    name: formValue.remarks, // Map remarks to name if name is repurposed
                    state: 1, // Default Active? User didn't specify, assume active.
                    // Wait, Step 5 says "唯一可以修改 Active/Suspended 的地方 (方案 B)". 
                    // Create usually creates Active.
                }

                const res = await fetch('/api/v2/agent/management/agents', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })
                const data = await res.json()
                
                if (data.code === 0) {
                    message.success(t('common.success'))
                    emit('refresh')
                    handleClose()
                } else {
                    message.error(data.msg || 'Error')
                }
            } catch (e) {
                message.error('System Error')
            } finally {
                loading.value = false
            }
        }
    })
}
</script>

<template>
    <n-drawer :show="show" :width="500" @update:show="(v) => emit('update:show', v)">
        <n-drawer-content :title="t('merchant.createTitle')" closable>
            <n-form ref="formRef" :model="formValue" :rules="rules" label-placement="left" label-width="120" require-mark-placement="right-hanging">
                
                <n-form-item :label="t('merchant.siteCodeLabel')" path="site_code">
                    <n-input v-model:value="formValue.site_code" placeholder="e.g. ABC" :maxlength="3" @input="(v) => formValue.site_code = v.toUpperCase()" />
                </n-form-item>

                <n-form-item :label="t('merchant.loginAccount')" path="account">
                    <n-input v-model:value="formValue.account" placeholder="Login Account" />
                </n-form-item>

                <n-form-item :label="t('merchant.initialPassword')" path="password">
                    <n-input v-model:value="formValue.password" type="password" show-password-on="click" />
                </n-form-item>

                <n-form-item :label="t('merchant.currency')" path="currency_type">
                    <n-select v-model:value="formValue.currency_type" :options="currencyOptions" />
                </n-form-item>

                <n-form-item :label="t('merchant.walletType')" path="walletMode">
                    <n-select v-model:value="formValue.walletMode" :options="walletOptions" />
                </n-form-item>

                <n-form-item :label="t('merchant.revenueShare')" path="percent">
                    <n-input-number v-model:value="formValue.percent" :min="0" :max="100" />
                    <span class="ml-2">%</span>
                </n-form-item>

                <n-form-item :label="t('merchant.remarks')" path="remarks">
                    <n-input v-model:value="formValue.remarks" type="textarea" />
                </n-form-item>

            </n-form>

            <template #footer>
                <div class="flex justify-end gap-2">
                    <n-button @click="handleClose">{{ t('common.cancel') }}</n-button>
                    <n-button type="primary" :loading="loading" @click="handleSubmit">{{ t('common.confirm') }}</n-button>
                </div>
            </template>
        </n-drawer-content>
    </n-drawer>
</template>
