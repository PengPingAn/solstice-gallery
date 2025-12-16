<script setup lang="ts">
defineProps<{
  scale: number;
  isMobile: boolean;
}>();

const emit = defineEmits<{
  zoomIn: [];
  zoomOut: [];
  zoomToFit: [];
}>();
</script>

<template>
  <!-- 缩放控制按钮 -->
  <transition
    enter-active-class="transition-all duration-200"
    leave-active-class="transition-all duration-200"
    enter-from-class="opacity-0 scale-90"
    leave-to-class="opacity-0 scale-90"
  >
    <div
      v-if="scale > 1 && !isMobile"
      class="absolute bottom-4 left-18 z-50 -translate-x-1/2 flex items-center gap-1 rounded-full p-1 shadow-lg bg-gray-500/20 text-white backdrop-blur-lg"
    >
      <button
        type="button"
        class="flex size-8 items-center justify-center text-white hover:bg-white/20 rounded-full transition-colors"
        @click.stop="$emit('zoomOut')"
        title="缩小"
      >
        <UIcon name="ic:baseline-remove" />
      </button>
      <button
        type="button"
        class="flex size-8 items-center justify-center text-white hover:bg-white/20 rounded-full transition-colors"
        @click.stop="$emit('zoomToFit')"
        title="适应屏幕"
      >
        <UIcon name="ic:baseline-fullscreen-exit" />
      </button>
      <button
        type="button"
        class="flex size-8 items-center justify-center text-white hover:bg-white/20 rounded-full transition-colors"
        @click.stop="$emit('zoomIn')"
        title="放大"
      >
        <UIcon name="ic:baseline-add" />
      </button>
    </div>
  </transition>

  <!-- 移动端缩放控制 -->
  <div
    v-if="scale > 1 && isMobile"
    class="absolute bottom-1 scale-50 left-1/2 z-50 -translate-x-1/2 flex items-center gap-2 rounded-full p-2 shadow-lg bg-gray-500/40 text-white backdrop-blur-lg"
  >
    <button
      type="button"
      class="flex size-10 items-center justify-center text-white hover:bg-white/20 rounded-full transition-colors"
      @click.stop="$emit('zoomOut')"
      title="缩小"
    >
      <UIcon name="ic:baseline-remove" class="text-xl" />
    </button>
    <button
      type="button"
      class="flex size-10 items-center justify-center text-white hover:bg-white/20 rounded-full transition-colors"
      @click.stop="$emit('zoomToFit')"
      title="适应屏幕"
    >
      <UIcon name="ic:baseline-fullscreen-exit" class="text-xl" />
    </button>
    <button
      type="button"
      class="flex size-10 items-center justify-center text-white hover:bg-white/20 rounded-full transition-colors"
      @click.stop="$emit('zoomIn')"
      title="放大"
    >
      <UIcon name="ic:baseline-add" class="text-xl" />
    </button>
  </div>
</template>
