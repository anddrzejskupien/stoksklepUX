<script setup>
  import { ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useDisplay } from 'vuetify'
  import InsuranceIMG from '@/assets/insurance_img.png'
  import GreenShield from '@/assets/shield-check-green.svg'
  import skiLOGO from '@/assets/ski-icon.svg'
  import snowboardLOGO from '@/assets/snowboard-icon.svg'
  import PopupSmall from '@/components/modals/PopupSmall.vue'
  import { usePickedClassesStore } from '@/stores/PickedClassesStore.js'
  import { useStayStore } from '@/stores/StayStore.js'
  import { formatPrice } from '@/utils/numbers.js'

  const props = defineProps({
    participant: {
      type: Object,
      required: true,
    },
    index: {
      type: Number,
      required: true,
    },
  })

  const { t } = useI18n()
  const { mobile } = useDisplay()
  const stayStore = useStayStore()
  const classesStore = usePickedClassesStore()
  const expandedPanels = ref({})
  const panel = ref([0])// Expansion panel state (main)

  // const insuranceSelected = ref({}) // Holds the insurance selection state
  const insuranceInfoDialog = ref(false) // Controls the insurance info dialog visibility
  const currentInsurance = ref(null) // Holds the insurance info to display

  const classToDelete = ref(null) // Holds the class selected for deletion
  const confirmClassDeletationDialog = ref(false) // Controls the confirmation dialog visibility

  const participantBookings = computed(() => {
    const bookings = classesStore.bookedClasses.filter(
      booking => booking.participantId === props.participant.dynamicId,
    )

    // Group by groupBookingId to avoid duplicates
    const grouped = new Map()

    for (const booking of bookings) {
      const key = booking.groupBookingId || booking.id

      if (!grouped.has(key)) {
        grouped.set(key, booking)
      }
    }

    return Array.from(grouped.values())
  })

  function openInsuranceDialog (insurance) {
    currentInsurance.value = insurance
    insuranceInfoDialog.value = true
  }

  // Delete class
  function deleteClass (booking) {
    console.log('delete class', booking)
    const item = participantBookings.value.find(c => c.id === booking.id)
    console.log('item to delete', item)
    if (item) {
      classToDelete.value = item
      confirmClassDeletationDialog.value = true
    }
  }

  // Confirm deletion
  function confirmDeleteClass () {
    if (classToDelete.value) {
      classesStore.removeBookedClass(classToDelete.value.id)
      classToDelete.value = null
    }
    confirmClassDeletationDialog.value = false
  }

  // Cancel deletion
  function cancelDelete () {
    classToDelete.value = null
    confirmClassDeletationDialog.value = false
  }
  function toggleInsurance (booking) {
    const bookingIndex = classesStore.bookedClasses.findIndex(b => b.id === booking.id)
    if (bookingIndex !== -1) {
      classesStore.bookedClasses[bookingIndex].insurance.enabled = !classesStore.bookedClasses[bookingIndex].insurance.enabled
    }
  }
</script>

<template>
  <div>
    <VExpansionPanels v-model="panel" class="participant-selected-classes-item">
      <VExpansionPanel>
        <VExpansionPanelTitle>
          <div class="d-flex ga-2 fw-600">
            <span>{{ index + 1 }}.</span>
            <span>{{ props.participant.name || '-' }}</span>
          </div>
        </VExpansionPanelTitle>
        <VExpansionPanelText class="border-t">
          <VList class="py-0" density="compact">
            <div
              v-for="item in participantBookings"
              :key="item.participantId + '-' + item.dynamicId"
            >
              <div
                class="py-4 pb-0 d-flex justify-between"
                :class="mobile ? 'px-0': 'px-4'"
              >
                <!--                {{ item }}-->

                <img
                  alt=""
                  class="mb-auto"
                  :src="participant.activityType === 'Narty' ? skiLOGO : snowboardLOGO"
                  width="28px"
                >
                <div class="d-flex flex-column ml-2 flex-1">
                  <!--                  {{ item }}-->
                  <!--                  {{ item }}-->
                  <p
                    v-if="item.type === 'individual'"
                    class="fs-500 text-pre-wrap lh-normal"
                    :class="mobile ? 'fs-12 ': 'fs-14'"
                  >
                    {{ t('individual_classes') }}
                  </p>
                  <p
                    v-if="item.type === 'group'"
                    class="fs-500 text-pre-wrap lh-normal"
                    :class="mobile ? 'fs-12 ': 'fs-14'"
                  >
                    {{ t('group_classes') }}
                  </p>
                  <p
                    v-if="item.type === 'shared'"
                    class="fs-500 text-pre-wrap lh-normal"
                    :class="mobile ? 'fs-12 ': 'fs-14'"
                  >
                    {{ t('shared_classes') }}
                  </p>
                  <div
                    v-if="item.instructor"
                    class="text-pre-wrap lh-normal"
                    :class="mobile ? 'fs-9 ': 'fs-12'"
                  >
                    <p>
                      {{ t('instructor') }}: {{ item.instructor }}

                    </p>
                  </div>
                  <div
                    class="text-pre-wrap lh-normal"
                    :class="mobile ? 'fs-9 ': 'fs-12'"
                  >
                    {{ participant.skillLevel }}
                  </div>
                  <div
                    v-if="item.type === 'individual' || item.type === 'shared'"
                    class="text-pre-wrap lh-normal"
                    :class="mobile ? 'fs-9 ': 'fs-12'"
                  >
                    <p>
                      &#8226;{{ item.data.slot.date }} - {{ item.data.slot.time }}
                    </p>
                  </div>
                  <div
                    v-else
                    class="text-pre-wrap lh-normal"
                    :class="mobile ? 'fs-9 ': 'fs-12'"
                  >
                    <p>
                      &#8226;{{ item.data.group.dates }}
                    </p>
                    <p>
                      &#8226;{{ item.data.group.schedule }}
                    </p>
                  </div>

                  <!--                  {{ item.data }}-->
                  <div
                    class="d-flex flex-column fw-500 text-pre-wrap lh-normal fc-gray mt-1"
                    :class="mobile ? 'fs-9 ': 'fs-12'"
                  >
                    <div class="d-flex align-center">
                      <p v-if="item.groupName" class="fc-gray">
                        &#8226; <span>{{ item.groupName }},</span>
                      </p>
                      <p v-if="item.skillLevel" class="fc-gray">
                        &#8226;<span class="ml-1">{{ item.skillLevel }}</span>
                      </p>
                    </div>
                    <div
                      v-for="(day, dIdx) in item.dates"
                      :key="dIdx"
                      class="d-flex align-center"
                      :class="mobile ? 'fs-9 ': 'fs-12'"
                    >
                      <p v-if="day.date">
                        &#8226;<span class="ml-1">{{ day.date }}</span>
                      </p>
                      <p v-if="day.time">
                        &#8226;<span class="ml-1">{{ day.time }}</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div class="d-flex align-center">
                  <p
                    class="mr-2 fw-600"
                    :class="mobile ? 'fs-12 ': 'fs-14'"
                  >
                    <!--                    {{ formatPrice(item.price) }}&nbsp;{{ stayStore.currency }}-->
                    <!--                    {{ item.data.group.price }}-->
                    <span v-if="item.data?.group?.price">
                      {{ item.data.group.price }}&nbsp;{{ stayStore.currency }}
                    </span>
                    <span v-if="item.data?.slot?.price">
                      {{ item.data.slot.price }}&nbsp;{{ stayStore.currency }}
                    </span>
                  </p>
                  <VIcon color="grey" icon="mdi-close" size="18" @click="deleteClass(item)" />
                </div>
              </div>

              <VSheet
                v-if="participant.participantType === 'child' && item.type === 'group'"
                class="rounded mt-2 mb-4 bg-light-green"
              >
                <div
                  class="pt-0 rounded d-flex align-center justify-between"
                  :class="mobile ? 'px-0': 'px-4'"
                >
                  <img alt="shield" :src="GreenShield" width="16px">

                  <div
                    class="fw-400 d-flex align-center ml-2"
                    :class="mobile ? 'fs-10': 'fs-14'"
                  >
                    {{ t('insurance_included') }}

                    <VBtn
                      class="ma-2 text-capitalize px-2"
                      :class="mobile ? 'fs-10': 'fs-14'"
                      color="grey"
                      flat
                      size="small"
                      variant="text"
                      @click="expandedPanels[item.dynamicId] = !expandedPanels[item.dynamicId]"
                    >
                      {{ expandedPanels[item.dynamicId] ? t('collapse') : t('expand') }}
                      <VIcon :icon="expandedPanels[item.dynamicId] ? 'mdi-chevron-up' : 'mdi-chevron-down'" />
                    </VBtn>
                  </div>

                </div>

                <VExpandTransition>
                  <VCard
                    v-show="expandedPanels[item.dynamicId]"
                    flat
                    style="background-color: transparent;"
                    width="100%"
                  >
                    <VCardText class="px-8 pt-0">
                      <p :class="mobile ? 'fs-10' : 'fs-12'">
                        {{ item.insurance.description }}
                      </p>

                      <div
                        class="custom-badge gray mt-4"
                        :class="mobile ? 'fs-10' : 'fs-12'"
                        @click="openInsuranceDialog(item.insurance)"
                      >
                        <VIcon class="mr-1" color="grey" icon="mdi-information-slab-circle" />
                        {{ $t('aditional_info') }}
                      </div>
                    </VCardText>
                  </VCard>
                </VExpandTransition>
              </VSheet>

              <VSheet
                v-else
                class="rounded bg-light-gray mt-2 mb-4"
              >
                <div
                  class="pt-0 rounded d-flex align-center justify-between"
                  :class="mobile ? 'px-0': 'px-4'"
                >
                  <!--                    v-model="item.insurance.enabled"-->
                  <VCheckbox
                    v-model="item.insurance.enabled"
                    color="info"
                    density="compact"
                    hide-details
                    @click="toggleInsurance(item)"
                  />
                  <div
                    class="fw-400 d-flex align-center ml-2"
                    :class="mobile ? 'fs-10': 'fs-14'"
                  >
                    {{ t('add_insurance') }}
                    <VBtn
                      class="ma-2 text-capitalize px-2"
                      :class="mobile ? 'fs-10': 'fs-14'"
                      color="grey"
                      flat
                      size="small"
                      variant="text"
                      @click="expandedPanels[item.dynamicId] = !expandedPanels[item.dynamicId]"
                    >
                      {{ expandedPanels[item.dynamicId] ? t('collapse') : t('expand') }}
                      <VIcon :icon="expandedPanels[item.dynamicId] ? 'mdi-chevron-up' : 'mdi-chevron-down'" />
                    </VBtn>
                  </div>

                  <div
                    class="d-flex flex-column align-end ml-auto ma-0 fc-gray"
                    :class="mobile ? 'fs-11 ': 'fs-14'"
                  >
                    <span class="fw-500">
                      + {{ formatPrice(item.insurance.price) }}
                    </span>
                    <span class="fw-400 mt-n1 text-no-wrap">
                      {{ item.insurance.perDay ? ` ( 1 ${t('day')})` : '' }}
                    </span>
                  </div>
                </div>

                <VExpandTransition>
                  <VCard
                    v-show="expandedPanels[item.dynamicId]"
                    flat
                    style="background-color: transparent;"
                    width="100%"
                  >
                    <VCardText class="px-8 pt-0">
                      <p :class="mobile ? 'fs-10' : 'fs-12'">
                        {{ item.insurance.description }}
                      </p>

                      <div
                        class="custom-badge gray mt-4"
                        :class="mobile ? 'fs-10' : 'fs-12'"
                        @click="openInsuranceDialog(item.insurance)"
                      >
                        <VIcon class="mr-1" color="grey" icon="mdi-information-slab-circle" />
                        {{ $t('aditional_info') }}
                      </div>
                    </VCardText>
                  </VCard>
                </VExpandTransition>
              </VSheet>

            </div>
          </VList>

          <VSheet
            class="participant-selected-classes-summary rounded-lg bg-gray-primary pa-4"
          >
            <div class="text-right ml-auto">
              <span class="fw-600" :class="mobile ? 'fs-12 ': 'fs-14'">
                {{ $t('total') }}
              </span>
              <div class="fw-500 ml-2" :class="mobile ? 'fs-14 ': 'fs-16'">
                {{
                  formatPrice(stayStore.participantClassesTotalPrice(participant.dynamicId) + stayStore.participantInsuranceTotalPrice(participant.dynamicId))
                }}&nbsp;{{ stayStore.currency }}
                <br>
                <p v-if="stayStore.participantInsuranceTotalPrice(participant.dynamicId) > 0" class="fs-10 mt-n1">
                  {{ $t('including') }}
                  {{
                    formatPrice(stayStore.participantInsuranceTotalPrice(participant.dynamicId))
                  }}&nbsp;{{ stayStore.currency }}
                  {{ $t('insurance') }}
                </p>
              </div>
            </div>
          </VSheet>

        </VExpansionPanelText>
      </VExpansionPanel>
    </VExpansionPanels>

    <!--POPUPS-->
    <PopupSmall
      v-model="insuranceInfoDialog"
      max-width="500px"
      :title="currentInsurance?.title || t('insurance_details')"
    >
      <template #content>
        <img alt="Insurance" class="w-100 mb-4" :src="InsuranceIMG">
        <p>{{ currentInsurance?.description }}</p>
      </template>
      <template #actions>
        <VBtn variant="outlined" @click="insuranceInfoDialog = false">
          {{ $t('close') }}
        </VBtn>
        <VBtn
          class="text-capitalize px-4"
          color="blue"
          variant="flat"
          @click="console.log('see more')"
        >
          {{ $t('see_more') }}
        </VBtn>
      </template>
    </PopupSmall>

    <PopupSmall
      v-model="confirmClassDeletationDialog"
      max-width="500px"
      :title="t('delete_class_confirmation')"
    >
      <template #content>
        <div
          v-if="classToDelete"
        >
          <div class="d-flex w-100 ga-2 flex-1 justify-between">
            <img
              alt=""
              class="mb-auto"
              :src="participant.activityType === 'narty' ? skiLOGO : snowboardLOGO"
              width="28px"
            >
            <div class="flex flex-column">

              <p
                v-if="classToDelete.type === 'individual'"
                class="fs-500 text-pre-wrap lh-normal"
                :class="mobile ? 'fs-12 ': 'fs-14'"
              >
                {{ t('individual_classes') }}
              </p>
              <p
                v-if="classToDelete.type === 'group'"
                class="fs-500 text-pre-wrap lh-normal"
                :class="mobile ? 'fs-12 ': 'fs-14'"
              >
                {{ t('group_classes') }}
              </p>
              <p
                v-if="classToDelete.type === 'shared'"
                class="fs-500 text-pre-wrap lh-normal"
                :class="mobile ? 'fs-12 ': 'fs-14'"
              >
                {{ t('shared_classes') }}
              </p>
              <div
                v-if="classToDelete.instructor"
                class="text-pre-wrap lh-normal"
                :class="mobile ? 'fs-9 ': 'fs-12'"
              >
                <p>
                  {{ t('instructor') }}: {{ classToDelete.instructor }}

                </p>
              </div>
              <div
                class="text-pre-wrap lh-normal"
                :class="mobile ? 'fs-9 ': 'fs-12'"
              >
                {{ participant.skillLevel }}
              </div>
              <div
                v-if="classToDelete.type === 'individual' || classToDelete.type === 'shared'"
                class="text-pre-wrap lh-normal"
                :class="mobile ? 'fs-9 ': 'fs-12'"
              >
                <p>
                  &#8226;{{ classToDelete.data.slot.date }} - {{ classToDelete.data.slot.time }}
                </p>
              </div>
              <div
                v-else
                class="text-pre-wrap lh-normal"
                :class="mobile ? 'fs-9 ': 'fs-12'"
              >
                <p>
                  &#8226;{{ classToDelete.data.group.dates }}
                </p>
                <p>
                  &#8226;{{ classToDelete.data.group.schedule }}
                </p>
              </div>
              <div class="d-flex flex-column ml-2 flex-1">
                <p
                  class="fs-500 text-pre-wrap lh-normal"
                  :class="mobile ? 'fs-12 ': 'fs-14'"
                />

              </div>
            </div>

            <div class="d-flex  ml-auto align-center">
              <p
                class="mr-2 fw-600"
                :class="mobile ? 'fs-12 ': 'fs-14'"
              >
                <!--                    {{ formatPrice(item.price) }}&nbsp;{{ stayStore.currency }}-->
                <!--                    {{ item.data.group.price }}-->
                <span v-if="classToDelete.data?.group?.price">
                  {{ classToDelete.data.group.price }}&nbsp;{{ stayStore.currency }}
                </span>
                <span v-if="classToDelete.data?.slot?.price">
                  {{ classToDelete.data.slot.price }}&nbsp;{{ stayStore.currency }}
                </span>
              </p>
              <VIcon color="grey" icon="mdi-close" size="18" @click="deleteClass(classToDelete.participantId)" />
            </div>
          </div>
        </div>
      </template>
      <template #actions>
        <VBtn class="text-capitalize" variant="outlined" @click="cancelDelete">
          {{ $t('cancel') }}
        </VBtn>
        <VBtn
          class="text-capitalize px-4"
          color="red"
          variant="flat"
          @click="confirmDeleteClass"
        >
          {{ $t('delete') }}
        </VBtn>
      </template>
    </PopupSmall>
  </div>

</template>
<style lang="scss">
.participant-selected-classes-item {
  .v-expansion-panel-text__wrapper {
    @media(max-width: 600px) {
      padding-left: 12px;
      padding-right: 12px;
    }
  }
}
</style>
