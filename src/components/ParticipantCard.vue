<script setup>
  import { computed } from 'vue'
  import { useI18n } from 'vue-i18n'
  import BlueArrow from '@/assets/blue_arrow_right.svg'
  import checkClasses from '@/assets/check_classes.svg'
  import Edit from '@/assets/edit.svg'
  import skiLOGO from '@/assets/ski-icon.svg'
  import snowboardLOGO from '@/assets/snowboard-icon.svg'
  import { formatPrice } from '@/utils/numbers.js'

  const props = defineProps({
    index: { type: Number, required: true },
    name: { type: String, required: true },
    activityType: { type: String, required: true },
    subtitle: { type: String, required: true },
    participantType: { type: String, required: false },
    age: { type: [Number, String], required: false },
    completed: { type: Boolean, default: false },
    totalPrice: { type: Number, required: false },
    currency: { type: String, required: false },
  })

  const emit = defineEmits(['click', 'edit'])
  const { t, locale } = useI18n()

  const iconSrc = computed(() => props.activityType === 'snowboard' ? snowboardLOGO : skiLOGO)

  const displaySubtitle = computed(() => {
    if (props.participantType === 'child' && props.age) {
      const unit = locale.value === 'pl' ? 'lat' : 'years old'
      const childLabel = t('child')
      if (props.subtitle && props.subtitle.includes(childLabel)) {
        return props.subtitle.replace(childLabel, `${childLabel}, ${props.age} ${unit}`)
      }
      return `${childLabel}, ${props.age} ${unit} - ${props.subtitle}`
    }
    return props.subtitle
  })
</script>

<template>
  <VSheet :class="['participant-card', 'pa-4', { 'participant-complated': completed }]">
    <div class="d-flex flex-column">
      <div class="d-flex align-center justify-space-between ga-3 mb-3">
        <div class="d-flex align-center ga-3">
          <div class="badge-circle fs-11 font-weight-bold">{{ index + 1 }}</div>
          <img alt="" height="24" :src="iconSrc" width="24">
          <p class="fs-18 font-weight-semibold mb-0 text-primary-900">{{ name }}</p>
        </div>

        <VBtn
          class="arrow-btn rounded-lg"
          height="28"
          variant="flat"
          width="28"
          @click="completed ? emit('edit') : emit('click')"
        >
          <template v-if="completed">
            <img alt="" height="12" :src="Edit" width="12">
          </template>
          <template v-else>
            <img alt="" height="12" :src="BlueArrow" width="12">
          </template>
        </VBtn>
      </div>

      <div>
        <div class="d-flex">
          <p class="fs-10 text-black45 font-weight-semibold mb-0">{{ displaySubtitle }}</p>
        </div>
        <div v-if="completed && typeof totalPrice === 'number'" class="picked-classes mt-2">
          <div class="d-flex align-center mb-1">
            <img alt="" height="10" :src="checkClasses" width="10">
            <span class="ml-1 fs-11 text-primary-800">{{ $t('picked_classes') }}</span>
          </div>
          <p class="mb-0 text-primary-08 fs-14 font-weight-medium">{{ $t('picked_classes_cost') }} <span class="fw-600 text-primary-900">{{ formatPrice(totalPrice) }}{{ currency ? ` ${currency}` : '' }}</span></p>
        </div>
      </div>

    </div>
  </VSheet>
</template>

<style scoped lang="scss">
.badge-circle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 21px;
  border-radius: 9999px;
  background-color: #E1EFFE;
  color: rgba(30, 66, 159, 0.85);
}
.text-gray-600 { color: #4B5563; }
.text-primary-900 { color: #233876; }
.text-primary-800 { color: #1E429F; }
.text-primary-900 { color: #233876; }
.text-primary-08 { color: rgba(35, 56, 118, 0.8);}
.text-black45 { color:rgba(0, 0, 0, 0.45); }
.arrow-btn {
  border: 1px solid #1A56DB;
  min-width: 28px;
  padding: 0;
}
.participant-card {
  border: 1px solid #E5E7EB;
  border-radius: 16px !important;
}

.participant-complated {
  background: #EBF5FF;

  .picked-classes {
    background: #E1EFFE;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 12px;
    border-radius: 8px;
  }
  .arrow-btn {
    border: 1px solid #BDC6E2;
    background: #ebf5ff;
  }

  .badge-circle {
    background:  #C3DDFD;
  }

}
</style>
