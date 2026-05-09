<script setup>
  import { computed, defineEmits, defineProps } from 'vue'
  import skiIcon from '@/assets/ski-icon.svg'
  import snowboardIcon from '@/assets/snowboard-icon.svg'

  const props = defineProps({
    modelValue: {
      type: Boolean,
      default: false,
    },
    booking: {
      type: Object,
      default: null,
    },
    activityType: {
      type: String,
      default: 'ski',
    },
  })

  const emit = defineEmits(['update:modelValue', 'confirm'])

  function close () {
    emit('update:modelValue', false)
  }

  function confirm () {
    emit('confirm')
  }

  const activityIcon = computed(() => props.activityType === 'snowboard' ? snowboardIcon : skiIcon)

  // Helpers adapted from ClassesModal.vue
  function getBookingTitle (booking) {
    if (!booking) return ''
    switch (booking.type) {
      case 'individual': {
        return 'Zajęcia indywidualne'
      }
      case 'group': {
        return 'Zajęcia grupowe'
      }
      case 'shared': {
        return 'Zajęcia wspólne'
      }
      default: {
        return 'Zajęcia'
      }
    }
  }

  function getSubtitle (booking) {
    if (!booking) return ''
    if (booking.type === 'individual' || booking.type === 'shared') {
      if (booking.data.slot && booking.data.slot.instructor) {
        return `Instruktor: ${booking.data.slot.instructor}`
      }
    } else if (booking.type === 'group' && booking.data.group && booking.data.group.name) {
      return booking.data.group.name
    }
    return ''
  }

  function getDateTime (booking) {
    if (!booking) return ''

    // Date
    // booking.dateStr is "DD month YYYY" (e.g. "02 stycznia 2025") or "YYYY-MM-DD" depending on how it was saved.
    // The screenshot shows "02.01.2025".
    // Let's try to parse booking.dateStr

    // Time
    let time = ''
    if (booking.type === 'individual' || booking.type === 'shared') {
      if (booking.data.slot && booking.data.slot.time) {
        time = booking.data.slot.time
      }
    } else if (booking.type === 'group' && booking.data.group && booking.data.group.schedule) {
      time = booking.data.group.schedule
        .replace(/\s* od\s+/gi, ' ')
        .replace(/\s+ do\s+/gi, ' - ')
    }

    return `${booking.dateStr}, ${time}`
  }

  function getPrice (booking) {
    if (!booking) return ''
    let price = 0
    if (booking.type === 'individual' || booking.type === 'shared') {
      if (booking.data.slot && booking.data.slot.price) {
        price = booking.data.slot.price
      }
    } else if (booking.type === 'group' && booking.data.group && booking.data.group.price) {
      price = booking.data.group.price
    }
    return price ? `${price.toFixed(2).replace('.', ',')} zł` : ''
  }
</script>

<template>
  <VDialog
    content-class="delete-confirmation-modal"
    max-width="400"
    :model-value="modelValue"
    @update:model-value="close"
  >
    <VCard class="rounded-xl overflow-hidden">
      <!-- Header with gray background -->
      <div class="modal-header bg-gray-50 pa-5 border-bottom d-flex justify-space-between align-start">
        <span class="fs-18 font-weight-bold text-wrap text-primary-900 pr-4" style="line-height: 1.4;">
          Czy na pewno chcesz usunąć zajęcia z planu?
        </span>
        <VBtn
          class="mt-n1 mr-n2"
          color="grey"
          density="compact"
          icon="mdi-close"
          variant="text"
          @click="close"
        />
      </div>

      <div class="pa-5">
        <!-- Class Details Card -->
        <div v-if="booking" class="class-details-card pa-0 mb-6 d-flex align-center ga-3 rounded-lg border-none">
          <!-- Icon -->
          <div class="icon-wrapper mb-6">
            <img height="24" :src="activityIcon" width="24">
          </div>
          <div class="flex-grow-1 overflow-hidden">
            <div class="font-weight-bold text-primary-900 text-wrap mb-1 fs-12">
              {{ getBookingTitle(booking) }}
            </div>
            <div class="text-gray-600 text-wrap d-flex flex-column fs-9" style="line-height: 1.4;">
              <span v-if="getSubtitle(booking)">• {{ getSubtitle(booking) }}</span>
              <span>• {{ getDateTime(booking) }}</span>
            </div>
          </div>
          <div class="font-weight-bold text-no-wrap ml-2 fs-14 text-primary-900">
            {{ getPrice(booking) }}
          </div>
        </div>

        <div class="d-flex justify-end ga-3">
          <VBtn
            class="text-none border-gray text-primary-900 px-6"
            height="44"
            variant="outlined"
            @click="close"
          >
            Nie usuwaj
          </VBtn>
          <VBtn
            class="text-none text-white px-8"
            color="#DC2626"
            flat
            height="44"
            @click="confirm"
          >
            Usuń
          </VBtn>
        </div>
      </div>
    </VCard>
  </VDialog>
</template>

<style scoped lang="scss">
  .text-primary-900 {
    color: #111928;
  }

  .text-gray-600 {
    color: #4B5563;
  }

  .bg-gray-50 {
    background-color: #F9FAFB;
  }

  .border-bottom {
    border-bottom: 1px solid #E5E7EB;
  }

  .border {
    border: 1px solid #E5E7EB;
  }

  .border-none {
    border: none !important;
  }

  .border-gray {
    border-color: #E5E7EB !important;
  }

  .fs-14 {
    font-size: 14px;
  }

  .fs-18 {
    font-size: 18px;
  }
</style>
