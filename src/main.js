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

import { loadDefaultsConfig, defaultsConfig } from "@/plugins/defaultsConfig";

const defaultConfigOptions = await loadDefaultsConfig();
console.log(defaultConfigOptions);

const app = createApp(App)

app.use(defaultsConfig, defaultConfigOptions);

registerPlugins(app)

app.mount('#app')
