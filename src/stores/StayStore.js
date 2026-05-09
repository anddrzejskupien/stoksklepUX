/**
 * StayStore - Main Pinia store for managing ski school stay reservations
 *
 * This store handles all data related to a stay booking including:
 * - Date and participant selection
 * - Class/lesson assignments for each participant
 * - Pricing calculations (classes, insurance, discounts)
 * - Manager, payer, and invoice data
 * - Loyalty program integration
 * - Legal agreements acceptance
 */

import { defineStore } from 'pinia'
import { computed, reactive, ref, watch } from 'vue'
import { usePickedClassesStore } from '@/stores/PickedClassesStore.js'
import { generateUniqueId } from '@/utils/numbers.js'
import { useStayConfigStore } from './StayConfigStore.js'

// ============================================================================
// PARTICIPANT TEMPLATE
// ============================================================================

/**
 * Blank participant template object
 * Used to initialize new participants when they are added to the stay
 * Contains all required fields with default values
 */
const blankParticipant = {
  dynamicId: '', // Unique identifier generated at runtime
  name: '', // Participant's first name
  surname: '', // Participant's last name
  phone: null, // Contact phone number
  birthDate: null, // Date of birth (used to calculate age)
  participantType: '', // Either 'adult' or 'child'
  age: null, // Calculated age or manually entered
  activityType: '', // Selected activity (ski/snowboard)
  skillLevel: '', // Skill level (beginner/intermediate/advanced)
  availableActivityTypes: [], // Activity types this participant can choose
  availableLessonTypes: [], // Lesson types available for this participant
  showGroupLessons: true, // Whether to show group lesson options
  classLang: 'Polski', // Preferred language for classes
  // selectedClasses: [], // Classes enrolled in
}

const tempChildminderSuggestion = ref({})

// ============================================================================
// STORE DEFINITION
// ============================================================================

export const useStayStore = defineStore('stayStore', () => {
  // Get access to configuration store for shared settings
  const configStore = useStayConfigStore()

  // ==========================================================================
  // STATE - BASIC STAY INFORMATION
  // ==========================================================================

  /** Selected date range for the stay */
  const dateOfStay = ref(null)

  /** Number of adult participants (1-12) */
  const adultsNumber = ref(1)

  /** Number of child participants (0-12) */
  const childrenNumber = ref(0)

  /** Array of all participants with their complete data */
  const participants = ref([])

  // ==========================================================================
  // STATE - LOYALTY PROGRAM
  // ==========================================================================

  /** Whether the user has a loyalty card checkbox state */
  const hasLoyaltyCard = ref(false)

  /** Loyalty program details */
  const loyaltyProgram = ref({
    loyaltyCard: false, // Redundant with hasLoyaltyCard, may be unified later
    loyaltyCardOwnerName: '', // Card owner's first name
    loyaltyCardOwnerSurname: '', // Card owner's last name
    loyaltyCardNumber: null, // Loyalty card number
  })

  // ==========================================================================
  // COMPUTED - COMPLETE EVENT OBJECT
  // ==========================================================================

  /**
   * Computed event object that aggregates all booking data
   * This represents the complete state that would be sent to the backend
   * Note: Some fields (regulations) are set to null here but updated from store refs
   */
  const event = computed(() => ({
    id: null, // Reservation ID (assigned by backend)
    dateOfStay: dateOfStay.value, // Selected stay date range
    adultsNumber: adultsNumber.value, // Number of adults
    childrenNumber: childrenNumber.value, // Number of children
    participants: participants.value, // Complete participant data array
    additionalOptions: {}, // Reserved for future additional options
    loyaltyProgram: {
      loyaltyCard: hasLoyaltyCard.value,
      loyaltyCardOwnerName: loyaltyProgram.value.loyaltyCardOwnerName,
      loyaltyCardOwnerSurname: loyaltyProgram.value.loyaltyCardOwnerSurname,
      loyaltyCardNumber: loyaltyProgram.value.loyaltyCardNumber,
    },
    stayManagerData: stayManagerData.value, // Person managing the booking
    anotherPayerData: anotherPayerData.value, // Whether payer is different from manager
    payerData: anotherPayerData.value ? payerData.value : null, // Payer info (if different)
    receiveInvoice: receiveInvoice.value, // Whether customer wants an invoice
    invoiceData: receiveInvoice.value ? invoiceData.value : null, // Invoice details (if requested)
    stokSchoolRegulationsAccepted: null, // School regulations agreement
    stokSchoolPrivacyPolicyAccepted: null, // School regulations agreement
    // stokSchoolRodoAccepted: null, // RODO/GDPR agreement
    stokSchoolPaymentRegulationsAccepted: null, // Payment terms agreement
  }))

  // ==========================================================================
  // STATE - STAY MANAGER DATA
  // ==========================================================================

  /**
   * Information about the person managing/organizing the stay
   * This is the primary contact person for the reservation
   */
  const stayManagerData = ref({
    managerId: null, // Manager ID (if returning customer)
    name: '', // Manager's first name
    surname: '', // Manager's last name
    phone: '', // Contact phone number
    email: '', // Contact email address
  })

  // ==========================================================================
  // STATE - PAYER DATA (IF DIFFERENT FROM MANAGER)
  // ==========================================================================

  /** Whether the person paying is different from the stay manager */
  const anotherPayerData = ref(false)

  /**
   * Payer information (only used if anotherPayerData is true)
   * Person responsible for payment if different from the manager
   */
  const payerData = ref({
    name: '', // Payer's first name
    surname: '', // Payer's last name
    email: '', // Payer's email address
  })

  // ==========================================================================
  // STATE - LEGAL AGREEMENTS
  // ==========================================================================

  /** Acceptance of school regulations checkbox */
  const stokSchoolRegulationsAccepted = ref(false)

  /** Acceptance of RODO/GDPR privacy policy checkbox */
  // const stokSchoolRodoAccepted = ref(false)

  /** Acceptance of payment regulations checkbox */
  const stokSchoolPaymentRegulationsAccepted = ref(false)

  const stokSchoolPrivacyPolicyAccepted = ref(false)

  /**
   * Combined check - all three agreements must be accepted to proceed
   * Used to enable/disable the final confirmation button
   */
  const agreementsAcceptedCombined = computed(() => {
    return stokSchoolRegulationsAccepted.value
      && stokSchoolPrivacyPolicyAccepted.value
      && stokSchoolPaymentRegulationsAccepted.value
  })

  // ==========================================================================
  // STATE - INVOICE DATA
  // ==========================================================================

  /** Whether the customer wants to receive an invoice checkbox */
  const receiveInvoice = ref(false)

  /**
   * Invoice/company details (only used if receiveInvoice is true)
   * Required for business customers who need tax documentation
   */
  const invoiceData = ref({
    companyName: '', // Company/business name
    taxId: '', // Tax identification number (NIP)
    companyAddress: '', // Registered company address
  })

  // ==========================================================================
  // COMPUTED - PARTICIPANT NUMBER CONSTRAINTS
  // ==========================================================================

  /**
   * Maximum number of adults allowed
   * Constrained by total limit (12) minus current children number
   * Must allow at least 1 person total
   */
  const maxAdults = computed(() => {
    const max = 12 - childrenNumber.value
    // If there are no children, ensure at least 1 adult can be selected
    return childrenNumber.value === 0 ? Math.max(1, max) : max
  })

  /**
   * Maximum number of children allowed
   * Constrained by total limit (12) minus current adults number
   * Must allow at least 1 person total
   */
  const maxChildren = computed(() => {
    const max = 12 - adultsNumber.value
    // If there are no adults, ensure at least 1 child can be selected
    return adultsNumber.value === 0 ? Math.max(1, max) : max
  })

  /**
   * Validation check - at least one participant must be selected
   * Used to enable/disable next step buttons
   */
  const participantsNumberCondition = computed(() => {
    return adultsNumber.value > 0 || childrenNumber.value > 0
  })

  // ==========================================================================
  // COMPUTED - PRICING CALCULATIONS
  // ==========================================================================

  /**
   * Calculate total price of classes for a single participant
   * @param {string} participantId - The unique ID of the participant
   * @returns {number} Total price of all classes for this participant
   */
  const participantClassesTotalPrice = computed(() => {
    return participantId => {
      const pickedClassesStore = usePickedClassesStore()
      const participantBookings = pickedClassesStore.bookedClasses.filter(
        booking => booking.participantId === participantId,
      )

      const processedGroupIds = new Set()
      return participantBookings.reduce((sum, booking) => {
        // Skip duplicate group bookings
        if (booking.groupBookingId && processedGroupIds.has(booking.groupBookingId)) {
          return sum
        }
        if (booking.groupBookingId) {
          processedGroupIds.add(booking.groupBookingId)
        }

        const price = booking.type === 'group'
          ? (booking.data?.group?.price || 0)
          : (booking.data?.slot?.price || 0)

        return sum + price
      }, 0)
    }
  })
  /**
   * Calculate total insurance price for a single participant
   * Insurance is calculated per day, not per class
   * Multiple classes on the same day count as one insurance charge
   *
   * @param {string} participantId - The unique ID of the participant
   * @returns {number} Total insurance cost for this participant
   *
   * Note: Insurance is skipped for children in group classes
   */
  const participantInsuranceTotalPrice = computed(() => {
    return participantId => {
      const pickedClassesStore = usePickedClassesStore()
      const participantBookings = pickedClassesStore.bookedClasses.filter(
        booking => booking.participantId === participantId,
      )

      const participant = participants.value.find(p => p.dynamicId === participantId)

      // Track unique dates with insurance enabled
      const insuranceDates = new Set()
      let insurancePrice = 0

      for (const booking of participantBookings) {
        // Skip if insurance is not enabled
        if (!booking.insurance?.enabled || !booking.insurance?.price) {
          continue
        }

        // Skip insurance for child participants in group classes
        if (participant?.participantType === 'child' && booking.type === 'group') {
          continue
        }

        // Store the price (should be same for all bookings, but we'll use the first one)
        if (insurancePrice === 0) {
          insurancePrice = booking.insurance.price
        }

        // Extract date from booking
        const dateStr = booking.dateStr || booking.data?.slot?.date || booking.data?.group?.classDates?.[0]

        if (dateStr) {
          insuranceDates.add(dateStr)
        }
      }

      // Calculate total: insurance price × number of unique dates
      return insurancePrice * insuranceDates.size
    }
  })

  /**
   * Calculate total price for all participants combined
   * Sums up all classes and insurance costs, then applies generic discount
   * @returns {number} Final total price for the entire booking (never negative)
   */
  const allParticipantsTotalPrice = computed(() => {
    const classStore = usePickedClassesStore()

    const classesTotal = participants.value.reduce((total, participant) => {
      return total + participantClassesTotalPrice.value(participant.dynamicId)
    }, 0)

    const insuranceTotal = participants.value.reduce((total, participant) => {
      return total + participantInsuranceTotalPrice.value(participant.dynamicId)
    }, 0)

    const childAddOnsTotal = classStore.hasAnyChildAddOnsSelected ? classStore.childAddOnPrice : 0

    return Math.max(0, (classesTotal + insuranceTotal + childAddOnsTotal) - finalDiscount.value)
  })

  // ==========================================================================
  // STATE - DISCOUNTS AND PROMOTIONS
  // ==========================================================================

  /**
   * Discount and promotional features
   * Currently in development, will be used for implementing package deals
   */

  /**
   * Calculate total hours of classes across ALL participants excluding group classes
   * @returns {number} Total hours of all classes for all participants combined
   *
   * Parses time ranges from class dates (e.g., "9:00 - 9:55") and sums up
   * the duration in hours across all participants and their enrolled classes
   */

  const allParticipantsTotalHours = computed(() => {
    const pickedClassesStore = usePickedClassesStore()
    const bookedClasses = pickedClassesStore.bookedClasses

    const totalHours = bookedClasses.reduce((total, booking) => {
      // Exclude group classes from total hours calculation
      if (booking.type === 'group') {
        return total
      }

      // Exclude Happy Hours classes from total hours calculation
      if (booking.data?.slot?.isHappyHours) {
        return total
      }

      // Check if it's an individual or shared class with slot data
      if ((booking.type === 'individual' || booking.type === 'shared') && booking.data?.slot?.time) {
        // Helper to parse time string "HH:MM" to decimal hours
        const parseTime = timeStr => {
          const [hours, minutes] = timeStr.split(':').map(Number)
          return hours + (minutes / 60)
        }

        const timeParts = booking.data.slot.time.split(' - ')
        if (timeParts.length !== 2) {
          return total
        }

        const [startTime, endTime] = timeParts
        const startHours = parseTime(startTime)
        const endHours = parseTime(endTime)
        const duration = endHours - startHours

        return total + duration
      }

      return total
    }, 0)

    return Number.parseFloat(totalHours.toFixed(1))
  })
  // thresholds:
  const FIRST_PACKAGE_THRESHOLD = 10 // hours
  const SECOND_PACKAGE_THRESHOLD = 20 // hours
  const FIRST_LEVEL_DISCOUNT = 5.7 // percent
  const SECOND_LEVEL_DISCOUNT = 11.4 // percent
  const LOYALTY_CARD_DISCOUNT = 12 // percent

  // first package eligibility
  const firstPackageEligible = computed(() => {
    return allParticipantsTotalHours.value >= FIRST_PACKAGE_THRESHOLD
      && allParticipantsTotalHours.value < SECOND_PACKAGE_THRESHOLD
  })

  // second package eligibility
  const secondPackageEligible = computed(() => {
    return allParticipantsTotalHours.value >= SECOND_PACKAGE_THRESHOLD
  })

  // final discount calculation
  const finalDiscount = computed(() => {
    if (secondPackageEligible.value) {
      return SECOND_LEVEL_DISCOUNT
    }
    if (firstPackageEligible.value) {
      return FIRST_LEVEL_DISCOUNT
    }
    if (isValidLoyaltyCardNumber.value) {
      return LOYALTY_CARD_DISCOUNT
    }
    return 0
  })

  // missing hours to thresholds
  const missingHoursToFirstThreshold = computed(() => {
    if (allParticipantsTotalHours.value >= FIRST_PACKAGE_THRESHOLD) {
      return 0
    }
    return FIRST_PACKAGE_THRESHOLD - allParticipantsTotalHours.value
  })
  const missingHoursToSecondThreshold = computed(() => {
    if (allParticipantsTotalHours.value >= SECOND_PACKAGE_THRESHOLD) {
      return 0
    }
    return SECOND_PACKAGE_THRESHOLD - allParticipantsTotalHours.value
  })

  /**
   * Tracks how many more class hours are needed to reach discount thresholds
   * Used to inform users how close they are to unlocking package deals
   */
  const missingClassesForDiscount = computed(() => {
    if (firstPackageEligible.value || secondPackageEligible.value) {
      return missingHoursToSecondThreshold.value
    }
    return (missingHoursToFirstThreshold.value).toFixed(1)
  })

  const totalClassesPrice = computed(() => {
    const pickedClassesStore = usePickedClassesStore()
    const bookedClasses = pickedClassesStore.bookedClasses
    const bookingsByParticipant = {}

    for (const b of bookedClasses) {
      if (!bookingsByParticipant[b.participantId]) {
        bookingsByParticipant[b.participantId] = []
      }
      bookingsByParticipant[b.participantId].push(b)
    }

    let total = 0

    for (const participantClasses of Object.values(bookingsByParticipant)) {
      const processedGroupIds = new Set()
      for (const booking of participantClasses) {
        let price = 0
        // Skip Happy Hours classes in discount calculation base
        if (booking.data?.slot?.isHappyHours || booking.data?.group?.isHappyHours) {
          // Do nothing (price remains 0), effectively excluding it from total
        } else if (booking.type === 'individual' || booking.type === 'shared') {
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
            price = booking.data.group.price
          }
        }
        total += price
      }
    }

    return total
  })

  const totalSavings = computed(() => {
    if (finalDiscount.value === 0) {
      return 0
    }
    return totalClassesPrice.value * (finalDiscount.value / 100)
  })

  // ==========================================================================
  // STATE - ADDITIONAL OPTIONS
  // ==========================================================================

  /**
   * Insurance selections per participant
   * Object structure: { participantId: insuranceOption }
   */
  const insuranceSelected = ref({})

  // ==========================================================================
  // WATCHER - PARTICIPANT SYNCHRONIZATION
  // ==========================================================================
  /**
   * Get selected classes for a specific participant from bookedClasses
   * Transforms bookedClasses data into the legacy selectedClasses format
   */
  const getParticipantClasses = computed(() => {
    return participantId => {
      const pickedClassesStore = usePickedClassesStore()
      const participantBookings = pickedClassesStore.bookedClasses.filter(
        booking => booking.participantId === participantId,
      )

      // Group bookings by groupBookingId or unique slot/group ID
      const classesMap = new Map()

      for (const booking of participantBookings) {
        const key = booking.groupBookingId || booking.id

        if (!classesMap.has(key)) {
          // Create class entry based on booking type
          const classEntry = {
            dynamicId: booking.groupBookingId || booking.id,
            type: booking.type,
            title: booking.type === 'group'
              ? `Zajęcia grupowe - ${booking.data?.group?.name || 'narciarstwo'}`
              : 'Zajęcia indywidualne',
            classType: booking.classType || 'ski',
            groupName: booking.data?.group?.name || '',
            instructor: booking.instructor || '',
            skillLevel: booking.skillLevel || '',
            dates: [],
            price: booking.type === 'group'
              ? (booking.data?.group?.price || 0)
              : (booking.data?.slot?.price || 0),
            insurance: booking.insurance || {
              title: '',
              enabled: false,
              price: 0,
              perDay: true,
              description: '',
            },
          }
          classesMap.set(key, classEntry)
        }

        // Add date entry
        const classEntry = classesMap.get(key)
        classEntry.dates.push({
          date: booking.dateStr,
          time: booking.data?.slot?.time || booking.data?.group?.schedule || '',
        })
      }

      return Array.from(classesMap.values())
    }
  })
  /**
   * CRUCIAL: Automatically sync the participants array with adults/children counts
   *
   * This watcher ensures that:
   * - When counts increase: new participant objects are created
   * - When counts decrease: excess participants are removed
   * - Adult participants are added first, then children
   * - Each new participant gets a unique ID and proper type
   */
  // watch([adultsNumber, childrenNumber], ([newAdults, newChildren]) => {
  //   const totalNeeded = newAdults + newChildren
  //   const currentLength = participants.value.length
  //
  //   // Add new participants if needed
  //   if (totalNeeded > currentLength) {
  //     const toAdd = totalNeeded - currentLength
  //     const adultsToAdd = Math.max(0, newAdults - participants.value.filter(p => p.participantType === 'adult').length)
  //
  //     // Create new participant objects with proper type assignment
  //     const newParticipants = Array.from({ length: toAdd }, (_, i) => {
  //       const isAdult = i < adultsToAdd
  //       return reactive({
  //         ...blankParticipant,
  //         dynamicId: generateUniqueId(),
  //         participantType: isAdult ? 'adult' : 'child',
  //         age: isAdult ? null : null, // Age will be set by user input
  //         birthDate: null,
  //         // selectedClasses: structuredClone(blankParticipant.selectedClasses), // Deep clone to avoid shared reference
  //       })
  //     })
  //     participants.value.push(...newParticipants)
  //   } else if (totalNeeded < currentLength) {
  //     // Remove excess participants from the end
  //     const toRemove = currentLength - totalNeeded
  //     participants.value.splice(-toRemove)
  //   }
  // }, { immediate: true }) // Execute immediately on store initialization
  watch([adultsNumber, childrenNumber], ([newAdults, newChildren]) => {
    const pickedClassesStore = usePickedClassesStore()
    const currentAdults = participants.value.filter(p => p.participantType === 'adult')
    const currentChildren = participants.value.filter(p => p.participantType === 'child')

    // --- Handle Adults ---
    if (newAdults > currentAdults.length) {
      // Add missing adults at the end of the adult section
      for (let i = 0; i < newAdults - currentAdults.length; i++) {
        participants.value.splice(currentAdults.length, 0, reactive({
          ...blankParticipant,
          dynamicId: generateUniqueId(),
          participantType: 'adult'
        }))
      }
    } else if (newAdults < currentAdults.length) {
      // Identify and remove excess adults from the end of the adult section
      const toRemoveCount = currentAdults.length - newAdults
      const firstAdultIdx = participants.value.findIndex(p => p.participantType === 'adult')

      // Get the participants to be removed to clean up their booked classes
      const removedAdults = participants.value.slice(firstAdultIdx + newAdults, firstAdultIdx + currentAdults.length)
      removedAdults.forEach(p => {
        if (p.dynamicId) {
          pickedClassesStore.removeClassesForParticipant(p.dynamicId)
        }
      })

      participants.value.splice(firstAdultIdx + newAdults, toRemoveCount)
    }

    // --- Handle Children ---
    if (newChildren > currentChildren.length) {
      // Add missing children at the very end of the array
      for (let i = 0; i < newChildren - currentChildren.length; i++) {
        participants.value.push(reactive({
          ...blankParticipant,
          dynamicId: generateUniqueId(),
          participantType: 'child'
        }))
      }
    } else if (newChildren < currentChildren.length) {
      // Remove excess children from the end of the list
      const toRemoveCount = currentChildren.length - newChildren

      for (let i = 0; i < toRemoveCount; i++) {
        // Find the last child in the array
        const lastChildIdx = [...participants.value].reverse().findIndex(p => p.participantType === 'child')
        if (lastChildIdx !== -1) {
          const actualIdx = participants.value.length - 1 - lastChildIdx
          const childToRemove = participants.value[actualIdx]

          // Clean up booked classes for this child
          if (childToRemove.dynamicId) {
            pickedClassesStore.removeClassesForParticipant(childToRemove.dynamicId)
          }

          // Remove the child from the participants array
          participants.value.splice(actualIdx, 1)
        }
      }
    }
  }, { immediate: true })

  // ==========================================================================
  // ACTIONS - RESET FUNCTIONALITY
  // ==========================================================================

  /**
   * Reset the entire booking to initial state
   * Clears all selections and returns to default values
   */
  const resetEvent = () => {
    dateOfStay.value = null
    adultsNumber.value = 1
    childrenNumber.value = 0
    participants.value = []
    tempChildminderSuggestion.value = {}
  }

  // ==========================================================================
  // ACTIONS - LOYALTY CARD VALIDATION
  // ==========================================================================

  /** Loading state during loyalty card number validation */
  const checkingLoyaltyCardNumber = ref(false)

  /** Result of loyalty card number validation (true/false/null) */
  const isValidLoyaltyCardNumber = ref(null)

  /**
   * Validate loyalty card number (simulated with timeout)
   * @param {string} number - The loyalty card number to check
   * @returns {Promise<boolean>} Promise resolving to validation result
   *
   * Validation logic (temporary): Card is valid if last digit is even
   * TODO: Replace with actual API call to loyalty program service
   */
  const checkLoyaltyCardNumber = number => {
    checkingLoyaltyCardNumber.value = true
    isValidLoyaltyCardNumber.value = null // Reset validation state
    return new Promise(resolve => {
      setTimeout(() => {
        // Temporary validation: even last digit = valid card
        const isValid = Number.parseInt(number.slice(-1)) % 2 === 0
        isValidLoyaltyCardNumber.value = isValid
        checkingLoyaltyCardNumber.value = false
        resolve(isValid)
      }, 1000) // Simulate network delay
    })
  }
  // ==========================================================================
  // CART
  // ==========================================================================

  const isPaymentCompleted = ref(true)
  const isPaymentInProgress = ref(true)
  const isPaymentFailed = ref(true)
  const isRedirecting = ref(true)

  // ==========================================================================
  // STORE EXPORTS
  // ==========================================================================

  return {
    // ==========================================================================
    // STATE REFS
    // ==========================================================================

    event, // Complete event object (computed)
    dateOfStay, // Selected date range
    adultsNumber, // Number of adults
    childrenNumber, // Number of children
    participants, // Participants array
    missingClassesForDiscount, // Discount threshold tracking
    insuranceSelected, // Insurance selections per participant
    hasLoyaltyCard, // Loyalty card checkbox state
    loyaltyProgram, // Loyalty program data
    isValidLoyaltyCardNumber, // Loyalty card validation result
    finalDiscount, // Generic discount amount
    stayManagerData, // Stay manager information
    anotherPayerData, // Different payer checkbox
    payerData, // Payer information
    receiveInvoice, // Invoice request checkbox
    invoiceData, // Invoice/company details
    stokSchoolRegulationsAccepted, // School regulations acceptance
    // stokSchoolRodoAccepted, // RODO/GDPR acceptance
    stokSchoolPrivacyPolicyAccepted, // Privacy policy acceptance
    stokSchoolPaymentRegulationsAccepted, // Payment regulations acceptance
    agreementsAcceptedCombined, // All agreements check (computed)
    isPaymentCompleted, // Payment completed state
    isPaymentInProgress, // Payment in progress state
    isPaymentFailed, // Payment failed state
    isRedirecting,
    firstPackageEligible,
    secondPackageEligible,
    missingHoursToFirstThreshold,
    missingHoursToSecondThreshold,
    FIRST_LEVEL_DISCOUNT,
    SECOND_LEVEL_DISCOUNT,
    LOYALTY_CARD_DISCOUNT,

    // ==========================================================================
    // COMPUTED PROPERTIES
    // ==========================================================================

    maxAdults, // Maximum adults allowed
    maxChildren, // Maximum children allowed
    participantsNumberCondition, // Validation: at least one participant
    participantClassesTotalPrice, // Single participant classes price calculator
    participantInsuranceTotalPrice, // Single participant insurance price calculator
    allParticipantsTotalPrice, // Total price for all participants
    totalClassesPrice,
    totalSavings,
    allParticipantsTotalHours, // Total hours of classes for all participants excluding groups
    checkingLoyaltyCardNumber, // Loyalty card validation loading state
    getParticipantClasses, // Get selected classes for a participant
    tempChildminderSuggestion, // Used for suggesting childminder when first is selected


    // ==========================================================================
    // ACTIONS/METHODS
    // ==========================================================================

    resetEvent, // Reset booking to initial state
    checkLoyaltyCardNumber, // Validate loyalty card number

    // ==========================================================================
    // CONFIGURATION (from StayConfigStore)
    // ==========================================================================

    activityTypes: configStore.activityTypes, // Available activities (ski/snowboard)
    skillLevels_ADULTS: configStore.skillLevels_ADULTS, // Adult skill levels
    skillLevels_CHILDREN_SKI: configStore.skillLevels_CHILDREN_SKI, // Children ski skill levels
    skillLevels_CHILDREN_SNOWBOARD: configStore.skillLevels_CHILDREN_SNOWBOARD, // Children snowboard skill levels
    availableLanguages: configStore.availableLanguages, // Available class languages
    currency: configStore.currency, // Currency settings

  }
})
