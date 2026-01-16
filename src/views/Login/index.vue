<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage, NCard, NForm, NFormItem, NInput, NButton } from 'naive-ui'
import { useAuthStore } from '../../stores/auth'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const message = useMessage()
const authStore = useAuthStore()
const { t } = useI18n()

const loading = ref(false)
const formRef = ref()
const model = ref({
    account: 'admin',
    password: 'admin'
})

const rules = computed(() => ({
    account: { required: true, message: t('login.account') + ' is required', trigger: 'blur' },
    password: { required: true, message: t('login.password') + ' is required', trigger: 'blur' }
}))

const handleLogin = async () => {
    try {
        await formRef.value?.validate()
        loading.value = true

        const res = await fetch('/api/v2/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(model.value)
        })

        const text = await res.text()
        let data
        try {
            data = JSON.parse(text)
        } catch (e) {
            console.error('Failed to parse JSON:', text)
            message.error(`API Error: ${res.status} ${res.statusText}`)
            return
        }

        if (data.code === 0) {
            message.success('Login Successful')
            authStore.login(data.data.token, data.data.user)
            router.push('/dashboard')
        } else {
            message.error(data.msg || 'Login Failed')
        }
    } catch (e) {
        if (e instanceof Error) {
            console.error(e)
            message.error(`System Error: ${e.message}`)
        } else {
             message.error('Unknown System Error')
        }
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <div class="min-h-screen flex items-center justify-center bg-gray-900">
        <n-card class="w-[400px] shadow-lg">
            <template #header>
                <div class="text-center">
                <div class="text-center">
                    <h2 class="text-2xl font-bold mb-2">{{ t('login.title') }}</h2>
                    <p class="text-gray-400 text-sm">{{ t('login.subtitle') }}</p>
                </div>
                </div>
            </template>
            
            <n-form
                ref="formRef"
                :model="model"
                :rules="rules"
                size="large"
            >
                <n-form-item path="account" :label="t('login.account')">
                    <n-input v-model:value="model.account" placeholder="admin" @keydown.enter="handleLogin" />
                </n-form-item>
                
                <n-form-item path="password" :label="t('login.password')">
                    <n-input 
                        v-model:value="model.password" 
                        type="password" 
                        show-password-on="click" 
                        placeholder="admin" 
                        @keydown.enter="handleLogin"
                    />
                </n-form-item>

                <n-button 
                    type="primary" 
                    block 
                    :loading="loading" 
                    @click="handleLogin"
                    class="mt-4"
                >
                    {{ t('login.submit') }}
                </n-button>
            </n-form>
        </n-card>
    </div>
</template>
