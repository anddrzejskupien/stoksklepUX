<script setup lang="ts">
  import { useCookies } from '@vueuse/integrations/useCookies'
  import { computed, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useDisplay } from 'vuetify'
  import enFlag from '@/assets/en-flag.svg'
  import plFlag from '@/assets/pl-flag.svg'
  import Logo from '@/assets/stok-logo.svg'
  import Timer from '@/components/Timer.vue'
  import { usePickedClassesStore } from '@/stores/PickedClassesStore.js'
  const { locale } = useI18n()
  const { mobile } = useDisplay()
  const menu = ref(false)
  const cookies = useCookies(['locale'])

  const classStore = usePickedClassesStore()
  // Switch language
  function changeLanguage (lang) {
    locale.value = lang
    cookies.set('locale', lang, { path: '/', maxAge: 60 * 60 * 24 * 365 }) // 1 year
  }
// Start timer when component mounts

</script>

<template>
  <VAppBar :elevation="0">
    <VImg
      class="ml-2"
      contain
      :max-width="mobile? 78: 120"
      :src="Logo"
      :width="mobile? 78:120 "
    />
    <VSpacer />
    <Timer v-if="classStore.bookedClasses.length > 0" :class="mobile ? '' :'ml-auto'" />

    <VMenu v-model="menu" class="ml-auto">
      <template #activator="{ props }">
        <VBtn v-bind="props" variant="text">
          {{ locale.toUpperCase() }}
        </VBtn>
      </template>

      <VList density="compact">
        <VListItem @click="changeLanguage('pl')">
          <template #prepend>
            <img alt="pl" class="mr-2" :src="plFlag">
          </template>
          PL
        </VListItem>
        <VListItem @click="changeLanguage('en')">
          <template #prepend>
            <img alt="en" class="mr-2" :src="enFlag">
          </template>
          EN
        </VListItem>
      </VList>
    </VMenu>
  </VAppBar>
</template>
