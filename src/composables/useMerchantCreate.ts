import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import type { FormInst, FormRules } from 'naive-ui'

export function useMerchantCreate() {
    const router = useRouter()
    const message = useMessage()
    const formRef = ref<FormInst | null>(null)
    const loading = ref(false)

    const formModel = reactive({
        site_code: '',
        account: '',
        password: '',
        name: '',
        currency_type: 'TWD',
        percent: 80, // Default sensible value
        game_id_list: [1, 2, 3], // Mock all games selected
        level: 1 // Force Level 1 as per Phase 1 Refactor
    })

    // QA Challenge: Strict Validation Rules
    const rules: FormRules = {
        site_code: [
            { required: true, message: 'Site Code is required', trigger: 'blur' },
            {
                pattern: /^[A-Z]{3}$/,
                message: 'Must be exactly 3 uppercase letters (e.g. ABC)',
                trigger: ['input', 'blur']
            }
        ],
        account: [
            { required: true, message: 'Account is required', trigger: 'blur' },
            { min: 4, message: 'Minimum 4 characters', trigger: 'blur' }
        ],
        password: [
            { required: true, message: 'Password is required', trigger: 'blur' },
            { min: 6, message: 'Minimum 6 characters', trigger: 'blur' }
        ],
        name: [
            { required: true, message: 'Merchant Name is required', trigger: 'blur' }
        ],
        currency_type: [
            { required: true, message: 'Currency is required', trigger: 'blur' }
        ],
        percent: [
            { required: true, type: 'number', message: 'Percent is required', trigger: 'blur' },
            { type: 'number', min: 0, max: 100, message: 'Must be between 0 and 100', trigger: 'blur' }
        ]
    }

    const currencies = ['TWD', 'CNY', 'USD', 'VND', 'THB'].map(c => ({ label: c, value: c }))

    const handleSubmit = (e: MouseEvent) => {
        e.preventDefault()
        formRef.value?.validate(async (errors) => {
            if (!errors) {
                loading.value = true
                try {
                    const res = await fetch('/api/v2/agent/management/agents', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(formModel)
                    })

                    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`)

                    const data = await res.json()
                    if (data.code !== 0) {
                        // Handle specific business errors
                        if (data.code === 409) {
                            message.error('Site Code already exists. Please choose another one.')
                            return
                        }
                        throw new Error(data.msg || 'Creation failed')
                    }

                    message.success('Merchant Created Successfully')
                    router.push('/admin/merchant/list')
                } catch (err: unknown) {
                    console.error(err)
                    const errorMessage = err instanceof Error ? err.message : 'Error creating merchant'
                    message.error(errorMessage)
                } finally {
                    loading.value = false
                }
            } else {
                message.error('Please verify the form inputs')
            }
        })
    }

    return {
        formRef,
        formModel,
        rules,
        loading,
        currencies,
        handleSubmit
    }
}
