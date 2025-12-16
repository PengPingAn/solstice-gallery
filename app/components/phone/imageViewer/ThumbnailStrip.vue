<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from "vue";
import type { PhotoItem } from "./types";

const props = defineProps<{
  images: PhotoItem[];
  currentIndex: number;
  isMobile: boolean;
}>();

const emit = defineEmits<{
  gotoIndex: [index: number];
}>();

const thumbnailContainer = ref<HTMLElement | null>(null);
const thumbnailWidth = 68; // 缩略图宽度 + 间隙

// 滚动到当前缩略图
const scrollToCurrent = () => {
  if (!thumbnailContainer.value || props.images.length === 0) return;

  nextTick(() => {
    const container = thumbnailContainer.value;
    if (!container) return;

    const containerWidth = container.clientWidth;
    const targetScroll =
      props.currentIndex * thumbnailWidth - containerWidth / 2 + thumbnailWidth / 2;
    const maxScroll = container.scrollWidth - containerWidth;

    container.scrollTo({
      left: Math.max(0, Math.min(targetScroll, maxScroll)),
      behavior: "smooth",
    });
  });
};

// 监听当前索引变化
watch(
  () => props.currentIndex,
  () => {
    scrollToCurrent();
  }
);

// 监听images变化，确保DOM更新后滚动
watch(
  () => props.images.length,
  () => {
    if (props.images.length > 0) {
      nextTick(() => {
        scrollToCurrent();
      });
    }
  }
);

// 简化点击处理
const handleThumbnailClick = (index: number) => {
  emit("gotoIndex", index);
};

// 鼠标滚轮事件
const handleWheel = (e: WheelEvent) => {
  if (!thumbnailContainer.value || props.isMobile) return;
  e.preventDefault();
  thumbnailContainer.value.scrollLeft += e.deltaY;
};

onMounted(() => {
  // 初始滚动到当前缩略图
  setTimeout(() => {
    scrollToCurrent();
  }, 100);
});

// 响应式 - 窗口大小变化时重新计算滚动
const handleResize = () => {
  scrollToCurrent();
};

onMounted(() => {
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
});
</script>

<template>
  <!-- 简化的缩略图区域 -->
  <div
    class="bg-material-medium z-10 shrink-0 backdrop-blur-2xl"
    :class="{ 'order-2': isMobile }"
    style="
      pointer-events: auto;
      box-shadow: 0 -8px 32px color-mix(in srgb, var(--color-accent) 8%, transparent),
        0 -4px 16px color-mix(in srgb, var(--color-accent) 6%, transparent),
        0 -2px 8px rgba(0, 0, 0, 0.1);
    "
  >
    <!-- 渐变背景 -->
    <div
      class="pointer-events-none absolute inset-0"
      style="
        background: linear-gradient(
          to top,
          color-mix(in srgb, var(--color-accent) 5%, transparent),
          transparent
        );
      "
    ></div>

    <!-- 缩略图滚动容器 -->
    <div class="relative p-2">
      <div
        ref="thumbnailContainer"
        class="scrollbar-none relative overflow-x-auto overflow-y-hidden flex gap-2"
        @wheel="handleWheel"
        :style="{
          'scroll-snap-type': isMobile ? 'x mandatory' : 'none',
          'scroll-behavior': 'smooth',
        }"
      >
        <button
          v-for="(image, index) in props.images"
          :key="image.id"
          type="button"
          class="flex-shrink-0 h-16 w-16 overflow-hidden transition-all duration-200 hover:grayscale-0 rounded-lg flex items-center justify-center"
          :class="[
            currentIndex === index
              ? 'ring-2 ring-accent grayscale-0  scale-105'
              : 'grayscale border border-accent/20',
          ]"
          @click="handleThumbnailClick(index)"
          :style="isMobile ? 'scroll-snap-align: center' : ''"
        >
          <img
            :alt="image.title || '缩略图'"
            class="h-full w-full object-cover pointer-events-none"
            :src="image.url"
            loading="lazy"
          />
        </button>
      </div>

      <!-- 滚动指示器（仅移动端） -->
      <template v-if="isMobile">
        <div
          class="absolute top-0 bottom-0 left-0 w-4 bg-gradient-to-r from-black/20 to-transparent pointer-events-none"
        ></div>
        <div
          class="absolute top-0 bottom-0 right-0 w-4 bg-gradient-to-l from-black/20 to-transparent pointer-events-none"
        ></div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.scrollbar-none {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.scrollbar-none::-webkit-scrollbar {
  display: none;
}

/* 确保图片不可点击和拖拽 */
img {
  pointer-events: none;
  user-select: none;
  -webkit-user-drag: none;
}

/* 按钮样式优化 */
button {
  transition: all 0.2s ease;
  outline: none;
}

button:active {
  transform: scale(0.95);
}

/* 移动端优化 */
@media (max-width: 768px) {
  .order-2 {
    order: 2;
  }
}
</style>
