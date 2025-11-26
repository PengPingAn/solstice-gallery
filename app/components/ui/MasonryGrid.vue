<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import CanvasPhotoCard from "./CanvasPhotoCard.vue";

// 定义接口
interface PhotoItem {
  id: string | number;
  url: string;
  title?: string;
  meta?: string;
  [key: string]: any;
}

const props = defineProps<{
  items: PhotoItem[];
}>();

const windowWidth = ref(0);

// 简单的响应式断点计算
const columnCount = computed(() => {
  if (windowWidth.value < 640) return 1; // 手机
  if (windowWidth.value < 1024) return 2; // 平板
  return 3; // 桌面
});

// 将数据分配到不同的列 (Round Robin 算法)
const columns = computed(() => {
  const cols: PhotoItem[][] = Array.from({ length: columnCount.value }, () => []);
  props.items.forEach((item, index) => {
    cols[index % columnCount.value].push(item);
  });
  return cols;
});

const updateWidth = () => {
  windowWidth.value = window.innerWidth;
};

onMounted(() => {
  updateWidth();
  window.addEventListener("resize", updateWidth);
});

onUnmounted(() => {
  window.removeEventListener("resize", updateWidth);
});
</script>

<template>
  <div class="flex gap-6 w-full items-start">
    <div
      v-for="(col, colIndex) in columns"
      :key="colIndex"
      class="flex-1 flex flex-col gap-6"
    >
      <CanvasPhotoCard
        v-for="(item, itemIndex) in col"
        :key="item.id"
        :src="item.url"
        :title="item.title"
        :meta="item.meta"
        :delay="colIndex * 100 + itemIndex * 50"
      />
    </div>
  </div>
</template>
