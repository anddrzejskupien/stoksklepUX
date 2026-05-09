<script setup>
import {differenceInCalendarDays} from 'date-fns'
import {computed, ref, watch} from 'vue'
import {useI18n} from 'vue-i18n'
import CalendarPlusIcon from '@/assets/calendar-plus.svg'
import ClockGrayIcon from '@/assets/clock_gray.svg'
import InfoIcon from '@/assets/info.svg'
import UserIcon from '@/assets/user.svg'
import UsersGroupIcon from '@/assets/users-group.svg'
import UsersIcon from '@/assets/users.svg'
import ChildSpecialistInfoModal from '@/components/modals/ChildSpecialistInfoModal.vue'
import ClassesInfoModal from '@/components/modals/ClassesInfoModal.vue'
import GroupDetailsModal from '@/components/modals/GroupDetailsModal.vue'
import {usePickedClassesStore} from '@/stores/PickedClassesStore'
import {useStayStore} from '@/stores/StayStore'
import {useViewControlStore} from '@/stores/ViewControlStore'
import {useDisplay} from "vuetify/framework";

const props = defineProps({
  modelValue: {type: Boolean, default: false},
  dateStr: {type: String, default: ''},
  dateIso: {type: String, default: ''},
  participantType: {type: String, default: 'adult'},
  age: {type: Number, default: null},
  currentParticipant: {type: Object, default: null},
})

const emit = defineEmits(['update:modelValue', 'next'])
const {t} = useI18n()
const stayStore = useStayStore()
const pickedClassesStore = usePickedClassesStore()
const viewStore = useViewControlStore()
const {mobile} = useDisplay()


const availableSkillLevels = computed(() => {

  if (props.participantType === 'adult') {
    return stayStore.skillLevels_ADULTS
  } else if (props.participantType === 'child') {
    if (!props.age) {
      return []
    }

    const age = Number.parseInt(props.age)

    // Use adult skill levels for children aged 14 and above
    if (age >= 14) {
      return stayStore.skillLevels_ADULTS
    }

    if (props.currentParticipant.activityType === 'Narty') {
      return stayStore.skillLevels_CHILDREN_SKI.filter(level =>
        age >= level.ageRange[0] && age <= level.ageRange[1],
      )
    } else if (props.currentParticipant.activityType === 'Snowboard') {
      return stayStore.skillLevels_CHILDREN_SNOWBOARD.filter(level =>
        age >= level.ageRange[0] && age <= level.ageRange[1],
      )
    }
  }
  return []
})


const currentStep = ref(1)
const selectedType = ref(null)
const showStepper = ref(false)
const showClassesInfoModal = ref(false)
const showChildSpecialistModal = ref(false)
const showGroupDetailsModal = ref(false)
const selectedGroupForDetails = ref(null)
const savePreferences = ref(false)

const skillInfoDialog = ref(false)
const selectedSkillLevel = ref(null)
const currentSkillLevelInfo = ref(null)

const selectSkillLevel = (level) => {
  for (const l of availableSkillLevels.value) l.selected = false
  level.selected = true


  props.currentParticipant.skillLevel = level.name
  selectedSkillLevel.value = [level]
  skillInfoDialog.value = false
}

function openGroupDetails(group) {
  selectedGroupForDetails.value = group
  showGroupDetailsModal.value = true
}

function formatSchedule(text) {
  if (!text) return ''
  return text.replace(/(\d{1,2}:\d{2})/g, '<span class="text-primary font-weight-bold">$1</span>')
}

// Shared Flow State
const sharedParticipants = ref([])

// Group Flow State
// selectedGroup is now in store

const stayDuration = computed(() => {
  if (!stayStore.dateOfStay) return 0
  let start, end
  if (Array.isArray(stayStore.dateOfStay)) {
    if (stayStore.dateOfStay.length === 0) return 0
    start = new Date(stayStore.dateOfStay[0])
    end = stayStore.dateOfStay[1] ? new Date(stayStore.dateOfStay[1]) : start
  } else {
    start = new Date(stayStore.dateOfStay)
    end = start
  }
  return differenceInCalendarDays(end, start) + 1
})

// Mock Data
const classTypes = computed(() => {
  const types = [
    {
      id: 'individual',
      label: t('private_lesson_1p'),
      icon: UserIcon,
    },
    {
      id: 'shared',
      label: t('private_lesson_2_3p'),
      icon: UsersIcon,
    },
    {
      id: 'group',
      label: t('group_course_few_days'),
      icon: UsersGroupIcon,
    },
  ]

  return types.filter(type => {
    // 1. Hide shared if < 2 participants
    if (type.id === 'shared' && stayStore.participants.length < 2) {
      return false
    }
    // 2. Hide group if stay <= 2 days
    if (type.id === 'group' && stayDuration.value <= 2) {
      return false
    }
    return true
  })
})

const timesOfDay = computed(() => [
  {title: t('any_time'), value: 'Dowolna'},
  {title: t('morning'), value: 'Rano'},
  {title: t('afternoon'), value: 'Popołudnie'},
  {title: t('evening'), value: 'Wieczór'},
])
const durations = ['1h', '1,5h', '2h', '2,5h', '3h', '4h', '5h']
const genders = computed(() => [
  {title: t('any_gender'), value: 'Dowolna'},
  {title: t('female'), value: 'Kobieta'},
  {title: t('male'), value: 'Mężczyzna'},
])

// Reset state when modal opens/closes or type changes
watch(() => props.modelValue, val => {
  if (val) {
    resetState()
    if (props.currentParticipant?.skillLevel) {
      const level = availableSkillLevels.value.find(l => l.name === props.currentParticipant.skillLevel)
      if (level) {
        selectedSkillLevel.value = [level]
      }
    }
  }
})

// Update store selected date when prop changes
watch(() => props.dateIso, val => {
  if (val) {
    pickedClassesStore.setSelectedDate(val)
  }
}, {immediate: true})

// Reset filters when "Search only classes with previously selected instructor" is enabled
watch(() => pickedClassesStore.searchPreviouslySelected, val => {
  if (val) {
    // Reset Individual Preferences
    pickedClassesStore.individualPreferences.timeOfDay = 'Dowolna'
    pickedClassesStore.individualPreferences.instructorGender = 'Dowolna'
    pickedClassesStore.individualPreferences.findSpecificInstructor = false
    pickedClassesStore.individualPreferences.selectedInstructor = null

    // Reset Shared Preferences
    pickedClassesStore.sharedPreferences.timeOfDay = 'Dowolna'
    pickedClassesStore.sharedPreferences.instructorGender = 'Dowolna'
    pickedClassesStore.sharedPreferences.findSpecificInstructor = false
    pickedClassesStore.sharedPreferences.selectedInstructor = null
  }
})

// Disable "Search only classes with previously selected instructor" if no instructor is selected
watch(() => pickedClassesStore.hasPreviouslySelectedInstructor, val => {
  if (!val) {
    pickedClassesStore.searchPreviouslySelected = false
  }
})


function resetState() {
  currentStep.value = 1
  selectedType.value = null
  showStepper.value = false

  // Clear the selected skill level state
  selectedSkillLevel.value = null
  availableSkillLevels.value.forEach(l => l.selected = false)

  viewStore.isAddClassesStepOneCompleted = false
  viewStore.isAddClassesStepTwoCompleted = false
  viewStore.isAddClassesStepThreeCompleted = false
  pickedClassesStore.resetState()

  const saved = pickedClassesStore.loadFilterPreferences()
  if (saved) {
    savePreferences.value = true
  } else {
    savePreferences.value = false
    // Set default duration based on age
    const ageNum = Number(props.age)
    const defaultDuration = (!Number.isNaN(ageNum) && ageNum >= 4 && ageNum <= 8) ? '1h' : '2h'
    pickedClassesStore.individualPreferences.duration = defaultDuration
    pickedClassesStore.sharedPreferences.duration = defaultDuration
  }

  sharedParticipants.value = []

  // Always pre-select the first participant
  if (stayStore.participants.length > 0) {
    const p1 = stayStore.participants[0]
    sharedParticipants.value.push(p1.dynamicId || 0)
  }
}

function close() {
  emit('update:modelValue', false)
}

function handleTypeSelection() {
  if (selectedType.value) {
    showStepper.value = true
    currentStep.value = 1
  }
}

function goNext() {
  if (savePreferences.value && (
    (selectedType.value === 'individual' && currentStep.value === 1)
    || (selectedType.value === 'shared' && currentStep.value === 2)
  )) {
    const prefs = selectedType.value === 'individual'
      ? pickedClassesStore.individualPreferences
      : pickedClassesStore.sharedPreferences
    pickedClassesStore.saveFilterPreferences(prefs)
  }

  switch (selectedType.value) {
    case 'individual': {
      if (currentStep.value < 2) {
        if (currentStep.value === 1) viewStore.isAddClassesStepOneCompleted = true
        currentStep.value++
      } else {
        viewStore.isAddClassesStepTwoCompleted = true
        handleFinish()
      }
      break
    }
    case 'shared': {
      if (currentStep.value < 3) {
        if (currentStep.value === 1) viewStore.isAddClassesStepOneCompleted = true
        if (currentStep.value === 2) viewStore.isAddClassesStepTwoCompleted = true
        currentStep.value++
      } else {
        viewStore.isAddClassesStepThreeCompleted = true
        handleFinish()
      }
      break
    }
    case 'group': {
      if (currentStep.value < 2) {
        currentStep.value++
      } else {
        handleFinish()
      }
      break
    }
  }
}

function goBack() {
  if (currentStep.value > 1) {
    currentStep.value--
  } else {
    showStepper.value = false
    selectedType.value = null
  }
}

function handleFinish() {
  // Emit next with selected data
  emit('next', {
    type: selectedType.value,
    data: getDataForType(),
  })
  close()
}

function getDataForType() {
  if (selectedType.value === 'individual') {
    let slotObj = pickedClassesStore.availableSlots.find(s => s.id === pickedClassesStore.individualSlot)
    if (!slotObj) {
      slotObj = pickedClassesStore.availableSlots.find(s => s.id === Number(pickedClassesStore.individualSlot))
    }

    let finalSlot = slotObj
    if (slotObj && slotObj.discount) {
      finalSlot = {...slotObj}
      finalSlot.originalPrice = finalSlot.price
      finalSlot.price = calculateDiscountedPrice(finalSlot.price, finalSlot.discount)
    }

    return {preferences: pickedClassesStore.individualPreferences, slot: finalSlot || pickedClassesStore.individualSlot}
  }
  if (selectedType.value === 'shared') {
    let slotObj = pickedClassesStore.availableSlots.find(s => s.id === pickedClassesStore.sharedSlot)
    if (!slotObj) {
      slotObj = pickedClassesStore.availableSlots.find(s => s.id === Number(pickedClassesStore.sharedSlot))
    }

    let finalSlot = slotObj
    if (slotObj && slotObj.discount) {
      finalSlot = {...slotObj}
      finalSlot.originalPrice = finalSlot.price
      finalSlot.price = calculateDiscountedPrice(finalSlot.price, finalSlot.discount)
    }

    return {
      participants: sharedParticipants.value,
      preferences: pickedClassesStore.sharedPreferences,
      slot: finalSlot || pickedClassesStore.sharedSlot
    }
  }
  if (selectedType.value === 'group') {
    const groupObj = pickedClassesStore.availableGroups.find(g => g.id === pickedClassesStore.selectedGroup)

    let finalGroup = groupObj
    if (groupObj && groupObj.discount) {
      finalGroup = {...groupObj}
      finalGroup.originalPrice = finalGroup.price
      finalGroup.price = calculateDiscountedPrice(finalGroup.price, finalGroup.discount)
    }

    return {
      group: finalGroup || pickedClassesStore.selectedGroup,
      childAddOn: props.participantType === 'child' && pickedClassesStore.childAddOnSelections[pickedClassesStore.selectedGroup],
      childAddOnPrice: pickedClassesStore.childAddOnPrice,
    }
  }
  return null
}

function calculateDiscountedPrice(price, discount) {
  if (!discount) return price
  return Math.round(price * (1 - discount))
}

function calculateGroupPrice(group) {
  let price = group.price
  if (props.participantType === 'child' && pickedClassesStore.childAddOnSelections[group.id]) {
    price += pickedClassesStore.childAddOnPrice
  }
  return price
}

function calculateDiscountedGroupPrice(group) {
  let price = calculateDiscountedPrice(group.price, group.discount)
  if (props.participantType === 'child' && pickedClassesStore.childAddOnSelections[group.id]) {
    price += pickedClassesStore.childAddOnPrice
  }
  return price
}

// Titles
const modalTitle = computed(() => {
  if (!showStepper.value) return t('adding_classes')
  if (selectedType.value === 'individual') return t('adding_private_lesson')
  if (selectedType.value === 'shared') return t('adding_private_lesson_2_3')
  if (selectedType.value === 'group') return t('adding_group_course')
  return t('adding_classes')
})

// Navigation Logic
const isLastStep = computed(() => {
  if (!showStepper.value) return false
  if (selectedType.value === 'individual') return currentStep.value === 2
  if (selectedType.value === 'shared') return currentStep.value === 3
  // if (selectedType.value === 'group') return true
  if (selectedType.value === 'group') return currentStep.value === 2 // Updated from true
  return false
})

const leftButtonText = computed(() => showStepper.value ? t('back') : t('exit'))

const rightButtonText = computed(() => {
  if (!showStepper.value) return t('next')
  return isLastStep.value ? t('add_classes') : t('next')
})

const rightButtonIcon = computed(() => {
  if (!showStepper.value) return 'mdi-arrow-right'
  return isLastStep.value ? '' : 'mdi-arrow-right'
})

const isRightButtonDisabled = computed(() => {
  if (!showStepper.value) return !selectedType.value

  if (selectedType.value === 'individual' && currentStep.value === 2) {
    return !pickedClassesStore.individualSlot
  }
  if (selectedType.value === 'shared') {
    if (currentStep.value === 1) return sharedParticipants.value.length <= 1
    if (currentStep.value === 3) return !pickedClassesStore.sharedSlot
  }
  if (selectedType.value === 'group') {
    // Add check for skill level in step 1
    if (currentStep.value === 1) return !props.currentParticipant?.skillLevel

    // Step 2: Selecting a group
    return !pickedClassesStore.selectedGroup
  }

  return false
})

const rightButtonColor = computed(() => {
  if (!showStepper.value) return selectedType.value ? 'blue' : 'grey-lighten-2'
  return 'blue'
})

function handleLeftButton() {
  if (showStepper.value) {
    goBack()
  } else {
    close()
  }
}

function handleRightButton() {
  if (showStepper.value) {
    goNext()
  } else {
    handleTypeSelection()
  }
}

const isChildParticipant = computed(() => {
  if (selectedType.value === 'individual') {
    return props.participantType === 'child'
  }
  if (selectedType.value === 'shared' && stayStore.participants.length > 0) {
    return stayStore.participants[0].participantType === 'child'
  }
  return false
})

const isInstructorAvailableForDuration = computed(() => {
  let prefs
  if (selectedType.value === 'individual') {
    prefs = pickedClassesStore.individualPreferences
  } else if (selectedType.value === 'shared') {
    prefs = pickedClassesStore.sharedPreferences
  } else {
    return true
  }

  if (!prefs.findSpecificInstructor || !prefs.selectedInstructor) return true

  return pickedClassesStore.availableSlots.some(s =>
    s.date === pickedClassesStore.selectedDate
    && s.instructor === prefs.selectedInstructor
    && s.duration === prefs.duration,
  )
})

function toggleChildSpecialist(type) {
  const prefs = type === 'individual' ? pickedClassesStore.individualPreferences : pickedClassesStore.sharedPreferences
  prefs.childSpecialist = !prefs.childSpecialist
}

function getFilters(prefs) {
  const filters = []
  if (prefs.timeOfDay && prefs.timeOfDay !== 'Dowolna') {
    const timeMap = {
      Rano: t('morning'),
      Popołudnie: t('afternoon'),
      Wieczór: t('evening'),
    }
    const label = timeMap[prefs.timeOfDay] || prefs.timeOfDay
    filters.push({key: 'timeOfDay', label})
  }
  if (prefs.duration && prefs.duration !== '2h') {
    filters.push({key: 'duration', label: t('lessons_duration_label', {duration: prefs.duration})})
  }
  if (prefs.instructorGender && prefs.instructorGender !== 'Dowolna') {
    let genderLabel = ''
    if (prefs.instructorGender === 'Kobieta') genderLabel = t('female').toLowerCase()
    else if (prefs.instructorGender === 'Mężczyzna') genderLabel = t('male').toLowerCase()
    else genderLabel = t('any_gender').toLowerCase()
    filters.push({key: 'instructorGender', label: `${t('instructor')} ${genderLabel}`})
  }
  return filters
}

const individualFilters = computed(() => getFilters(pickedClassesStore.individualPreferences))
const sharedFilters = computed(() => getFilters(pickedClassesStore.sharedPreferences))

function removeFilter(type, key) {
  const prefs = type === 'individual' ? pickedClassesStore.individualPreferences : pickedClassesStore.sharedPreferences
  if (key === 'timeOfDay') prefs.timeOfDay = 'Dowolna'
  if (key === 'duration') prefs.duration = '2h'
  if (key === 'instructorGender') prefs.instructorGender = 'Dowolna'
}

const availableParticipantsForShared = computed(() => {
  if (stayStore.participants.length === 0) return []

  const firstParticipant = stayStore.participants[0]
  const allowedType = firstParticipant.participantType
  const allowedActivity = firstParticipant.activityType

  return stayStore.participants
    .map((p, index) => ({data: p, originalIndex: index}))
    .filter(({data: p}) => {
      // Check age category
      if (p.participantType !== allowedType) return false

      // Check discipline
      if (p.activityType !== allowedActivity) return false

      return true
    })
})

function toggleParticipant(id) {
  const firstId = stayStore.participants[0]?.dynamicId || 0

  // Prevent removing the first participant
  if (id === firstId) {
    // Ensure it's selected (recovery mechanism)
    if (!sharedParticipants.value.includes(id)) {
      sharedParticipants.value.push(id)
    }
    return
  }

  const index = sharedParticipants.value.indexOf(id)
  if (index === -1) {
    if (sharedParticipants.value.length < 3) {
      sharedParticipants.value.push(id)
    }
  } else {
    sharedParticipants.value.splice(index, 1)
  }
}

const selectedParticipantNames = computed(() => {
  if (selectedType.value !== 'shared') return []
  const parts = stayStore.participants
  if (!parts) return []

  return sharedParticipants.value.map(id => {
    const p = parts.find(part => (part.dynamicId || 0) === id)
    if (p) return p.name || 'Uczestnik'
    const pByIndex = parts[id]
    if (pByIndex) return pByIndex.name || 'Uczestnik'
    return 'Uczestnik'
  })
})
</script>

<template>
  <VDialog
    max-width="600"
    :model-value="modelValue"
    persistent
    @update:model-value="emit('update:modelValue', $event)"
  >
    <VCard class="rounded-xl d-flex flex-column" style="max-height: 90vh;">
      <!-- Header Area (Fixed) -->
      <div class="modal-header pa-4">
        <div class="d-flex justify-space-between align-center">
          <span class="text-h6 font-weight-bold text-primary-900 mb-1 pr-6">{{ modalTitle }}</span>
          <VBtn class="special-close-btn" variant="text" @click="close"/>
        </div>

        <div v-if="selectedParticipantNames.length > 0 && currentStep > 1"
             class="d-flex flex-wrap align-center mb-3 mt-1" style="gap: 8px;">
          <div
            v-for="(name, index) in selectedParticipantNames"
            :key="index"
            class="px-3 py-1 rounded-pill text-primary font-weight-bold text-caption"
            style="background-color: #eff6ff; color: #1a56db !important;"
          >
            {{ name }}
          </div>
        </div>

        <div class="d-flex align-center text-grey-darken-1">
          <img alt="" class="mr-2" :src="CalendarPlusIcon" width="13">
          <span class="font-weight-medium fs-14">{{ dateStr }}</span>
        </div>
      </div>

      <!-- Scrollable Content Area -->
      <div class="flex-grow-1 overflow-y-auto pa-4" style="min-height: 0;">

        <!-- TYPE SELECTION VIEW -->
        <div v-if="!showStepper">
          <div class="text-center mb-4">
            <span class="text-subtitle-1 font-weight-medium text-primary-900">{{ t('select_class_type') }}</span>
          </div>

          <div class="d-flex flex-column gap-3 mb-6">
            <div
              v-for="type in classTypes"
              :key="type.id"
              class="selection-card d-flex align-center px-4 py-3 cursor-pointer"
              :class="{ 'selected': selectedType === type.id }"
              @click="selectedType = type.id"
            >
              <div class="selection-circle mr-4 d-flex align-center justify-center"/>
              <img alt="" class="mr-3" :src="type.icon" width="24">
              <span class="font-weight-medium text-primary-900 fs-14">{{ type.label }}</span>
            </div>
          </div>

          <div class="d-flex justify-center mb-6">
            <VBtn
              class="text-none text-caption"
              color="grey-darken-1 border-gray"
              variant="outlined"
              @click="showClassesInfoModal = true"
            >
              <template #prepend>
                <img alt="" :src="InfoIcon" width="16">
              </template>
              {{ t('learn_more_about_class_types') }}
            </VBtn>
          </div>
        </div>

        <!-- STEPPER FLOWS -->
        <VStepper
          v-else
          v-model="currentStep"
          class="elevation-0"
          hide-actions
        >
          <VStepperHeader class="box-shadow-none">
            <template v-if="selectedType === 'individual'">
              <VStepperItem
                class="pa-2"
                :complete="viewStore.isAddClassesStepOneCompleted"
                :title="t('preferences')"
                :value="1"
              />
              <VDivider/>
              <VStepperItem
                class="pa-2"
                :complete="viewStore.isAddClassesStepTwoCompleted"
                :title="t('term')"
                :value="2"
              />
            </template>
            <template v-if="selectedType === 'shared'">
              <VStepperItem
                class="pa-2"
                :complete="viewStore.isAddClassesStepOneCompleted"
                :title="t('participants')"
                :value="1"
              />
              <VDivider/>
              <VStepperItem
                class="pa-2"
                :complete="viewStore.isAddClassesStepTwoCompleted"
                :title="t('preferences')"
                :value="2"
              />
              <VDivider/>
              <VStepperItem
                class="pa-2"
                :complete="viewStore.isAddClassesStepThreeCompleted"
                :title="t('term')"
                :value="3"
              />
            </template>
            <template v-if="selectedType === 'group'">
              <VStepperItem
                class="pa-2"
                :title="t('skillLevel')"
                :value="1"
              />
              <VStepperItem
                class="pa-2"
                :title="t('group')"
                :value="2"
              />
            </template>
          </VStepperHeader>

          <VStepperWindow v-model="currentStep">
            <!-- INDIVIDUAL FLOW -->
            <template v-if="selectedType === 'individual'">
              <!-- Step 1: Preferences -->
              <VStepperWindowItem :value="1">
                <div class="text-center mb-4">
                  <span class="text-subtitle-1 font-weight-medium text-primary-900">{{
                      t('adjust_your_classes')
                    }}</span>
                </div>

                <VSwitch
                  v-model="pickedClassesStore.searchPreviouslySelected"
                  class="ml-2 mb-2 gap-4"
                  color="primary"
                  density="compact"
                  :disabled="!pickedClassesStore.hasPreviouslySelectedInstructor"
                  hide-details
                  :label="t('search_only_with_prev_instructor')"
                />

                <div>
                  <span class="text-subtitle-2 font-weight-bold mb-1 d-block text-primary-900">{{
                      t('time_of_day')
                    }}</span>
                  <VSelect
                    v-model="pickedClassesStore.individualPreferences.timeOfDay"
                    density="compact"
                    :disabled="pickedClassesStore.searchPreviouslySelected"
                    :items="timesOfDay"
                    variant="outlined"
                  />
                </div>
                <div>
                  <span class="text-subtitle-2 font-weight-bold mb-1 d-block text-primary-900">{{
                      t('lesson_duration')
                    }}</span>
                  <VSelect
                    v-model="pickedClassesStore.individualPreferences.duration"
                    density="compact"
                    :items="durations"
                    variant="outlined"
                  />
                </div>
                <div class="mb-4">
                  <span class="text-subtitle-2 font-weight-bold mb-1 d-block text-primary-900 mb-2">{{
                      t('instructor_gender')
                    }}</span>
                  <VBtnToggle
                    v-model="pickedClassesStore.individualPreferences.instructorGender"
                    class="ga-2 w-100 gender-buttons"
                    :disabled="pickedClassesStore.searchPreviouslySelected"
                    mandatory
                  >
                    <VBtn
                      v-for="gender in genders"
                      :key="gender.value"
                      class="text-capitalize border rounded flex-1"
                      size="small"
                      :value="gender.value"
                      variant="outlined"
                    >
                      {{ gender.title }}
                    </VBtn>
                  </VBtnToggle>
                </div>
                <div class="mb-4">
                  <VCheckbox
                    v-model="pickedClassesStore.individualPreferences.findSpecificInstructor"
                    color="primary"
                    density="compact"
                    :disabled="pickedClassesStore.searchPreviouslySelected"
                    hide-details
                    :label="t('find_specific_instructor')"
                  />
                  <div v-if="pickedClassesStore.individualPreferences.findSpecificInstructor">
                    <span class="text-subtitle-2 font-weight-bold mt-1 mb-1 d-block text-primary-900">{{
                        t('instructor')
                      }}</span>
                    <VAutocomplete
                      v-model="pickedClassesStore.individualPreferences.selectedInstructor"
                      class="instructor-select"
                      density="compact"
                      :items="pickedClassesStore.instructors"
                      :placeholder="t('select_instructor')"
                      variant="outlined"
                    />
                    <div v-if="!isInstructorAvailableForDuration" class="text-caption text-red mb-2">
                      {{ t('instructor_not_available') }}
                    </div>
                  </div>

                  <div v-if="isChildParticipant" class="mb-4 pa-3 rounded-lg d-flex align-start mt-2"
                       style="background-color: #E1EFFE;">
                    <div class="mr-3 mt-1">
                      <div
                        class="selection-circle d-flex align-center justify-center cursor-pointer"
                        :class="{ 'selected': pickedClassesStore.individualPreferences.childSpecialist }"
                        style="width: 20px; height: 20px; border: 2px solid #A4CAFE; border-radius: 50%; background: white;"
                        @click="toggleChildSpecialist('individual')"
                      >
                        <div v-if="pickedClassesStore.individualPreferences.childSpecialist"
                             style="width: 10px; height: 10px; border-radius: 50%; background-color: #1E429F;"/>
                      </div>
                    </div>
                    <div>
                      <div class="font-weight-bold text-primary-900 fs-14 cursor-pointer"
                           @click="toggleChildSpecialist('individual')">{{ t('child_specialists_only') }}
                      </div>
                      <div class="text-caption text-primary-900 mb-1" style="line-height: 1.3; opacity: 0.8;">
                        {{ t('child_specialists_description') }}
                      </div>
                      <a
                        class="text-caption text-primary-900 text-decoration-underline font-weight-medium cursor-pointer"
                        @click="showChildSpecialistModal = true"
                      >
                        {{ t('learn_more') }}
                      </a>
                    </div>
                  </div>
                </div>
              </VStepperWindowItem>

              <!-- Step 2: Slots -->
              <VStepperWindowItem :value="2">
                <div class="text-center mb-4">
                  <span class="text-subtitle-1 font-weight-medium text-primary-900">{{
                      t('choose_available_slots')
                    }}</span>
                </div>

                <div class="d-flex align-center justify-center flex-wrap gap-2 mb-4">
                  <VChip
                    v-for="filter in individualFilters"
                    :key="filter.key"
                    class="filter-chip"
                    :class="{ 'filter-chip--error': filter.isProblematic }"
                    closable
                    close-icon="mdi-close"
                    color="grey-lighten-4"
                    label
                    size="small"
                    variant="flat"
                    @click:close="removeFilter('individual', filter.key)"
                  >
                    <span>{{ filter.label }}</span>
                  </VChip>
                </div>

                <div v-if="pickedClassesStore.displayedIndividualSlots.length > 0" class="d-flex flex-column gap-3">
                  <div
                    v-for="slot in pickedClassesStore.displayedIndividualSlots"
                    :key="slot.id"
                    class="slot-card d-flex align-center px-4 py-3 cursor-pointer"
                    :class="{ 'selected': pickedClassesStore.individualSlot === slot.id }"
                    @click="pickedClassesStore.individualSlot = slot.id"
                  >
                    <div class="selection-circle mr-4 d-flex align-center justify-center flex-shrink-0"/>

                    <div class="d-flex flex-column w-100">
                      <div class="flex-grow-1 d-flex justify-space-between align-start">
                        <div class="d-flex flex-column align-start">
                          <span class="font-weight-bold fs-14 blue-text">{{ slot.time }}</span>
                          <div v-if="slot.instructor" class="text-caption-slot mt-1 text-left">
                            {{ t('instructor_selected_previously') }}<br>
                            <span class="font-weight-bold">{{ slot.instructor }}</span>
                          </div>
                        </div>
                        <div class="d-flex flex-column align-start justify-center h-100">
                          <div v-if="slot.isHappyHours" class="happy-hours-badge">
                            Happy hours
                          </div>
                        </div>
                      </div>
                      <div v-if="slot.price" class="d-flex justify-end w-100 mt-1">
                        <div v-if="slot.discount" class="d-flex align-center">
                          <span class="text-decoration-line-through text-grey mr-2 fs-14">{{ slot.price }},00zł</span>
                          <span class="font-weight-bold blue-text fs-14 pl-1">{{
                              calculateDiscountedPrice(slot.price, slot.discount)
                            }},00zł</span>
                        </div>
                        <span v-else class="font-weight-bold text-primary-900 fs-14 pl-1">{{ slot.price }},00zł</span>
                      </div>
                    </div>
                  </div>
                  <!-- TODO: Remove this button after backend integration -->
                  <div v-if="pickedClassesStore.individualFilteredSlots.length > pickedClassesStore.visibleSlotsLimit"
                       class="mt-2">
                    <VBtn
                      block
                      class="text-capitalize load-more-btn"
                      variant="outlined"
                      @click="pickedClassesStore.loadMoreSlots('individual')"
                    >
                      {{ t('load_more') }}
                    </VBtn>
                  </div>
                </div>

                <div v-else class="text-center py-4">
                  <div class="text-h6 font-weight-bold text-primary-900 mb-6">
                    <span v-html="t('no_classes_found').replace('\n', '<br>')"/>
                  </div>

                  <VBtn
                    class="text-capitalize mb-8 text-primary-900 border-primary find-other-btn text-wrap py-2"
                    color="primary"
                    style="min-height: 59px; height: auto;"
                    variant="flat"
                    width="100%"
                  >
                    <span class="text-break" style="white-space: normal; line-height: 1.2;"
                          v-html="t('find_closest_classes').replace('\n', '<br>')"/>
                  </VBtn>

                  <div class="border rounded-lg px-4 py-3 d-flex align-start text-left bg-white border-gray">
                    <VIcon class="mr-3 mt-1 flex-shrink-0" color="grey-darken-1" icon="mdi-message-text-outline"/>
                    <div class="text-caption text-grey-darken-1" style="line-height: 1.4;">
                      {{ t('contact_customer_service_info') }}
                      <a class="text-decoration-underline text-grey-darken-1 font-weight-medium cursor-pointer"
                         href="https://szkolastok.pl/kontakt" rel="noopener noreferrer"
                         target="_blank">{{ t('customer_service_office') }}</a>.
                    </div>
                  </div>
                </div>
              </VStepperWindowItem>
            </template>

            <!-- SHARED FLOW -->
            <template v-if="selectedType === 'shared'">
              <!-- Step 1: Participants -->
              <VStepperWindowItem :value="1">
                <div class="text-center mb-4">
                  <span class="text-subtitle-1 font-weight-medium text-primary-900">Wybierz uczestników:</span>
                </div>
                <div class="mb-4">
                  <p class="text-caption text-grey-darken-1 mb-6 text-center"
                     style="line-height: 1.4; max-width: 92%; margin: 0 auto;">
                    Wybierz maksymalnie trzech uczestników o podobnych preferncjach którzy mają uczestniczyć w
                    zajęciach.
                  </p>
                  <div class="d-flex flex-column gap-3">
                    <div
                      v-for="item in availableParticipantsForShared"
                      :key="item.originalIndex"
                      class="selection-card d-flex align-center px-4 py-3 cursor-pointer"
                      :class="{ 'selected': sharedParticipants.includes(item.data.dynamicId || item.originalIndex), 'disabled': item.originalIndex === 0 }"
                      @click="toggleParticipant(item.data.dynamicId || item.originalIndex)"
                    >
                      <div class="selection-circle mr-4 d-flex align-center justify-center flex-shrink-0"/>
                      <span class="font-weight-medium text-primary-900 fs-14">
                        {{ item.originalIndex + 1 }} - {{ item.data.name || `Uczestnik ${item.originalIndex + 1}` }}
                      </span>
                    </div>
                  </div>
                </div>
              </VStepperWindowItem>

              <!-- Step 2: Preferences (Same as Individual Step 1) -->
              <VStepperWindowItem :value="2">
                <div class="text-center mb-4">
                  <span class="text-subtitle-1 font-weight-medium text-primary-900">{{
                      t('adjust_your_classes')
                    }}</span>
                </div>
                <VSwitch
                  v-model="pickedClassesStore.searchPreviouslySelected"
                  class="ml-2 mb-2 gap-4"
                  color="primary"
                  density="compact"
                  :disabled="!pickedClassesStore.hasPreviouslySelectedInstructor"
                  hide-details
                  :label="t('search_only_with_prev_instructor')"
                />

                <div class="mb-4">
                  <span class="text-subtitle-2 font-weight-bold mb-1 d-block text-primary-900">{{
                      t('time_of_day')
                    }}</span>
                  <VSelect
                    v-model="pickedClassesStore.sharedPreferences.timeOfDay"
                    density="compact"
                    :disabled="pickedClassesStore.searchPreviouslySelected"
                    :items="timesOfDay"
                    variant="outlined"
                  />
                </div>
                <div class="mb-4">
                  <span class="text-subtitle-2 font-weight-bold mb-1 d-block text-primary-900">{{
                      t('lesson_duration')
                    }}</span>
                  <VSelect
                    v-model="pickedClassesStore.sharedPreferences.duration"
                    density="compact"
                    :items="durations"
                    variant="outlined"
                  />
                </div>
                <div class="mb-4">
                  <span class="text-subtitle-2 font-weight-bold mb-1 d-block text-primary-900 mb-2">{{
                      t('instructor_gender')
                    }}</span>
                  <VBtnToggle
                    v-model="pickedClassesStore.sharedPreferences.instructorGender"
                    class="ga-2 w-100 gender-buttons"
                    :disabled="pickedClassesStore.searchPreviouslySelected"
                    mandatory
                  >
                    <VBtn
                      v-for="gender in genders"
                      :key="gender.value"
                      class="text-capitalize border rounded flex-1"
                      size="small"
                      :value="gender.value"
                      variant="outlined"
                    >
                      {{ gender.title }}
                    </VBtn>
                  </VBtnToggle>
                </div>
                <div class="mb-4">

                  <VCheckbox
                    v-model="pickedClassesStore.sharedPreferences.findSpecificInstructor"
                    color="primary"
                    density="compact"
                    :disabled="pickedClassesStore.searchPreviouslySelected"
                    hide-details
                    :label="t('find_specific_instructor')"
                  />
                  <div v-if="pickedClassesStore.sharedPreferences.findSpecificInstructor">
                    <span class="text-subtitle-2 font-weight-bold mt-1 mb-1 d-block text-primary-900">{{
                        t('instructor')
                      }}</span>
                    <VAutocomplete
                      v-model="pickedClassesStore.sharedPreferences.selectedInstructor"
                      class="instructor-select"
                      density="compact"
                      :items="pickedClassesStore.instructors"
                      :placeholder="t('select_instructor')"
                      variant="outlined"
                    />
                    <div v-if="!isInstructorAvailableForDuration" class="text-caption text-red mb-2">
                      {{ t('instructor_not_available') }}
                    </div>
                  </div>
                </div>
              </VStepperWindowItem>

              <!-- Step 3: Slots (Same as Individual Step 2) -->
              <VStepperWindowItem :value="3">
                <div class="text-center mb-4">
                  <span class="text-subtitle-1 font-weight-medium text-primary-900">{{
                      t('choose_available_slots')
                    }}</span>
                </div>

                <div class="d-flex align-center justify-center flex-wrap gap-2 mb-4">
                  <VChip
                    v-for="filter in sharedFilters"
                    :key="filter.key"
                    class="filter-chip"
                    :class="{ 'filter-chip--error': filter.isProblematic }"
                    closable
                    close-icon="mdi-close"
                    color="grey-lighten-4"
                    label
                    size="small"
                    variant="flat"
                    @click:close="removeFilter('shared', filter.key)"
                  >
                    <span>{{ filter.label }}</span>
                  </VChip>
                </div>

                <div v-if="pickedClassesStore.displayedSharedSlots.length > 0" class="d-flex flex-column gap-3">
                  <div
                    v-for="slot in pickedClassesStore.displayedSharedSlots"
                    :key="slot.id"
                    class="slot-card d-flex align-center px-4 py-3 cursor-pointer"
                    :class="{ 'selected': pickedClassesStore.sharedSlot === slot.id }"
                    @click="pickedClassesStore.sharedSlot = slot.id"
                  >
                    <div class="selection-circle mr-4 d-flex align-center justify-center flex-shrink-0"/>
                    <div class="flex-grow-1 d-flex justify-space-between align-center">
                      <div class="d-flex flex-column align-start">
                        <span class="font-weight-bold fs-14 blue-text">{{ slot.time }}</span>
                        <div v-if="slot.instructor" class="text-caption-slot mt-1 text-left">
                          {{ t('instructor_selected_previously') }}<br>
                          <span class="font-weight-bold">{{ slot.instructor }}</span>
                        </div>
                      </div>
                      <div class="d-flex flex-column align-end justify-center h-100">
                        <div v-if="slot.isHappyHours" class="happy-hours-badge">
                          Happy hours
                        </div>
                        <div v-if="slot.discount" class="d-flex align-center">
                          <span class="text-decoration-line-through text-grey mr-2 fs-14">{{ slot.price }},00zł</span>
                          <span class="font-weight-semibold blue-text fs-14 max-content-width">{{
                              calculateDiscountedPrice(slot.price, slot.discount)
                            }},00zł</span>
                        </div>
                        <span v-else-if="slot.price" class="font-weight-semibold blue-text fs-14 max-content-width">{{
                            slot.price
                          }},00zł</span>
                      </div>
                    </div>
                  </div>
                  <!-- TODO: Remove this button after backend integration -->
                  <div v-if="pickedClassesStore.sharedFilteredSlots.length > pickedClassesStore.visibleSlotsLimit"
                       class="mt-2">
                    <VBtn
                      block
                      class="text-capitalize load-more-btn"
                      variant="outlined"
                      @click="pickedClassesStore.loadMoreSlots('shared')"
                    >
                      {{ t('load_more') }}
                    </VBtn>
                  </div>
                </div>

                <div v-else class="text-center py-4">
                  <div class="text-h6 font-weight-bold text-primary-900 mb-6">
                    <span v-html="t('no_classes_found').replace('\n', '<br>')"/>
                  </div>

                  <VBtn
                    class="text-capitalize mb-8 text-primary-900 border-primary text-wrap py-2"
                    color="primary"
                    style="min-height: 59px; height: auto;"
                    variant="outlined"
                    width="100%"
                  >
                    <span class="text-break" style="white-space: normal; line-height: 1.2;"
                          v-html="t('find_closest_classes').replace('\n', '<br>')"/>
                  </VBtn>

                  <div class="border rounded-lg px-4 py-3 d-flex align-start text-left bg-white border-gray">
                    <VIcon class="mr-3 mt-1 flex-shrink-0" color="grey-darken-1" icon="mdi-message-text-outline"/>
                    <div class="text-caption text-grey-darken-1" style="line-height: 1.4;">
                      {{ t('contact_customer_service_info') }}
                      <a class="text-decoration-underline text-grey-darken-1 font-weight-medium cursor-pointer"
                         href="https://szkolastok.pl/kontakt" rel="noopener noreferrer"
                         target="_blank">{{ t('customer_service_office') }}</a>.
                    </div>
                  </div>
                </div>
              </VStepperWindowItem>
            </template>

            <!-- GROUP FLOW -->
            <template v-if="selectedType === 'group'">
              <VStepperWindowItem :value="1">
                <!--                Selecting skill level-->
<!--                <div v-if="selectedClassType === 0 || selectedClassType === 1" class="mb-4">-->
                <div  class="mb-4">
                  <p class="custom-input-label mb-2">{{ $t('select_difficulty_level') }}</p>
                  <VList
                    v-model:selected="selectedSkillLevel"
                    select-strategy="single-leaf"
                    selectable
                  >
                    <VListItem
                      v-for="(item, i) in availableSkillLevels"
                      :key="i"
                      class="border rounded-lg mb-2"
                      color="primary"
                      :ripple="false"
                      :value="item"
                      @click="selectSkillLevel(item)"
                    >
                      <template #prepend="{ isSelected }">
                        <VIcon
                          :icon="isSelected ? 'mdi-circle-slice-8' : 'mdi-circle-outline'"
                          size="16"
                        />
                      </template>

                      <template #default>
                        <VListItemTitle>
                          <p class="mb-0 fs-14 text-pre-wrap lh-normal">
                            {{ item.name }}
                          </p>
                        </VListItemTitle>
                        <VListItemSubtitle>
                          <p class="mb-0 fs-11 text-pre-wrap">
                            {{ item.description }}
                          </p>
                        </VListItemSubtitle>
                      </template>

                      <template #append>
                        <VIcon
                          icon="mdi-information-slab-circle"
                          size="18"
                          @click.stop="currentSkillLevelInfo = item; skillInfoDialog = true"
                        />
                      </template>
                    </VListItem>
                  </VList>
                  <small v-if="!selectedSkillLevel" class="fs-12 fc-error pl-4">
                    {{ $t('select_difficulty_level') }}
                  </small>
                </div>
              </VStepperWindowItem>
              <VStepperWindowItem :value="2">
                <div class="text-center mb-2">
                  <span class="text-subtitle-1 font-weight-medium text-primary-900">{{
                      t('choose_group_classes')
                    }}</span>
                </div>
                <div class="mb-6">
                  <p class="text-caption text-grey-darken-1 text-center"
                     style="line-height: 1.4; max-width: 90%; margin: 0 auto;">
                    {{ t('group_classes_description') }}
                  </p>
                </div>

                <div v-if="pickedClassesStore.filteredGroups.length > 0" class="d-flex flex-column gap-3">
                  <div
                    v-for="group in pickedClassesStore.filteredGroups"
                    :key="group.id"
                    class="gray-bg-card"
                  >
                    <!-- Main Card -->
                    <div
                      class="slot-card d-flex align-center px-4 py-4 cursor-pointer flex-column"
                      :class="{ 'selected': pickedClassesStore.selectedGroup === group.id }"
                      @click="pickedClassesStore.selectedGroup = group.id"
                    >

                      <div class="d-flex align-start justify-start w-100">
                        <!-- Checkbox/Circle -->
                        <div class="selection-circle mr-4 mt-1 d-flex align-center justify-center flex-shrink-0"/>

                        <!-- Content -->
                        <div class="flex-grow-1">
                          <!-- Title & Happy Hours Badge -->
                          <div class="d-flex justify-space-between align-start mb-1">
                            <span class="text-caption text-grey-darken-1">{{ group.name }}</span>
                            <div v-if="group.isHappyHours" class="happy-hours-badge ml-2 mb-0">Happy hours</div>
                          </div>

                          <!-- Dates -->
                          <div class="font-weight-bold text-primary-900 mb-2 fs-14">
                            {{ group.dates }}
                          </div>

                          <!-- Description -->
                          <div class="text-caption text-grey-darken-1 mb-1" style="line-height: 1.4;">
                            {{ group.description }}
                          </div>

                          <!-- Schedule (Hours) -->
                          <div class="text-caption text-grey-darken-1 mb-3" style="line-height: 1.4;"
                               v-html="formatSchedule(group.schedule)"/>

                          <!-- Details Button -->
                          <VBtn
                            class="text-none text-caption px-3"
                            color="primary"
                            density="compact"
                            height="28"
                            variant="outlined"
                            @click.stop="openGroupDetails(group)"
                          >
                            {{ t('learn_more') }}
                          </VBtn>
                        </div>
                      </div>

                      <!-- Price (Absolute Bottom Right) -->
                      <div v-if="group.price" class="d-flex justify-end w-100 mt-1">
                        <div v-if="group.discount" class="d-flex align-center">
                          <span class="text-decoration-line-through text-grey mr-2 fs-14">{{
                              calculateGroupPrice(group)
                            }},00zł</span>
                          <span class="font-weight-bold blue-text fs-14 pl-1">{{
                              calculateDiscountedGroupPrice(group)
                            }},00zł</span>
                        </div>
                        <span v-else class="font-weight-bold text-primary-900 fs-14 pl-1">{{
                            calculateGroupPrice(group)
                          }},00zł</span>
                      </div>
                    </div>

                    <!-- Child Add-on (Outside Card) -->
                    <div
                      v-if="props.participantType === 'child'"
                      class="add-on-card border-0 mt-1 px-2 py-2 rounded-lg d-flex align-start cursor-pointer"
                      @click="pickedClassesStore.selectedGroup = group.id"
                    >
                      <VCheckbox
                        v-model="pickedClassesStore.childAddOnSelections[group.id]"
                        class="mt-0 pt-0 flex-grow-0 mr-3"
                        color="blue"
                        density="compact"
                        hide-details
                        style="margin-bottom: -10px !important;"
                        @change="pickedClassesStore.selectedGroup = group.id"
                        @click.stop
                      />
                      <div class="flex-grow-1" style="min-width: 0;">
                        <VExpansionPanels flat>
                          <VExpansionPanel class="bg-transparent">
                            <VExpansionPanelTitle
                              class="px-0 py-0"
                              style="min-height: 32px; border-radius: 0;"
                              @click.stop
                            >
                              <div class="d-flex flex-column text-left">
                                <span class="text-caption font-weight-bold text-primary-900" style="line-height: 1.2;">
                                  {{ t('additional_animations_meal') }}
                                </span>
                                <span class="text-caption font-weight-medium text-grey-darken-1">
                                  + {{ pickedClassesStore.childAddOnPrice }},00 zł
                                </span>
                              </div>
                            </VExpansionPanelTitle>
                            <VExpansionPanelText class="px-0 pt-2 text-caption text-grey-darken-1">
                              <div class="mb-3">
                                {{ t('animations_description') }}
                              </div>

                              <div class="d-flex align-center text-caption text-grey-darken-1 mb-1">
                                <img alt="" class="mr-2" :src="ClockGrayIcon" width="16">
                                <span v-html="formatSchedule(t('animations_schedule'))"/>
                              </div>
                              <div class="d-flex align-center text-caption text-grey-darken-1">
                                <img alt="" class="mr-2" :src="UsersGroupIcon" width="16">
                                <span><strong class="text-primary-900">{{ t('places_left', {count: 18}) }}</strong> (18/20)</span>
                              </div>
                            </VExpansionPanelText>
                          </VExpansionPanel>
                        </VExpansionPanels>
                      </div>
                    </div>
                  </div>
                </div>

                <div v-else class="text-center py-4">
                  <div class="border rounded-lg px-4 py-3 d-flex align-start text-left bg-white border-gray">
                    <VIcon class="mr-3 mt-1 flex-shrink-0" color="grey-darken-1" icon="mdi-message-text-outline"/>
                    <div class="text-caption text-grey-darken-1" style="line-height: 1.4;">
                      {{ t('contact_customer_service_info') }}
                      <a class="text-decoration-underline text-grey-darken-1 font-weight-medium cursor-pointer"
                         href="https://szkolastok.pl/kontakt" rel="noopener noreferrer"
                         target="_blank">{{ t('customer_service_office') }}</a>.
                    </div>
                  </div>
                </div>
              </VStepperWindowItem>
            </template>
          </VStepperWindow>
        </VStepper>
      </div>

      <!-- Footer Actions (Fixed) -->
      <div class="footer-actions pa-4 bg-white">
        <div class="d-flex gap-3 mb-4">
          <VBtn
            class="flex-1-1 text-none rounded-lg"
            height="48"
            prepend-icon="mdi-arrow-left"
            variant="outlined"
            @click="handleLeftButton"
          >
            {{ leftButtonText }}
          </VBtn>
          <VBtn
            :append-icon="rightButtonIcon"
            class="flex-1-1 text-none rounded-lg"
            :color="rightButtonColor"
            :disabled="isRightButtonDisabled"
            height="48"
            variant="flat"
            @click="handleRightButton"
          >
            {{ rightButtonText }}
          </VBtn>
        </div>

        <div v-if="showStepper && !isLastStep" class="d-flex justify-center">
          <VCheckbox
            v-model="savePreferences"
            color="primary"
            density="compact"
            hide-details
            :label="t('save_my_preferences')"
          />
        </div>
      </div>

    </VCard>
  </VDialog>

  <VDialog v-model="skillInfoDialog" max-width="320px">
    <VCard v-if="currentSkillLevelInfo">
      <VCardTitle>
        <div class="d-flex justify-space-between" :class="mobile ? 'py-2':''">
              <span :class="mobile ? 'fs-14':'fs-16'">
                {{ currentSkillLevelInfo.name }}
              </span>
          <button aria-label="Close" class="close-btn" @click="skillInfoDialog = false">
            <VIcon icon="mdi-close" size="18"/>
          </button>
        </div>
      </VCardTitle>
      <VCardText :class="mobile ? 'pt-0':''">
        <p :class="mobile ? 'fs-12':'fs-14'">
          {{ currentSkillLevelInfo.additionalInfo }}
        </p>
      </VCardText>
      <VCardActions class="border-t d-flex justify-between text-capitalize">
        <VBtn class="px-4 text-capitalize" variant="outlined" @click="skillInfoDialog = false">
          {{ $t('close') }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>

  <ClassesInfoModal v-model="showClassesInfoModal"/>
  <ChildSpecialistInfoModal v-model="showChildSpecialistModal"/>
  <GroupDetailsModal v-model="showGroupDetailsModal" :group="selectedGroupForDetails"/>
</template>

<style scoped lang="scss">
.bg-blue-light {
  background-color: #eff6ff !important;
}

.text-primary-900 {
  color: #111827;
}

.gap-3 {
  gap: 12px;
}

.selection-card {
  img {
    max-width: 16px;
    max-height: 16px;
  }
}

.selection-card, .slot-card {
  border: 1px solid #E5E7EB;
  background: #F9FAFB;
  border-radius: 12px;
  transition: all 0.2s ease;
  min-height: 70px;

  &:hover, &:focus {
    border-color: #E5E7EB;
    background-color: transparent;
  }

  &.selected {
    border-color: #2563EB;
    background-color: #EFF6FF;
    border-width: 1px;

    span, div {
      color: #2563EB;
    }
  }

  &.disabled {
    cursor: default;
    border-color: transparent;
    background-color: #EFF6FF;

    span {
      color: #2563EB;
    }
  }
}

.selection-circle {
  min-width: 20px;
  min-height: 20px;
  max-width: 20px;
  max-height: 20px;
  border-radius: 50%;
  border: 2px solid #D1D5DB;
  background: white;
  position: relative;

  .selected & {
    border-color: #2563EB;
  }

  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0);
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background-color: rgb(26, 86, 219);
    transition: transform 0.2s ease;
  }

  .selected &::after {
    transform: translate(-50%, -50%) scale(1);
  }

  .disabled & {
    border-color: #818CF8;
    background-color: transparent;
  }
}

.inner-circle {
  width: 10px;
  height: 10px;
  background-color: #2563EB;
  border-radius: 50%;

  .disabled & {
    background-color: #818CF8;
  }
}

.flex-1-1 {
  flex: 1 1 0;
}

.footer-actions {
  z-index: 10;
  position: sticky;
  bottom: 0;
}

.modal-header {
  background-color: #F9FAFB;
  border-bottom: 1px solid #F3F4F6;
}

.border-gray {
  border: 1px solid #F3F4F6;
}

:deep(.v-stepper-header) {
  display: none !important;
}

:deep(.v-label) {
  font-size: 14px;
  color: #111928;
  font-size: 14px;
  font-weight: 500;
}

.special-close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  min-width: 32px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  color: #9CA3AF;

  &::before {
    content: "✕";
    font-size: 20px;
    line-height: 1;
  }
}

:deep(.v-checkbox .v-label) {
  margin-left: 4px;
}

:deep(.v-switch__track) {
  border: 3px solid #E5E7EB !important;
  background-color: #E5E7EB !important;
  opacity: 1 !important;
  border-radius: 20px !important;
}

:deep(.v-selection-control--dirty .v-switch__track) {
  background-color: #2563EB !important;
}

:deep(.v-switch__thumb) {
  height: 20px !important;
  width: 20px !important;
  background-color: white !important;
}

:deep(.v-switch .v-selection-control__input > .v-overlay) {
  display: none !important;
}

.happy-hours-badge {
  color: #000 !important;
  font-size: 10px;
  font-weight: 400 !important;
  background: #FACA15;
  padding: 2px 3px;
  border-radius: 5px;
  margin-bottom: 16px !important;
  width: max-content;
  min-width: 70px;
  text-align: center;
}

.text-caption {
  line-height: 1.4;
}

.blue-text {
  color: #233876 !important;
}

.text-caption-slot {
  font-size: 11px;
  color: rgba(35, 56, 118, 0.65);
}

.max-content-width {
  width: max-content;
}

.filter-chip {
  font-family: 'Inter', sans-serif !important;
  font-size: 10px !important;
  font-weight: 600 !important;
  line-height: 150% !important;
  color: rgba(0, 0, 0, 0.55);
  border-radius: 8px !important;

  :deep(.v-chip__content) {
    font-family: 'Inter', sans-serif !important;
    font-size: 10px !important;
    font-weight: 600 !important;
    line-height: 150% !important;
    color: rgba(0, 0, 0, 0.55);
  }
}

.filter-chip--error {
  background-color: #FDE8E8 !important;
}

:deep(.v-chip__close) {
  font-size: 14px !important;
  color: rgba(31, 42, 55, 0.55) !important;
  opacity: 1 !important;
}

.load-more-btn {
  border-color: #2563EB !important;
  color: #2563EB !important;
  font-weight: 500;
  line-height: 1;
}

:deep(.v-chip.v-chip--size-small) {
  --v-chip-height: 19px;
  padding: 0 8px !important;
}

.gap-2 {
  gap: 8px;
}

.footer-actions {
  :deep(.v-btn) {
    height: 48px !important;
    line-height: 1;
  }

}

.find-other-btn {
  line-height: 1.4 !important;
}

.gender-buttons {
  height: 38px !important;

  :deep(.v-btn) {
    height: 38px !important;
  }
}

:deep(.v-select .v-field .v-field__input > input) {
  align-self: center !important;
}

.gap-4 {

  :deep(.v-selection-control) {
    gap: 4px;
  }

}

.gray-bg-card {
  background: #F3F4F6;
  border-radius: 10px;

  .add-on-card {
    background: #F3F4F6;

    .v-input {
      min-width: 30px !important;
    }

    :deep(.v-expansion-panel-text__wrapper) {
      padding: 4px 0;
    }

    :deep(.v-expansion-panel-title) {
      margin-top: 12px !important;
    }

    :deep(.v-expansion-panel-title__icon) {
      margin-top: -20px !important;
    }
  }

}
</style>
