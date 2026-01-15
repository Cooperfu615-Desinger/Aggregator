<script setup lang="ts">
import { onMounted, h, type VNode } from 'vue'
import { 
    NCard, NBreadcrumb, NBreadcrumbItem, NDataTable, 
    NButton, NTag, NSpace 
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { useAgentList } from '../../composables/useAgentList'
import type { Agent } from '../../types/agent'

const { 
    loading, agents, breadcrumbs, 
    fetchAgents, handleDrillDown, handleBreadcrumbClick 
} = useAgentList()

// Columns
const columns: DataTableColumns<Agent> = [
    { title: 'ID', key: 'id', width: 80 },
    { title: 'Site Code', key: 'site_code', width: 100 },
    { title: 'Account', key: 'account', width: 150 },
    { 
        title: 'Level', 
        key: 'level', 
        width: 80,
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
        render: (row) => row.balance.toLocaleString() 
    },
    { 
        title: 'Percent', 
        key: 'percent', 
        width: 80,
        render: (row) => `${row.percent}%` 
    },
    { 
        title: 'State', 
        key: 'state', 
        width: 100,
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
            }

            actions.push(h(
                NButton,
                { size: 'small', quaternary: true },
                { default: () => 'Edit' }
            ))

            return h(NSpace, null, { default: () => actions })
        }
    }
]

onMounted(() => {
    fetchAgents()
})
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
    </div>
</template>
