<script setup lang="ts">
import { ref, h, onMounted } from 'vue'
import {
  NCard, NInput, NDatePicker, NSelect, NButton,
  NDataTable, NTag, NModal, NCode, NSpace
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { useRoundSearch } from '../../composables/useRoundSearch'
import type { BetLog } from '../../types/report'

// Reusing composable logic but will enhance local UI state
const { loading, searchModel, logs, handleSearch } = useRoundSearch()

// Initialize Search Model
onMounted(() => {
    handleSearch()
})

// Detailed Filters
const gameOptions = [
    { label: 'All Games', value: '' },
    { label: 'Fortune Tiger', value: 'Fortune Tiger' },
    { label: 'Super Ace', value: 'Super Ace' },
    { label: 'Gates of Olympus', value: 'Gates of Olympus' },
    { label: 'Sugar Rush', value: 'Sugar Rush' }
]

const statusOptions = [
    { label: 'All Status', value: '' },
    { label: 'Win', value: 'win' },
    { label: 'Loss', value: 'loss' },
    { label: 'Refund', value: 'refund' }
]

// Modal State
const showDetail = ref(false)
const detailedLog = ref<BetLog | null>(null)
const jsonContent = ref('')

const openDetail = (row: BetLog) => {
    detailedLog.value = row
    jsonContent.value = JSON.stringify(row.game_detail, null, 2)
    showDetail.value = true
}

// Columns
const columns: DataTableColumns<BetLog> = [
    { 
        title: 'Time', 
        key: 'created_at', 
        width: 180,
        sorter: (row1, row2) => new Date(row1.created_at).getTime() - new Date(row2.created_at).getTime(),
        render: (row) => new Date(row.created_at).toLocaleString() 
    },
    { 
        title: 'Round ID', 
        key: 'id', 
        width: 140, 
        ellipsis: true,
        render: (row) => h(
            'span', 
            { 
                class: 'text-primary cursor-pointer hover:underline',
                onClick: () => openDetail(row)
            }, 
            row.id
        ) 
    },
    { title: 'Account', key: 'player_account', width: 120 },
    { title: 'Game', key: 'game_name', width: 140 },
    { 
        title: 'Bet', 
        key: 'bet_amount', 
        width: 100,
        sorter: (row1, row2) => row1.bet_amount - row2.bet_amount,
        render: (row) => row.bet_amount.toFixed(2)
    },
    { 
        title: 'Win', 
        key: 'win_amount', 
        width: 100,
        sorter: (row1, row2) => row1.win_amount - row2.win_amount,
        render: (row) => h(
            'span',
            { class: row.win_amount > 0 ? 'text-green-400 font-bold' : 'text-gray-500' },
            row.win_amount.toFixed(2)
        )
    },
    { 
        title: 'Payout', 
        key: 'payout', 
        width: 100,
        sorter: (row1, row2) => row1.payout - row2.payout,
        render: (row) => {
            const isBigWin = row.payout >= 100
            return h(NSpace, { align: 'center', size: 4 }, {
                default: () => [
                    isBigWin ? '🔥' : '',
                    row.payout.toFixed(2) + 'x'
                ]
            })
        }
    },
    {
        title: 'Status',
        key: 'status',
        width: 100,
        render: (row) => {
            const map: Record<string, 'success' | 'error' | 'warning'> = {
                win: 'success',
                loss: 'error',
                refund: 'warning'
            }
            return h(
                NTag,
                { type: map[row.status] || 'default', bordered: false, size: 'small' },
                { default: () => row.status.toUpperCase() }
            )
        }
    },
    {
        title: 'Action',
        key: 'actions',
        width: 100,
        render: (row) => h(
            NButton,
            { size: 'small', secondary: true, onClick: () => openDetail(row) },
            { default: () => 'View Detail' }
        )
    }
]
</script>

<template>
  <div class="p-6 space-y-4">
    <div class="flex justify-between items-center">
        <h1 class="text-2xl font-bold">Bet Log Query System</h1>
        <n-button type="primary" dashed @click="handleSearch">Refresh</n-button>
    </div>

    <!-- Advanced Filter Bar -->
    <n-card size="small">
        <n-space vertical size="medium">
            <n-space>
                <n-date-picker 
                    v-model:value="searchModel.timeRange" 
                    type="datetimerange" 
                    clearable 
                    placeholder="Time Range (Default 24h)"
                    style="width: 340px"
                />
                <n-input 
                    v-model:value="searchModel.playerId" 
                    placeholder="Player Account (Fuzzy)" 
                    style="width: 200px"
                />
                 <n-input 
                    v-model:value="searchModel.roundId" 
                    placeholder="Round ID" 
                    style="width: 160px"
                />
            </n-space>
            <n-space>
                <n-select 
                    placeholder="Select Game" 
                    :options="gameOptions" 
                    clearable 
                    style="width: 200px" 
                />
                <n-select 
                    placeholder="Status" 
                    :options="statusOptions" 
                    clearable 
                    style="width: 150px" 
                />
                 <n-button type="primary" @click="handleSearch" :loading="loading">
                    Search Logs
                </n-button>
            </n-space>
        </n-space>
    </n-card>

    <!-- Data Table -->
    <n-data-table
        :columns="columns"
        :data="logs"
        :loading="loading"
        :pagination="{ pageSize: 15 }"
        class="bg-[#18181c] rounded-lg"
    />

    <!-- JSON Inspector Modal -->
    <n-modal v-model:show="showDetail" preset="card" :title="`Round Detail: ${detailedLog?.id}`" style="width: 800px">
        <div class="grid grid-cols-3 gap-4 h-[500px]">
            <!-- Left: Info Panel -->
            <div class="col-span-1 bg-gray-800 p-4 rounded space-y-4">
                <h3 class="font-bold text-lg border-b pb-2 border-gray-700">Summary</h3>
                
                <div class="grid grid-cols-2 gap-2 text-sm">
                    <span class="text-gray-400">Game:</span>
                    <span>{{ detailedLog?.game_name }}</span>
                    
                    <span class="text-gray-400">Bet:</span>
                    <span>{{ detailedLog?.bet_amount }}</span>
                    
                    <span class="text-gray-400">Win:</span>
                    <span :class="detailedLog?.win_amount! > 0 ? 'text-green-400' : ''">
                        {{ detailedLog?.win_amount }}
                    </span>

                    <span class="text-gray-400">Payout:</span>
                    <span>{{ detailedLog?.payout }}x</span>
                </div>
                
                <div v-if="detailedLog?.payout! >= 100" class="bg-red-900/30 p-2 rounded text-center border border-red-900">
                    <span class="text-xl">🔥 Big Win!</span>
                </div>
                <div v-if="detailedLog?.game_detail.free_games_triggered" class="bg-blue-900/30 p-2 rounded text-center border border-blue-900">
                    <span class="text-blue-300">Free Game Triggered</span>
                </div>
            </div>

            <!-- Right: JSON Code -->
            <div class="col-span-2 bg-[#1e1e1e] p-4 rounded overflow-auto relative font-mono text-xs">
                 <n-code :code="jsonContent" language="json" word-wrap />
            </div>
        </div>
    </n-modal>
  </div>
</template>
