import { defineStore } from 'pinia'
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'

export const useStayConfigStore = defineStore('stayConfig', () => {
  const { t } = useI18n()

  const currency = 'zł'
  // Per hour prices (DEFAULT FOR COMBINED CLASSES)
  /**
   * Combined pricing structure for classes based on participant count
   */
  const combinedClassesPrices = ref({
    firstParticipant: 174.99, // Price for first participant
    secondParticipant: 40, // Price for second participant
    additionalParticipant: 30, // Price for each participant beyond the second
  })

  const combinedClassesPrices_10h = ref({
    firstParticipant: 164.99, // Price for first participant
    secondParticipant: 38, // Price for second participant
    additionalParticipant: 28, // Price for each participant beyond the second
  })

  const combinedClassesPrices_20h = ref({
    firstParticipant: 154.99, // Price for first participant
    secondParticipant: 37, // Price for second participant
    additionalParticipant: 27, // Price for each participant beyond the second
  })

  const combinedClassesPrices_HH = ref({
    firstParticipant: 164.99, // Price for first participant
    secondParticipant: 38, // Price for second participant
    additionalParticipant: 28, // Price for each participant beyond the second
  })

  const insuranceObject = ref({
    title: 'PAKIET NNW TURYSTYCZNO-SPORTOWY - Wariant 111 SWIJ indywidualnych\n'
      + 'podróży Kontynenty na terenie RP. ',
    enabled: false,
    price: 10,
    perDay: true,
    description:
      'Dodaj ochronę na czas zajęć. Szczegóły i zakres w warunkach ubezpieczenia.',
    imgSource: '',
  })

  const CUSTOMER_SERVICE_LINK = 'https://szkolastok.pl/kontakt'
  const REGULATIONS_LINK = 'https://szkolastok.pl/kontakt'
  const PRIVACY_LINK = 'https://szkolastok.pl/kontakt'
  const PAYMENT_REGULATIONS_LINK = 'https://szkolastok.pl/kontakt'

  const activityTypes = reactive([
    { name: t('ski'), selected: false },
    { name: t('snowboard'), selected: false },
  ])

  const skillLevels_ADULTS = reactive([
    // {
    //   name: t('firstime'),
    //   description: t('firstime_desc'),
    //   additionalInfo: t('firstime_info'),
    //   selected: false
    // },
    {
      name: t('begginer'),
      description: t('novice_desc'),
      additionalInfo: t('novice_info'),
      selected: false,
    },
    {
      name: t('intermediate'),
      description: t('intermediate_desc'),
      additionalInfo: t('intermediate_info'),
      selected: false,
    },
    {
      name: t('advanced'),
      description: t('advanced_desc'),
      additionalInfo: t('advanced_info'),
      selected: false,
    },
  ])

  const skillLevels_CHILDREN_SKI = reactive([
    {
      name: t('orange_group'),
      description: t('orange_group_desc'),
      ageRange: [4, 10],
      additionalInfo: t('orange_group_info'),
      selected: false,
    },
    {
      name: t('bronze_group'),
      description: t('bronze_group_desc'),
      ageRange: [6, 10],
      additionalInfo: t('bronze_group_info'),
      selected: false,
    },
    {
      name: t('silver_group'),
      description: t('silver_group_desc'),
      ageRange: [7, 14],
      additionalInfo: t('silver_group_info'),
      selected: false,
    },
    {
      name: t('gold_group'),
      description: t('gold_group_desc'),
      ageRange: [9, 14],
      additionalInfo: t('gold_group_info'),
      selected: false,
    },
    {
      name: t('diamond_group'),
      description: t('diamond_group_desc'),
      ageRange: [10, 14],
      additionalInfo: t('diamond_group_info'),
      selected: false,
    },
  ])

  const skillLevels_CHILDREN_SNOWBOARD = reactive([
    {
      name: t('yellow_snowboard'),
      description: t('yellow_snowboard_desc'),
      ageRange: [7, 14],
      additionalInfo: t('yellow_snowboard_info'),
      selected: false,
    },
    {
      name: t('wide_snowboard'),
      description: t('wide_snowboard_desc'),
      ageRange: [7, 14],
      additionalInfo: t('wide_snowboard_info'),
      selected: false,
    },
    {
      name: t('narrow_snowboard'),
      description: t('narrow_snowboard_desc'),
      ageRange: [7, 14],
      additionalInfo: t('narrow_snowboard_info'),
      selected: false,
    },
  ])

  const availableLanguages = reactive([
    { name: t('polish'), selected: true },
    { name: t('english'), selected: false },
  ])

  return {
    activityTypes,
    skillLevels_ADULTS,
    skillLevels_CHILDREN_SKI,
    skillLevels_CHILDREN_SNOWBOARD,
    availableLanguages,
    currency,
    CUSTOMER_SERVICE_LINK,
    REGULATIONS_LINK,
    PAYMENT_REGULATIONS_LINK,
    PRIVACY_LINK,
    combinedClassesPrices,
    combinedClassesPrices_10h,
    combinedClassesPrices_20h,
    combinedClassesPrices_HH,
    insuranceObject,
  }
})
