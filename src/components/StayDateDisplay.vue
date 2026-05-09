<script setup>
  import { useStayStore } from '@/stores/StayStore.js'
  import { formatDateRangeSimple } from '@/utils/dates.js'

  const stayStore = useStayStore()

</script>

<template>
  <p class="fs-11 fw-400">
    {{ $t('stay') }}: {{ formatDateRangeSimple(stayStore.dateOfStay) }}
  </p>
</template>

<style scoped lang="scss">

</style>
