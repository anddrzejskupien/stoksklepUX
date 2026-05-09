/**
 * plugins/vuetify.js
 *
 * Framework documentation: https://vuetifyjs.com`
 */

import DateFnsAdapter from '@date-io/date-fns'
import { enGB, pl } from 'date-fns/locale'
import { useI18n } from 'vue-i18n'
// Composables
import { createVuetify } from 'vuetify'
import { VDateInput } from 'vuetify/labs/VDateInput'
import { createVueI18nAdapter } from 'vuetify/locale/adapters/vue-i18n'
import i18n from './i18n'
// Styles
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import '@fontsource/inter/index.css'

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  locale: {
    adapter: createVueI18nAdapter({ i18n, useI18n }),
  },
  date: {
    adapter: DateFnsAdapter,
    locale: {
      en: enGB,
      pl,
    },
  },
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#1a56db',
          error: '#fb2c36',
        },
      },
    },
  },
  display: {
    mobileBreakpoint: 'sm',
  },
  defaults: {
    global: {
      style: {
        fontFamily: 'Inter, sans-serif',
      },
    },
  },
})
