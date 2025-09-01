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

// Performance optimizations
import { PerformanceMonitor } from '@/plugins/performanceOptimizations';

// Global performance monitor
window.performanceMonitor = new PerformanceMonitor();

// Performance optimization: Set Vue production mode in production
// if (process.env.NODE_ENV === 'production') {
//   // Disable Vue devtools in production
//   window.__VUE_DEVTOOLS_GLOBAL_HOOK__ = undefined;
// }

// Performance optimization: Set memory limits for large datasets
if (window.performance && window.performance.memory) {
  // Monitor memory usage
  setInterval(() => {
    const memory = window.performance.memory;
    if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.8) {
      console.warn('Memory usage is high. Consider clearing caches.');
      // Trigger garbage collection if available
      if (window.gc) {
        window.gc();
      }
    }
  }, 30000); // Check every 30 seconds
}

const defaultConfigOptions = await loadDefaultsConfig();
console.log(defaultConfigOptions);

const app = createApp(App)

app.use(defaultsConfig, defaultConfigOptions);

registerPlugins(app)

// Performance optimization: Add global error handler
app.config.errorHandler = (err, vm, info) => {
  console.error('Vue Error:', err);
  console.error('Component:', vm);
  console.error('Info:', info);

  // Log performance metrics on error
  if (window.performanceMonitor) {
    console.log('Performance metrics at error:', window.performanceMonitor.getMetrics());
  }
};

// Performance optimization: Add global performance warning
app.config.warnHandler = (msg, vm, trace) => {
  // Only show warnings in development
  if (process.env.NODE_ENV === 'development') {
    console.warn('Vue Warning:', msg);
    console.warn('Component:', vm);
    console.warn('Trace:', trace);
  }
};

app.mount('#app')

// Performance optimization: Monitor long tasks
if ('PerformanceObserver' in window) {
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.duration > 50) { // Tasks longer than 50ms
        console.warn('Long task detected:', entry.duration + 'ms', entry);
      }
    }
  });

  observer.observe({ entryTypes: ['longtask'] });
}
