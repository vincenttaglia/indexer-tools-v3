/**
 * main.js
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Components
import App from './App.vue'

// Composables
import { createApp } from 'vue'

// Plugins
import { registerPlugins } from '@/plugins'

import JsonCSV from 'vue-json-csv';

const app = createApp(App)

registerPlugins(app)

app.component('downloadCsv', JsonCSV);

app.mount('#app')
