<script setup lang="ts">
defineProps<{
  isMobile: boolean;
  drawerOpen: boolean;
}>();

const emit = defineEmits<{
  close: [];
  toggleDrawer: [];
}>();
</script>

<template>
  <!-- 顶部控制栏 -->
  <div
    class="pointer-events-none absolute top-4 right-4 left-4 z-30 flex items-center justify-between"
    style="opacity: 1"
  >
    <div class="flex w-full md:justify-end justify-between">
      <!-- 移动端信息按钮 -->
      <button
        v-if="isMobile"
        type="button"
        class="bg-material-ultra-thick pointer-events-auto flex size-8 items-center justify-center bg-neutral-800 rounded-full text-white backdrop-blur-2xl duration-200 hover:bg-black/20 focus:outline-none focus-visible:outline-none"
        @click.stop="$emit('toggleDrawer')"
        title="查看详情"
      >
        <UIcon name="material-symbols:info-outline" class="text-lg"></UIcon>
      </button>

      <div class="flex items-center gap-2">
        <button
          type="button"
          class="bg-material-ultra-thick pointer-events-auto flex size-8 items-center justify-center bg-neutral-800 rounded-full text-white backdrop-blur-2xl duration-200 hover:bg-black/20 focus:outline-none focus-visible:outline-none"
          title="分享照片"
        >
          <UIcon name="iconoir:share-android"></UIcon>
        </button>
        <button
          type="button"
          class="bg-material-ultra-thick pointer-events-auto flex size-8 items-center justify-center bg-neutral-800 rounded-full text-white backdrop-blur-2xl duration-200 hover:bg-black/20"
          @click="$emit('close')"
        >
          <UIcon name="material-symbols:close"></UIcon>
        </button>
      </div>
    </div>
  </div>
</template>
