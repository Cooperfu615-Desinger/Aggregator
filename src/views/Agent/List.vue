<script setup lang="ts">
import { onMounted, h, ref, type VNode } from 'vue'
import { 
    NCard, NBreadcrumb, NBreadcrumbItem, NDataTable, 
    NButton, NTag, NSpace 
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { useAgentList } from '../../composables/useAgentList'
import type { Agent } from '../../types/agent'
import AgentFormModal from './components/AgentFormModal.vue'

const { 
    loading, agents, breadcrumbs, 
    fetchAgents, handleDrillDown, handleBreadcrumbClick 
} = useAgentList()

// Modal State
const showModal = ref(false)
const modalType = ref<'create' | 'edit'>('create')
const modalParent = ref<Agent | null>(null)
const modalEditData = ref<Agent | null>(null)

const handleAddSub = (parent: Agent) => {
    modalType.value = 'create'
    modalParent.value = parent
    modalEditData.value = null
    showModal.value = true
}

const handleEdit = (agent: Agent) => {
    modalType.value = 'edit'
    // Simplified: For edit, we relax parent validation or rely on backend
    modalParent.value = null 
    modalEditData.value = agent
    showModal.value = true
}

// Columns
const columns: DataTableColumns<Agent> = [
    { 
        title: 'ID', 
        key: 'id', 
        width: 80,
        sorter: (row1, row2) => row1.id - row2.id
    },
    { 
        title: 'Site Code', 
        key: 'site_code', 
        width: 100,
        sorter: (row1, row2) => row1.site_code.localeCompare(row2.site_code)
    },
    { 
        title: 'Account', 
        key: 'account', 
        width: 150,
        sorter: (row1, row2) => row1.account.localeCompare(row2.account)
    },
    { 
        title: 'Level', 
        key: 'level', 
        width: 80,
        sorter: (row1, row2) => row1.level - row2.level,
        render: (row) => h(
            NTag,
            { type: 'info', size: 'small', bordered: false },
            { default: () => `Lv.${row.level}` }
        )
    },
    { 
        title: 'Balance', 
        key: 'balance', 
        width: 120,
        sorter: (row1, row2) => row1.balance - row2.balance,
        render: (row) => row.balance.toLocaleString() 
    },
    { 
        title: 'Percent', 
        key: 'percent', 
        width: 80,
        sorter: (row1, row2) => row1.percent - row2.percent,
        render: (row) => `${row.percent}%` 
    },
    { 
        title: 'State', 
        key: 'state', 
        width: 100,
        sorter: (row1, row2) => (row1.state === 'active' ? 1 : 0) - (row2.state === 'active' ? 1 : 0),
        render: (row) => h(
            NTag,
            { type: row.state === 'active' ? 'success' : 'error', size: 'small', bordered: false },
            { default: () => row.state.toUpperCase() }
        )
    },
    {
        title: 'Actions',
        key: 'actions',
        render: (row) => {
            const actions: VNode[] = []
            
            // Drill down button (only if not max level, assume max is 3)
            if (row.level < 3) {
                actions.push(h(
                    NButton,
                    { 
                        size: 'small', 
                        type: 'primary', 
                        quaternary: true,
                        onClick: () => handleDrillDown(row)
                    },
                    { default: () => 'View Subs' }
                ))
                 
                // Add Sub-Agent Button
                actions.push(h(
                    NButton,
                    { 
                        size: 'small', 
                        type: 'info', 
                        quaternary: true,
                        onClick: () => handleAddSub(row)
                    },
                    { default: () => 'Add Sub' }
                ))
            }

            actions.push(h(
                NButton,
                { 
                    size: 'small', 
                    quaternary: true,
                    onClick: () => handleEdit(row)
                },
                { default: () => 'Edit' }
            ))

            return h(NSpace, null, { default: () => actions })
        }
    }
]

onMounted(() => {
    fetchAgents()
})

const handleRefresh = () => {
    // Refresh current level
    const lastCrumb = breadcrumbs.value[breadcrumbs.value.length - 1]
    if (lastCrumb) {
        fetchAgents(lastCrumb.id, lastCrumb.level)
    }
}
</script>

<template>
    <div class="p-6 space-y-4">
        <!-- Header & Breadcrumb -->
        <div class="flex flex-col gap-2">
            <h1 class="text-2xl font-bold">Agent Management</h1>
            <n-breadcrumb>
                <n-breadcrumb-item 
                    v-for="(crumb, index) in breadcrumbs" 
                    :key="index"
                    @click="handleBreadcrumbClick(crumb, index)"
                >
                    <span :class="{ 'cursor-pointer hover:text-primary': index !== breadcrumbs.length - 1 }">
                        {{ crumb.label }}
                    </span>
                </n-breadcrumb-item>
            </n-breadcrumb>
        </div>

        <!-- Table -->
        <n-card size="small">
            <n-data-table
                :columns="columns"
                :data="agents"
                :loading="loading"
                :pagination="{ pageSize: 15 }"
                class="bg-[#18181c] rounded-lg"
            />
        </n-card>

        <!-- Modal -->
        <AgentFormModal 
            v-model:show="showModal"
            :type="modalType"
            :parent-agent="modalParent"
            :edit-data="modalEditData"
            @refresh="handleRefresh"
        />
    </div>
</template>
