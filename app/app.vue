<script setup lang="ts">
import { useHead } from '#imports'
import { ref, watch } from 'vue'
import { useConfirmDialog } from '~/composables/useConfirmDialog'

const pageTitle = ref('SNAPSTORY')
const pageIcon = ref('/logo.png')

const { open, loading, options, confirm } = useConfirmDialog()

// 监听变化并动态更新
watch(
  [pageTitle, pageIcon],
  () => {
    useHead({
      title: pageTitle.value,
      link: [{ rel: 'icon', type: 'image/png', href: pageIcon.value }],
    })
  },
  { immediate: true }
)
</script>

<template>
  <div>
    <UApp>
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
      <Loading />
      <UModal v-model:open="open" :title="options.title" :ui="{ footer: 'justify-end' }">
        <template #body>
          <div class="text-sm text-gray-600">
            {{ options.content }}
          </div>
        </template>

        <template #footer="{ close }">
          <UButton variant="outline" color="neutral" @click="close">
            {{ options.cancelText ?? '取消' }}
          </UButton>

          <UButton
            :color="options.confirmColor ?? 'primary'"
            :loading="loading"
            @click="confirm(close)"
          >
            {{ options.confirmText ?? '确认' }}
          </UButton>
        </template>
      </UModal>
    </UApp>
  </div>
</template>

<style>
span {
  border: none !important;
}
</style>
