import { useCookies } from '@vueuse/integrations/useCookies'
import { defineStore } from 'pinia'
import { computed, nextTick, ref, watch } from 'vue'
import { useStayConfigStore } from '@/stores/StayConfigStore.js'
import { useTimerStore } from '@/stores/TimerStore.js'
import { useStayStore } from './StayStore'

export const usePickedClassesStore = defineStore('pickedClassesStore', () => {
  const stayStore = useStayStore()
  const configStore = useStayConfigStore()
  const timerStore = useTimerStore()
  const cookies = useCookies(['booking_preferences'])

  // Helper to generate dynamic dates
  const getFutureDate = daysToAdd => {
    const d = new Date()
    d.setDate(d.getDate() + daysToAdd)
    return d
  }

  const formatDate = date => {
    return date.toISOString().split('T')[0]
  }

  const formatDisplayDate = date => {
    return date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  // Helper to generate classDates array
  const generateClassDates = count => {
    return Array.from({ length: count }, (_, i) => formatDate(getFutureDate(i)))
  }

  // Base slots templates
  const baseSlots = [
    { time: '9:00 - 11:00', price: 50, isHappyHours: true, discount: 0.1, instructor: 'Marcin Kowalik', gender: 'male', duration: '2h', timeOfDay: 'Rano', isChildSpecialist: true },
    { time: '10:00 - 12:00', price: 50, isHappyHours: true, discount: 0.1, instructor: 'Anna Nowak', gender: 'female', duration: '2h', timeOfDay: 'Rano' },
    { time: '10:00 - 12:00', price: 50, isHappyHours: true, discount: 0.1, duration: '2h', timeOfDay: 'Rano' },
    { time: '10:30 - 12:30', price: 50, duration: '2h', timeOfDay: 'Rano' },
    { time: '11:00 - 13:00', price: 50, duration: '2h', timeOfDay: 'Rano' },
    { time: '14:00 - 16:00', price: 50, instructor: 'Piotr Wiśniewski', gender: 'male', duration: '2h', timeOfDay: 'Popołudnie' },
    { time: '15:00 - 16:00', price: 35, instructor: 'Maria Zielińska', gender: 'female', duration: '1h', timeOfDay: 'Popołudnie', isChildSpecialist: true },
    { time: '18:00 - 20:00', price: 50, instructor: 'Tomasz Kamiński', gender: 'male', duration: '2h', timeOfDay: 'Wieczór' },
    { time: '19:00 - 20:00', price: 35, instructor: 'Katarzyna Lewandowska', gender: 'female', duration: '1h', timeOfDay: 'Wieczór', isChildSpecialist: true },
  ]

  // Generate slots for next 30 days
  const generateAvailableSlots = () => {
    const slots = []
    const daysToGenerate = 30
    for (let i = 0; i < daysToGenerate; i++) {
      const date = getFutureDate(i)
      const dateStr = formatDate(date)
      for (const [index, slot] of baseSlots.entries()) {
        slots.push({
          ...slot,
          id: `${dateStr}-${index}`,
          date: dateStr,
        })
      }
    }
    return slots
  }

  // Mock Data
  const availableSlots = ref(generateAvailableSlots())

  const availableGroups = ref([
    {
      id: 1,
      name: 'Grupa 5 dni',
      dates: `${formatDisplayDate(getFutureDate(0))} - ${formatDisplayDate(getFutureDate(4))}`,
      classDates: generateClassDates(5),
      description: '5 dni zajęć, zajęcia 1x dziennie',
      schedule: 'od 9:30 do 10:30',
      price: 1400,
    },
    {
      id: 2,
      name: 'Grupa 3 dni',
      dates: `${formatDisplayDate(getFutureDate(0))} - ${formatDisplayDate(getFutureDate(2))}`,
      classDates: generateClassDates(3),
      description: '3 dni zajęć, zajęcia 2x dziennie',
      schedule: 'od 9:30 do 10:30 oraz od 15:30 do 17:30',
      price: 1400,
    },
    {
      id: 3,
      name: 'Grupa Happy Hours',
      dates: `${formatDisplayDate(getFutureDate(0))} - ${formatDisplayDate(getFutureDate(4))}`,
      classDates: generateClassDates(5),
      description: '5 dni zajęć, zajęcia 1x dziennie',
      schedule: 'od 9:30 do 10:30',
      isHappyHours: true,
      discount: 0.1,
      price: 1200,
    },
    {
      id: 4,
      name: 'Grupa Weekendowa',
      dates: `${formatDisplayDate(getFutureDate(0))} - ${formatDisplayDate(getFutureDate(1))}`,
      classDates: [formatDate(getFutureDate(0)), formatDate(getFutureDate(1))],
      description: '2 dni zajęć, zajęcia 2x dziennie',
      schedule: 'od 9:00 do 11:00 oraz od 14:00 do 16:00',
      price: 600,
    },
    {
      id: 5,
      name: 'Grupa Trzydniowa',
      dates: `${formatDisplayDate(getFutureDate(0))} - ${formatDisplayDate(getFutureDate(2))}`,
      classDates: generateClassDates(3),
      description: '3 dni zajęć, zajęcia 1x dziennie',
      schedule: 'od 10:00 do 12:00',
      price: 500,
    },
    {
      id: 6,
      name: 'Grupa Czterodniowa',
      dates: `${formatDisplayDate(getFutureDate(0))} - ${formatDisplayDate(getFutureDate(3))}`,
      classDates: generateClassDates(4),
      description: '4 dni zajęć, zajęcia 1x dziennie',
      schedule: 'od 12:00 do 14:00',
      price: 800,
    },
  ])

  // State
  const searchPreviouslySelected = ref(false)
  const selectedDate = ref(formatDate(new Date()))

  // Save/Load preference for "Search Previously Selected"
  function setSearchPreviouslySelected (val) {
    searchPreviouslySelected.value = val
    cookies.set('search_prev_instructor', val ? 'true' : 'false')
  }

  // Save/Load general filter preferences
  function saveFilterPreferences (prefs) {
    // Save common fields
    const toSave = {
      timeOfDay: prefs.timeOfDay,
      duration: prefs.duration,
      instructorGender: prefs.instructorGender,
      findSpecificInstructor: prefs.findSpecificInstructor,
      childSpecialist: prefs.childSpecialist,
      selectedInstructor: prefs.selectedInstructor,
    }
    cookies.set('user_filter_preferences', JSON.stringify(toSave))
  }

  function loadFilterPreferences () {
    const saved = cookies.get('user_filter_preferences')
    if (saved) {
      try {
        const parsed = typeof saved === 'string' ? JSON.parse(saved) : saved
        return {
          timeOfDay: parsed.timeOfDay || 'Dowolna',
          duration: parsed.duration || '2h',
          instructorGender: parsed.instructorGender || 'Dowolna',
          findSpecificInstructor: parsed.findSpecificInstructor || false,
          childSpecialist: parsed.childSpecialist || false,
          selectedInstructor: parsed.selectedInstructor || null,
        }
      } catch {
        return null
      }
    }
    return null
  }

  // Auto-enable if preference is saved and we have an instructor
  watch(searchPreviouslySelected, val => {
    // Also sync if changed directly (e.g. v-model, though we prefer setter)
    cookies.set('search_prev_instructor', val ? 'true' : 'false')
  })

  // Individual Preferences
  const individualPreferences = ref({
    selectedInstructor: null,
    timeOfDay: 'Dowolna',
    duration: '2h',
    instructorGender: 'Dowolna',
    findSpecificInstructor: false,
    childSpecialist: false,
  })

  // Shared Preferences
  const sharedPreferences = ref({
    selectedInstructor: null,
    timeOfDay: 'Dowolna',
    duration: '2h',
    instructorGender: 'Dowolna',
    findSpecificInstructor: false,
    childSpecialist: false,
  })

  // Selected Slots
  const individualSlot = ref(null)
  const sharedSlot = ref(null)
  const selectedGroup = ref(null)
  const childAddOnSelections = ref({})
  const childAddOnPrice = 340

  // Pagination
  const visibleSlotsLimit = ref(4)

  // Booked Classes
  const bookedClasses = ref([])

  // Getters
  const instructors = computed(() => {
    const names = new Set(availableSlots.value.filter(s => s.instructor).map(s => s.instructor))
    return Array.from(names)
  })

  // Computed helper to get status for current group or a specific group
  const isChildAddOnSelected = computed(() => {
    return groupId => !!childAddOnSelections.value[groupId]
  })
  const hasAnyChildAddOnsSelected = computed(() => {
    return Object.keys(childAddOnSelections.value).some(
      groupId => childAddOnSelections.value[groupId] === true,
    )
  })

  // Check if there is any booked class with an instructor
  const hasPreviouslySelectedInstructor = computed(() => {
    return bookedClasses.value.some(booking => booking.instructor)
  })

  const getFilteredSlots = type => {
    let slots = availableSlots.value

    // Filter by Date
    if (selectedDate.value) {
      slots = slots.filter(s => s.date === selectedDate.value)
    }

    const prefs = type === 'individual' ? individualPreferences.value : sharedPreferences.value

    // Filter by Time of Day
    if (prefs.timeOfDay && prefs.timeOfDay !== 'Dowolna') {
      slots = slots.filter(s => s.timeOfDay === prefs.timeOfDay)
    }

    // Filter by "Previously Selected Instructor" (Switch)
    if (searchPreviouslySelected.value) {
      const prevInstructors = bookedClasses.value.map(b => b.instructor).filter(Boolean)
      slots = prevInstructors.length > 0
        ? slots.filter(s => prevInstructors.includes(s.instructor))
        : slots.filter(s => s.instructor)
    }

    // Filter by Selected Instructor (if checkbox is checked)
    if (prefs.findSpecificInstructor && prefs.selectedInstructor) {
      slots = slots.filter(s => s.instructor === prefs.selectedInstructor)
    }

    // Filter by Duration
    if (prefs.duration) {
      slots = slots.filter(s => s.duration === prefs.duration)
    }

    // Filter by Gender
    if (prefs.instructorGender && prefs.instructorGender !== 'Dowolna') {
      const targetGender = prefs.instructorGender === 'Mężczyzna' ? 'male' : 'female'
      slots = slots.filter(s => s.gender === targetGender)
    }

    // Filter by Child Specialist
    if (prefs.childSpecialist) {
      slots = slots.filter(s => s.isChildSpecialist)
    }

    return slots
  }

  const individualFilteredSlots = computed(() => getFilteredSlots('individual'))
  const sharedFilteredSlots = computed(() => getFilteredSlots('shared'))

  const filteredGroups = computed(() => {
    // Determine stay duration
    let duration = 5 // Default max
    if (stayStore.dateOfStay && Array.isArray(stayStore.dateOfStay) && stayStore.dateOfStay.length > 0) {
      const start = new Date(stayStore.dateOfStay[0])
      const end = stayStore.dateOfStay[1] ? new Date(stayStore.dateOfStay[1]) : new Date(start)
      const diffTime = Math.abs(end - start)
      duration = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    } else if (stayStore.dateOfStay) {
      // Single date case
      duration = 1
    }

    return availableGroups.value.filter(group => {
      // Extract days from description e.g. "5 dni zajęć"
      const match = group.description.match(/(\d+)\s+dni/)
      if (match) {
        const groupDays = Number.parseInt(match[1], 10)
        return groupDays <= duration
      }
      return true
    })
  })

  const displayedIndividualSlots = computed(() => individualFilteredSlots.value.slice(0, visibleSlotsLimit.value))
  const displayedSharedSlots = computed(() => sharedFilteredSlots.value.slice(0, visibleSlotsLimit.value))

  const getBookedClass = (participantId, dateStr) => {
    // Deprecated: returns first booking
    return bookedClasses.value.find(c => c.participantId === participantId && c.dateStr === dateStr)
  }

  const getBookedClasses = (participantId, dateStr) => {
    return bookedClasses.value.filter(c => c.participantId === participantId && c.dateStr === dateStr)
  }

  // Actions

  function removeClassesForParticipant(participantId) {
    bookedClasses.value = bookedClasses.value.filter(c => c.participantId !== participantId)
  }

  function setSelectedDate (dateIso) {
    selectedDate.value = dateIso
  }

  function loadMoreSlots () {
    visibleSlotsLimit.value += 4
  }

  function resetState () {
    // Reset state but respect preference if applicable
    const pref = cookies.get('search_prev_instructor')
    searchPreviouslySelected.value = hasPreviouslySelectedInstructor.value && (pref === 'true' || pref === true)

    const savedFilters = loadFilterPreferences()
    const defaults = { selectedInstructor: null, timeOfDay: 'Dowolna', duration: '2h', instructorGender: 'Dowolna', findSpecificInstructor: false, childSpecialist: false }

    if (savedFilters) {
      individualPreferences.value = { ...defaults, ...savedFilters }
      sharedPreferences.value = { ...defaults, ...savedFilters }
    } else {
      individualPreferences.value = { ...defaults }
      sharedPreferences.value = { ...defaults }
    }

    individualSlot.value = null
    sharedSlot.value = null
    selectedGroup.value = null
    childAddOnSelections.value = {}
    visibleSlotsLimit.value = 4
  }

  function addBookedClass (booking) {
    // Extract instructor if present in data.slot
    let instructor = booking.instructor
    if (!instructor && booking.data && booking.data.slot && booking.data.slot.instructor) {
      instructor = booking.data.slot.instructor
    }

    // Add unique ID
    const newBooking = {
      ...booking,
      instructor,
      id: Date.now() + Math.random().toString(36).slice(2, 11),
      insurance: { ...configStore.insuranceObject },
    }
    bookedClasses.value.push(newBooking)
    timerStore.resetTimer()
    nextTick(() => {
      timerStore.startTimer()
    })
  }

  function removeBookedClass (bookingId) {
    const bookingToRemove = bookedClasses.value.find(c => c.id === bookingId)
    if (!bookingToRemove) {
      return
    }

    if (bookingToRemove.groupBookingId) {
      // Remove all with same groupBookingId
      bookedClasses.value = bookedClasses.value.filter(c => c.groupBookingId !== bookingToRemove.groupBookingId)
    } else {
      const index = bookedClasses.value.findIndex(c => c.id === bookingId)
      if (index !== -1) {
        bookedClasses.value.splice(index, 1)
      }
    }
  }

  return {
    // State
    availableSlots,
    availableGroups,
    searchPreviouslySelected,
    selectedDate,
    individualPreferences,
    sharedPreferences,
    individualSlot,
    sharedSlot,
    selectedGroup,
    childAddOnSelections,
    isChildAddOnSelected,
    hasAnyChildAddOnsSelected,
    childAddOnPrice,
    visibleSlotsLimit,
    bookedClasses,

    // Getters
    instructors,
    individualFilteredSlots,
    sharedFilteredSlots,
    filteredGroups,
    displayedIndividualSlots,
    displayedSharedSlots,
    getBookedClass,
    getBookedClasses,
    hasPreviouslySelectedInstructor,

    // Actions
    removeClassesForParticipant,
    setSearchPreviouslySelected,
    saveFilterPreferences,
    loadFilterPreferences,
    setSelectedDate,
    loadMoreSlots,
    resetState,
    addBookedClass,
    removeBookedClass,
  }
})
