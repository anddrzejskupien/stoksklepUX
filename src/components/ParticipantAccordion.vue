<script setup>
  import { computed, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useDisplay } from 'vuetify'
  import { useStayConfigStore } from '@/stores/StayConfigStore.js'
  import { useStayStore } from '@/stores/StayStore.js'

  const props = defineProps({
    participant: {
      type: Object,
      required: true,
    },
    index: {
      type: Number,
      required: true,
    },
  })
  const stayStore = useStayStore()
  const configStore = useStayConfigStore()
  const { mobile } = useDisplay()
  const { t } = useI18n()

  // const infoDialog = ref(false)

  const panel = ref(props.index === 0 ? [0] : []) // To control expansion panel opened/closed state
  const form = ref(null) // Reference to the form (participant details)
  const showErrors = ref(false) // To control error display

  const rules = {
    required: value => !!value || t('fill_the_field_properly'),
  }

  // const selectedSkillLevel = ref(null)
  const selectedClassType = ref(null)

  // const availableSkillLevels = computed(() => {
  //   if (props.participant.participantType === 'adult') {
  //     return stayStore.skillLevels_ADULTS
  //   } else if (props.participant.participantType === 'child') {
  //     if (!props.participant.age) {
  //       return []
  //     }
  //
  //     const age = Number.parseInt(props.participant.age)
  //
  //     // Use adult skill levels for children aged 14 and above
  //     if (age >= 14) {
  //       return stayStore.skillLevels_ADULTS
  //     }
  //
  //     if (selectedClassType.value === 0) {
  //       return stayStore.skillLevels_CHILDREN_SKI.filter(level =>
  //         age >= level.ageRange[0] && age <= level.ageRange[1],
  //       )
  //     } else if (selectedClassType.value === 1) {
  //       return stayStore.skillLevels_CHILDREN_SNOWBOARD.filter(level =>
  //         age >= level.ageRange[0] && age <= level.ageRange[1],
  //       )
  //     }
  //   }
  //   return []
  // })

  // const currentSkillLevelInfo = ref(null)

  const isSnowboardDisabled = computed(() => {
    return props.participant.participantType === 'child'
      && props.participant.age !== null
      && props.participant.age < 8
  })

  // function selectSkillLevel (level) {
  //   for (const l of availableSkillLevels.value) l.selected = false
  //   level.selected = true
  //   props.participant.skillLevel = level.name
  //   selectedSkillLevel.value = [level]
  //   infoDialog.value = false
  // }

  // watch(selectedSkillLevel, newValue => {
  //   props.participant.skillLevel = newValue && newValue[0] ? newValue[0].name : ''
  // })

  watch(() => props.participant.age, newAge => {
    if (props.participant.participantType === 'child' && newAge !== null && newAge < 8 && selectedClassType.value === 1) {
      selectedClassType.value = null
      props.participant.activityType = ''
      // selectedSkillLevel.value = null
      props.participant.skillLevel = ''
    }
  })

  // Expose validate method for parent
  defineExpose({
    validate: async () => {
      showErrors.value = true
      const formValid = await form.value?.validate()

      // Additional validation for classType and skillLevel
      const hasClassType = selectedClassType.value !== null
      // const hasSkillLevel = selectedSkillLevel.value !== null && selectedSkillLevel.value.length > 0

      return {
        // valid: formValid?.valid && hasClassType && hasSkillLevel,
        valid: formValid?.valid && hasClassType,
      }
    },
  })
</script>

<template>
  <VExpansionPanels v-model="panel">
    <VExpansionPanel>
      <VExpansionPanelTitle>
        <span class="fw-600">
          {{ index + 1 }} - {{ t(`${participant.participantType}`) || '-' }}
        </span>
      </VExpansionPanelTitle>
      <VExpansionPanelText class="border-t">
        <VForm ref="form">
          <div v-if="participant.participantType === 'child'" class="mb-4">
            <p class="custom-input-label mb-2">{{ $t('child_age') }}</p>
            <VNumberInput
              v-model="participant.age"
              control-variant="split"
              density="default"
              hide-details="auto"
              :max="16"
              max-width="165px"
              :min="4"
              :rules="[rules.required]"
              :step="1"
              variant="outlined"
            />
            <p class="fs-12 fc-gray">
              {{ $t('min_child_age') }}
              <a class="fc-gray" :href="configStore.CUSTOMER_SERVICE_LINK" target="_blank">{{ $t('with_customers_service') }}</a>
            </p>
          </div>

          <div class="mb-4">
            <p class="custom-input-label mb-2">{{ $t('name') }}</p>
            <VTextField
              v-model="participant.name"
              autocomplete="off"
              clear-icon="mdi-close"
              clearable
              density="default"
              hide-details="auto"
              max-length="50"
              :placeholder="$t('enter_name')"
              :rules="[rules.required]"
              variant="outlined"
              @click:clear="participant.name = ''"
              @keydown="(e) => /\d/.test(e.key) && e.preventDefault()"
              @paste="(e) => {
                const pastedText = e.clipboardData.getData('text')
                if (/\d/.test(pastedText)) {
                  e.preventDefault()
                }
              }"
            >
              <template #prepend-inner>
                <VIcon icon="mdi-account" size="18" />
              </template>
            </VTextField>
          </div>
          <div class="mb-4">
            <p class="custom-input-label mb-2">{{ $t('select_classes_lang') }}</p>

            <VSelect
              v-model="participant.classLang"
              density="default"
              hide-details="auto"
              item-title="name"
              item-value="name"
              :items="stayStore.availableLanguages"
              :placeholder="$t('select_language')"
              :rules="[rules.required]"
              variant="outlined"
            />

          </div>

          <div class="mb-4">
            <p class="custom-input-label mb-2">{{ $t('select_discipline') }}</p>
            <VBtnToggle
              v-model="selectedClassType"
              class="ga-2 w-100"
              mandatory
              @update:model-value="(val) => {
                participant.activityType = val === 0 ? t('ski') : t('snowboard')
              }"
            >
              <VBtn
                class="text-capitalize border rounded"
                :class="[
                  mobile ? 'flex-1' : 'px-8',
                  { 'border-error-input border-2': showErrors && selectedClassType === null }
                ]"
                :value="0"
                variant="outlined"
              >
                {{ $t('ski') }}
              </VBtn>
              <VBtn
                class="text-capitalize border rounded"
                :class="[
                  mobile ? 'flex-1' : 'px-8',
                  { 'border-error-input border-2': showErrors && selectedClassType === null }
                ]"
                :disabled="isSnowboardDisabled"
                :value="1"
                variant="outlined"
              >
                {{ $t('snowboard') }}
              </VBtn>
            </VBtnToggle>
            <p class="fs-12 mt-2 fc-gray">
              {{ $t('snowboard_available_ages') }}
            </p>
            <small v-if="showErrors && selectedClassType === null" class="fs-12 fc-error pl-4 pt-2">
              {{ $t('select_class_type') }}
            </small>
          </div>
<!--Selecting skill level-->
<!--          <div v-if="selectedClassType === 0 || selectedClassType === 1" class="mb-4">-->
<!--            <p class="custom-input-label mb-2">{{ $t('select_difficulty_level') }}</p>-->
<!--            <VList-->
<!--              v-model:selected="selectedSkillLevel"-->
<!--              select-strategy="single-leaf"-->
<!--              selectable-->
<!--            >-->
<!--              <VListItem-->
<!--                v-for="(item, i) in availableSkillLevels"-->
<!--                :key="i"-->
<!--                class="border rounded-lg mb-2"-->
<!--                color="primary"-->
<!--                :ripple="false"-->
<!--                :value="item"-->
<!--                @click="selectSkillLevel(item)"-->
<!--              >-->
<!--                <template #prepend="{ isSelected }">-->
<!--                  <VIcon-->
<!--                    :icon="isSelected ? 'mdi-circle-slice-8' : 'mdi-circle-outline'"-->
<!--                    size="16"-->
<!--                  />-->
<!--                </template>-->

<!--                <template #default>-->
<!--                  <VListItemTitle>-->
<!--                    <p class="mb-0 fs-14 text-pre-wrap lh-normal">-->
<!--                      {{ item.name }}-->
<!--                    </p>-->
<!--                  </VListItemTitle>-->
<!--                  <VListItemSubtitle>-->
<!--                    <p class="mb-0 fs-11 text-pre-wrap">-->
<!--                      {{ item.description }}-->
<!--                    </p>-->
<!--                  </VListItemSubtitle>-->
<!--                </template>-->

<!--                <template #append>-->
<!--                  <VIcon-->
<!--                    icon="mdi-information-slab-circle"-->
<!--                    size="18"-->
<!--                    @click.stop="currentSkillLevelInfo = item; infoDialog = true"-->
<!--                  />-->
<!--                </template>-->
<!--              </VListItem>-->
<!--            </VList>-->
<!--            <small v-if="showErrors && !selectedSkillLevel" class="fs-12 fc-error pl-4">-->
<!--              {{ $t('select_difficulty_level') }}-->
<!--            </small>-->
<!--          </div>-->
        </VForm>
      </VExpansionPanelText>
    </VExpansionPanel>

<!--    <VDialog v-model="infoDialog" max-width="320px">-->
<!--      <VCard v-if="currentSkillLevelInfo">-->
<!--        <VCardTitle>-->
<!--          <div class="d-flex justify-space-between" :class="mobile ? 'py-2':''">-->
<!--            <span :class="mobile ? 'fs-14':'fs-16'">-->
<!--              {{ currentSkillLevelInfo.name }}-->
<!--            </span>-->
<!--            <button aria-label="Close" class="close-btn" @click="infoDialog = false">-->
<!--              <VIcon icon="mdi-close" size="18" />-->
<!--            </button>-->
<!--          </div>-->
<!--        </VCardTitle>-->
<!--        <VCardText :class="mobile ? 'pt-0':''">-->
<!--          <p :class="mobile ? 'fs-12':'fs-14'">-->
<!--            {{ currentSkillLevelInfo.additionalInfo }}-->
<!--          </p>-->
<!--        </VCardText>-->
<!--        <VCardActions class="border-t d-flex justify-between text-capitalize">-->
<!--          <VBtn class="px-4 text-capitalize" variant="outlined" @click="infoDialog = false">-->
<!--            {{ $t('close') }}-->
<!--          </VBtn>-->
<!--        </VCardActions>-->
<!--      </VCard>-->
<!--    </VDialog>-->
  </VExpansionPanels>
</template>
