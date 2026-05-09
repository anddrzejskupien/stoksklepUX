<script setup>
  import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useDisplay } from 'vuetify'
  import arrowLeft from '@/assets/arrow_left.svg'
  import arrowRight from '@/assets/arrow_right.svg'
  import calendarIcon from '@/assets/calendar-plus.svg'
  import checkCircleIcon from '@/assets/check-circle.svg'
  import skiLOGO from '@/assets/ski-icon.svg'
  import snowboardLOGO from '@/assets/snowboard-icon.svg'
  import UserIcon from '@/assets/user.svg'
  import UsersGroupIcon from '@/assets/users-group.svg'
  import UsersIcon from '@/assets/users.svg'
  import AddClassesModal from '@/components/modals/AddClassesModal.vue'
  import DeleteClassConfirmationModal from '@/components/modals/DeleteClassConfirmationModal.vue'
  import { useToast } from '@/composables/useToast.js'
  import { usePickedClassesStore } from '@/stores/PickedClassesStore.js'
  import { useStayStore } from '@/stores/StayStore.js'

  const props = defineProps({
    modelValue: { type: Boolean, default: false },
    participant: { type: Object, default: null },
    activityType: { type: String, default: 'ski' },
    index: { type: Number, default: 0 },
    name: { type: String, default: '' },
    subtitle: { type: String, default: '' },
    participantType: { type: String, default: '' },
    age: { type: [Number, String], default: undefined },
    completed: { type: Boolean, default: false },
    totalPrice: { type: Number, default: undefined },
    currency: { type: String, default: '' },
  })
  const emit = defineEmits(['update:modelValue', 'save'])
  const { mobile, mdAndDown } = useDisplay()
  const { t, locale } = useI18n()
  const { showSimpleToast, showIncompleteBookingToast } = useToast()
  const stayStore = useStayStore()
  const pickedClassesStore = usePickedClassesStore()

  function close () {
    emit('update:modelValue', false)
  }
  const iconSrc = computed(() => props.activityType === 'snowboard' ? snowboardLOGO : skiLOGO)
  const displaySubtitle = computed(() => {
    const typeLabel = t(props.participantType || 'adult')
    const activityLabel = props.activityType === 'snowboard' ? t('snowboard') : t('ski')
    return `${typeLabel} - ${activityLabel}`
  })

  const carouselIndex = ref(0)
  const autoSlideTimeout = ref(null)

  watch(() => props.modelValue, val => {
    if (!val && autoSlideTimeout.value) {
      clearTimeout(autoSlideTimeout.value)
      autoSlideTimeout.value = null
    }
  })

  watch(() => props.participant, () => {
    carouselIndex.value = 0
    if (autoSlideTimeout.value) {
      clearTimeout(autoSlideTimeout.value)
      autoSlideTimeout.value = null
    }
  })

  onUnmounted(() => {
    if (autoSlideTimeout.value) {
      clearTimeout(autoSlideTimeout.value)
    }
  })

  const days = computed(() => {
    const result = []
    let startDate, endDate

    if (Array.isArray(stayStore.dateOfStay) && stayStore.dateOfStay.length > 0) {
      startDate = new Date(stayStore.dateOfStay[0])
      endDate = stayStore.dateOfStay[1] ? new Date(stayStore.dateOfStay[1]) : new Date(startDate)
    } else if (stayStore.dateOfStay) {
      startDate = new Date(stayStore.dateOfStay)
      endDate = new Date(startDate)
    } else {
      // Fallback
      startDate = new Date()
      endDate = new Date()
      endDate.setDate(startDate.getDate() + 4)
    }

    // Calculate number of days
    const diffTime = Math.abs(endDate - startDate)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1

    for (let i = 0; i < diffDays; i++) {
      const d = new Date(startDate)
      d.setDate(d.getDate() + i)
      const dayName = d.toLocaleDateString(locale.value === 'pl' ? 'pl-PL' : 'en-US', { weekday: 'long' })
      const dateStr = d.toLocaleDateString(locale.value === 'pl' ? 'pl-PL' : 'en-US', { day: '2-digit', month: 'long', year: 'numeric' })
      const dateIso = d.toISOString().split('T')[0]
      result.push({ dayName, dateStr, dateIso })
    }
    return result
  })

  const hasAnyBookedClasses = computed(() => {
    if (!props.participant?.dynamicId) return false
    return pickedClassesStore.bookedClasses.some(c => c.participantId === props.participant.dynamicId)
  })

  function prevDay () {
    carouselIndex.value = Math.max(0, carouselIndex.value - 1)
  }
  function nextDay () {
    carouselIndex.value = Math.min(days.value.length - 1, carouselIndex.value + 1)
  }

  const showAddClassesModal = ref(false)
  const showDeleteConfirmationModal = ref(false)
  const classToDelete = ref(null)
  const selectedDateForAdd = ref('')
  const selectedDateForAddIso = ref('')
  const currentDayForBooking = ref(null)

  function openDeleteConfirmation (booking) {
    classToDelete.value = booking
    showDeleteConfirmationModal.value = true
  }

  function confirmDeleteClass () {
    if (classToDelete.value) {
      pickedClassesStore.removeBookedClass(classToDelete.value.id)
      showDeleteConfirmationModal.value = false
      classToDelete.value = null
    }
  }

  function openAddClassesModal (day) {
    currentDayForBooking.value = day
    selectedDateForAdd.value = `${day.dayName.charAt(0).toUpperCase() + day.dayName.slice(1)} ${day.dateStr}`
    selectedDateForAddIso.value = day.dateIso
    showAddClassesModal.value = true
  }

  async function handleAddClassesNext (payload) {
    const { type, data } = payload

    if (currentDayForBooking.value) {
      // Handle shared classes - add for all selected participants
      if (type === 'shared' && data.participants && Array.isArray(data.participants)) {
        for (const pId of data.participants) {
          const booking = {
            participantId: pId,
            dateStr: currentDayForBooking.value.dateStr,
            type,
            data,
          }
          pickedClassesStore.addBookedClass(booking)
        }
      } else if (type === 'group' && props.participant && data.group && data.group.description) {
        // Handle group classes - add for multiple days
        const groupBookingId = `group-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

        if (data.group.classDates && Array.isArray(data.group.classDates)) {
          const totalDays = data.group.classDates.length

          for (const [index, dateStr] of data.group.classDates.entries()) {
            // dateStr should be 'YYYY-MM-DD'
            // We need to format it to display format if needed, but the store uses dateStr as key usually?
            // Actually getBookedClass uses dateStr matching 'day.dateStr' which is 'DD month YYYY' in Polish/English
            // So we need to convert 'YYYY-MM-DD' to the display format used in 'days' array.

            const d = new Date(dateStr)
            const displayDateStr = d.toLocaleDateString(locale.value === 'pl' ? 'pl-PL' : 'en-US', { day: '2-digit', month: 'long', year: 'numeric' })

            const booking = {
              participantId: props.participant.dynamicId,
              dateStr: displayDateStr,
              type,
              groupBookingId,
              data: {
                ...data,
                groupDayIndex: index + 1,
                groupTotalDays: totalDays,
              },
            }
            pickedClassesStore.addBookedClass(booking)
          }
        } else {
          // Fallback to old regex method if classDates not present (should not happen with new data)
          const match = data.group.description.match(/(\d+)\s+dni/)
          const duration = match ? Number.parseInt(match[1], 10) : 1
          const startIndex = days.value.findIndex(d => d.dateStr === currentDayForBooking.value.dateStr)

          if (startIndex !== -1) {
            for (let i = 0; i < duration; i++) {
              if (startIndex + i < days.value.length) {
                const day = days.value[startIndex + i]
                const booking = {
                  participantId: props.participant.dynamicId,
                  dateStr: day.dateStr,
                  type,
                  groupBookingId,
                  data: {
                    ...data,
                    groupDayIndex: i + 1,
                    groupTotalDays: duration,
                  },
                }
                pickedClassesStore.addBookedClass(booking)
              }
            }
          }
        }
      } else if (props.participant) {
        // Handle individual classes - add for current participant only
        const booking = {
          participantId: props.participant.dynamicId,
          dateStr: currentDayForBooking.value.dateStr,
          type,
          data,
        }
        pickedClassesStore.addBookedClass(booking)
      }
    }

    showAddClassesModal.value = false
    await nextTick()

    if (currentDayForBooking.value) {
      showSimpleToast(t('classes_added_to_plan') || 'Zajęcia zostały dodane do planu', 'info')
    }

    if (mdAndDown.value) {
      const allDaysBooked = days.value.every(day => hasBookedClasses(day))

      if (!allDaysBooked) {
        if (autoSlideTimeout.value) clearTimeout(autoSlideTimeout.value)
        autoSlideTimeout.value = setTimeout(() => {
          nextDay()
        }, 2000)
      }
    }
  }

  function handleSave () {
    const allDaysBooked = days.value.every(day => hasBookedClasses(day))

    if (allDaysBooked) {
      emit('save')
    } else {
      showIncompleteBookingToast(
        () => {
          // Stay in modal
        },
        () => {
          emit('save')
        },
      )
    }
  }

  function getBookedClasses (day) {
    return pickedClassesStore.getBookedClasses(props.participant?.dynamicId, day.dateStr)
  }

  function hasBookedClasses (day) {
    const classes = getBookedClasses(day)
    return classes && classes.length > 0
  }

  function getGroupProgress (booking) {
    if (booking.type !== 'group') return ''

    if (booking.data.groupDayIndex && booking.data.groupTotalDays) {
      return `(${booking.data.groupDayIndex}/${booking.data.groupTotalDays})`
    }

    if (!booking.data.group || !booking.data.group.description) return ''
    const match = booking.data.group.description.match(/(\d+)\s+dni/)
    if (match) {
      // For now default to 1/X as we don't track day index in mock
      return `(1/${match[1]})`
    }
    return ''
  }

  // Helper to get slot time if available
  function getBookingTime (booking) {
    if (!booking) return ''

    // If slot object is available in data
    if (booking.type === 'individual' || booking.type === 'shared') {
      if (booking.data.slot && booking.data.slot.time) {
        return booking.data.slot.time
      }
      // Fallback (if slot is just ID)
      const slotId = booking.data.slot
      const allSlots = pickedClassesStore.availableSlots
      const found = allSlots.find(s => s.id === slotId)
      if (found) return found.time
    } else if (booking.type === 'group' && booking.data.group && booking.data.group.schedule) {
      // remove "od " and "do " for cleaner look
      return booking.data.group.schedule
        .replace(/\s* od\s+/gi, ' ')
        .replace(/\s+ do\s+/gi, ' - ')
        .replace(/\s+ oraz \s+/gi, ', ')
    }
    return ''
  }

  function getBookingPrice (booking) {
    if (!booking) return ''
    if (booking.type === 'individual' || booking.type === 'shared') {
      if (booking.data.slot && booking.data.slot.price) {
        return `${booking.data.slot.price.toFixed(2).replace('.', ',')}zł`
      }
    } else if (booking.type === 'group' && booking.data.group && booking.data.group.price) {
      return `${booking.data.group.price.toFixed(2).replace('.', ',')}zł`
    }
    return ''
  }

  function getBookingSubtitle (booking) {
    if (!booking) return ''
    if (booking.type === 'individual' || booking.type === 'shared') {
      if (booking.data.slot && booking.data.slot.instructor) {
        return booking.data.slot.instructor
      }
    } else if (booking.type === 'group' && booking.data.group && booking.data.group.name) {
      return booking.data.group.name
    }
    return ''
  }

  function getBookingColorClass (booking) {
    if (!booking) return ''
    if (booking.type === 'group') return 'booking-card--group'
    return 'booking-card--individual'
  }

  function getBookingIcon (booking) {
    if (!booking) return null
    if (booking.type === 'individual') return UserIcon
    if (booking.type === 'shared') return UsersIcon
    if (booking.type === 'group') return UsersGroupIcon
    return UserIcon
  }

  function getBookingTitle (booking) {
    if (!booking) return ''

    switch (booking.type) {
      case 'individual': {
        return 'Zajęcia indywidualne'
      }
      case 'group': {
        const progress = getGroupProgress(booking)
        return `Zajęcia grupowe ${progress}`.trim()
      }
      case 'shared': {
        return 'Zajęcia wspólne'
      }
      default: {
        return 'Zajęcia'
      }
    }
  }
</script>

<template>
  <VDialog
    content-class="under-app-bar"
    fullscreen
    :model-value="modelValue"
    scrollable
    @update:model-value="emit('update:modelValue', $event)"
  >

    <VCard>
      <VCardTitle class="px-0">
        <div class="main-container">
          <p class="font-weight-medium fs-14 mt-4 text-gray-700">Wybierasz zajęcia dla:</p>
          <div class="d-flex justify-space-between align-center user-info-container mt-2" :class="mobile ? 'fs-16 ':''">
            <div class="d-flex align-start justify-start ga-2">
              <img
                alt=""
                class="mt-1"
                height="24"
                :src="iconSrc"
                width="24"
              >
              <div>
                <p class="fw-600 text-primary-900 mb-1 fs-30 line-height-1">{{ participant?.name || '-' }}</p>
                <span class="fw-600 d-flex flex-column fs-12 text-black55 font-weight-semibold">{{ displaySubtitle }}</span>
              </div>
            </div>
          </div>
        </div>
      </VCardTitle>
      <VCardText class="px-0">
        <div class="mb-4">
          <div class="main-container slider-controls d-flex align-center justify-space-between mb-2">
            <img
              alt="Previous day"
              class="nav-icon"
              :class="{ 'disabled-icon': carouselIndex === 0 }"
              height="12"
              :src="arrowLeft"
              width="12"
              @click="prevDay"
            >
            <span class="fs-16 font-weight-medium text-gray-900">{{ t('select_day') || 'Wybór dnia' }}</span>
            <img
              alt="Next day"
              class="nav-icon"
              :class="{ 'disabled-icon': carouselIndex === days.length - 1 }"
              height="12"
              :src="arrowRight"
              width="12"
              @click="nextDay"
            >
          </div>
          <VSlideGroup v-model="carouselIndex" center-active class="day-slider px-0 slider-breakout" :show-arrows="false">
            <VSlideGroupItem v-for="(day, idx) in days" :key="idx" :value="idx">
              <VCard
                class="ma-2 day-card"
                :class="{ 'day-card--booked': hasBookedClasses(day) }"
                elevation="0"
              >
                <VCardText class="class-card">
                  <div class="d-flex justify-start align-start border-bottom flex-column">
                    <span class="fs-12 text-primary-08 d-flex justify-end w-100">{{ idx + 1 }}/{{ days.length }}</span>

                    <div v-if="hasBookedClasses(day)" class="d-flex align-center ga-3 w-100">
                      <img
                        alt="Selected"
                        height="20"
                        :src="checkCircleIcon"
                        width="20"
                      >
                      <div class="fw-600 text-primary-900 fs-18">
                        {{ day.dayName.charAt(0).toUpperCase() + day.dayName.slice(1, 3) }}. {{ day.dateStr }}
                      </div>
                    </div>

                    <div v-else class="d-flex align-center ga-2">
                      <img
                        alt=""
                        height="16"
                        :src="calendarIcon"
                        width="16"
                      >
                      <div class="ml-2">
                        <span class="fw-600 text-primary-900">{{ day.dayName.charAt(0).toUpperCase() + day.dayName.slice(1) }}</span>
                        <div class="mt-1 text-primary-08">{{ day.dateStr }}</div>
                      </div>
                    </div>
                  </div>

                  <div v-if="hasBookedClasses(day)" class="h-100 w-100 overflow-y-auto" style="max-height: 180px;">
                    <p class="text-center text-gray-600 fs-14 mb-2 mt-1">Wybrane zajęcia:</p>
                    <div
                      v-for="booking in getBookedClasses(day)"
                      :key="booking.id"
                      class="booking-card w-100 d-flex flex-column pa-3 rounded-lg position-relative mb-2"
                      :class="getBookingColorClass(booking)"
                    >
                      <VBtn
                        class="booking-remove-btn"
                        density="compact"
                        icon="mdi-close"
                        size="small"
                        variant="text"
                        @click="openDeleteConfirmation(booking)"
                      />

                      <div class="d-flex justify-space-between align-center mb-1 pr-6">
                        <span class="booking-card-title text-truncate" :class="{ 'fs-12 font-weight-medium': getBookingColorClass(booking) !== 'booking-card--group' }">{{ getBookingTitle(booking) }}</span>
                      </div>

                      <template v-if="getBookingColorClass(booking) === 'booking-card--group'">
                        <div class="d-flex align-center justify-space-between w-100">
                          <div>
                            <div class="d-flex align-center ga-2 mb-1">
                              <VIcon icon="mdi-clock-outline" size="16" />
                              <span class="booking-time">{{ getBookingTime(booking) }}</span>
                            </div>

                            <div v-if="getBookingSubtitle(booking)" class="d-flex align-center ga-2">
                              <img
                                alt=""
                                :src="getBookingIcon(booking)"
                                width="16"
                              >
                              <span class="booking-subtitle text-truncate">{{ getBookingSubtitle(booking) }}</span>
                            </div>
                          </div>
                        </div>
                      </template>

                      <template v-else>
                        <div class="d-flex align-center justify-space-between mb-1">
                          <div class="d-flex align-center ga-2 text-truncate" style="min-width: 0;">
                            <VIcon icon="mdi-clock-outline" size="16" />
                            <span class="fs-14 font-weight-medium text-truncate">{{ getBookingTime(booking) }}</span>
                          </div>
                          <span v-if="getBookingPrice(booking)" class="fs-14 font-weight-bold ml-2 flex-shrink-0">{{ getBookingPrice(booking) }}</span>
                        </div>

                        <div v-if="getBookingSubtitle(booking)" class="d-flex align-center ga-2">
                          <img
                            alt=""
                            :src="getBookingIcon(booking)"
                            width="14"
                          >
                          <span class="fs-11 text-truncate">{{ getBookingSubtitle(booking) }}</span>
                        </div>
                      </template>
                    </div>
                  </div>
                  <div v-else class="text-center text-gray-600 h-100 d-flex align-center justify-center">{{ t('no_classes_selected') || 'Nie wybrano zajęć' }}</div>
                  <div class="d-flex justify-center mt-2">
                    <VBtn
                      class="px-6"
                      color="blue normal-text"
                      prepend-icon="mdi-plus-circle"
                      variant="flat"
                      @click="openAddClassesModal(day)"
                    >
                      {{ hasBookedClasses(day) ? (t('add_more_classes') || 'Dodaj kolejne') : (t('add_classes') || 'Dodaj zajęcia') }}
                    </VBtn>
                  </div>
                </VCardText>
              </VCard>
            </VSlideGroupItem>
          </VSlideGroup>
        </div>
      </VCardText>
      <VCardActions class="px-0">
        <div class="main-container d-flex justify-center align-center ga-4 text-capitalize w-100">
          <VBtn
            :class="[
              mobile ? 'px-2 no-letter-spacing' : '',
              'fs-16',
              'text-normal',
              'back-btn'
            ]"
            size="x-large"
            variant="outlined"
            @click="close"
          >
            <VIcon class="mr-1 no-letter-spacing" icon="mdi-arrow-left" />
            {{ t('return') || 'Powrót' }}
          </VBtn>
          <VBtn
            :class="[
              mobile ? 'px-2 no-letter-spacing' : 'px-8',
              'fs-16',
              'text-normal',
              'back-btn'
            ]"
            color="blue normal-text"
            size="x-large"
            variant="flat"
            @click="handleSave"
          >
            {{ t('save_and_back') || 'Zapisz i przejdź dalej' }}
            <VIcon class="ml-1" icon="mdi-arrow-right" />
          </VBtn>
        </div>
      </VCardActions>
    </VCard>
  </VDialog>

  <AddClassesModal
    v-model="showAddClassesModal"
    :age="props.participant?.age"
    :date-iso="selectedDateForAddIso"
    :date-str="selectedDateForAdd"
    :participant-type="props.participantType"
    :current-participant="props.participant"
    @next="handleAddClassesNext"
  />

  <DeleteClassConfirmationModal
    v-model="showDeleteConfirmationModal"
    :activity-type="props.activityType"
    :booking="classToDelete"
    @confirm="confirmDeleteClass"
  />
</template>

<style scoped lang="scss">
.main-container {
  max-width: 960px;
  margin: 0 auto;
  padding: 0 16px;
  width: 100%;

   :deep(.v-btn) {
      font-size: 16px;
}
}

.slider-breakout {
  padding-left: max(16px, calc((100% - 960px) / 2 + 16px))!important;
}

.text-gray-700 {
  color: #374151;
}

.text-primary-900 {
  color: #233876;
}

.text-gray-900 {
  color: #111928;
}

.background-primary-100 {
  background: #E1EFFE;
}

.under-app-bar {
  top: 64px;
  height: calc(100% - 64px);
}
.v-card {
  background: rgb(243 244 246);
}

:deep(.day-card) {
  background: #ffffff;
  border: 2px solid #C3DDFD;
  border-radius: 12px;
  width: 78vw;
  height: 94vw;
  max-width: 280px;
  max-height: 340px;

  &:last-child {
    margin-right: 20px!important;
  }
}

:deep(.day-card--booked) {
  background: #E1EFFE !important;
  border: 2px solid #C3DDFD!important;
  box-shadow: none!important;
  .bg-blue {
    background: transparent!important;
     border: 1px solid #1a56db!important;
     color: #1a56db!important;

  }
}

:deep(.v-overlay__scrim) {
  top: 64px;
}
.v-overlay {
  top: 64px;
}

.user-info-container {
    background: #E1EFFE;
    border-radius: 8px;
    padding: 12px 8px;
}

.text-black55 {
  color: rgba(0, 0, 0, 0.55);
}

.nav-icon {
  cursor: pointer;
}

.disabled-icon {
  opacity: 0.3;
  cursor: default;
  pointer-events: none;
}

.class-card {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}

.border-bottom {
    border-bottom: 1px solid #A4CAFE;
    padding-bottom: 8px;
}

:deep(.v-slide-group__next), :deep(.v-slide-group__prev) {
    display: none!important;
}

.w-100 {
  width: 100%;
}

.text-normal {
  text-transform: none;
}

.v-card-actions {
  padding: 16px;
}

.no-letter-spacing {
  letter-spacing: 0;
}

.booking-card {
  padding: 8px 30px 8px 8px!important;
}

.booking-card {
  border: 1px solid transparent;

  &--individual {
    background-color: #C3DDFD;
    border-color: #BAE6FD;
    color: #0C4A6E;

    .booking-card-title {
      color: #233876;
      font-weight: 500;
      font-size: 11px;
    }
    :deep(.v-icon) {
      color: #5071BB;
    }
    :deep(.booking-remove-btn) {
      color: #64748B;
    }
    img {
       filter: brightness(0) saturate(100%) invert(30%) sepia(96%) saturate(1066%) hue-rotate(185deg) brightness(90%) contrast(101%);
    }
  }

  &--group {
    background-color: #FFF7ED; // Light orange
    border-color: #FFF7ED;
    color: #7C2D12;

    .booking-card-title {
      color: #9A3412;
      font-weight: 500;
        font-size: 11px;
    }
    .booking-time {
      font-size: 14px;
      font-weight: 500;
      color: #1F2937;
    }
    .booking-subtitle {
      color: #4B5563;
          font-size: 11px;
    }
    :deep(.v-icon) {
      color: #4B5563;
    }
    :deep(.booking-remove-btn) {
      color: #9A3412;
    }
    img {
       filter: brightness(0) saturate(100%) invert(32%) sepia(9%) saturate(838%) hue-rotate(179deg) brightness(93%) contrast(89%);
    }
  }
}

.booking-remove-btn {
  position: absolute;
  // top: calc(50% - 13px);
  right: 4px;
}

.normal-text {
  text-transform: none!important;
}

:deep(.v-slide-group__container) {
  scroll-behavior: smooth !important;
}

:deep(.v-slide-group__content) {
  transition: transform 1s ease-out !important;
}
</style>
