<script setup>
  defineProps({
    buttonText: {
      type: String,
      required: true,
    },
    buttonStyle: {
      type: String,
      default: '',
    },
    onAction: {
      type: Function,
      required: true,
    },
  })

  function handleAction () {
    onAction()
  }

</script>

<template>
  <div class="toast-with-action">
    <div class="toast-content">
      <slot />
    </div>
    <button
      class="toast-button"
      :style="buttonStyle"
      @click="onAction"
    >
      {{ buttonText }}
    </button>
  </div>
</template>

<style scoped lang="scss">

.toast-icon {
  display: flex;
  align-items: center;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.toast-text {
  flex: 1;
  font-size: 14px;
  line-height: normal;
}

.toast-title {
  font-weight: 600;
}

.toast-message {
  margin: 0;
  font-size: 0.875rem;
  color: inherit;
  opacity: 0.9;
}

.toast-button {
  padding: 0.5rem 1rem;
  background-color: #1976d2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: background-color 0.2s;
  flex-shrink: 0;

  &:hover {
    background-color: #1565c0;
  }

  &:active {
    background-color: #0d47a1;
  }
}
</style>
