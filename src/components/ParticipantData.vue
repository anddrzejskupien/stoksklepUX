<script setup>
import {ref, computed, watch} from 'vue'
import {useI18n} from 'vue-i18n'
import {useDisplay} from 'vuetify'
import UserIcon from '@/assets/user-circle-blue.svg'
// import DatePicker from '@/components/DatePicker.vue'
import {useStayStore} from '@/stores/StayStore.js'

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

const {t} = useI18n()
const {mobile} = useDisplay()
const stayStore = useStayStore()
const form = ref(null)
const showErrors = ref(false)

const rules = {
  required: value => !!value || t('fill_the_field_properly'),
  phone: value => {
    const phoneRegex = /^\+?[0-9]{9,15}$/
    return !value || phoneRegex.test(value) || t('invalid_phone_number')
  },
}

// Get adult participants for childminder selection
const adultParticipants = computed(() => {
  return stayStore.participants.filter(p => p.participantType === 'adult')
})

const isAnotherChildminder = computed(() =>
  props.participant.childminder === 'another',
)

// Prepare select items with "Another childminder" option
// 1. Ensure childminderOptions reacts to participant name changes
const childminderOptions = computed(() => {
  return [
    ...adultParticipants.value.map(p => ({
      ...p,
      // Create a display name for the dropdown
      name: `${p.name} ${p.surname}`.trim() || t('unnamed_adult')
    })),
    { name: t('another_childminder'), dynamicId: 'another' },
  ]
})

const hasAdultParticipants = computed(() => {
  return stayStore.participants.some(p => p.participantType === 'adult')
})

// Computed property to handle birthDate null/undefined conversion
// const birthDate = computed({
//   get: () => {
//     const value = props.participant.birthDate
//
//     // Return null for any invalid values
//     if (value === null || value === undefined || value === '') {
//       return null
//     }
//
//     // If it's already a Date object, validate it
//     if (value instanceof Date) {
//       return isNaN(value.getTime()) ? null : value
//     }
//
//     // If it's a string, try to parse it
//     const parsed = new Date(value)
//     return isNaN(parsed.getTime()) ? null : parsed
//   },
//   set: val => {
//     props.participant.birthDate = val ?? null
//   },
// })

// Watch for changes in childminder selection
watch(() => props.participant.childminder, (newVal) => {
  if (props.participant.participantType !== 'child' || !newVal) return

  // 1. Update the global suggestion if this is a manual change or the first one
  stayStore.tempChildminderSuggestion = {
    childminder: newVal,
    anotherChildminderName: props.participant.anotherChildminderName,
    anotherChildminderSurname: props.participant.anotherChildminderSurname,
    anotherChildminderPhone: props.participant.anotherChildminderPhone,
  }

  // 2. Automatically apply this selection to all other children who haven't picked a childminder yet
  stayStore.participants.forEach(p => {
    if (p.participantType === 'child' && !p.childminder) {
      p.childminder = newVal
      if (newVal === 'another') {
        p.anotherChildminderName = props.participant.anotherChildminderName
        p.anotherChildminderSurname = props.participant.anotherChildminderSurname
        p.anotherChildminderPhone = props.participant.anotherChildminderPhone
      }
    }
  })
})

// Optional: Keep "Another childminder" details in sync across participants
// watch(
//   [
//     () => props.participant.anotherChildminderName,
//     () => props.participant.anotherChildminderSurname,
//     () => props.participant.anotherChildminderPhone
//   ],
//   ([name, surname, phone]) => {
//     if (props.participant.childminder === 'another') {
//       stayStore.participants.forEach(p => {
//         if (p.participantType === 'child' && p.childminder === 'another') {
//           p.anotherChildminderName = name
//           p.anotherChildminderSurname = surname
//           p.anotherChildminderPhone = phone
//         }
//       })
//     }
//   }
// )
watch(
  [
    () => props.participant.anotherChildminderName,
    () => props.participant.anotherChildminderSurname,
    () => props.participant.anotherChildminderPhone
  ],
  ([name, surname, phone], [oldName, oldSurname, oldPhone]) => {
    const isUsingAnother = props.participant.childminder === 'another' || !hasAdultParticipants.value

    if (props.participant.participantType === 'child' && isUsingAnother) {
      // Propagate ONLY to children that appear AFTER the current one in the list
      stayStore.participants.forEach((p, idx) => {
        // Condition: Must be a child AND must be further down in the participants array
        if (p.participantType === 'child' && idx > props.index) {
          const targetIsAnother = p.childminder === 'another' || !hasAdultParticipants.value

          // Check if the target is empty OR if it matches what was there before the change
          const isTargetEmpty = !p.anotherChildminderName && !p.anotherChildminderSurname && !p.anotherChildminderPhone
          const isTargetMatchingOld = p.anotherChildminderName === oldName &&
            p.anotherChildminderSurname === oldSurname &&
            p.anotherChildminderPhone === oldPhone

          if (targetIsAnother && (isTargetEmpty || isTargetMatchingOld)) {
            p.anotherChildminderName = name
            p.anotherChildminderSurname = surname
            p.anotherChildminderPhone = phone
          }
        }
      })

      // Update global suggestion for any future participants added
      stayStore.tempChildminderSuggestion = {
        childminder: 'another',
        anotherChildminderName: name,
        anotherChildminderSurname: surname,
        anotherChildminderPhone: phone,
      }
    }
  }
)
defineExpose({
  validate: async () => {
    showErrors.value = true
    const formValid = await form.value?.validate()

    // Additional validation for childminder if child
    const hasChildminder = props.participant.participantType === 'child'
      ? !!props.participant.childminder
      : true

    return {
      valid: formValid?.valid && hasChildminder,
    }
  },
})

</script>

<template>
  <VForm ref="form" class="bg-white fc-black pa-4 rounded-lg my-4 box-shadow-sm">
    <div class="border-b mb-4 pb-4">
      <img alt="user-icon" :src="UserIcon">
      <div class="d-flex align-center fs-16 fw-500 mt-2">

        {{ index + 1 }}. {{ participant.name }}
      </div>
    </div>
    <VRow>
      <VCol :cols="mobile ? 12 : 6">

        <p class="custom-input-label mb-2">{{ $t('name') }}</p>
        <VTextField
          v-model="participant.name"
          autocomplete="off"
          clear-icon="mdi-close"
          clearable
          density="default"
          hide-details="auto"
          max-length="50"
          min-length="2"
          :rules="[rules.required]"
          variant="outlined"
          @keydown="(e) => /\d/.test(e.key) && e.preventDefault()"
        />

      </VCol>

      <VCol :cols="mobile ? 12 : 6">
        <p class="custom-input-label mb-2">{{ $t('surname') }}</p>
        <VTextField
          v-model="participant.surname"
          autocomplete="off"
          clear-icon="mdi-close"
          clearable
          density="default"
          hide-details="auto"
          max-length="50"
          min-length="2"
          :rules="[rules.required]"
          variant="outlined"
          @keydown="(e) => /\d/.test(e.key) && e.preventDefault()"
        />

      </VCol>

      <VCol
        v-if="participant.participantType === 'adult'"
        :cols="mobile ? 12 : 6"
      >
        <p class="custom-input-label mb-2">{{ $t('phone_number') }}</p>
        <VTextField
          v-model="participant.phone"
          autocomplete="off"
          clear-icon="mdi-close"
          clearable
          density="default"
          hide-details="auto"
          max-length="11"
          min-length="9"
          :rules="[rules.required, rules.phone]"
          variant="outlined"
          @keydown="(e) => !/[\d+]/.test(e.key) && e.key !== 'Backspace' && e.preventDefault()"
        />
      </VCol>

      <!--      <VCol :cols="mobile ? 12 : 6">-->
      <!--        <p class="custom-input-label mb-2">{{ $t('birth_date') }}</p>-->
      <!--        <DatePicker-->
      <!--          v-model="participant.birthDate"-->
      <!--          auto-apply-->
      <!--          :dark="false"-->
      <!--          :enable-time-picker="false"-->
      <!--          :placeholder="$t('select_date')"-->
      <!--        >-->
      <!--          <template #input-icon>-->
      <!--            <VIcon icon="mdi-calendar" size="18" />-->
      <!--          </template>-->
      <!--        </DatePicker>-->
      <!--        <small v-if="showErrors && !participant.birthDate" class="fs-12 fc-error pl-4 pt-2">-->
      <!--          {{ $t('fill_the_field_properly') }}-->
      <!--        </small>-->
      <!--        <p class="fs-12 px-4 fc-gray mt-1">-->
      <!--          {{ $t('why_birthdate') }}-->
      <!--        </p>-->
      <!--      </VCol>-->

      <VCol
        v-if="participant.participantType === 'child'"
        :cols="12"
      >
        <p class="custom-input-label mb-2">{{ $t('childminder') }}</p>
        <div v-if="hasAdultParticipants">
          <VSelect
            v-model="participant.childminder"
            clear-icon="mdi-close"
            clearable
            density="default"
            hide-details="auto"
            item-title="name"
            item-value="dynamicId"
            :items="childminderOptions"
            :placeholder="$t('select_childminder')"
            :rules="[rules.required]"
            variant="outlined"
          />
          <small v-if="showErrors && !participant.childminder" class="fs-12 fc-error pl-4 pt-2">
            {{ $t('select_childminder') }}
          </small>
        </div>
        <p
          class="fs-12  fc-gray mt-1"
          :class="hasAdultParticipants ? 'px-4' : 'px-0'"
        >
          {{ $t('person_reponsible_for_child') }}
        </p>
        <div v-if="!hasAdultParticipants">

          <p class="custom-input-label mt-4 mb-2">{{ $t('childminder_name') }}</p>
          <VTextField
            v-model="participant.anotherChildminderName"
            autocomplete="off"
            clear-icon="mdi-close"
            clearable
            density="default"
            hide-details="auto"
            max-length="50"
            min-length="2"
            :rules="[rules.required]"
            variant="outlined"
          />

          <p class="custom-input-label my-2">{{ $t('surname') }}</p>
          <VTextField
            v-model="participant.anotherChildminderSurname"
            autocomplete="off"
            clear-icon="mdi-close"
            clearable
            density="default"
            hide-details="auto"
            max-length="50"
            min-length="2"
            :rules="[rules.required]"
            variant="outlined"
          />

          <p class="custom-input-label my-2">{{ $t('childminder_phone') }}</p>
          <VTextField
            v-model="participant.anotherChildminderPhone"
            autocomplete="off"
            clear-icon="mdi-close"
            clearable
            density="default"
            hide-details="auto"
            max-length="11"
            :rules="[rules.required, rules.phone]"
            variant="outlined"
            @keydown="(e) => !/[\d+]/.test(e.key) && e.key !== 'Backspace' && e.preventDefault()"
          />
        </div>
      </VCol>
      <!-- Additional fields for "Another childminder" -->
      <template v-if="isAnotherChildminder">
        <VCol :cols="mobile ? 12 : 6">
          <p class="custom-input-label mb-2">{{ $t('childminder_name') }}</p>
          <VTextField
            v-model="participant.anotherChildminderName"
            autocomplete="off"
            clear-icon="mdi-close"
            clearable
            density="default"
            hide-details="auto"
            max-length="50"
            min-length="2"
            :rules="[rules.required]"
            variant="outlined"
          />
        </VCol>

        <VCol :cols="mobile ? 12 : 6">
          <p class="custom-input-label mb-2">{{ $t('surname') }}</p>
          <VTextField
            v-model="participant.anotherChildminderSurname"
            autocomplete="off"
            clear-icon="mdi-close"
            clearable
            density="default"
            hide-details="auto"
            max-length="50"
            min-length="2"
            :rules="[rules.required]"
            variant="outlined"
          />
        </VCol>

        <VCol :cols="mobile ? 12 : 6">
          <p class="custom-input-label mb-2">{{ $t('childminder_phone') }}</p>
          <VTextField
            v-model="participant.anotherChildminderPhone"
            autocomplete="off"
            clear-icon="mdi-close"
            clearable
            density="default"
            hide-details="auto"
            max-length="11"
            :rules="[rules.required, rules.phone]"
            variant="outlined"
            @keydown="(e) => !/[\d+]/.test(e.key) && e.key !== 'Backspace' && e.preventDefault()"
          />
          <p class="fs-12 px-4 fc-gray">
            {{ $t('enter_only_numbers') }}
          </p>
        </VCol>
      </template>

    </VRow>
  </VForm>
</template>
