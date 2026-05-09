import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useViewControlStore = defineStore('viewStore', () => {
  // const STEP_ONE_ID = 'STEP_ONE'
  // const STEP_ONE_DATA_ID = 'STEP_ONE_DATA'
  // const STEP_ONE_PREFERENCES_ID = 'STEP_ONE_PREFERENCES'
  // const STEP_TWO_ID = 'STEP_TWO'
  // const STEP_THREE_ID = 'STEP_THREE'
  // const STEP_THREE_CART_ID = 'STEP_THREE_CART'
  // const STEP_THREE_PARTICIPANTS_ID = 'STEP_THREE_PARTICIPANTS'
  // const STEP_THREE_PAYMENT_ID = 'STEP_THREE_PAYMENT'

  const currentStep = ref({
    parent: 1,
    child: 1,
  },
  )

  const parentStepperRef = ref(null) // Reference to the parent stepper component

  const isStepOneCompleted = ref(false)

  const isStepTwoCompleted = ref(false)

  const isStepThreeCompleted = ref(false)

  const isAddClassesStepOneCompleted = ref(false)
  const isAddClassesStepTwoCompleted = ref(false)
  const isAddClassesStepThreeCompleted = ref(false)

  const isStepThreeCartCompleted = ref(false) // step three - cart
  const isStepThreeParticipantsCompleted = ref(false) // step three - participants
  const isStepThreePaymentCompleted = ref(false) // step three - payment

  const setParentStepper = stepperRef => {
    parentStepperRef.value = stepperRef
  }

  return {

    currentStep,
    isStepOneCompleted, // step one - overall
    isStepTwoCompleted, // step two - overall
    isStepThreeCartCompleted, // step three - cart
    isStepThreeParticipantsCompleted, // step three - participants
    isStepThreePaymentCompleted, // step three - payment
    isStepThreeCompleted, // step three - overall
    isAddClassesStepOneCompleted,
    isAddClassesStepTwoCompleted,
    isAddClassesStepThreeCompleted,
    parentStepperRef,
    setParentStepper,

  }
})
