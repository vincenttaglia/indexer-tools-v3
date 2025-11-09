<template>
  <v-tooltip :text="title" location="top">
    <template v-slot:activator="{ props }">
      <div v-bind="props" class="dot" :style="{ '--color': color }"></div>
    </template>
  </v-tooltip>
</template>

<style scoped>
.dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%; 
  box-shadow: 0 0 0 7px transparentize(var(--color), 0.5);
  background-color: var(--color);
  margin-right: 6px;
}
</style>

<script setup>
import { toRefs, computed } from 'vue';
const props = defineProps(['status', 'title']);
const { status } = toRefs(props);
const color = computed(() => {
  if(status.value == null)
    return "#A9A9A9";
  return status.value ? "#228B22": "#D2042D";
});
</script>