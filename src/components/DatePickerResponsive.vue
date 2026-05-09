<script setup>
  import { VueDatePicker } from '@vuepic/vue-datepicker'
  import { enUS, pl } from 'date-fns/locale'
  import { computed, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useDisplay } from 'vuetify'
  import { formatDateRange } from '@/utils/dates.js'
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
      type: [String, Object],
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
  })

  const emit = defineEmits(['update:modelValue'])
  const { t } = useI18n()
  const datePickerRef = ref(null)

  const { mobile } = useDisplay()

  const rules = {
    required: value => !!value || t('select_date'),
  }
  // Dialog visibility for mobile
  const dialog = ref(false)

  // Current month and year for navigation
  const currentMonth = ref(new Date().getMonth())
  // Current year
  const currentYear = ref(new Date().getFullYear())

  //
  const normalizedLocale = computed(() => {
    if (typeof props.locale === 'string') {
      return props.locale === 'pl' ? pl : enUS
    }
    return props.locale
  })

  // Day names based on locale
  const dayNames = computed(() => {
    const localeCode = typeof props.locale === 'string'
      ? props.locale
      : props.locale?.code

    return localeCode === 'pl'
      ? ['Pn', 'Wt', 'Śr', 'Czw', 'Pt', 'Sb', 'Nd']
      : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  })

  // Temporary selection storage
  const tempSelection = ref(null)

  // Previous month handler
  function handlePrevMonth () {
    if (currentMonth.value === 0) {
      currentMonth.value = 11
      currentYear.value--
    } else {
      currentMonth.value--
    }
    datePickerRef.value?.setMonthYear({ month: currentMonth.value, year: currentYear.value })
  }

  // Next month handler
  function handleNextMonth () {
    if (currentMonth.value === 11) {
      currentMonth.value = 0
      currentYear.value++
    } else {
      currentMonth.value++
    }
    datePickerRef.value?.setMonthYear({ month: currentMonth.value, year: currentYear.value })
  }

  // Simple close
  function handleClose () {
    datePickerRef.value?.closeMenu()
  }

  // Clear selection
  function handleClear () {
    tempSelection.value = null
    emit('update:modelValue', null)
  }

  // Save and close for mobile dialog
  function handleSaveAndClose () {
    datePickerRef.value?.selectDate()
    datePickerRef.value?.closeMenu()
    dialog.value = false
  }
  // Cancel selection for mobile dialog
  function handleCancel () {
    tempSelection.value = ''
    datePickerRef.value?.closeMenu()
    dialog.value = false
  }

  // On change handler
  function onChange (newValue) {
    tempSelection.value = newValue
    emit('update:modelValue', newValue)
  }
  // Internal update handler
  function onInternalUpdate (newValue) {
    tempSelection.value = newValue
  }
</script>

<template>
  <div class="range-date-picker">

    <!-- Desktop Picker -->
    <VueDatePicker
      v-if="!mobile"
      :key="modelValue ? modelValue.toString() : 'empty'"
      ref="datePickerRef"
      :action-row="{
        selectBtnLabel: $t('save'),
        cancelBtnLabel: $t('cancel'),
        nowBtnLabel: $t('current'),
        selectBtnClass: 'sraka'
      }"
      clearable
      :day-names="dayNames"
      :format="formatDateRange"
      :formats="{
        month: 'LLLL',
      }"
      :locale="normalizedLocale"
      :model-value="modelValue"
      multi-calendars
      :range="{ maxRange: 14 }"
      :time-config="{ enableTimePicker: props.enableTimePicker }"
      @internal-model-change="onInternalUpdate"
      @update:model-value="onChange"
    >
      <template #menu-header>
        <div class="fs-16 mb-3 d-flex justify-space-between">
          {{ $t('select_your_stay_dates') }}
          <button aria-label="Close" class="close-btn" @click="handleClose">
            <VIcon icon="mdi-close" size="18" />
          </button>
        </div>
        <div class="mb-3">
          <VAlert
            class="mb-2 fs-13 border alert-info-small"
            density="compact"
          >
            <span class="fc-blue">
              {{ $t('maximum_length_of_stay') }}
            </span>
          </VAlert>
        </div>
        <div class="d-flex justify-space-between px-4">
          <VIcon icon="mdi-chevron-left" @click="handlePrevMonth" />
          {{ $t('select_month') }}
          <VIcon icon="mdi-chevron-right" @click="handleNextMonth" />
        </div>
      </template>
      <template #trigger>
        <VTextField
          clear-icon="mdi-close"
          clearable
          control-variant="hidden"
          density="default"
          hide-details="auto"
          :model-value="formatDateRange(modelValue)"
          :placeholder="$t('select')"
          readonly
          :rules="[rules.required]"
          variant="outlined"
          @click:clear="handleClear"
        >
          <!--        :error-messages="$t('select_date')"-->
          <template #prepend-inner>
            <VIcon icon="mdi-calendar-blank-outline" size="16" />
          </template>
        </VTextField>
      </template>
      <template #action-preview="{ value }">
        <div class="custom-preview fs-13 mr-auto">
          {{ $t('selected') }}:
          <span class="fw-600">
            {{ formatDateRange(tempSelection) }}
          </span>
        </div>
      </template>
    </VueDatePicker>

    <VTextField
      v-else
      clear-icon="mdi-close"
      clearable
      control-variant="hidden"
      density="default"
      hide-details="auto"
      :model-value="formatDateRange(modelValue)"
      :placeholder="$t('select')"
      readonly
      :rules="[rules.required]"
      variant="outlined"
      @click="dialog = true"
      @click:clear="handleClear"
    >
      <template #prepend-inner>
        <VIcon icon="mdi-calendar-blank-outline" size="16" />
      </template>
    </VTextField>

    <!-- Mobile dialog-->
    <VDialog
      v-model="dialog"
      fullscreen
      scrollable
    >
      <VCard>
        <VCardTitle>
          <div
            class="d-flex justify-space-between"
            :class="mobile ? 'fs-16 py-2':''"
          >
            {{ $t('select_your_stay_dates') }}
            <VIcon icon="mdi-close" @click="dialog = false" />
          </div>
        </VCardTitle>
        <VCardText
          class="px-2"
          :class="mobile ? 'pt-0':''"
        >
          <VueDatePicker
            :key="modelValue ? modelValue.toString() : 'empty'"
            ref="datePickerRef"
            :action-row="{ showSelect: false, showCancel: false, showNow: false }"
            clearable
            :day-names="dayNames"
            :format="formatDateRange"
            :formats="{
              month: 'LLLL',
            }"
            inline
            :locale="normalizedLocale"
            :model-value="modelValue"
            multi-calendars
            :range="{ maxRange: 14 }"
            :time-config="{ enableTimePicker: props.enableTimePicker }"
            @internal-model-change="onInternalUpdate"
            @update:model-value="onChange"
          >
            <template #menu-header>
              <div class="mb-3">
                <VAlert
                  class="mb-2 fs-13 border alert-info-small mx-2"
                  density="compact"
                >
                  <span
                    class="fc-blue"
                    :class="mobile? 'fs-11' : ''"
                  >
                    {{ $t('maximum_length_of_stay') }}
                  </span>
                </VAlert>
              </div>
              <div class="d-flex justify-space-between px-4">
                <VIcon icon="mdi-chevron-left" @click="handlePrevMonth" />
                <span
                  class="fw-500"
                  :class="mobile ? 'fs-13':''"
                >
                  {{ $t('select_month') }}
                </span>
                <VIcon icon="mdi-chevron-right" @click="handleNextMonth" />
              </div>
            </template>

            <template #action-preview="{ value }">
              <div class="custom-preview fs-13 mr-auto">
                {{ $t('selected') }}:
                <span class="fw-600">
                  {{ formatDateRange(tempSelection) }}
                </span>
              </div>
            </template>
          </VueDatePicker>

        </VCardText>
        <VCardActions class="border-t d-flex justify-between text-capitalize">

          <VBtn
            class="mr-auto px-4 text-capitalize"
            color="grey"
            variant="flat"
            @click="handleCancel"
          >
            {{ $t('cancel') }}
          </VBtn>

          <VBtn
            id="save-dates-btn"
            class="px-4 text-capitalize"
            :color="tempSelection ? '#1C64F2' : '#ebe6e7'"
            :disabled="!tempSelection"
            variant="flat"
            @click="handleSaveAndClose"
          >
            {{ $t('save') }}
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<style lang="scss">
.range-date-picker {

  .dp__outer_menu_wrap {
    @media (max-width: 600px) {
      width: 100%;
    }

  }

  .dp__menu {
    font-family: 'Inter', sans-serif;
    border: none;
    @media (min-width: 600px) {
      margin-top: unset;
      border-radius: 16px;
      padding: 16px;
      -webkit-box-shadow: 0px 0px 8px 0px rgba(0, 0, 0, 0.2);
      -moz-box-shadow: 0px 0px 8px 0px rgba(0, 0, 0, 0.2);
      box-shadow: 0px 0px 8px 0px rgba(0, 0, 0, 0.2);
    }

    .dp__arrow_top {
      display: none;
    }

    //#save-dates-btn {
    //  background-color: #ebe6e7;
    //}
  }

  .dp__month_year_wrap {
    font-size: 13px;

    .dp--arrow-btn-nav {
      display: none !important;
    }

    .dp__month_year_select {
      width: unset !important;
      margin-right: 5px;
      text-transform: capitalize;
      font-weight: 700;
    }
  }

  .dp__menu_inner {
    padding-bottom: 0;
    column-gap: 10px;

    @media (min-width: 600px) {
      padding: 16px 16px 0 16px !important;

    }
  }

  .dp__calendar_header {
    font-size: 11px;
    font-weight: 200;
    @media (min-width: 600px) {
      font-size: 13px;
    }
  }

  .dp__action_button {
    padding-block: 8px !important;
    padding-inline: 16px !important;
    min-height: 35px;
    border-radius: 8px;
    font-size: 16px;
    margin-left: 8px;
  }

  .dp__action_cancel {
    background-color: $gray-light !important;
    color: #000;
  }

  .dp__action_select {
    background-color: $gray !important;
    color: #fff;
  }

  .dp__action_row {
    flex-direction: column;
    align-items: flex-start;
    border-top: 1px solid $gray-border;
    padding-top: 12px;
    margin-top: 12px;
  }

  .dp__cell_inner {
    padding: 0 6px !important;
    margin: 0 !important;
    border-radius: $border-radius;
    height: 24px !important;
    font-size: 11px;
    @media (min-width: 600px) {
      font-size: 13px;
      height: 28px !important;
      padding: 1px 8px !important;
      margin: 1px !important;
    }
  }

  .dp--future.dp__range_start,
  .dp--future.dp__range_end {
    background: #1a56db;

  }

  .dp__range_between {
    background: #dbeafe;
    color: $blue;
  }

  .dp__menu:has(.dp__range_start) .dp__action_select,
  .dp__menu:has(.dp__range_end) .dp__action_select {
    background-color: $blue !important;
  }
}
</style>
