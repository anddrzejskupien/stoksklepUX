<script setup>
  import { VueDatePicker } from '@vuepic/vue-datepicker'
  import { pl } from 'date-fns/locale'
  import { computed, ref } from 'vue'
  import { useDisplay } from 'vuetify'
  import { formatDateRange, formatDateRangeSimple } from '@/utils/dates'
  import '@vuepic/vue-datepicker/dist/main.css'

  const props = defineProps({
    modelValue: { type: [Date, Array], default: null },
    variant: {
      type: String,
      default: 'simple',
      validator: value => ['simple', 'range', 'multi-calendars', 'month-picker'].includes(value),
    },
    inline: {
      type: Boolean,
      default: false,
    },
    locale: {
      type: Object,
      default: () => pl,
    },
    enableTimePicker: {
      type: Boolean,
      default: false,
    },
    isMobile: {
      type: Boolean,
      default: false,
    },
    minAge: { type: Number, default: 18 },
  })

  const emit = defineEmits(['update:modelValue'])

  const { mobile } = useDisplay()
  const datePickerRef = ref(null)

  const pickerConfig = computed(() => {
    const baseConfig = {
      inline: props.inline,
      format: format,
    }

    switch (props.variant) {
      case 'range': {
        return { ...baseConfig, range: true }
      }
      case 'multi-calendars': {
        return { ...baseConfig, range: true, multiCalendars: 2 }
      }
      case 'month-picker': {
        return { ...baseConfig, monthPicker: true }
      }
      default: {
        return baseConfig
      }
    }
  })

  // Format function for DD.MM.YYYY
  function format (date) {
    if (!date) return ''

    if (Array.isArray(date)) {
      return date
        .map(d => {
          const day = String(d.getDate()).padStart(2, '0')
          const month = String(d.getMonth() + 1).padStart(2, '0')
          const year = d.getFullYear()
          return `${day}.${month}.${year}`
        })
        .join(' - ')
    }

    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}.${month}.${year}`
  }

  // Calculate max date based on minimum age requirement (at least 18 years old)
  // const maxDate = computed(() => {
  //   if (!props.minAge) return null
  //
  //   const today = new Date()
  //   const maxYear = today.getFullYear() - props.minAge
  //   return new Date(maxYear, today.getMonth(), today.getDate())
  // })
  function handleClose () {
    datePickerRef.value?.closeMenu()
  }

  const currentMonth = ref(new Date().getMonth())
  const currentYear = ref(new Date().getFullYear())

  const customDayNames = ['Pn', 'Wt', 'Śr', 'Czw', 'Pt', 'Sb', 'Nd']
  const customDayNamesEN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  function handlePrevMonth () {
    if (currentMonth.value === 0) {
      currentMonth.value = 11
      currentYear.value--
    } else {
      currentMonth.value--
    }
    datePickerRef.value?.setMonthYear({ month: currentMonth.value, year: currentYear.value })
  }

  function handleNextMonth () {
    if (currentMonth.value === 11) {
      currentMonth.value = 0
      currentYear.value++
    } else {
      currentMonth.value++
    }
    datePickerRef.value?.setMonthYear({ month: currentMonth.value, year: currentYear.value })
  }

  function onChange (newValue) {
    emit('update:modelValue', newValue)
  }
</script>

<template>
  <VueDatePicker
    ref="datePickerRef"
    v-bind="pickerConfig"
    :action-row="{
      selectBtnLabel: $t('save'),
      cancelBtnLabel: $t('cancel'),
      nowBtnLabel: $t('current')
    }"
    class="simple-date-picker"
    clearable
    :day-names="customDayNames"
    :locale="props.locale"
    :model-value="modelValue"
    :time-config="{ enableTimePicker: props.enableTimePicker }"
    @update:model-value="onChange"
  >
<!--    :max-date="maxDate"-->

    <template #trigger>
      <VTextField
        clear-icon="mdi-close"
        clearable
        control-variant="hidden"
        hide-details
        :model-value="format(modelValue)"
        :placeholder="$t('select')"
        readonly
        variant="outlined"
      >
        <template #prepend-inner>
          <VIcon icon="mdi-calendar-blank-outline" size="16" />
        </template>

      </VTextField>
    </template>

  </VueDatePicker>
</template>
