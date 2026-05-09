<script setup>
  import { useDisplay } from 'vuetify'
  import { useTimerStore } from '@/stores/TimerStore.js'
  const timerStore = useTimerStore()
  const { mobile } = useDisplay()
</script>

<template>
  <div class="time-counter d-flex fs-12  align-center">
    <span
      class="mr-1 pa-1 text-right"
      :style="mobile ? { maxWidth: '130px' } : {}"
    >
      {{ $t('timer_info') }}
    </span>
    <span class="black-badge text-center pa-1">
      {{ timerStore.formattedTime }}
    </span>
  </div>
</template>

<style scoped lang="scss">
.time-counter {
  //max-width: 200px;
  line-height: 12px;
  width: fit-content;
}
</style>
