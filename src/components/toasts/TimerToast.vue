<script setup>
  import ClockIcon from '@/assets/clock.svg'
  import { useTimerStore } from '@/stores/TimerStore.js'

  defineProps({
    timeExpireWarning: {
      type: String,
      required: true,
    },
    timeLeftLabel: {
      type: String,
      required: false,
    },
    showTimerBadge: {
      type: Boolean,
      default: true,
    },
  })

  const timerStore = useTimerStore()
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 12px;">
    <div style="display: flex; align-items: center; gap: 8px;">
      <img alt="clock" :src="ClockIcon" style="width: 32px; height: 32px;">
      <span style="font-size: 14px;">{{ timeExpireWarning }}</span>
    </div>
    <div style="font-size: 14px; padding-left: 40px;">
      <span>{{ timeLeftLabel }}</span>
      <span
        v-if="showTimerBadge"
        style="background: #000; color: #fff; padding: 4px 8px; border-radius: 4px; margin-left: 4px;"
      >
        {{ timerStore.formattedTime }}
      </span>
    </div>
  </div>
</template>
