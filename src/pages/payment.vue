<script setup>
  import { useDisplay } from 'vuetify'
  import CheckGreenIcon from '@/assets/check-circle.svg'
  import ExclamationIcon from '@/assets/exclamation.svg'
  import { useStayConfigStore } from '@/stores/StayConfigStore.js'
  import { useStayStore } from '@/stores/StayStore.js'

  const stayStore = useStayStore()
  const configStore = useStayConfigStore()
  const { mobile } = useDisplay()
</script>

<template>
  <VContainer
    class="d-flex flex-column flex-1 mt-4 mb-12"
    :class="mobile ? 'px-2': ''"
    max-width="990"
  >
    <VCard
      v-if="stayStore.isPaymentCompleted"
      class="my-8 bg-transparent"
      flat
    >
      <VCardText>
        <div class="d-flex flex-column justify-center items-center ga-4 text-center">
          <img
            alt="check"
            class="mx-auto"
            :src="CheckGreenIcon"
            width="32px"
          >
          <div>
            <h2>
              {{ $t('booking_confirmed') }}
            </h2>
            <p>
              {{ $t('booking_confirmed_info') }}
            </p>
          </div>
          <VBtn
            class="mx-auto  text-transform-none"
            color="primary"
            size="large"
            variant="flat"
            @click="$router.push({ name: '/' })"
          >
            {{ $t('back_to_homepage') }}
          </VBtn>
        </div>

      </VCardText>
    </VCard>
    <!--Failed-->
    <VCard
      v-if="stayStore.isPaymentFailed"
      class="my-8 bg-transparent"
      flat
    >
      <VCardText>
        <div class="d-flex flex-column justify-center items-center ga-4 text-center">
          <img
            alt="check"
            class="mx-auto"
            :src="ExclamationIcon"
            width="32px"
          >
          <div>
            <h2>
              {{ $t('payment_failed') }}
            </h2>
            <p>
              {{ $t('payment_failed_info') }}
            </p>
            <p>
              {{ $t('payment_failed_info_2') }}
              <a :href="configStore.CUSTOMER_SERVICE_LINK">
                {{ $t('with_our_customer_service') }}
              </a>
            </p>
          </div>
          <VBtn
            class="mx-auto text-transform-none"
            color="primary"
            size="large"
            variant="flat"

            @click="$router.push({ name: '/' })"
          >
            {{ $t('back_to_payment') }}
          </VBtn>
        </div>

      </VCardText>
    </VCard>

    <VCard
      v-if="stayStore.isPaymentFailed"
      class="my-8 bg-transparent"
      flat
    >
      <VCardText>
        <div class="d-flex flex-column justify-center items-center ga-4 text-center">
          <VIcon class="mx-auto" icon="mdi-progress-clock" size="32" />
          <div>
            <h2>
              {{ $t('payment_in_process') }}
            </h2>
            <p>
              {{ $t('payment_in_process_info') }}
            </p>

          </div>
          <VBtn
            class="mx-auto text-transform-none"
            color="primary"
            size="large"
            variant="flat"
            @click="$router.push({ name: '/payment' })"
          >
            {{ $t('back_to_payment') }}
          </VBtn>
        </div>

      </VCardText>
    </VCard>

    <!--    <VCard-->
    <!--      v-if="stayStore.isRedirecting"-->
    <!--      class="my-8 bg-transparent"-->
    <!--      flat-->
    <!--    >-->
    <!--      <VCardText>-->
    <!--        <div class="d-flex flex-column justify-center items-center ga-4 text-center">-->
    <!--          <VIcon class="mx-auto" icon="mdi-progress-clock" size="32" />-->
    <!--          <div>-->
    <!--            <h2>-->
    <!--              {{ $t('redirecting_to_payment') }}-->
    <!--            </h2>-->
    <!--            <p>-->
    <!--              {{ $t('redirect_info') }}-->
    <!--            </p>-->
    <!--          </div>-->
    <!--          <VBtn-->
    <!--            class="mx-auto text-transform-none"-->
    <!--            color="primary"-->
    <!--            size="large"-->
    <!--            variant="flat"-->
    <!--            @click="$router.push({ name: '/payment' })"-->
    <!--          >-->
    <!--            {{ $t('proceed_to_payment') }}-->
    <!--          </VBtn>-->
    <!--        </div>-->

    <!--      </VCardText>-->
    <!--    </VCard>-->

  </VContainer>

</template>

<style scoped lang="scss">

</style>
