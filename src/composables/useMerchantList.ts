import { ref } from 'vue'
import type { Merchant } from '../types/merchant'

export function useMerchantList() {
    const loading = ref(false)
    const list = ref<Merchant[]>([])
    const error = ref<string | null>(null)

    // Basic pagination state (mocked)
    const pagination = ref({
        page: 1,
        pageSize: 20,
        itemCount: 0,
        pageCount: 1
    })

    async function fetchList(params: { level?: number, parent_id?: number, search?: string } = { level: 1 }) {
        loading.value = true
        error.value = null
        try {
            // Build query params
            const query = new URLSearchParams()
            if (params.level) query.append('level', params.level.toString())
            if (params.parent_id) query.append('parent_id', params.parent_id.toString())
            if (params.search) query.append('search', params.search)

            // Using fetch as requested (no axios)
            const response = await fetch(`/api/v2/agent/list?${query.toString()}`)

            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`)
            }

            const res = await response.json()

            if (res.code !== 0) {
                throw new Error(res.msg || 'Unknown API Error')
            }

            list.value = res.data.list
            pagination.value.itemCount = res.data.total
            // If backend doesn't return pageCount, calculate it
            pagination.value.pageCount = Math.ceil(res.data.total / pagination.value.pageSize)

        } catch (err: any) {
            console.error('Fetch Merchant List Error:', err)
            error.value = `API Error: ${err.message || err}`
        } finally {
            loading.value = false
        }
    }

    return {
        loading,
        list,
        pagination,
        error,
        fetchList
    }
}
