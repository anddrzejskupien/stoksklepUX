<script setup>
  import { defineEmits, defineProps } from 'vue'

  defineProps({
    modelValue: {
      type: Boolean,
      default: false,
    },
  })

  const emit = defineEmits(['update:modelValue'])

  function close () {
    emit('update:modelValue', false)
  }
</script>

<template>
  <VDialog
    max-width="500"
    :model-value="modelValue"
    persistent
    @update:model-value="close"
  >
    <VCard class="rounded-xl">
      <div class="pa-5">
        <div class="d-flex justify-space-between align-center mb-4">
          <span class="text-h6 font-weight-bold text-primary-900">Rodzaje zajęć</span>
          <VBtn
            class="close-btn"
            icon="mdi-close"
            variant="text"
            @click="close"
          />
        </div>

        <p class="text-body-2 text-gray-600 mb-6">
          Przeczytaj poniższe informacje i dowiedz się więcej o rodzajach dostępnych zajęć.
        </p>

        <div class="mb-5">
          <div class="font-weight-bold text-primary-900 mb-2 fs-14">
            Zajęcia indywidualne
          </div>
          <p class="text-caption text-gray-600 mb-0" style="line-height: 1.5;">
            To zajęcia w których uczestniczysz tylko Ty i instruktor.
          </p>
        </div>

        <VDivider class="mb-5 border-opacity-100" color="#E5E7EB" />

        <div class="mb-5">
          <div class="font-weight-bold text-primary-900 mb-2 fs-14">
            Zajęcia indywidualne łączone z innym uczestnikiem
          </div>
          <p class="text-caption text-gray-600 mb-0" style="line-height: 1.5;">
            To zajęcia podobne do indywidualnych, lecz oprócz Ciebie, mogą uczestniczyć też dowolni dwaj inny uczestnicy z Twojej grupy.
          </p>
        </div>

        <VDivider class="mb-5 border-opacity-100" color="#E5E7EB" />

        <div class="mb-6">
          <div class="font-weight-bold text-primary-900 mb-2 fs-14">
            Zajęcia grupowe
          </div>
          <p class="text-caption text-gray-600 mb-0" style="line-height: 1.5;">
            To zajęcia w których uczestniczy wiele osób, ale mają one także większą kadrę instruktorską. Zajęcia grupowe w odróżnieniu od indywidualnych sprzedajemy w pakiecie kilku zajęć rozłożonym na pare dni.
          </p>
        </div>

        <div class="d-flex justify-end">
          <VBtn
            class="text-none font-weight-medium px-6"
            color="white"
            elevation="0"
            height="40"
            style="border: 1px solid #E5E7EB;"
            variant="flat"
            @click="close"
          >
            Zamknij
          </VBtn>
        </div>
      </div>
    </VCard>
  </VDialog>
</template>

<style scoped lang="scss">
.text-primary-900 {
  color: #111928;
}

.text-gray-600 {
  color: #4B5563;
}

.fs-14 {
  font-size: 14px;
}

.close-btn {
  color: #6B7280;
  margin-right: -8px;
}
</style>
