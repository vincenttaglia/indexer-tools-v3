/**
 * Performance optimization utilities for handling large datasets
 */

// Debounce function to limit how often a function can be called
export function debounce(func, wait, immediate = false) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
}

// Throttle function to limit function execution rate
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Virtual scrolling helper for large datasets
export class VirtualScroller {
  constructor(itemHeight = 50, containerHeight = 600) {
    this.itemHeight = itemHeight;
    this.containerHeight = containerHeight;
    this.visibleItems = Math.ceil(containerHeight / itemHeight) + 2; // Buffer of 2 items
  }

  // Calculate which items should be visible
  getVisibleRange(scrollTop, totalItems) {
    const startIndex = Math.floor(scrollTop / this.itemHeight);
    const endIndex = Math.min(startIndex + this.visibleItems, totalItems);

    return {
      start: Math.max(0, startIndex - 1), // Buffer
      end: endIndex + 1,
      offsetY: startIndex * this.itemHeight
    };
  }

  // Get items for current viewport
  getVisibleItems(items, scrollTop) {
    const range = this.getVisibleRange(scrollTop, items.length);
    return {
      items: items.slice(range.start, range.end),
      startIndex: range.start,
      endIndex: range.end,
      offsetY: range.offsetY
    };
  }
}

// Memory management utilities
export class MemoryManager {
  constructor(maxCacheSize = 1000) {
    this.maxCacheSize = maxCacheSize;
    this.cache = new Map();
    this.accessOrder = [];
  }

  // Add item to cache with LRU eviction
  set(key, value) {
    if (this.cache.has(key)) {
      // Update access order
      this.accessOrder = this.accessOrder.filter(k => k !== key);
    } else if (this.cache.size >= this.maxCacheSize) {
      // Evict least recently used item
      const lruKey = this.accessOrder.shift();
      if (lruKey) {
        this.cache.delete(lruKey);
      }
    }

    this.cache.set(key, value);
    this.accessOrder.push(key);
  }

  // Get item from cache and update access order
  get(key) {
    if (this.cache.has(key)) {
      // Move to end of access order (most recently used)
      this.accessOrder = this.accessOrder.filter(k => k !== key);
      this.accessOrder.push(key);
      return this.cache.get(key);
    }
    return undefined;
  }

  // Clear cache
  clear() {
    this.cache.clear();
    this.accessOrder = [];
  }

  // Get cache statistics
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      hitRate: this.cache.size / this.maxCacheSize
    };
  }
}

// Batch processing utilities
export class BatchProcessor {
  constructor(batchSize = 100, delay = 16) { // 16ms = 60fps
    this.batchSize = batchSize;
    this.delay = delay;
    this.queue = [];
    this.processing = false;
  }

  // Add items to processing queue
  add(items) {
    this.queue.push(...items);
    if (!this.processing) {
      this.process();
    }
  }

  // Process items in batches
  async process() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, this.batchSize);

      // Process batch
      await this.processBatch(batch);

      // Yield control to browser if there are more items
      if (this.queue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, this.delay));
      }
    }

    this.processing = false;
  }

  // Override this method to implement custom batch processing
  async processBatch(batch) {
    // Default implementation - override in subclass
    console.log(`Processing batch of ${batch.length} items`);
  }
}

// Performance monitoring utilities
export class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.startTime = performance.now();
  }

  // Start timing an operation
  startTimer(operation) {
    this.metrics.set(operation, {
      start: performance.now(),
      end: null,
      duration: null
    });
  }

  // End timing an operation
  endTimer(operation) {
    const metric = this.metrics.get(operation);
    if (metric) {
      metric.end = performance.now();
      metric.duration = metric.end - metric.start;
    }
  }

  // Get performance metrics
  getMetrics() {
    const results = {};
    for (const [operation, metric] of this.metrics) {
      results[operation] = {
        duration: metric.duration,
        start: metric.start,
        end: metric.end
      };
    }
    return results;
  }

  // Get total runtime
  getTotalRuntime() {
    return performance.now() - this.startTime;
  }

  // Reset metrics
  reset() {
    this.metrics.clear();
    this.startTime = performance.now();
  }
}

// Web Worker utilities for heavy computations
export class WorkerManager {
  constructor(workerScript) {
    this.worker = new Worker(workerScript);
    this.messageId = 0;
    this.pendingMessages = new Map();
  }

  // Send message to worker and return promise
  postMessage(data) {
    return new Promise((resolve, reject) => {
      const id = ++this.messageId;

      this.pendingMessages.set(id, { resolve, reject });

      this.worker.postMessage({
        id,
        data
      });
    });
  }

  // Handle worker responses
  handleMessage(event) {
    const { id, data, error } = event.data;
    const pending = this.pendingMessages.get(id);

    if (pending) {
      this.pendingMessages.delete(id);

      if (error) {
        pending.reject(new Error(error));
      } else {
        pending.resolve(data);
      }
    }
  }

  // Cleanup
  destroy() {
    this.worker.terminate();
    this.pendingMessages.clear();
  }
}

// Export all utilities
export default {
  debounce,
  throttle,
  VirtualScroller,
  MemoryManager,
  BatchProcessor,
  PerformanceMonitor,
  WorkerManager
};
