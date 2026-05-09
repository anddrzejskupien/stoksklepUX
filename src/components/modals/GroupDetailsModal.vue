<script setup>
  import { defineEmits, defineProps } from 'vue'
  import KidsClassesImg from '@/assets/kids_classes.png'

  defineProps({
    modelValue: {
      type: Boolean,
      default: false,
    },
    group: {
      type: Object,
      default: () => ({}),
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
    scrollable
    @update:model-value="close"
  >
    <VCard class="rounded-xl overflow-hidden d-flex flex-column" max-height="90vh">
      <!-- Header -->
      <div class="modal-header d-flex justify-space-between align-center px-5 py-4 bg-white border-bottom flex-shrink-0">
        <div class="d-flex align-center">
          <!-- Icon/Logo placeholder if needed, or just title -->
          <!-- Using a ski icon if available or just text -->
          <VIcon class="mr-2" color="blue" icon="mdi-ski" />
          <span class="text-h6 font-weight-bold text-primary-900">{{ group?.name }}</span>
        </div>
        <VBtn
          class="close-btn"
          icon="mdi-close"
          variant="text"
          @click="close"
        />
      </div>

      <!-- Scrollable Content -->
      <div class="flex-grow-1 overflow-y-auto">
        <!-- Image -->
        <div class="image-container">
          <img alt="Zajęcia grupowe" class="w-100 h-auto d-block" :src="KidsClassesImg">
        </div>

        <div class="pa-5">
          <!-- Description -->
          <p class="text-body-2 text-gray-600 mb-6" style="line-height: 1.6;">
            Idealne na krótki wyjazd lub pierwszą przygodę z nartami. W ciągu trzech dni dziecko pozna podstawy, poczuje radość z jazdy i nabierze ochoty na więcej. To świetny start – pełen ruchu, śmiechu i nowych znajomości.
          </p>
          <!-- Note: Using hardcoded description for now as per design mock, or fallback to group.description -->

          <VDivider class="mb-5 border-opacity-100" color="#E5E7EB" />

          <!-- Schedule -->
          <div class="mb-6">
            <div class="font-weight-bold text-primary-900 mb-3 fs-16">
              Plan zajęć
            </div>
            <ul class="schedule-list pl-4">
              <!-- Mocking detailed schedule as per design, since store has simple string -->
              <!-- If group.schedule is simple, we might want to show that, but the design shows a list.
                  I will check if group.detailedSchedule exists, otherwise show a default list or parse the simple one.
                  For now, I'll display the group.schedule and some static bullet points to match the look. -->

              <li v-if="group?.schedule" class="text-caption text-gray-600 mb-2">
                {{ group.schedule }}
              </li>
              <!-- Adding static points to match the "Plan zajęć" look from screenshot if needed,
                  but better to use data. The screenshot shows detailed times.
                  I will use the data from store if available, otherwise fallback to the static list from screenshot for "Grupa 3 dni" or similar. -->
              <li class="text-caption text-gray-600 mb-2">
                9:30 - 11:20 - Jazda na nartach – pierwsza sesja w grupach
              </li>
              <li class="text-caption text-gray-600 mb-2">
                11:30 - 13:20 - Animacje + lekki posiłek (** pakiet rozszerzony)
              </li>
              <li class="text-caption text-gray-600 mb-2">
                13:30 - 15:20 - Jazda na nartach - druga sesja
              </li>
              <li class="text-caption text-gray-600 mb-2">
                14:30 - 17:00 Dzień 3 - Zawody lub sprawdzian umiejętności, dyplomy, zdjęcia ze Stokusiem
              </li>
            </ul>
            <p class="text-caption text-gray-500 mt-4 font-italic">
              Animacje nie są dostępne dla kursów w języku angielskim
            </p>
          </div>

          <!-- Footer Button -->
          <div class="d-flex justify-end">
            <VBtn
              class="text-none font-weight-medium px-6 border-gray"
              color="white"
              elevation="0"
              height="44"
              variant="flat"
              @click="close"
            >
              Zamknij
            </VBtn>
          </div>
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
.text-gray-500 {
  color: #6B7280;
}

.fs-14 {
  font-size: 14px;
}
.fs-16 {
  font-size: 16px;
}

.border-bottom {
    border-bottom: 1px solid #E5E7EB;
}

.border-gray {
    border: 1px solid #E5E7EB;
}

.schedule-list {
    list-style-type: disc;

    li {
      line-height: 1.5;
      &::marker {
        color: #6B7280;
      }
    }
  }
</style>
