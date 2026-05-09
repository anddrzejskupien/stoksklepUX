<script setup>
  import { useCookies } from '@vueuse/integrations/useCookies'
  import { computed, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useDisplay } from 'vuetify'
  import UserPlusIcon from '@/assets/user-plus.svg'
  import DatePickerResponsive from '@/components/DatePickerResponsive.vue'
  import ParticipantAccordion from '@/components/ParticipantAccordion.vue'
  import { useToast } from '@/composables/useToast'
  import { useStayConfigStore } from '@/stores/StayConfigStore.js'
  import { useStayStore } from '@/stores/StayStore.js'
  import { useViewControlStore } from '@/stores/ViewControlStore.js'

  const { t } = useI18n()
  const { showSimpleToast } = useToast()
  const stayStore = useStayStore()
  const configStore = useStayConfigStore()
  const viewStore = useViewControlStore()
  const cookies = useCookies(['locale'])
  const { mobile } = useDisplay()
  const currentLocale = computed(() => cookies.get('locale') || 'pl')

  const stepOneNestedRef = ref(null)
  const activeChildStep = ref(1)

  const dataForm = ref(null)
  const participantForms = ref([])

  const rules = {
    required: value => !!value || t('fill_the_field_properly'),
    // minAdults: value => value >= 1 || t('at_least_one_adult_required'),
  }

  async function validateDataForm () {
    const result = await dataForm.value.validate()
    if (!result.valid) {
      showSimpleToast(t('please_fill_required_fields'), 'error')
    }
    return result.valid
  }

  async function validateCurrentStep () {
    const results = await Promise.all(
      participantForms.value.map(form => form?.validate()),
    )

    const allValid = results.every(result => result?.valid === true)

    if (!allValid) {
      showSimpleToast(t('please_fill_required_fields'), 'error')
    }

    return allValid
  }

  watch(() => stayStore.participants.length, () => {
    participantForms.value = []
  })
  watch(activeChildStep, async newStep => {
    await nextTick()
    viewStore.currentStep.child = newStep
  })
  defineExpose({
    stepOneNestedRef,
    validateCurrentStep,
    validateDataForm,
  })

</script>

<template>
  <VStepper
    ref="stepOneNestedRef"
    v-model="activeChildStep"
    class="child-stepper step-one-element d-flex flex-column flex-1"
    hide-actions
  >
    <VStepperHeader class="mt-2">
      <VStepperItem
        class="px-1 py-0"
        :title="$t('stay_datails')"
        :value="1"
      >
        <template #icon>
          1.
        </template>
      </VStepperItem>
      <VStepperItem
        class="px-1 py-0"
        :title="$t('participants_preferences')"
        :value="2"
      >
        <template #icon>
          2.
        </template>
      </VStepperItem>
    </VStepperHeader>

    <VStepperWindow class="flex-1">
      <VStepperWindowItem :value="1">
        <div class="container-narrow">
          <p class="fs-24 font-weight-bold my-4">
            {{ $t('booking_classes') }}:
          </p>
          <div class="my-4">
            <p
              class="font-weight-medium"
              :class="mobile ? 'fs-18' : 'fs-20'"
            >
              {{ $t('provide_details_of_your_stay') }}:
            </p>
            <small class="fs-11">
              {{ $t('select_day_or_period_of_stay') }}
            </small>
          </div>

          <VForm ref="dataForm">
            <div class="mb-6">
              <p class="custom-input-label mb-2">{{ $t('length_of_stay') }}</p>
              <DatePickerResponsive
                v-model="stayStore.dateOfStay"
                class="mb-2"
                :locale="currentLocale"
                :rules="[v => !!v || 'Required']"
              />
            </div>
            <div class="mb-6">
              <p class="custom-input-label mb-2">{{ $t('adults_number') }}</p>
              <VNumberInput
                v-model="stayStore.adultsNumber"
                class="mb-2"
                control-variant="split"
                hide-details="auto"
                :max="stayStore.maxAdults"
                max-width="165px"
                :min="0"
                :step="1"
                variant="outlined"
              />
<!--                :rules="[rules.minAdults]"-->
              <p class="fs-12 fc-gray">
                {{ $t('enter_number_of_participants_adult') }}
              </p>
            </div>
            <div class="mb-6">
              <p class="custom-input-label mb-2">{{ $t('children_number') }}</p>
              <VNumberInput
                v-model="stayStore.childrenNumber"
                class="mb-2"
                control-variant="split"
                hide-details="auto"
                :max="stayStore.maxChildren"
                max-width="165px"
                :min="0"
                :step="1"
                variant="outlined"
              />
              <p class="fs-12 fc-gray">
                {{ $t('enter_number_of_participants_children') }}
              </p>
            </div>
            <VSheet class="rounded-lg pa-4">
              <div
                class="d-flex ga-2 "
                :class="mobile ? 'align-start' : 'align-center'"
              >
                <img alt="user" class="mt-1" :src="UserPlusIcon">
                <p class="fs-12 fc-gray">
                  {{ $t('book_more_info') }}
                  <a class="fc-gray" :href="configStore.CUSTOMER_SERVICE_LINK" target="_blank">{{ $t('with_customers_service') }}</a>
                </p>
              </div>
            </VSheet>
          </VForm>
        </div>
      </VStepperWindowItem>

      <VStepperWindowItem :value="2">
        <div class="container-narrow px-1">
          <p class="fs-20 font-weight-bold my-4">
            {{ $t('booking_classes') }}:
          </p>
          <div class="my-4">
            <p class="fs-18 fc-blue font-weight-medium">
              {{ $t('specify_participants_preferences') }}:
            </p>
            <small class="fs-11">
              {{ $t('enter_preferences_details') }}
            </small>
          </div>

          <div class="d-flex flex-column ga-4 my-4">
            <ParticipantAccordion
              v-for="(participant, index) in stayStore.participants"
              :key="participant.dynamicId"
              ref="participantForms"
              :ref="el => participantForms[index] = el"
              class="ga-4"
              :index="index"
              :participant="participant"
            />
          </div>
        </div>
      </VStepperWindowItem>
    </VStepperWindow>
  </VStepper>
</template>
<style lang="scss">
//.step-one-element {
//  .v-stepper-header {
//    .v-avatar {
//      display: none;
//    }
//  }
//
//}

</style>
