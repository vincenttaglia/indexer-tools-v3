<template>
  <tr>
    <td v-if="props.selectable">
      <slot name="selectable"></slot>
    </td>
    <td v-for="(column) in props.columns" v-bind:key="column">
      <slot :name="column.key"></slot>
    </td>
  </tr>
</template>

<script setup>
  import { defineProps } from 'vue';
  const props = defineProps(['columns', 'selectable']);
</script>
