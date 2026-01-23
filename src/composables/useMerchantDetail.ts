import { ref } from 'vue'
import { useMessage } from 'naive-ui'
import type { MerchantDetail } from '../types/merchant'

export function useMerchantDetail() {
    const message = useMessage()
    const loading = ref(false)
    const saving = ref(false)
    const formModel = ref<MerchantDetail | null>(null)
    const error = ref<string | null>(null)

    async function fetchDetail(id: number) {
        loading.value = true
        error.value = null
        try {
            const response = await fetch(`/api/v2/agent/${id}`)
            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`)

            const res = await response.json()
            if (res.code !== 0) throw new Error(res.msg || 'Unknown API Error')

            formModel.value = res.data
        } catch (err: unknown) {
            console.error('Fetch Merchant Detail Error:', err)
            const errorMessage = err instanceof Error ? err.message : 'Failed to load merchant details'
            error.value = errorMessage
            message.error(errorMessage)
        } finally {
            loading.value = false
        }
    }

    async function updateDetail() {
        if (!formModel.value) return

        saving.value = true
        try {
            const response = await fetch('/api/v2/agent/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formModel.value)
            })

            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`)

            const res = await response.json()
            if (res.code !== 0) throw new Error(res.msg || 'Update failed')

            message.success('Merchant configuration updated successfully')
        } catch (err: unknown) {
            console.error('Update Merchant Error:', err)
            const errorMessage = err instanceof Error ? err.message : 'Failed to update configuration'
            message.error(errorMessage)
        } finally {
            saving.value = false
        }
    }

    const regenerateKey = () => {
        if (formModel.value) {
            // Mock client-side generation for preview, real logic should likely be a backend call
            formModel.value.secret_key = crypto.randomUUID()
            message.info('New secret key generated (unsaved)')
        }
    }

    return {
        loading,
        saving,
        formModel,
        error,
        fetchDetail,
        updateDetail,
        regenerateKey
    }
}
