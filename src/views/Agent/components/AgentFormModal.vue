<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { 
    NModal, NForm, NFormItem, NInput, NInputNumber,
    NSwitch, NButton, useMessage
} from 'naive-ui'
import { useI18n } from 'vue-i18n'
import type { FormRules } from 'naive-ui'
import type { Agent } from '../../../types/agent'

const props = defineProps<{
    show: boolean
    type: 'create' | 'edit'
    parentAgent: Agent | null // Context for creating sub-agent
    editData: Agent | null // Data for editing
}>()

const emit = defineEmits<{
    (e: 'update:show', value: boolean): void
    (e: 'refresh'): void
}>()

const message = useMessage()
const { t } = useI18n()
const loading = ref(false)
const formRef = ref()

const formModel = ref({
    account: '',
    password: '',
    site_code: '',
    percent: 0,
    state: true, // true: active, false: disabled
    memo: ''
})

// Validation Rules
const rules = computed<FormRules>(() => {
    const maxPercent = props.parentAgent ? props.parentAgent.percent : 100
    
    return {
        account: { required: true, message: t('form.required', { field: t('form.account') }), trigger: 'blur' },
        password: { required: props.type === 'create', message: t('form.required', { field: t('form.password') }), trigger: 'blur' },
        percent: [
            { required: true, type: 'number', message: t('form.required', { field: t('form.percent') }), trigger: 'blur' },
            { 
                validator: (_: any, value: number) => value <= maxPercent,
                message: t('form.maxPercent', { max: maxPercent }),
                trigger: ['blur', 'change']
            }
        ]
    }
})

// Initialize Form
watch(() => props.show, (newVal) => {
    if (newVal) {
        if (props.type === 'edit' && props.editData) {
            formModel.value = {
                account: props.editData.account,
                password: '', // Should be empty or handled separately
                site_code: props.editData.site_code,
                percent: props.editData.percent,
                state: props.editData.state === 'active',
                memo: ''
            }
        } else {
            // Create Mode
            formModel.value = {
                account: '',
                password: '',
                site_code: props.parentAgent?.site_code || '', // Inherit
                percent: 0,
                state: true,
                memo: ''
            }
        }
    }
})

const handleClose = () => {
    emit('update:show', false)
}

const handleSubmit = async () => {
    try {
        await formRef.value?.validate()
        loading.value = true
        
        const isCreate = props.type === 'create'
        const url = isCreate ? '/api/v1/agent/create' : '/api/v1/agent/update'
        const method = isCreate ? 'POST' : 'PUT'
        
        const payload = {
            ...formModel.value,
            parent_id: props.parentAgent?.id,
            id: props.editData?.id,
            state: formModel.value.state ? 'active' : 'disabled'
        }

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        const data = await res.json()

        if (data.code === 0) {
            message.success(data.msg || t('form.saveChanges') + ' Success')
            emit('refresh')
            handleClose()
        } else {
            message.error(data.msg || t('common.action') + ' Failed')
        }
    } catch (e) {
        // Validation error or Network error
        if (e instanceof Error) {
             console.error(e)
             // message.error(e.message) // Optional: show network error
        }
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <n-modal
        :show="show"
        @update:show="$emit('update:show', $event)"
        class="w-[600px]"
        preset="card"
        :title="type === 'create' ? t('agent.modalTitleCreate') : t('agent.modalTitleEdit')"
        size="huge"
        :bordered="false"
    >
        <n-form
            ref="formRef"
            :model="formModel"
            :rules="rules"
            label-placement="left"
            label-width="120"
            require-mark-placement="right-hanging"
        >
            <!-- Parent Info Context -->
            <n-form-item :label="t('agent.parentAgent')" v-if="parentAgent">
                <div class="text-gray-400">
                    {{ parentAgent.account }} (Max Percent: {{ parentAgent.percent }}%)
                </div>
            </n-form-item>

            <n-form-item :label="t('form.account')" path="account">
                <n-input v-model:value="formModel.account" :disabled="type === 'edit'" :placeholder="t('form.account')" />
            </n-form-item>

            <n-form-item label="Password" path="password" v-if="type === 'create'">
                <n-input 
                    v-model:value="formModel.password" 
                    type="password" 
                    show-password-on="click" 
                    :placeholder="t('form.password')" 
                />
            </n-form-item>

            <n-form-item label="Site Code" path="site_code">
                <n-input v-model:value="formModel.site_code" :disabled="!!parentAgent || type === 'edit'" placeholder="Inherited if sub-agent" />
            </n-form-item>

            <n-form-item :label="t('form.percent') + ' (%)'" path="percent">
                <n-input-number 
                    v-model:value="formModel.percent" 
                    :min="0" 
                    :max="100" 
                    :placeholder="t('form.percent')" 
                    class="w-full"
                >
                    <template #suffix>%</template>
                </n-input-number>
            </n-form-item>

            <n-form-item :label="t('form.state')" path="state">
                <n-switch v-model:value="formModel.state">
                    <template #checked>{{ t('status.active') }}</template>
                    <template #unchecked>{{ t('status.disabled') }}</template>
                </n-switch>
            </n-form-item>

             <n-form-item :label="t('form.memo')" path="memo">
                <n-input v-model:value="formModel.memo" type="textarea" :placeholder="t('form.memo')" />
            </n-form-item>

            <div class="flex justify-end gap-3 mt-6">
                <n-button @click="handleClose">{{ t('form.cancel') }}</n-button>
                <n-button type="primary" @click="handleSubmit" :loading="loading">
                    {{ type === 'create' ? t('form.create') : t('form.saveChanges') }}
                </n-button>
            </div>
        </n-form>
    </n-modal>
</template>
