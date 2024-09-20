<script setup lang="ts">
import { onDevtoolsClientConnected } from '@nuxt/devtools-kit/iframe-client'
import type { ClientFunctions, ServerFunctions } from '../../src/devtools/rpc'

type Component = {
  slug: string
}

const components = ref<Component[]>([{ slug: 'button' }])
const component = ref<Component | null>({ slug: 'button' })

onDevtoolsClientConnected(async (client) => {
  const rpc = client.devtools.extendClientRpc<ServerFunctions, ClientFunctions>('nuxt/ui/devtools', { })

  // call server RPC functions
  components.value = await rpc.getComponents()
})
</script>

<template>
  <UApp class="h-screen w-full relative">
    <div class="absolute top-0 inset-x-0 flex gap-2 h-[49px] justify-center items-center px-2 border-b border-gray-100" />
    <UButton> Click me </UButton>
    <div v-if="component" class="grow flex justify-center items-center top-[49px] absolute inset-x-0 bottom-96 bg-gray-100">
      <!-- <iframe class="w-full" :src="`/_ui/components/${component.slug}`" /> -->
    </div>
    <div v-if="component" class="absolute bottom-0 inset-x-0 h-96 bg-white" />
  </UApp>
</template>

<style>
@import 'tailwindcss';
@import '@nuxt/ui';
</style>
