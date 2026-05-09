<script setup>
  import ClockIcon from '@/assets/clock-outline.svg'

  defineProps({
    message: {
      type: String,
      default: 'Nie masz jeszcze zaplanowanych zajęć w każdym dniu pobytu.',
    },
    closeToast: {
      type: Function,
      default: () => {},
    },
  })

  const emit = defineEmits(['add', 'proceed'])
</script>

<template>
  <div class="incomplete-booking-toast">
    <div class="d-flex align-start mb-4">
      <div class="icon-wrapper mr-3">
        <img class="clock-icon" :src="ClockIcon">
      </div>
      <div class="text-content fs-14 text-gray-900 font-weight-medium pt-1">
        <p>
          {{ message }}
        </p>
        <p class="fs-11 fc-gray">Możesz zostawić część dni bez zajęć, lub wrócić do nich później.

        </p>
      </div>
    </div>

    <div class="d-flex ga-3">
      <button class="action-btn btn-outline" @click="$emit('add')">
        Dodaj zajęcia
      </button>
      <button class="action-btn btn-primary" @click="$emit('proceed')">
        Przejdź dalej
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.incomplete-booking-toast {
  width: 100%;
}

.icon-wrapper {
  background: #FEF2F2;
  border-radius: 12px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  img {
    width: 24px;
    height: 24px;
    filter: brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(2878%) hue-rotate(346deg) brightness(104%) contrast(97%); /* Red color filter */
  }
}

.text-content {
  line-height: 1.5;
  color: #1F2937;
}

.action-btn {
  flex: 1;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;

  &.btn-outline {
    background: white;
    border: 1px solid #1A56DB;
    color: #1A56DB;

    &:hover {
      background: #F3F4F6;
    }
  }

  &.btn-primary {
    background: #1A56DB;
    border: 1px solid #1A56DB;
    color: white;

    &:hover {
      background: #1E429F;
    }
  }
}
</style>
