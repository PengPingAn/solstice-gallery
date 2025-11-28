<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";

const props = defineProps<{
  src: string;
  title?: string;
  meta?: string;
  delay?: number; // 用于交错动画延迟
  address?: string;
  date?: string;
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const containerRef = ref<HTMLDivElement | null>(null);
const isLoading = ref(true);
const isVisible = ref(false); // 控制入场动画

// 核心：Canvas 绘制逻辑
const renderImage = () => {
  if (!canvasRef.value) return;

  const ctx = canvasRef.value.getContext("2d");
  const img = new Image();

  // 允许跨域加载（必须配置图片服务器支持 CORS）
  img.crossOrigin = "Anonymous";
  img.src = props.src;

  img.onload = () => {
    if (!canvasRef.value || !ctx) return;
    // 关键：设置 Canvas 画布大小为图片原始大小，保证 Retina 屏清晰度
    canvasRef.value.width = img.naturalWidth;
    canvasRef.value.height = img.naturalHeight;

    // 绘制图片
    ctx.drawImage(img, 0, 0);
    isLoading.value = false;

    // 图片绘制完成后触发显示的动画
    requestAnimationFrame(() => {
      isVisible.value = true;
    });
  };

  img.onerror = () => {
    isLoading.value = false;
    // 这里可以处理加载失败逻辑
  };
};

let observer: IntersectionObserver | null = null;

onMounted(() => {
  // 懒加载：只有进入视口才开始加载图片并绘制 Canvas
  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        renderImage();
        observer?.disconnect();
      }
    },
    { threshold: 0.1 }
  );

  if (containerRef.value) {
    observer.observe(containerRef.value);
  }
});

onBeforeUnmount(() => {
  observer?.disconnect();
});
</script>

<template>
  <div
    ref="containerRef"
    class="relative m-0.5 group overflow-hidden bg-[#111] select-none transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
    :class="{
      'opacity-0 translate-y-8': !isVisible,
      'opacity-100 translate-y-0': isVisible,
    }"
    :style="{ transitionDelay: `${delay || 0}ms` }"
  >
    <!-- Loading 骨架 -->
    <div v-if="isLoading" class="w-full aspect-[3/4] bg-neutral-900 animate-pulse" />

    <!-- 核心 Canvas -->
    <!-- pointer-events-none 防止部分交互，@contextmenu.prevent 禁止右键 -->
    <canvas
      ref="canvasRef"
      class="w-full h-auto block outline-none"
      @contextmenu.prevent
    />

    <!-- 悬停遮罩层 (Innei 风格) -->
    <div
      class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5"
    >
      <div
        class="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 ease-out"
      >
        <h3 v-if="title" class="text-white font-medium text-sm tracking-wide">
          {{ title }}
        </h3>
        <p
          v-if="meta"
          class="text-neutral-400 text-xs mt-1 font-mono uppercase opacity-80"
        >
          {{ meta }}
        </p>
        <p
          v-if="address"
          class="text-neutral-400 text-xs mt-1 font-mono uppercase opacity-80"
        >
          {{ address }}
        </p>
        <p
          v-if="date"
          class="text-neutral-400 text-xs mt-1 font-mono uppercase opacity-80"
        >
          {{ date }}
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 确保 Canvas 响应式 */
canvas {
  width: 100%;
  height: auto;
  display: block;
}
</style>
