<script setup>
  import { defineEmits, defineProps } from 'vue'
  import kidsClassesImg from '@/assets/kids_classes.png'

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
    <VCard class="rounded-xl overflow-hidden">
      <div class="pa-4 pb-4">
        <div class="d-flex justify-space-between align-center">
          <div class="d-flex align-center">
            <VIcon
              class="mr-3"
              color="grey-darken-1"
              icon="mdi-emoticon-happy"
              size="28"
            />
            <span class="text-h6 font-weight-bold text-primary-900">Specjalista dla dzieci</span>
          </div>
          <VBtn
            class="close-btn"
            icon="mdi-close"
            variant="text"
            @click="close"
          />
        </div>
      </div>

      <div class="w-100" style="height: 250px;">
        <img
          alt="Kids Classes"
          class="w-100 h-100"
          :src="kidsClassesImg"
          style="object-fit: cover;"
        >
      </div>

      <div class="pa-5">
        <div class="mb-6">
          <div class="font-weight-bold text-primary-900 mb-2 fs-14">
            <p class="font-bold fc-gray mb-1">
              Dopłata +30,00 zł / godz. szkoleniową - Liczba miejsc ograniczona
            </p>
            Dlaczego warto?
          </div>
          <p class="text-caption text-gray-600 mb-0" style="line-height: 1.5;">
            instruktorzy z odznaką “specjalista dla dzieci” posiadają specjalny certyfikat potwierdzający zakończenie specjalnego kursu dot. pracy z dziećmi.
            Charakteryzuje ich dobre i profesjonalne podejście do dzieci, oraz szczególna dbałość o bezpieczeństwo.
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
  margin-top: -8px;
}
</style>
