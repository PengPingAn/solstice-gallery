<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, onBeforeMount, nextTick } from "vue";

// 定义接口
interface PhotoItem {
  id: string | number;
  url: string;
  title?: string;
  meta?: string;
  date?: string; // 日期格式: YYYY-MM-DD
  address?: string; // 地址
  [key: string]: any;
}

const props = withDefaults(
  defineProps<{
    items: PhotoItem[];
  }>(),
  {
    items: () => [],
  }
);

const windowWidth = ref(0);
const isReady = ref(false);
const isMobile = ref(false);
const MOBILE_BREAKPOINT = 1000; // 最小分辨率，小于这个分辨率就需要将个人信息单独放一行

// 检查是否为移动端
const checkMobile = () => {
  isMobile.value = windowWidth.value < MOBILE_BREAKPOINT;
};

// 更新窗口宽度和移动端状态
const updateWidth = () => {
  windowWidth.value = window.innerWidth;
  checkMobile();
};

// 保持原有的列数算法不变
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
    minColumns: 2,
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

  return calculatedColumns;
});

// 根据设备类型计算列数据
const deviceColumns = computed(() => {
  const count = columnCount.value;

  if (!count || count <= 0 || !props.items || !Array.isArray(props.items)) {
    return [];
  }

  // 简化的列分配逻辑：无论移动端还是桌面端，都按顺序分配
  const cols: PhotoItem[][] = Array.from({ length: count }, () => []);
  props.items.forEach((item, index) => {
    item._index = index;
    const colIndex = index % count;
    cols[colIndex].push(item);
  });

  return cols;
});

// 初始化组件
const initializeComponent = () => {
  updateWidth();

  // 等待DOM完全渲染
  nextTick(() => {
    isReady.value = true;
  });
};

onMounted(async () => {
  initializeComponent();
  window.addEventListener("resize", updateWidth);
});

onBeforeMount(() => {
  windowWidth.value = window.innerWidth;
  checkMobile();
});

onUnmounted(() => {
  window.removeEventListener("resize", updateWidth);
});
</script>

<template>
  <div class="relative">
    <!-- 移动端布局 -->
    <div v-if="isReady && isMobile" class="w-full">
      <!-- 图片列（根据columnCount计算，移动端通常是2列） -->
      <div class="flex w-full">
        <template v-for="(col, colIndex) in deviceColumns" :key="colIndex">
          <div class="flex-1 flex flex-col">
            <div v-for="(item, itemIndex) in col" :key="item.id">
              <CanvasPhotoCard
                :src="item.url"
                :title="item.title"
                :meta="item.meta"
                :delay="colIndex * 100 + itemIndex * 50"
                :address="item.address"
                :date="item.date"
                @click="$emit('image-click', item._index)"
              />
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- 桌面端布局 -->
    <div v-else-if="isReady && !isMobile" class="flex w-full items-start">
      <!-- 所有列正常显示 -->
      <template v-if="deviceColumns.length > 0">
        <div
          v-for="(col, colIndex) in deviceColumns"
          :key="colIndex"
          class="flex-1 flex flex-col"
        >
          <div v-for="(item, itemIndex) in col" :key="item.id">
            <CanvasPhotoCard
              :src="item.url"
              :title="item.title"
              :meta="item.meta"
              :delay="colIndex * 100 + itemIndex * 50"
              :address="item.address"
              :date="item.date"
              @click="$emit('image-click', item._index)"
            />
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.gallery-item {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}
.gallery-enter-active,
.gallery-leave-active {
  transition: opacity 0.5s ease-out, transform 0.5s ease-out;
}
.gallery-enter-from,
.gallery-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}
.gallery-enter-to {
  opacity: 1;
  transform: translateY(0) scale(1);
}
</style>
