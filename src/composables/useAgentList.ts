import { ref } from 'vue'
import { useMessage } from 'naive-ui'
import type { Agent } from '../types/agent'

export interface BreadcrumbItem {
    label: string;
    id: number | null; // null for Root
    level: number;
}

export function useAgentList() {
    const message = useMessage()
    const loading = ref(false)
    const agents = ref<Agent[]>([])

    // Breadcrumb state: Start with Root
    const breadcrumbs = ref<BreadcrumbItem[]>([
        { label: 'Root', id: null, level: 0 }
    ])

    const fetchAgents = async (parentId: number | null = null, currentLevel: number = 0) => {
        loading.value = true
        try {
            // Build query params
            const params = new URLSearchParams()
            if (parentId) params.append('parent_id', String(parentId))
            params.append('level', String(currentLevel))

            const res = await fetch(`/api/v2/agents?${params.toString()}`)
            const data = await res.json()
            if (data.code === 0) {
                agents.value = data.data.list
            } else {
                message.error(data.msg || 'Failed to fetch agents')
            }
        } catch (e) {
            message.error('Network Error')
        } finally {
            loading.value = false
        }
    }

    const handleDrillDown = (agent: Agent) => {
        // Add to breadcrumb
        breadcrumbs.value.push({
            label: agent.account,
            id: agent.id,
            level: agent.level
        })
        // Fetch children
        fetchAgents(agent.id, agent.level)
    }

    const handleBreadcrumbClick = (item: BreadcrumbItem, index: number) => {
        // If clicking current level, do nothing
        if (index === breadcrumbs.value.length - 1) return

        // Slice breadcrumbs up to the clicked item
        breadcrumbs.value = breadcrumbs.value.slice(0, index + 1)

        // Fetch for that item
        fetchAgents(item.id, item.level)
    }

    return {
        loading,
        agents,
        breadcrumbs,
        fetchAgents,
        handleDrillDown,
        handleBreadcrumbClick
    }
}
