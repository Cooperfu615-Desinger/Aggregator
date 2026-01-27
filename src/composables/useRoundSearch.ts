import { ref } from 'vue'
import { useMessage } from 'naive-ui'
import { useSessionStorage } from '@vueuse/core'
import { format } from 'date-fns'
import type { BetLog } from '../types/report'

export function useRoundSearch() {
    const message = useMessage()
    const loading = ref(false)
    const logs = ref<BetLog[]>([])

    // QA Fix: Use SessionStorage for filter persistence
    const searchModel = useSessionStorage('master-bet-log-search', {
        timeRange: null as [number, number] | null,
        playerId: '',
        roundId: '',
        // Aggregator filters
        merchantCode: '',
        provider: '',
        currency: ''
    })

    // Columns definition could be here or in component. 
    // Keeping in component for templating ease usually, but clean architecture logic here.

    const fetchLogs = async () => {
        loading.value = true
        try {
            // QA Fix: Format dates to yyyy-MM-dd to avoid timezone issues
            const payload: any = { ...searchModel.value }
            if (payload.timeRange) {
                payload.startTime = format(payload.timeRange[0], 'yyyy-MM-dd')
                payload.endTime = format(payload.timeRange[1], 'yyyy-MM-dd')
                delete payload.timeRange
            }

            const res = await fetch('/api/v2/report/bet-logs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            const data = await res.json()
            if (data.code === 0) {
                logs.value = data.data.list
            } else {
                message.error(data.msg || 'Query failed')
            }
        } catch (e) {
            message.error('Network Error')
        } finally {
            loading.value = false
        }
    }

    const handleSearch = () => {
        fetchLogs()
    }

    return {
        loading,
        searchModel,
        logs,
        handleSearch
    }
}
