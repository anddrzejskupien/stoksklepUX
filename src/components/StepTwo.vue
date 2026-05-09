<script setup>
  import { computed, onMounted, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import ClassesModal from '@/components/modals/ClassesModal.vue'
  import PackageInfoBox from '@/components/PackageInfoBox.vue'
  import ParticipantCard from '@/components/ParticipantCard.vue'
  import { useToast } from '@/composables/useToast'
  import { usePickedClassesStore } from '@/stores/PickedClassesStore.js'
  import { useStayStore } from '@/stores/StayStore.js'
  import { useTimerStore } from '@/stores/TimerStore.js'

  const timerStore = useTimerStore()

  const { showSimpleToast } = useToast()
  const stayStore = useStayStore()
  const pickedClassesStore = usePickedClassesStore()

  const { t } = useI18n()

  const classesModalOpen = ref(false)
  const selectedParticipant = ref(null)
  function openClassesModal (participant) {
    selectedParticipant.value = participant
    classesModalOpen.value = true
  }
  function closeClassesModal () {
    classesModalOpen.value = false
    selectedParticipant.value = null
  }

  function getParticipantClassesTotalPrice (participantId) {
    const participantClasses = pickedClassesStore.bookedClasses.filter(c => c.participantId === participantId)
    if (!participantClasses || participantClasses.length === 0) return 0

    const processedGroupIds = new Set()

    return participantClasses.reduce((sum, booking) => {
      let price = 0
      if (booking.type === 'individual' || booking.type === 'shared') {
        if (booking.data.slot && booking.data.slot.price) {
          price = booking.data.slot.price
        }
      } else if (booking.type === 'group' && booking.data.group && booking.data.group.price) {
        if (booking.groupBookingId) {
          if (!processedGroupIds.has(booking.groupBookingId)) {
            price = booking.data.group.price
            processedGroupIds.add(booking.groupBookingId)
          }
        } else {
          // Fallback if no groupBookingId (should not happen with new code)
          price = booking.data.group.price
        }
      }
      return sum + price
    }, 0)
  }

  function hasParticipantBookedClasses (participantId) {
    return pickedClassesStore.bookedClasses.some(c => c.participantId === participantId)
  }

  // watch(() => timerStore.timeRemaining, remaining => {
  //   if (remaining === 0) {
  //     showSimpleToast(t('time_expired'), 'warning')
  //   }
  // })

  onMounted(() => {
    timerStore.startTimer()
  })

  // Package Info Box Logic
  const showFirstLevelActive = computed(() => stayStore.firstPackageEligible)
  const showSecondLevelActive = computed(() => stayStore.secondPackageEligible)

  // Logic for incentive box:
  // Show if NOT first package eligible AND missing hours <= 2 AND missing hours > 0
  // OR if first package eligible AND NOT second package eligible AND missing hours to second <= 2 AND missing hours > 0
  const showIncentiveBox = computed(() => {
    const totalHours = stayStore.allParticipantsTotalHours

    // Case 1: Approaching 1st threshold (10h)
    // Show if 8 <= total < 10
    if (!stayStore.firstPackageEligible && !stayStore.secondPackageEligible) {
      const missingToFirst = stayStore.missingHoursToFirstThreshold
      return missingToFirst <= 2 && missingToFirst > 0
    }

    // Case 2: Approaching 2nd threshold (20h)
    // Show if 10 <= total < 20 (always show incentive when first package is active but second is not)
    if (stayStore.firstPackageEligible && !stayStore.secondPackageEligible) {
      return true
    }

    return false
  })

  const incentiveMissingHours = computed(() => {
    if (stayStore.firstPackageEligible) {
      return stayStore.missingHoursToSecondThreshold
    }
    return stayStore.missingHoursToFirstThreshold
  })

  const incentiveDiscountPercent = computed(() => {
    if (stayStore.firstPackageEligible) {
      return stayStore.SECOND_LEVEL_DISCOUNT // Target is 11.4%
    }
    return stayStore.FIRST_LEVEL_DISCOUNT // Target is 5.7%
  })
</script>

<template>
  <div class="d-flex flex-column justify-space-between h-100 flex-1">
    <!-- tabs navigation remains the same -->
    <div>
      <!--      <div class="time-counter fs-12 text-center mt-2">-->
      <!--        {{ $t('timer_info') }}-->
      <!--        <span class="black-badge ">-->

      <!--          {{ timerStore.formattedTime }}-->
      <!--        </span>-->
      <!--      </div>-->
      <div />

      <p class="fs-24 font-weight-medium mb-2 mt-4 text-black">
        {{ $t('select_classes') }}:
      </p>
      <div>
        <p class="fs-14 mb-2 text-gray-600">
          {{ $t('select_classes_subtitle') }}
        </p>
      </div>
      <div class="d-flex flex-column ga-3 mt-4 mb-4">
        <ParticipantCard
          v-for="(p, i) in stayStore.participants"
          :key="p.dynamicId || i"
          :activity-type="p.activityType === t('snowboard') ? 'snowboard' : 'ski'"
          :age="p.age"
          :completed="hasParticipantBookedClasses(p.dynamicId)"
          :currency="stayStore.currency"
          :index="i"
          :name="p.name || '-'"
          :participant-type="p.participantType"
          :subtitle="`${t(p.participantType || 'adult')} - ${p.activityType || t('ski')} - Poz. ${p.skillLevel || '-'}`"
          :total-price="getParticipantClassesTotalPrice(p.dynamicId)"
          @click="openClassesModal(p)"
          @edit="openClassesModal(p)"
        />
      </div>

      <!-- Package Info Boxes -->
      <div class="mt-4">
        <!-- 1. Active Package Status (Yellow) -->
        <PackageInfoBox
          v-if="showFirstLevelActive || showSecondLevelActive"
          color="yellow"
        >
          <div class="d-flex justify-space-between align-center w-100">
            <div>
              <div class="mb-1">
                <span class="font-weight-bold ">{{ stayStore.allParticipantsTotalHours }}</span> / <span>{{ showSecondLevelActive ? '20h' : '10h' }}</span> w pakiecie.
              </div>
              <div class="text-caption">
                Aktywowano {{ showSecondLevelActive ? 'tańszy' : 'niższy' }} pakiet cenowy
              </div>
              <div class="mt-2">
                <v-chip
                  class="chip-active-package"
                  label
                  size="small"
                  variant="flat"
                >
                  Oszczędzasz -{{ (showSecondLevelActive ? stayStore.SECOND_LEVEL_DISCOUNT : stayStore.FIRST_LEVEL_DISCOUNT).toString().replace('.', ',') }}%
                </v-chip>
              </div>
            </div>
            <div v-if="stayStore.totalSavings > 0" class=" font-weight-medium fs-14 discount-text">
              - {{ stayStore.totalSavings.toFixed(2).replace('.', ',') }} {{ stayStore.currency }}
            </div>
          </div>
        </PackageInfoBox>

        <!-- 2. Incentive Box (Green Border) -->
        <PackageInfoBox
          v-if="showIncentiveBox"
          border
          color="green"
        >
          <div class="mb-2 text-deep-green">
            Brakuje Ci <span class="font-weight-bold">{{ incentiveMissingHours }}h zajęć</span>, by aktywować
            {{ stayStore.firstPackageEligible ? 'najtańszy' : 'tańszy' }} pakiet cenowy.
          </div>
          <v-chip
            class="chip-incentive"
            label
            size="small"
            variant="flat"
          >
            Zyskaj -{{ incentiveDiscountPercent.toString().replace('.', ',') }}%
          </v-chip>
        </PackageInfoBox>
      </div>
    </div>

    <ClassesModal
      v-model="classesModalOpen"
      :activity-type="selectedParticipant?.activityType === t('snowboard') ? 'snowboard' : 'ski'"
      :age="selectedParticipant?.age"
      :participant="selectedParticipant"
      :participant-type="selectedParticipant?.participantType"
      :subtitle="`${t(selectedParticipant?.participantType || 'adult')} - ${selectedParticipant?.activityType || t('ski')} - Poz. ${selectedParticipant?.skillLevel || '-'}`"
      @save="closeClassesModal"
    />
  </div>
</template>

<style scoped lang="scss">
.text-gray-600 {
  color: #4B5563;
}

.text-deep-green {
  color: #046C4E !important;
}

.chip-incentive {
  background-color: #DEF7EC !important;
  color: #014737 !important;
  font-weight: 500 !important;
  font-size: 10px !important;
}

.chip-active-package {
  background-color: #FACA15 !important;
  color: #723B13 !important;
  font-weight: 500 !important;
  font-size: 10px !important;
}

.v-overlay__scrim {
  color: #4B5563;
  top: 64px;
}

.v-overlay {
  top: 64px;
}
.v-overlay__scrim {
    top: 64px;
}

.bg-yellow-light {
  .v-list-item__append {
    width: 20px;
  }
}

.discount-text {
      text-align: right;
    width: 80px;
    color: #6B7280;
}
</style>
