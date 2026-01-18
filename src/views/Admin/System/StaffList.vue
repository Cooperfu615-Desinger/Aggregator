<script setup lang="ts">
import { ref, onMounted, computed, h } from 'vue'
import { 
    NCard, NButton, NDataTable, NTag, NModal, NForm, NFormItem, NInput, NSelect,
    useMessage, type DataTableColumns 
} from 'naive-ui'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const message = useMessage()

interface Staff {
    id: number
    account: string
    role: string
    last_login: string
    status: 'active' | 'disabled'
}

const staffList = ref<Staff[]>([])
const loading = ref(false)
const showModal = ref(false)
// const formRef = ref<any>(null)

const formModel = ref({
    id: 0,
    account: '',
    role: 'Support',
    status: 'active'
})

const roles = ['Super Admin', 'Tech Lead', 'Finance', 'Support'].map(r => ({ label: r, value: r }))

const columns = computed<DataTableColumns<Staff>>(() => [
    { title: t('system.account'), key: 'account' },
    { 
        title: t('system.role'), 
        key: 'role',
        render: (row) => h(
            NTag, 
            { type: row.role === 'Super Admin' ? 'error' : 'info', bordered: false }, 
            { default: () => row.role }
        )
    },
    { title: t('system.lastLogin'), key: 'last_login' },
    { 
        title: t('finance.status'), // Reuse key
        key: 'status',
        render: (row) => h(
            NTag, 
            { type: row.status === 'active' ? 'success' : 'error', bordered: false }, 
            { default: () => row.status.toUpperCase() }
        )
    },
    {
        title: 'Action',
        key: 'action',
        render: (row) => h(
            NButton, 
            { size: 'small', onClick: () => editStaff(row) }, 
            { default: () => 'Edit' }
        )
    }
])

const fetchStaff = async () => {
    loading.value = true
    const res = await fetch('/api/v2/system/staff')
    const data = await res.json()
    staffList.value = data.data.list
    loading.value = false
}

const editStaff = (row: Staff) => {
    formModel.value = { ...row }
    showModal.value = true
}

const addStaff = () => {
    formModel.value = { id: 0, account: '', role: 'Support', status: 'active' }
    showModal.value = true
}

const handleSubmit = async () => {
    await fetch('/api/v2/system/staff', {
        method: 'POST',
        body: JSON.stringify(formModel.value)
    })
    message.success('Saved successfully')
    showModal.value = false
    fetchStaff()
}

onMounted(() => fetchStaff())
</script>

<template>
    <div class="p-6 space-y-4">
        <div class="flex justify-between items-center">
            <h1 class="text-2xl font-bold">{{ t('system.staffList') }}</h1>
            <n-button type="primary" @click="addStaff">{{ t('system.addStaff') }}</n-button>
        </div>

        <n-card>
            <n-data-table :columns="columns" :data="staffList" :loading="loading" />
        </n-card>

        <n-modal v-model:show="showModal" preset="card" :title="formModel.id ? 'Edit Staff' : 'Add Staff'" class="w-[500px]">
            <n-form ref="formRef" :model="formModel">
                <n-form-item :label="t('system.account')">
                    <n-input v-model:value="formModel.account" :disabled="!!formModel.id" />
                </n-form-item>
                <n-form-item :label="t('system.role')">
                    <n-select v-model:value="formModel.role" :options="roles" />
                </n-form-item>
                <n-form-item label="Status" v-if="formModel.id">
                    <n-select v-model:value="formModel.status" :options="[{label:'Active', value:'active'}, {label:'Disabled', value:'disabled'}]" />
                </n-form-item>
            </n-form>
            <div class="flex justify-end gap-2 mt-4">
                <n-button @click="showModal = false">Cancel</n-button>
                <n-button type="primary" @click="handleSubmit">Save</n-button>
            </div>
        </n-modal>
    </div>
</template>
