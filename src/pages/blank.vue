<script setup>
  import { useI18n } from 'vue-i18n'
  import { useDisplay } from 'vuetify'
  import PopupSmall from '@/components/modals/PopupSmall.vue'
  import PackageInfoBox from '@/components/PackageInfoBox.vue'
  import { useToast } from '@/composables/useToast.js'
  import { useStayStore } from '@/stores/StayStore.js'

  const stayStore = useStayStore()
  const { showSimpleToast, showActionToast } = useToast()

  // Simple Toast Examples
  function showSuccessToast () {
    showSimpleToast('Operation completed successfully!', 'success')
  }

  function showErrorToast () {
    showSimpleToast('An error occurred', 'error')
  }

  function showWarningToast () {
    showSimpleToast('This is a warning', 'warning')
  }

  function showInfoToast () {
    showSimpleToast('Informational message', 'info')
  }

  // Action Toast Example
  function showUndoToast () {
    showActionToast(
      'Item deleted',
      'Undo',
      () => {
        // Action to perform when button is clicked
        console.log('Undo action triggered')
        showSimpleToast('Action undone!', 'success')
      },
    )
  }
  const popup = ref(false)

  const { mobile } = useDisplay()
  const { t } = useI18n()
</script>
<template>
  <VContainer max-width="990">
    <h2>Those are price package boxes, related to stayStore participant selectedClasses</h2>
    <!--INFO BOX FIRST LEVEL DISCOUNT-->

    <PackageInfoBox v-if="stayStore.firstPackageEligible" class="my-4" color="yellow">
      <span class="fw-500"><span class="fw-600">{{ stayStore.allParticipantsTotalHours }}</span>/10h w {{ $t('in_package') }}.</span>
      <div class="d-flex justify-space-between">
        <p class="mb-2 ">{{ $t('lower_price_package_activated') }}
        </p>
        <span class="fc-gray fw-500 ml-auto">
          -{{ ((stayStore.allParticipantsTotalPrice / (1 - stayStore.FIRST_LEVEL_DISCOUNT / 100)) * (stayStore.FIRST_LEVEL_DISCOUNT / 100)).toFixed(2) }}&nbsp;{{ stayStore.currency }}
        </span>
      </div>
      <div class="custom-badge info" :class="mobile? 'fs-10':'fs-12'">
        {{ $t('you_save') }} -{{ stayStore.FIRST_LEVEL_DISCOUNT }}%
      </div>
    </PackageInfoBox>

    <!--INFO BOX SECOND LEVEL DISCOUNT-->
    <PackageInfoBox v-if="stayStore.secondPackageEligible" class="my-4" color="yellow">
      <span class="fw-500"><span class="fw-600">{{ stayStore.allParticipantsTotalHours }}</span>/20h w {{ $t('in_package') }}.</span>
      <div class="d-flex justify-space-between">
        <p class="mb-2 ">{{ $t('cheaper_price_package_activated') }}
        </p>
        <span class="fc-gray fw-500 ml-auto">
          -{{ ((stayStore.allParticipantsTotalPrice / (1 - stayStore.SECOND_LEVEL_DISCOUNT / 100)) * (stayStore.SECOND_LEVEL_DISCOUNT / 100)).toFixed(2) }}&nbsp;{{ stayStore.currency }}
        </span>
      </div>
      <div class="custom-badge info" :class="mobile? 'fs-10':'fs-12'">
        {{ $t('you_save') }} -{{ stayStore.SECOND_LEVEL_DISCOUNT }}%
      </div>
    </PackageInfoBox>

    <!--INFO BOX MISSING HOURS-->
    <PackageInfoBox
      v-if="(stayStore.missingHoursToFirstThreshold > 0 && stayStore.missingHoursToFirstThreshold <= 2) ||
        (stayStore.firstPackageEligible && stayStore.missingHoursToSecondThreshold > 0)"
      class="my-4"
      color="green"
      :show-icon="false"
    >
      <div class="d-flex justify-space-between mb-2">
        <p class="fw-500">
          {{ $t('you_are_missing') }}
          <span class="fc-green-dark fw-600">{{ stayStore.missingClassesForDiscount }}h {{ $t('classes_plural') }},</span>
          {{ $t('to_activate_the_package') }}
        </p>
        <VBtn
          class="text-capitalize pa-2 mt-4 mb-2 ml-2"
          :class="mobile? 'fs-12':'fs-14'"
          color="green"
          variant="outlined"
        >
          {{ $t('add_classes') }}
        </VBtn>
      </div>
      <div class="custom-badge green" :class="mobile ? 'fs-10' : 'fs-12'">
        {{ $t('you_gain') }} {{ stayStore.firstPackageEligible ? stayStore.SECOND_LEVEL_DISCOUNT : stayStore.FIRST_LEVEL_DISCOUNT }}%
      </div>
    </PackageInfoBox>

  </VContainer>

  <VContainer max-width="990">
    <h2>This is based on <code>stayStore</code></h2>
    <p>

      total hours (no group classes): {{ stayStore.allParticipantsTotalHours }}
    </p>
    <p>
      missing hours to first discount package: {{ stayStore.missingHoursToFirstThreshold }}
    </p>
    <p>
      missing hours to second discount package: {{ stayStore.missingHoursToSecondThreshold }}
    </p>
    <p>
      missing classes for discount: {{ stayStore.missingClassesForDiscount }}
    </p>
  </VContainer>

  <VContainer max-width="990">
    <div class="pa-4">
      <h2>Toast Examples</h2>

      <!-- Simple Toasts -->
      <div class="my-4">
        <VBtn class="mr-2" color="success" @click="showSuccessToast">
          Success Toast
        </VBtn>
        <VBtn class="mr-2" color="error" @click="showErrorToast">
          Error Toast
        </VBtn>
        <VBtn class="mr-2" color="warning" @click="showWarningToast">
          Warning Toast
        </VBtn>
        <VBtn color="info" @click="showInfoToast">
          Info Toast
        </VBtn>
      </div>

      <!-- Action Toast -->
      <div class="my-4">
        <VBtn color="primary" @click="showUndoToast">
          Show Action Toast
        </VBtn>
      </div>
    </div>

    <!--POPUP-->
    <VBtn @click="popup = true">
      popup
    </VBtn>

    <PopupSmall
      v-model="popup"
      title="Mateusz"
    >
      <template #content>
        KĄTĘNT
      </template>

      <template #actions>
        <VBtn variant="outlined" @click="popup = false">
          Ok
        </VBtn>

      </template>

    </PopupSmall>
  </VContainer>

</template>
<style lang="scss"></style>
