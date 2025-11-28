<!-- components/StatsHeader.vue -->
<template>
  <div
    v-if="stats.dateRange || stats.addresses"
    class="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm py-3 px-6 transition-all duration-300"
    :class="{
      'opacity-100 translate-y-0': isVisible,
      'opacity-0 -translate-y-full': !isVisible,
    }"
  >
    <div class="max-w-7xl mx-auto flex justify-between items-center">
      <!-- 左侧：日期范围 -->
      <div class="flex-1">
        <h2 class="text-lg font-semibold text-gray-900">
          {{ stats.dateRange }}
        </h2>
      </div>

      <!-- 中间：分隔线 -->
      <div class="mx-8 w-px h-6 bg-gray-300"></div>

      <!-- 右侧：地点 -->
      <div class="flex-1">
        <p class="text-base text-gray-700 font-medium">
          {{ stats.addresses }}
        </p>
      </div>

      <!-- 计数徽章 -->
      <div class="ml-6">
        <span
          class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
        >
          {{ stats.count }} 张
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";

// 从 Composable 获取统计信息
const { stats } = useVisibleStats();

const isVisible = ref(false);

// 可选：添加滚动隐藏/显示逻辑
const lastScrollY = ref(0);
const isScrollingDown = ref(false);
const handleScroll = () => {
  const currentScrollY = window.scrollY;
  isScrollingDown.value = currentScrollY > lastScrollY.value && currentScrollY > 100;
  lastScrollY.value = currentScrollY;
};

onMounted(() => {
  setTimeout(() => {
    isVisible.value = true;
    console.log(stats);
  }, 100);
  window.addEventListener("scroll", handleScroll, { passive: true });
});

onBeforeUnmount(() => {
  window.removeEventListener("scroll", handleScroll);
});
</script>

<style scoped>
/* 添加一些微妙的动画 */
.fixed {
  transition: transform 0.3s ease, opacity 0.3s ease;
}
</style>
