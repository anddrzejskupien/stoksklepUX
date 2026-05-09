<script setup>
  import { useDisplay } from 'vuetify'
  import PercentIcon from '@/assets/percentage.svg'
  import GreenShieldIcon from '@/assets/shield-check-green.svg'
  import OrangeShieldIcon from '@/assets/shield-check-orange.svg'
  import TagIcon from '@/assets/tag.svg'
  import PopupSmall from '@/components/modals/PopupSmall.vue'
  import { useStayConfigStore } from '@/stores/StayConfigStore.js'

  const props = defineProps({
    color: {
      type: String,
      default: 'yellow',
      validator: value => ['yellow', 'green', 'orange'].includes(value),
    },
    showIcon: {
      type: Boolean,
      default: true,
    },
    border: {
      type: Boolean,
      default: false,
    },
  })
  const { mobile } = useDisplay()
  const configStore = useStayConfigStore()

  const popup = ref(false)

  const icon = computed(() => {
    const iconMap = {
      green: GreenShieldIcon,
      yellow: TagIcon,
      orange: OrangeShieldIcon,
    }
    return iconMap[props.color]
  })

  const backgroundColor = computed(() => {
    const bgMap = {
      green: 'bg-green-light',
      yellow: 'bg-yellow-light',
      orange: 'bg-orange-light',
    }
    return bgMap[props.color]
  })
</script>

<template>
  <div>
    <div
      :class="[
        mobile ? 'pa-4 pt-2' : 'px-4 pb-4 py-2',
        'package-card-info',
        'rounded-lg',
        'position-relative',
        'my-4',
        backgroundColor,
        { 'with-border': border }
      ]"
    >
      <div class="d-flex justify-end position-relative z-10" />
      <VListItem
        class="package-list-item pa-0 position-relative "
      >
        <template v-if="showIcon" #prepend>
          <img alt="" class="mt-1 mr-2" :src="icon" width="18px">
        </template>
        <div :class="mobile ? 'fs-12' : 'fs-14'">
          <slot />
        </div>
        <template #append>
          <VIcon class="mb-auto" color="grey" icon="mdi-information-slab-circle" @click.stop="popup = true" />

        </template>

      </VListItem>

    </div>
    <PopupSmall
      v-model="popup"
      :title="$t('price_packages')"
    >
      <template #icon>
        <img alt="icon" class="mr-2" :src="PercentIcon">
      </template>
      <template #content>
        <div
          :class="mobile?'fs-11' : 'fs-12'"
        >
          <div class="mb-4 ">
            <p class="fw-600">
              {{ $t('1_class_hour') }}
            </p>
            <ul class="pl-4 lh-normal">
              <li>
                {{ $t('first_person') }}: {{ configStore.combinedClassesPrices.firstParticipant }}&nbsp;{{ configStore.currency }}
              </li>
              <li>
                {{ $t('second_person') }}: {{ configStore.combinedClassesPrices.secondParticipant }}&nbsp;{{ configStore.currency }}
              </li>
              <li>
                {{ $t('third_person') }}: {{ configStore.combinedClassesPrices.additionalParticipant }}&nbsp;{{ configStore.currency }}
              </li>
            </ul>
          </div>
          <div class="mb-4">
            <p class="fw-600">
              {{ $t('package') }} 10+
            </p>
            <ul class="pl-4 lh-normal">
              <li>
                {{ $t('first_person') }}: {{ configStore.combinedClassesPrices_10h.firstParticipant }}&nbsp;{{ configStore.currency }}
              </li>
              <li>
                {{ $t('second_person') }}: {{ configStore.combinedClassesPrices_10h.secondParticipant }}&nbsp;{{ configStore.currency }}
              </li>
              <li>
                {{ $t('third_person') }}: {{ configStore.combinedClassesPrices_10h.additionalParticipant }}&nbsp;{{ configStore.currency }}
              </li>
            </ul>
          </div>
          <div class="mb-4">
            <p class="fw-600">
              {{ $t('package') }} 20+
            </p>
            <ul class="pl-4 lh-normal">
              <li>
                {{ $t('first_person') }}: {{ configStore.combinedClassesPrices_20h.firstParticipant }}&nbsp;{{ configStore.currency }}
              </li>
              <li>
                {{ $t('second_person') }}: {{ configStore.combinedClassesPrices_20h.secondParticipant }}&nbsp;{{ configStore.currency }}
              </li>
              <li>
                {{ $t('third_person') }}: {{ configStore.combinedClassesPrices_20h.additionalParticipant }}&nbsp;{{ configStore.currency }}
              </li>
            </ul>
          </div>
          <div class="mb-4">
            <p class="fw-600">
              Happy Hours
            </p>
            <ul class="pl-4 lh-normal">
              <li>
                {{ $t('first_person') }}: {{ configStore.combinedClassesPrices_HH.firstParticipant }}&nbsp;{{ configStore.currency }}
              </li>
              <li>
                {{ $t('second_person') }}: {{ configStore.combinedClassesPrices_HH.secondParticipant }}&nbsp;{{ configStore.currency }}
              </li>
              <li>
                {{ $t('third_person') }}: {{ configStore.combinedClassesPrices_HH.additionalParticipant }}&nbsp;{{ configStore.currency }}
              </li>
            </ul>
          </div>
          <div class="mb-4">
            <p class="fw-600">
              {{ $t('additional_information') }}
            </p>
            <ul class="pl-4 lh-normal">
              <li>
                {{ $t('price_package.info_1') }}
              </li>
              <li>
                {{ $t('price_package.info_2') }}
              </li>
              <li>
                {{ $t('price_package.info_3') }}
              </li>
              <li>
                {{ $t('price_package.info_4') }}
              </li>
            </ul>
          </div>
        </div>
      </template>

      <template #actions>
        <VBtn variant="outlined" @click="popup = false">
          {{ $t('close') }}
        </VBtn>

      </template>

    </PopupSmall>
  </div>
</template>

<style lang="scss">
.package-card-info {
  &.bg-yellow-light {
    background-color: #FDF6B2;
    color: #723B13;

    .v-list-item__append {
      width: 20px;
    }
  }

  &.bg-green-light {
    background-color: #F3FAF7;
    color: #046C4E;
  }
  &.bg-orange-light{
    background-color: #FEECDC;
  }

  &.with-border {
    border: 1px solid transparent;
    &.bg-green-light {
      border-color: #BCF0DA;
    }
  }
}

  .v-list-item__prepend {
    align-self: flex-start !important;
  }
  .v-list-item__content,
  .v-list-item__prepend {
    margin-top: 8px
  }
  .v-list-item__append {
   margin-bottom: auto;
  }
</style>
