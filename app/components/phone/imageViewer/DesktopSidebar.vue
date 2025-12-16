<script setup lang="ts">
import type { PhotoItem } from "./types";

const props = defineProps<{
  currentImage?: PhotoItem;
  scale: number;
  minScale: number;
  maxScale: number;
}>();

const emit = defineEmits<{
  zoomIn: [];
  zoomOut: [];
  zoomToFit: [];
}>();
</script>

<template>
  <!-- 桌面端右侧信息栏 -->
  <div
    class="bg-material-opaque z-30 w-[280px] shrink-0 overflow-y-auto border-l border-white/10 p-4 backdrop-blur-2xl"
    style="opacity: 1"
  >
    <!-- 右侧信息栏内容保持不变 -->
    <div class="space-y-4">
      <div>
        <h2 class="text-lg font-semibold text-white">
          {{ currentImage?.title || "无标题" }}
        </h2>
        <p class="text-sm text-white/60">
          {{ currentImage?.meta || "无设备信息" }}
        </p>
      </div>
      <div class="space-y-2">
        <div class="flex items-center gap-2 text-sm text-white/80">
          <i class="i-mingcute-calendar-line"></i>
          <span>{{ currentImage?.date || "无日期" }}</span>
        </div>
        <div class="flex items-center gap-2 text-sm text-white/80">
          <i class="i-mingcute-location-line"></i>
          <span>{{ currentImage?.address || "无地址" }}</span>
        </div>
        <div class="flex items-center gap-2 text-sm text-white/80">
          <i class="i-mingcute-zoom-in-line"></i>
          <span>缩放: {{ Math.round(scale * 100) }}%</span>
        </div>
      </div>
    </div>

    <!-- 缩放控制面板 -->
    <div class="mt-4 p-3 bg-white/5 rounded-lg">
      <h4 class="mb-2 text-sm font-medium text-white/80">缩放控制</h4>
      <div class="flex items-center justify-between mb-3">
        <button
          type="button"
          class="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          @click="$emit('zoomOut')"
          title="缩小"
        >
          <UIcon name="ic:baseline-remove" />
        </button>
        <div class="text-sm text-white/80">{{ Math.round(scale * 100) }}%</div>
        <button
          type="button"
          class="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          @click="$emit('zoomIn')"
          title="放大"
        >
          <UIcon name="ic:baseline-add" />
        </button>
      </div>
      <div class="w-full bg-white/10 rounded-full h-1.5">
        <div
          class="bg-white h-full rounded-full transition-all duration-200"
          :style="{
            width: `${Math.min(
              100,
              ((scale - minScale) / (maxScale - minScale)) * 100
            )}%`,
          }"
        ></div>
      </div>
      <div class="mt-2 flex justify-between text-xs text-white/60">
        <span>{{ Math.round(minScale * 100) }}%</span>
        <span>{{ Math.round(maxScale * 100) }}%</span>
      </div>
      <button
        v-if="scale !== 1"
        type="button"
        class="w-full mt-3 px-3 py-1.5 text-sm bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors flex items-center justify-center gap-2"
        @click="$emit('zoomToFit')"
      >
        <UIcon name="ic:baseline-fullscreen-exit" />
        适应屏幕
      </button>
    </div>

    <!-- 操作提示 -->
    <div class="mt-4 p-3 bg-white/5 rounded-lg">
      <h4 class="mb-2 text-sm font-medium text-white/80">操作提示</h4>
      <div class="space-y-1 text-xs text-white/60">
        <div class="flex justify-between">
          <span>双击图片</span>
          <span class="text-white/80">放大/恢复</span>
        </div>
        <div class="flex justify-between">
          <span>鼠标滚轮</span>
          <span class="text-white/80">缩放</span>
        </div>
        <div v-if="scale > 1" class="flex justify-between">
          <span>拖拽图片</span>
          <span class="text-white/80">查看细节</span>
        </div>
        <div class="flex justify-between">
          <span>ESC</span>
          <span class="text-white/80">关闭</span>
        </div>
      </div>
    </div>

    <!-- 标签 -->
    <div>
      <h4 class="my-2 text-sm font-medium text-white/80">标签</h4>
      <div class="-ml-1 flex flex-wrap gap-1.5">
        <button
          type="button"
          class="glassmorphic-btn border-accent/20 bg-accent/10 inline-flex cursor-pointer items-center rounded-full border px-2 py-1 text-xs text-white/90 backdrop-blur-sm"
          tabindex="0"
        >
          湖州</button
        ><button
          type="button"
          class="glassmorphic-btn border-accent/20 bg-accent/10 inline-flex cursor-pointer items-center rounded-full border px-2 py-1 text-xs text-white/90 backdrop-blur-sm"
          tabindex="0"
        >
          龙之梦太湖古镇</button
        ><button
          type="button"
          class="glassmorphic-btn border-accent/20 bg-accent/10 inline-flex cursor-pointer items-center rounded-full border px-2 py-1 text-xs text-white/90 backdrop-blur-sm"
          tabindex="0"
        >
          NPC
        </button>
      </div>
    </div>

    <!-- 影调分析 -->
    <div class="text-white/70 mt-4">
      <h4 class="my-2 text-sm font-medium text-white/80">影调分析</h4>
      <div class="grid grid-cols-2 gap-x-2 gap-y-1 text-sm">
        <div class="flex justify-between gap-4 text-sm">
          <span class="text-text-secondary shrink-0">亮度</span>
          <span class="text-text min-w-0 text-right">41%</span>
        </div>
        <div class="flex justify-between gap-4 text-sm">
          <span class="text-text-secondary shrink-0">对比度</span>
          <span class="text-text min-w-0 text-right">49%</span>
        </div>
        <div class="flex justify-between gap-4 text-sm">
          <span class="text-text-secondary shrink-0">阴影占比</span>
          <span class="text-text min-w-0 text-right">47%</span>
        </div>
        <div class="flex justify-between gap-4 text-sm">
          <span class="text-text-secondary shrink-0">高光占比</span>
          <span class="text-text min-w-0 text-right">24%</span>
        </div>
      </div>
    </div>

    <!-- 设备信息 -->
    <div class="text-white/70 mt-4">
      <h4 class="my-2 text-sm font-medium text-white/80">设备信息</h4>
      <div class="space-y-1 text-sm">
        <div class="flex justify-between gap-4 text-sm">
          <span class="text-text-secondary shrink-0">相机</span>
          <span class="text-text min-w-0 text-right">FUJIFILM X-T5</span>
        </div>
        <div class="flex justify-between gap-4 text-sm">
          <span class="text-text-secondary shrink-0">镜头</span>
          <span class="text-text min-w-0 text-right">FUJIFILM Fujinon XF70-300mm</span>
        </div>
        <div class="flex justify-between gap-4 text-sm">
          <span class="text-text-secondary shrink-0">焦距</span>
          <span class="text-text min-w-0 text-right">84mm</span>
        </div>
        <div class="flex justify-between gap-4 text-sm">
          <span class="text-text-secondary shrink-0">光圈</span>
          <span class="text-text min-w-0 text-right">f/4</span>
        </div>
      </div>
    </div>
  </div>
</template>
