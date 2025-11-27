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

// 响应式断点计算
const columnCount = computed(() => {
  if (windowWidth.value <= 0) return 5;
  const containerWidth = windowWidth.value;

  // 配置参数
  const config = {
    // 容器设置
    containerPadding: 32,
    gapSize: 24,

    // 列宽范围
    minColumnWidth: 180,
    idealColumnWidth: 240,
    maxColumnWidth: 300,

    // 列数限制
    minColumns: 1,
    maxColumns: 8,

    // 设备特定调整
    mobileBreakpoint: 640,
    tabletBreakpoint: 1024,
    desktopBreakpoint: 1280,

    // 性能考虑
    performanceMaxColumns: 8,
  };

  // 计算可用宽度
  const availableWidth = containerWidth - config.containerPadding * 2;

  // 基于理想列宽计算基础列数
  let baseColumns;
  if (containerWidth < config.mobileBreakpoint) {
    baseColumns = 1;
  } else if (containerWidth < config.tabletBreakpoint) {
    baseColumns = Math.floor(availableWidth / config.idealColumnWidth);
  } else {
    // 修复：使用理想列宽而不是最小列宽来计算
    baseColumns = Math.floor(
      (availableWidth + config.gapSize) / (config.idealColumnWidth + config.gapSize)
    );
  }
  console.log(baseColumns);
  // 应用列数限制
  let calculatedColumns = Math.max(
    config.minColumns,
    Math.min(config.maxColumns, baseColumns)
  );

  // 计算当前配置的实际列宽
  const calculateColumnWidth = (columns: number) => {
    return (availableWidth - (columns - 1) * config.gapSize) / columns;
  };

  // 优化算法：寻找最佳列数配置
  const evaluateConfiguration = (columns: number) => {
    const width = calculateColumnWidth(columns);

    // 检查是否满足最小和最大宽度约束
    if (width < config.minColumnWidth) return { columns, width, score: -1 };
    if (width > config.maxColumnWidth) return { columns, width, score: -1 };

    // 计算与理想宽度的接近程度
    const utilization = width / config.idealColumnWidth;
    const efficiency = 1 - Math.abs(1 - utilization);

    // 添加轻微偏好更多列数的倾向（在合理范围内）
    const columnPreference = (columns - config.minColumns) * 0.02;

    return {
      columns,
      width,
      score: efficiency + columnPreference,
      utilization,
    };
  };

  // 测试附近可能的列数配置
  const possibleConfigs = [];
  const minTestColumns = Math.max(config.minColumns, calculatedColumns - 1);
  const maxTestColumns = Math.min(config.maxColumns, calculatedColumns + 2);

  for (let cols = minTestColumns; cols <= maxTestColumns; cols++) {
    const configResult = evaluateConfiguration(cols);
    if (configResult.score >= 0) {
      possibleConfigs.push(configResult);
    }
  }

  // 如果找到有效配置，选择得分最高的
  if (possibleConfigs.length > 0) {
    const bestConfig = possibleConfigs.reduce((best, current) =>
      current.score > best.score ? current : best
    );
    calculatedColumns = bestConfig.columns;
  }

  // 性能优化：在大屏幕上限制最大列数
  if (containerWidth > config.desktopBreakpoint) {
    calculatedColumns = Math.min(calculatedColumns, config.performanceMaxColumns);
  }

  // 特殊情况处理：超宽屏幕直接推荐更多列
  if (containerWidth > 1920 && calculatedColumns < 5) {
    // 检查5列是否可行
    const fiveColWidth = calculateColumnWidth(5);
    if (fiveColWidth >= config.minColumnWidth) {
      calculatedColumns = 5;
    }
  }

  console.log("计算列数:", calculatedColumns, "窗口宽度:", containerWidth);
  return calculatedColumns;
});

const isReady = ref(false);
// 将数据分配到不同的列 (Round Robin 算法)
const columns = computed(() => {
  const cols: PhotoItem[][] = Array.from({ length: columnCount.value }, () => []);
  props.items.forEach((item, index) => {
    cols[index % columnCount.value].push(item);
  });
  console.log(isReady.value);
  isReady.value = true;
  return cols;
});

// 更新窗口宽度
const updateWidth = () => {
  windowWidth.value = window.innerWidth;
};

onMounted(() => {
  updateWidth();
  window.addEventListener("resize", updateWidth); // 监听窗口大小变化
});

onBeforeMount(() => {
  windowWidth.value = window.innerWidth;
});

onUnmounted(() => {
  window.removeEventListener("resize", updateWidth); // 解除监听
});
</script>

<template>
  <div class="flex w-full items-start">
    <!-- 第一列特殊处理 -->
    <div class="flex-1 flex flex-col" v-if="isReady">
      <!-- 个人信息格子 -->
      <div class="personal-info-card h-[15rem] m-1">这里是个人信息</div>
      <!-- 第一列的图片（从原本的位置开始） -->
      <CanvasPhotoCard
        v-for="(item, itemIndex) in columns[0]"
        :key="item.id"
        :src="item.url"
        :title="item.title"
        :meta="item.meta"
        :delay="itemIndex * 50"
      />
    </div>

    <!-- 其他列正常显示 -->
    <div
      v-for="(col, colIndex) in columns.slice(1)"
      :key="colIndex + 1"
      class="flex-1 flex flex-col"
    >
      <CanvasPhotoCard
        v-for="(item, itemIndex) in col"
        :key="item.id"
        :src="item.url"
        :title="item.title"
        :meta="item.meta"
        :delay="(colIndex + 1) * 100 + itemIndex * 50"
      />
    </div>
  </div>
</template>
