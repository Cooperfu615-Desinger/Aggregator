<script setup lang="ts">
import { ref, h } from 'vue'
import { 
  NCard, NForm, NFormItem, NInput, NDatePicker, NButton, 
  NDataTable, NTag, NModal, NCode 
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { useRoundSearch } from '../../composables/useRoundSearch'
import type { BetLog } from '../../types/report'

const { loading, searchModel, logs, handleSearch } = useRoundSearch()

// JSON Detail Modal State
const showDetail = ref(false)
const currentDetail = ref('')

const openDetail = (row: BetLog) => {
  currentDetail.value = JSON.stringify(row.game_detail, null, 2)
  showDetail.value = true
}

// Columns Configuration
const columns: DataTableColumns<BetLog> = [
  { title: 'Time', key: 'created_at', width: 180, 
    sorter: (row1, row2) => new Date(row1.created_at).getTime() - new Date(row2.created_at).getTime(),
    render: (row) => new Date(row.created_at).toLocaleString() 
  },
  { title: 'Round ID', key: 'id', width: 140, ellipsis: true, sorter: (row1, row2) => row1.id.localeCompare(row2.id) },
  { title: 'Player', key: 'player_account', width: 120, sorter: (row1, row2) => row1.player_account.localeCompare(row2.player_account) },
  { title: 'Game', key: 'game_name', width: 140, sorter: (row1, row2) => row1.game_name.localeCompare(row2.game_name) },
  { title: 'Bet', key: 'bet_amount', width: 100, 
    sorter: (row1, row2) => row1.bet_amount - row2.bet_amount, 
    render: (row) => row.currency + ' ' + row.bet_amount.toFixed(2) 
  },
  { title: 'Win', key: 'win_amount', width: 100, 
    sorter: (row1, row2) => row1.win_amount - row2.win_amount, 
    render: (row) => {
        const isWin = row.win_amount > 0
        return h(
            'span', 
            { class: isWin ? 'text-green-400 font-bold' : 'text-gray-400' }, 
            row.win_amount.toFixed(2)
        )
    }
  },
  { title: 'Profit', key: 'profit', width: 100,
    sorter: (row1, row2) => row1.profit - row2.profit,
    render: (row) => {
        const val = row.profit
        return h(
            NTag,
            { type: val >= 0 ? 'success' : 'error', bordered: false },
            { default: () => val.toFixed(2) }
        )
    }
  },
  {
    title: 'Action',
    key: 'actions',
    width: 100,
    render(row) {
      return h(
        NButton,
        {
          size: 'small',
          secondary: true,
          onClick: () => openDetail(row)
        },
        { default: () => 'View Detail' }
      )
    }
  }
]
</script>

<template>
  <div class="p-6 space-y-4">
    <h1 class="text-2xl font-bold">Round Search (Bet Logs)</h1>
    
    <!-- Search Filter -->
    <n-card size="small">
      <n-form inline :model="searchModel" label-placement="left">
        <n-form-item label="Time Range">
          <n-date-picker 
            v-model:value="searchModel.timeRange" 
            type="datetimerange" 
            clearable 
          />
        </n-form-item>
        <n-form-item label="Player ID">
          <n-input v-model:value="searchModel.playerId" placeholder="Exact Match" />
        </n-form-item>
        <n-form-item label="Round ID">
            <n-input v-model:value="searchModel.roundId" placeholder="Exact Match" />
        </n-form-item>
        <n-form-item>
          <n-button type="primary" @click="handleSearch" :loading="loading">
            Search
          </n-button>
        </n-form-item>
      </n-form>
    </n-card>

    <!-- Data Table -->
    <n-data-table
      :columns="columns"
      :data="logs"
      :loading="loading"
      :pagination="{ pageSize: 10 }"
      :bordered="false"
      class="bg-gray-900 rounded-lg"
    />

    <!-- Detail Modal -->
    <n-modal v-model:show="showDetail" preset="card" title="Raw Game Detail" style="width: 600px">
       <div class="bg-[#1e1e1e] p-4 rounded overflow-auto max-h-[500px]">
         <n-code :code="currentDetail" language="json" word-wrap />
       </div>
    </n-modal>
  </div>
</template>
