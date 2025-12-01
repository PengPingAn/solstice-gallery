<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";

const props = defineProps<{
  src: string;
  title?: string;
  meta?: string;
  delay?: number;
  address?: string;
  date?: string;
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const containerRef = ref<HTMLDivElement | null>(null);
const isLoading = ref(true);
const isVisible = ref(false);

const renderImage = () => {
  if (!canvasRef.value) return;
  const ctx = canvasRef.value.getContext("2d");
  const img = new Image();
  img.crossOrigin = "Anonymous";
  img.src = props.src;

  img.onload = () => {
    if (!canvasRef.value || !ctx) return;
    canvasRef.value.width = img.naturalWidth;
    canvasRef.value.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);
    isLoading.value = false;

    // 入场动画触发
    requestAnimationFrame(() => {
      isVisible.value = true;
    });
  };

  img.onerror = () => {
    isLoading.value = false;
  };
};

let observer: IntersectionObserver | null = null;
onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        renderImage();
        observer?.disconnect();
      }
    },
    { threshold: 0.1 }
  );
  if (containerRef.value) observer.observe(containerRef.value);
});
onBeforeUnmount(() => observer?.disconnect());
</script>

<template>
  <div
    ref="containerRef"
    class="relative m-0.5 group overflow-hidden bg-[#111] select-none"
    :style="{
      transition: 'transform 0.6s cubic-bezier(0.34,1.56,0.64,1), opacity 0.6s ease-out',
      transitionDelay: `${props.delay || 0}ms`,
      transform: isVisible ? 'translateY(0px) scale(1)' : 'translateY(30px) scale(0.9)',
      opacity: isVisible ? 1 : 0,
    }"
  >
    <div v-if="isLoading" class="w-full aspect-[3/4] bg-neutral-900 animate-pulse"></div>

    <canvas
      ref="canvasRef"
      class="w-full h-auto block outline-none"
      @contextmenu.prevent
    />

    <div
      class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5"
    >
      <div
        class="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 ease-out"
      >
        <h3 v-if="props.title" class="text-white font-medium text-sm tracking-wide">
          {{ props.title }}
        </h3>
        <p
          v-if="props.meta"
          class="text-neutral-400 text-xs mt-1 font-mono uppercase opacity-80"
        >
          {{ props.meta }}
        </p>
        <p
          v-if="props.address"
          class="text-neutral-400 text-xs mt-1 font-mono uppercase opacity-80"
        >
          {{ props.address }}
        </p>
        <p
          v-if="props.date"
          class="text-neutral-400 text-xs mt-1 font-mono uppercase opacity-80"
        >
          {{ props.date }}
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
canvas {
  width: 100%;
  height: auto;
  display: block;
}
</style>
