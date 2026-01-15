<script setup lang="ts">
import { ref, watch } from 'vue'
import { NCard, NInputNumber, NSlider, NButton, useDialog, useMessage } from 'naive-ui'

// Props definitions to allow parent context usage
const props = defineProps<{
  merchantId?: number;
  value?: number; // v-model:value support
  showSaveButton?: boolean;
}>()

const emit = defineEmits<{
  (e: 'update:value', value: number): void
  (e: 'save'): void
}>()

const dialog = useDialog()
const message = useMessage()
const loading = ref(false)
const localRtpValue = ref<number>(props.value || 96)

watch(() => props.value, (newVal) => {
  if (newVal !== undefined) localRtpValue.value = newVal
})

watch(localRtpValue, (newVal) => {
  emit('update:value', newVal)
})

// Rules: 90 - 99
const minRtp = 90
const maxRtp = 99

// QA Challenge: What if API fails?
const handleSave = () => {
  // Validation
  if (localRtpValue.value < minRtp || localRtpValue.value > maxRtp) {
    message.error(`RTP must be between ${minRtp}% and ${maxRtp}%`)
    return
  }

  // Safety: Double Confirm
  dialog.warning({
    title: '⚠️ Critical Configuration Change',
    content: `You are about to change the Global RTP to ${localRtpValue.value}%. This will affect all future game rounds immediately. Are you absolutely sure?`,
    positiveText: 'DANGER: Confirm Change',
    negativeText: 'Cancel',
    onPositiveClick: async () => {
      await executeUpdate()
    }
  })
}

const executeUpdate = async () => {
  loading.value = true
  try {
    const res = await fetch('/api/v2/game/rtp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchant_id: props.merchantId,
        rtp: localRtpValue.value
      })
    })

    if (!res.ok) throw new Error('Network error')
    
    const data = await res.json()
    if (data.code !== 0) throw new Error(data.msg)

    message.success('RTP Configuration Updated: ' + localRtpValue.value + '%')
    emit('save')
  } catch (e: any) {
    message.error(e.message || 'Failed to update RTP')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <n-card title="Game Math Configuration (RTP)" size="small">
    <div class="space-y-6">
      
      <!-- Visual Feedback -->
      <div class="bg-gray-800 p-4 rounded-lg flex items-center justify-between">
        <div>
          <div class="text-gray-400 text-xs uppercase tracking-wider">Current Setting</div>
          <div class="text-2xl font-mono text-green-400 font-bold">{{ localRtpValue }}%</div>
        </div>
        <div class="text-right">
          <div class="text-gray-400 text-xs">Est. House Edge</div>
          <div class="text-xl font-mono text-red-400 font-bold">{{ (100 - localRtpValue).toFixed(2) }}%</div>
        </div>
      </div>

      <!-- Controls -->
      <div class="space-y-1">
        <label class="text-xs text-gray-500">Target RTP Percentage</label>
        <div class="flex gap-4 items-center">
          <div class="flex-1">
             <n-slider 
                v-model:value="localRtpValue" 
                :min="minRtp" 
                :max="maxRtp" 
                :step="0.1"
                :marks="{ 90: '90%', 95: '95%', 99: '99%' }"
             />
          </div>
          <div class="w-24">
            <n-input-number 
              v-model:value="localRtpValue" 
              :min="minRtp" 
              :max="maxRtp" 
              :step="0.1" 
              size="small"
            >
               <template #suffix>%</template>
            </n-input-number>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div v-if="showSaveButton" class="flex justify-end pt-4 border-t border-gray-700">
        <n-button 
          type="error" 
          secondary 
          :loading="loading"
          @click="handleSave"
        >
          Update RTP Configuration
        </n-button>
      </div>

    </div>
  </n-card>
</template>
