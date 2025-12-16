<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import type { PhotoItem } from "./types";

const props = defineProps<{
  currentImage?: PhotoItem;
}>();

const DEFAULT_BACKGROUND =
  "data:image/png;base64,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";

// 背景图相关
const backgroundImageUrl = ref<string>(DEFAULT_BACKGROUND);
const backgroundImageLoaded = ref<boolean>(false);
const isTransitioningBackground = ref<boolean>(false);
const previousBackgroundUrl = ref<string>("");
const imageCache = new Map<string, boolean>();

// 预加载图片
const preloadImage = (url: string) => {
  if (!url || imageCache.has(url)) return;

  const img = new Image();
  img.src = url;
  img.onload = () => imageCache.set(url, true);
  img.onerror = () => imageCache.set(url, false);
};

// 切换背景
const switchBackground = (url: string) => {
  if (!url) {
    backgroundImageUrl.value = DEFAULT_BACKGROUND;
    backgroundImageLoaded.value = true;
    return;
  }

  if (backgroundImageUrl.value === url && backgroundImageLoaded.value) return;

  previousBackgroundUrl.value = backgroundImageUrl.value;
  isTransitioningBackground.value = true;

  if (imageCache.has(url) && imageCache.get(url)) {
    backgroundImageUrl.value = url;
    backgroundImageLoaded.value = true;
    isTransitioningBackground.value = false;
    return;
  }

  backgroundImageUrl.value = DEFAULT_BACKGROUND;
  backgroundImageLoaded.value = true;

  const img = new Image();
  img.src = url;
  img.onload = () => {
    imageCache.set(url, true);
    setTimeout(() => {
      backgroundImageUrl.value = url;
      isTransitioningBackground.value = false;
    }, 100);
  };
  img.onerror = () => {
    imageCache.set(url, false);
    backgroundImageUrl.value = DEFAULT_BACKGROUND;
    isTransitioningBackground.value = false;
  };
};

// 监听图片变化
watch(
  () => props.currentImage,
  (newImage) => {
    if (newImage?.url) {
      switchBackground(newImage.url);
    } else {
      backgroundImageUrl.value = DEFAULT_BACKGROUND;
      backgroundImageLoaded.value = true;
    }
  },
  { immediate: true }
);
</script>

<template>
  <!-- 背景模糊层 -->
  <div class="bg-material-opaque fixed inset-0" style="opacity: 1" @click.stop></div>

  <!-- 动态背景图片 -->
  <div class="fixed inset-0" style="opacity: 1">
    <!-- 前一个背景（用于平滑过渡） -->
    <div
      v-if="previousBackgroundUrl && isTransitioningBackground"
      class="h-full w-full size-fill scale-110 bg-cover bg-center absolute inset-0"
      :style="{
        backgroundImage: `url(${previousBackgroundUrl})`,
        filter: 'blur(50px) brightness(0.7) saturate(1.2)',
        transition: 'opacity 0.3s ease-out',
        opacity: 0.5,
      }"
    ></div>

    <!-- 当前背景 -->
    <div
      class="h-full w-full size-fill scale-100 bg-cover bg-center"
      :style="{
        backgroundImage: `url(${backgroundImageUrl})`,
        filter: 'blur(50px) brightness(0.5) saturate(1.2)',
        transition:
          'background-image 0.3s ease-out, filter 0.3s ease-out, opacity 0.3s ease-out',
        opacity: isTransitioningBackground ? 0.5 : 1,
      }"
    ></div>

    <!-- 额外的暗色遮罩层 -->
    <div
      class="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/40"
      style="mix-blend-mode: multiply"
    ></div>
  </div>
</template>
