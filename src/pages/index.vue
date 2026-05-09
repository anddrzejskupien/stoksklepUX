<script setup>
  import { computed, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useDisplay } from 'vuetify'
  import StepOne from '@/components/StepOne.vue'
  import StepThree from '@/components/StepThree.vue'
  import StepTwo from '@/components/StepTwo.vue'

  import { useToast } from '@/composables/useToast.js'
  import { usePickedClassesStore } from '@/stores/PickedClassesStore.js'
  import { useStayStore } from '@/stores/StayStore.js'
  import { useViewControlStore } from '@/stores/ViewControlStore.js'

  import { scrollToTop} from "@/utils/totop.js";

  const viewStore = useViewControlStore()
  const stayStore = useStayStore()
  const pickedClassesStore = usePickedClassesStore()
  const { showSimpleToast } = useToast()
  const { mobile } = useDisplay()
  const { t } = useI18n()

  const parentStepperRef = ref(null)
  const parentActiveStep = ref(1)

  const stepOneComponentRef = ref(null)
  const stepTwoComponentRef = ref(null)
  const stepThreeComponentRef = ref(null)

  const isNextButtonDisabled = computed(() => {
    if (!stayStore.dateOfStay) return true
    // Disable if both adults and children are 0
    if (stayStore.adultsNumber === 0 && stayStore.childrenNumber === 0) return true

    // Step 2 validation: Every participant must have at least one class booked
    if (viewStore.currentStep.parent === 2) {
      return !stayStore.participants.every(p =>
        pickedClassesStore.bookedClasses.some(c => c.participantId === p.dynamicId),
      )
    }

    return false
  })

  function handlePrev () {
    if (viewStore.currentStep.parent === 3 && viewStore.currentStep.child === 3) {
      stepThreeComponentRef.value.stepThreeNestedRef.prev()
    }
    if (viewStore.currentStep.parent === 3 && viewStore.currentStep.child === 2) {
      stepThreeComponentRef.value.stepThreeNestedRef.prev()
    }
    if (viewStore.currentStep.parent === 3 && viewStore.currentStep.child === 1) {
      viewStore.currentStep = { parent: 2, child: 2 } // reset child step to 2 to remain flow
      parentStepperRef.value.prev()
    }
    if (viewStore.currentStep.parent === 2) {
      parentStepperRef.value.prev()
    }
    if (viewStore.currentStep.parent === 1 && viewStore.currentStep.child === 2) {
      stepOneComponentRef.value.stepOneNestedRef.prev()
    }
  }

  async function handleNext () {
    // Step 1/1 (stay data) - proceed to Step 1/2
    if (viewStore.currentStep.parent === 1 && viewStore.currentStep.child === 1) {
      const isValid = await stepOneComponentRef.value?.validateDataForm()
      if (isValid) {
        stepOneComponentRef.value.stepOneNestedRef.next()
      }
    }
    // Step 1/2 (participants data) - validate and proceed to Step 2
    if (viewStore.currentStep.parent === 1 && viewStore.currentStep.child === 2) {
      const isValid = await stepOneComponentRef.value?.validateCurrentStep()
      if (isValid) {
        viewStore.isStepOneCompleted = true
        parentStepperRef.value.next()
      } else {
        viewStore.isStepOneCompleted = false
      }
      return
    }
    // Step 2 (classes data) - proceed to Step 3
    if (viewStore.currentStep.parent === 2) {
      viewStore.currentStep = { parent: 2, child: 1 } // reset child step to 1 to remain flow
      viewStore.isStepTwoCompleted = true
      parentStepperRef.value.next()
    }
    // Step 3/1 (cart) - no validations -  proceed to Step 3/2
    if (viewStore.currentStep.parent === 3 && viewStore.currentStep.child === 1) {
      stepThreeComponentRef.value.stepThreeNestedRef.next()
      await nextTick()
      setTimeout(() => scrollToTop(), 500)
    }
    // Step 3/2 (participants data)  - proceed to payment
    if (viewStore.currentStep.parent === 3 && viewStore.currentStep.child === 2) {
      const isValid = await stepThreeComponentRef.value?.validateCurrentStep()
      if (isValid) {
        viewStore.isStepThreeCompleted = true
        stepThreeComponentRef.value.stepThreeNestedRef.next()
      } else {
        viewStore.isStepThreeCompleted = false
      }
      return
    }
  }

  // two-way sync
  watch(parentActiveStep, newStep => {
    viewStore.currentStep.parent = newStep
  })
  watch(() => viewStore.currentStep.parent, newStep => {
    parentActiveStep.value = newStep
  })
  onMounted(() => {
    viewStore.setParentStepper(parentStepperRef.value)
  })
</script>

<template>
  <VContainer
    class="d-flex flex-column flex-1 mt-4 mb-12"
    :class="mobile ? 'px-4': ''"
    max-width="990"
  >
    <VStepper
      ref="parentStepperRef"
      v-model="parentActiveStep"
      class="parent-stepper pa-0 fs-11 d-flex flex-column flex-1 "
      min-height="100%"
    >
      <VStepperHeader
        class="container-narrow pa-4 box-shadow-sm"
        :class="mobile ? 'px-2 py-4' : ''"
      >
        <VStepperItem
          class="pa-1"
          :complete="viewStore.isStepOneCompleted"
          :title="$t('participants')"
          :value="1"
        />
        <VDivider :style="mobile ? 'max-width: 10px' : ''" />
        <VStepperItem
          class="pa-1"
          :complete="viewStore.isStepTwoCompleted"
          :title="$t('classes')"
          :value="2"
        />
        <VDivider :style="mobile ? 'max-width: 10px' : ''" />
        <VStepperItem
          class="pa-1"
          :title="$t('details')"
          :value="3"
        />
      </VStepperHeader>

      <VStepperWindow class="flex-1">
        <VStepperWindowItem
          :value="1"
        >
          <StepOne ref="stepOneComponentRef" />
        </VStepperWindowItem>

        <VStepperWindowItem
          class="container-narrow"
          :value="2"
        >
          <StepTwo ref="stepTwoComponentRef" />
        </VStepperWindowItem>

        <VStepperWindowItem :value="3">
          <StepThree ref="stepThreeComponentRef" />
        </VStepperWindowItem>
      </VStepperWindow>

      <template #actions>
        <div class="fixed-bar box-shadow-sm">
          <div
            class=" container-actions d-flex ga-4"
          >
            <VBtn
              v-if="viewStore.currentStep.parent !== 1 || viewStore.currentStep.child !== 1"
              class="fs-16 text-capitalize flex-1 bg-light-gray"
              color="blue"
              prepend-icon="mdi-arrow-left"
              size="large"
              variant="outlined"
              @click="handlePrev"
            >
              {{ t('previous') }}
            </VBtn>

            <VBtn
              class="fs-16  px-8 ml-auto flex-2"
              color="blue"
              :disabled="isNextButtonDisabled"
              size="large"
              variant="flat"
              @click="handleNext"
            >
              <span v-if="viewStore.currentStep.parent === 3 && viewStore.currentStep.child === 2">
                {{ t('proceed_to_payment') }}
              </span>
              <span v-else>
                {{ t('next') }}
              </span>
            </VBtn>

          </div>

        </div>
      </template>
    </VStepper>
  </VContainer>
</template>

<style lang="scss">
.v-stepper {
  background: transparent;
  box-shadow: none;
  border: none !important;

  .v-stepper-window,
  .v-window__container,
  .v-window-item--active {
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  .v-stepper-window {
    margin: 0;
  }

  .v-divider {
    flex: .4
  }

  .v-stepper-item__avatar.v-avatar {
    background: none;
    color: #000;
    border: 1px solid;
    border-color: #000;
  }

}

// Parent stepper
.parent-stepper {
  box-shadow: none !important;
  &:not(.child-stepper) {
    > .v-stepper-header {
      border-radius: $border-radius;
      background: #fff;
      box-shadow: none;

      .v-stepper-item--selected {
        background-color: #EBF5FF;
        border-radius: 24px;
        color: $blue;
        font-weight: 600;

        .v-stepper-item__avatar.v-avatar {
          background-color: $blue;
          color: #fff;
          border-color: $blue;
        }
      }

      .v-stepper-item--complete {
        color: $blue;

        .v-stepper-item__avatar.v-avatar {
          background-color: $blue;
          color: #fff;
          border-color: $blue;
        }
      }
    }
  }
}

.child-stepper {
  .v-stepper-item__avatar.v-avatar {
    border: none;
  }

  .v-stepper-header {
    box-shadow: none;
    justify-content: center;
    column-gap: 10px;
  }

  .v-stepper-item__avatar.v-avatar {
    margin-right: 0 !important;
  }

  .v-stepper-item--selected {
    color: $blue;
    font-weight: 600;
    position: relative;

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 10px;
      width: 90%;
      height: 1px;
      background-color: $blue;
    }

    .v-stepper-item__avatar.v-avatar,
    .v-stepper-item__avatar.v-avatar > * {
      color: $blue;
    }
  }

  .v-stepper-item--complete {
    color: $blue;

    .v-stepper-item__avatar.v-avatar {
      color: $blue;
      border-color: $blue;
    }
  }
}
.fixed-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  width: 100%;
  z-index: 10;
  padding: .5rem 20px;
  background-color: $bg-gray-light;
}
</style>
