<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { 
    useMessage, 
    NCard, 
    NForm, 
    NFormItem, 
    NInput, 
    NButton,
    NSpace,
    NDivider,
    NText
} from 'naive-ui'
import { useAuthStore } from '../../stores/auth'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const router = useRouter()
const message = useMessage()
const authStore = useAuthStore()

const loading = ref(false)
const formRef = ref()
const model = ref({
    username: '',
    password: ''
})

const rules = computed(() => ({
    username: { required: true, message: t('form.required', { field: t('login.account') }), trigger: 'blur' },
    password: { required: true, message: t('form.required', { field: t('login.password') }), trigger: 'blur' }
}))

const handleLogin = async () => {
    try {
        await formRef.value?.validate()
        loading.value = true

        const result = await authStore.login(model.value.username, model.value.password)

        if (result.success) {
            message.success('Login Successful')
            
            // Role-based redirect
            if (authStore.userRole === 'MASTER') {
                router.push('/admin/dashboard')
            } else if (authStore.userRole === 'MERCHANT') {
                router.push('/merchant/dashboard')
            } else {
                router.push('/admin/dashboard') // Fallback
            }
        } else {
            message.error(result.message || 'Login Failed')
        }
    } catch (e) {
        if (e instanceof Error) {
            console.error(e)
        }
        // Validation error - don't show extra message
    } finally {
        loading.value = false
    }
}

// Quick login helpers for demo
const quickLogin = (type: 'master' | 'merchant') => {
    if (type === 'master') {
        model.value.username = 'admin'
        model.value.password = 'admin123'
    } else {
        model.value.username = 'merchant'
        model.value.password = '123456'
    }
}
</script>

<template>
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <!-- Decorative background elements -->
        <div class="absolute inset-0 overflow-hidden pointer-events-none">
            <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
            <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        </div>

        <n-card class="w-[420px] shadow-2xl relative z-10 border border-slate-700/50 bg-slate-800/80 backdrop-blur-xl">
            <template #header>
                <div class="text-center py-2">
                    <div class="text-4xl mb-4">🎮</div>
                    <h1 class="text-2xl font-bold text-white mb-1">{{ t('login.appName') }}</h1>
                    <p class="text-slate-400 text-sm">{{ t('login.subtitle') }}</p>
                </div>
            </template>
            
            <n-form
                ref="formRef"
                :model="model"
                :rules="rules"
                size="large"
            >
                <n-form-item path="username" :label="t('login.account')">
                    <n-input 
                        v-model:value="model.username" 
                        :placeholder="t('login.placeholderUsername')"
                        @keydown.enter="handleLogin"
                    >
                        <template #prefix>
                            <span class="text-slate-400">👤</span>
                        </template>
                    </n-input>
                </n-form-item>
                
                <n-form-item path="password" :label="t('login.password')">
                    <n-input 
                        v-model:value="model.password" 
                        type="password" 
                        show-password-on="click" 
                        :placeholder="t('login.placeholderPassword')"
                        @keydown.enter="handleLogin"
                    >
                        <template #prefix>
                            <span class="text-slate-400">🔐</span>
                        </template>
                    </n-input>
                </n-form-item>

                <n-button 
                    type="primary" 
                    block 
                    :loading="loading" 
                    @click="handleLogin"
                    class="mt-4 h-12"
                    strong
                >
                    {{ loading ? t('login.authenticating') : t('login.submit') }}
                </n-button>
            </n-form>

            <n-divider class="!my-6">
                <n-text depth="3" class="text-xs">{{ t('login.quickLogin') }}</n-text>
            </n-divider>

            <n-space vertical :size="12">
                <n-button 
                    block 
                    secondary
                    @click="quickLogin('master')"
                    class="h-10"
                >
                    <template #icon>
                        <span>👑</span>
                    </template>
                    {{ t('login.masterAdmin') }} (admin / admin123)
                </n-button>
                
                <n-button 
                    block 
                    secondary
                    @click="quickLogin('merchant')"
                    class="h-10"
                >
                    <template #icon>
                        <span>💼</span>
                    </template>
                    {{ t('login.merchant') }} (merchant / 123456)
                </n-button>
            </n-space>

            <template #footer>
                <div class="text-center text-slate-500 text-xs">
                    Prototype v0.1.0 • Mock Authentication
                </div>
            </template>
        </n-card>
    </div>
</template>
