/**
 * main.js
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Composables
import { createApp } from 'vue'

// Plugins
import { registerPlugins } from '@/plugins'

// Components
import App from './App.vue'

// Styles
import 'unfonts.css'
import '@/styles/overrides.scss'
import '@/styles/classes.scss'

const app = createApp(App)

registerPlugins(app)

app.mount('#app')
