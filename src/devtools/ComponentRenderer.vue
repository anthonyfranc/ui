<script setup lang="ts">
const props = defineProps<{
  slug: string
}>()
</script>

<template>
  <div class="nuxt-ui-component-renderer">
    <UButton> Click me! </UButton>
  </div>
</template>

<style>
.nuxt-ui-component-renderer {
  display: flex;
  justify-content: center;
  align-items: center
}
</style>
