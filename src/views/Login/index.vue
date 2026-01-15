<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage, NCard, NForm, NFormItem, NInput, NButton } from 'naive-ui'
import { useAuthStore } from '../../stores/auth'

const router = useRouter()
const message = useMessage()
const authStore = useAuthStore()

const loading = ref(false)
const formRef = ref()
const model = ref({
    account: 'admin',
    password: 'admin'
})

const rules = {
    account: { required: true, message: 'Please enter account', trigger: 'blur' },
    password: { required: true, message: 'Please enter password', trigger: 'blur' }
}

const handleLogin = async () => {
    try {
        await formRef.value?.validate()
        loading.value = true

        const res = await fetch('/api/v2/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(model.value)
        })
        const data = await res.json()

        if (data.code === 0) {
            message.success('Login Successful')
            authStore.login(data.data.token, data.data.user)
            router.push('/dashboard')
        } else {
            message.error(data.msg || 'Login Failed')
        }
    } catch (e) {
        message.error('Network or Validation Error')
        console.error(e)
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
                    <h2 class="text-2xl font-bold mb-2">Game Platform Login</h2>
                    <p class="text-gray-400 text-sm">B2B Management System</p>
                </div>
            </template>
            
            <n-form
                ref="formRef"
                :model="model"
                :rules="rules"
                size="large"
            >
                <n-form-item path="account" label="Account">
                    <n-input v-model:value="model.account" placeholder="admin" @keydown.enter="handleLogin" />
                </n-form-item>
                
                <n-form-item path="password" label="Password">
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
                    Login
                </n-button>
            </n-form>
        </n-card>
    </div>
</template>
