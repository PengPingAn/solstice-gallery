<script setup lang="ts">
import {
  computed,
  onMounted,
  onUnmounted,
  ref,
  onBeforeMount,
  nextTick,
  watch,
} from "vue";

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
const profileCardRef = ref<HTMLElement | null>(null);
const showStats = ref(false);

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

// 保持原有的列数算法不变，但针对移动端调整
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

const columnStartIndex = computed(() => {
  const arr = [];
  let total = 0;
  for (const col of deviceColumns.value) {
    arr.push(total);
    total += col.length;
  }
  return arr;
});

// 根据设备类型计算列数据
const deviceColumns = computed(() => {
  const count = columnCount.value;

  if (!count || count <= 0 || !props.items || !Array.isArray(props.items)) {
    return [];
  }

  // 如果是移动端，需要特殊处理：将个人信息卡片单独放一行
  if (isMobile.value) {
    // 移动端：将所有图片均匀分配到列中
    const cols: PhotoItem[][] = Array.from({ length: count }, () => []);
    props.items.forEach((item, index) => {
      item._index = index;
      const colIndex = index % count;
      cols[colIndex].push(item);
    });
    return cols;
  } else {
    // 桌面端：保持原有逻辑，第一列包含个人信息卡片
    const cols: PhotoItem[][] = Array.from({ length: count }, () => []);
    props.items.forEach((item, index) => {
      item._index = index;
      const colIndex = index % count;
      cols[colIndex].push(item);
    });
    return cols;
  }
});

// 视口统计相关功能
const visibleDates = ref<Set<string>>(new Set());
const visibleAddresses = ref<Set<string>>(new Set());

// 标准化日期格式
const normalizeDate = (dateStr: string): string => {
  if (!dateStr) return "";

  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const year = parts[0];
    const month = parts[1].padStart(2, "0");
    const day = parts[2].padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  return dateStr;
};

// 从日期字符串中提取年份和月份
const getYearMonthFromDate = (
  dateStr: string
): { year: number; month: number } | null => {
  const normalized = normalizeDate(dateStr);
  const date = new Date(normalized);

  if (isNaN(date.getTime())) {
    return null;
  }

  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
  };
};

// 计算显示的日期范围文本
const dateRangeText = computed(() => {
  if (visibleDates.value.size === 0) return "";

  const yearMonths: { year: number; month: number }[] = [];

  visibleDates.value.forEach((dateStr) => {
    const yearMonth = getYearMonthFromDate(dateStr);
    if (yearMonth) {
      yearMonths.push(yearMonth);
    }
  });

  if (yearMonths.length === 0) return "";

  let minYear = Infinity,
    minMonth = Infinity;
  let maxYear = -Infinity,
    maxMonth = -Infinity;

  yearMonths.forEach(({ year, month }) => {
    if (year < minYear || (year === minYear && month < minMonth)) {
      minYear = year;
      minMonth = month;
    }
    if (year > maxYear || (year === maxYear && month > maxMonth)) {
      maxYear = year;
      maxMonth = month;
    }
  });

  if (minYear === maxYear) {
    if (minMonth === maxMonth) {
      return `${minMonth}月 ${minYear}`;
    } else {
      return `${minMonth}月 - ${maxMonth}月 ${minYear}`;
    }
  } else {
    return `${minMonth}月 ${minYear} - ${maxMonth}月 ${maxYear}`;
  }
});

// 计算显示的地址文本
const addressText = computed(() => {
  if (visibleAddresses.value.size === 0) return "";
  const addresses = Array.from(visibleAddresses.value).filter(
    (addr) => addr && addr.trim() !== ""
  );

  const maxDisplayAddresses = 3;
  if (addresses.length > maxDisplayAddresses) {
    return `${addresses.slice(0, maxDisplayAddresses).join("、")} 等 ${
      addresses.length
    } 个地点`;
  }

  return addresses.join("、");
});

// 精确的视口检测
const isElementInViewport = (el: HTMLElement): boolean => {
  if (!el || typeof el.getBoundingClientRect !== "function") {
    return false;
  }

  const rect = el.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  const windowWidth = window.innerWidth || document.documentElement.clientWidth;

  // 元素必须至少有一部分在视口内
  const verticalInView = rect.top <= windowHeight && rect.bottom >= 0;
  const horizontalInView = rect.left <= windowWidth && rect.right >= 0;

  // 计算元素在视口中的可见比例
  const elementHeight = rect.height;
  const elementWidth = rect.width;

  let visibleHeight = 0;
  let visibleWidth = 0;

  if (rect.top < 0) {
    visibleHeight = Math.min(rect.bottom, windowHeight);
  } else if (rect.bottom > windowHeight) {
    visibleHeight = Math.min(windowHeight - rect.top, elementHeight);
  } else {
    visibleHeight = elementHeight;
  }

  if (rect.left < 0) {
    visibleWidth = Math.min(rect.right, windowWidth);
  } else if (rect.right > windowWidth) {
    visibleWidth = Math.min(windowWidth - rect.left, elementWidth);
  } else {
    visibleWidth = elementWidth;
  }

  const visibleArea = visibleHeight * visibleWidth;
  const totalArea = elementHeight * elementWidth;
  const visibleRatio = visibleArea / totalArea;

  // 只有当元素至少30%在视口内才认为是可见的
  return verticalInView && horizontalInView && visibleRatio > 0.3;
};

// 检查个人信息卡片是否离开视口
const checkProfileCardVisibility = () => {
  nextTick(() => {
    // 确保在 DOM 更新完成后再执行
    setTimeout(() => {
      if (!profileCardRef.value) return;

      const rect = profileCardRef.value.getBoundingClientRect();

      // 如果个人信息卡片完全离开视口顶部（加上50px的缓冲距离）
      const isProfileCardOutOfView = rect.bottom < -100;

      if (isProfileCardOutOfView && (dateRangeText.value || addressText.value)) {
        showStats.value = true;
      } else {
        showStats.value = false;
      }
    }, 0); // 延迟，确保页面完全渲染
  });
};

// 手动更新可见统计
const updateVisibleStats = () => {
  const newVisibleDates = new Set<string>();
  const newVisibleAddresses = new Set<string>();

  const cards = document.querySelectorAll("[data-photo-card]");
  let visibleCount = 0;

  cards.forEach((card) => {
    if (isElementInViewport(card as HTMLElement)) {
      const date = card.getAttribute("data-date");
      const address = card.getAttribute("data-address");

      if (date) newVisibleDates.add(normalizeDate(date));
      if (address) newVisibleAddresses.add(address);
      visibleCount++;
    }
  });

  visibleDates.value = newVisibleDates;
  visibleAddresses.value = newVisibleAddresses;

  // 更新统计信息后检查是否显示
  // setTimeout(() => {
  checkProfileCardVisibility();
  // }, 300);
};

// 防抖函数
const debounce = (fn: Function, delay: number) => {
  let timeoutId: number;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(null, args), delay);
  };
};

const debouncedUpdate = debounce(() => {
  updateVisibleStats();
  checkProfileCardVisibility();
}, 100);

// 初始化组件
const initializeComponent = () => {
  updateWidth();

  // 等待DOM完全渲染
  nextTick(() => {
    isReady.value = true;

    // 再次等待DOM更新
    nextTick(() => {
      // 初始统计
      updateVisibleStats();
    });
  });
};

// const showDetail = ref(false);
// const currentImageIndex = ref(0);
// const openImageDetail = (index) => {
//   currentImageIndex.value = index;
//   showDetail.value = true;
// };

// // 关闭详情
// const handleCloseDetail = () => {
//   showDetail.value = false;
// };

// const loadImage = () => {
//   return new Promise((resolve) => {
//     setTimeout(() => {
//       resolve("Image loaded");
//     }, 3000); // 延迟 3 秒
//   });
// };

onMounted(async () => {
  // await loadImage();
  initializeComponent();
  window.addEventListener("resize", updateWidth);
  window.addEventListener("scroll", debouncedUpdate);
  window.addEventListener("resize", debouncedUpdate);
});

onBeforeMount(() => {
  windowWidth.value = window.innerWidth;
  checkMobile();
});

onUnmounted(() => {
  window.removeEventListener("resize", updateWidth);
  window.removeEventListener("scroll", debouncedUpdate);
  window.removeEventListener("resize", debouncedUpdate);
});

// 监听数据变化
watch(
  () => props.items,
  () => {
    nextTick(() => {
      setTimeout(() => {
        updateVisibleStats();
      }, 200);
    });
  }
);

// 监听列数变化
watch(columnCount, () => {
  nextTick(() => {
    setTimeout(() => {
      updateVisibleStats();
    }, 300);
  });
});

// 监听统计文本变化，检查是否显示
watch([dateRangeText, addressText], () => {
  // checkProfileCardVisibility();
});
</script>

<template>
  <div class="relative">
    <!-- 统计信息显示在左上角 -->
    <Transition name="stats">
      <div
        v-if="(dateRangeText || addressText) && showStats"
        class="fixed top-4 left-4 z-50 lg:top-6 lg:left-6 flex flex-col gap-1 bg-black/40 backdrop-blur-3xl rounded-xl border border-white/10 px-4 py-2 pb-4 shadow-2xl max-sm:top-2 max-sm:left-2 max-sm:px-3 max-sm:py-1 max-sm:pb-3 max-sm:backdrop-blur-xl max-sm:rounded-lg"
      >
        <div
          v-if="dateRangeText"
          class="flex gap-1 items-center text-white text-3xl font-black leading-normal tracking-wide max-sm:text-lg max-sm:font-semibold max-sm:leading-tight max-sm:tracking-normal"
        >
          <svg
            class="w-6 h-6 mr-1 flex-shrink-0 max-sm:w-4 max-sm:h-4 max-sm:mr-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span>{{ dateRangeText }}</span>
        </div>
        <div
          v-if="addressText"
          class="flex gap-1 items-center text-white text-xl font-black leading-normal tracking-wide max-sm:text-sm max-sm:font-medium max-sm:leading-tight max-sm:tracking-normal"
        >
          <svg
            class="w-5 h-5 mr-1 mt-0.5 flex-shrink-0 max-sm:w-3 max-sm:h-3 max-sm:mr-0.5 max-sm:mt-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span>{{ addressText }}</span>
        </div>
      </div>
    </Transition>

    <!-- 移动端布局 -->
    <div v-if="isReady && isMobile" class="w-full">
      <!-- 个人信息卡片单独一行 -->
      <div ref="profileCardRef" class="personal-info-card h-[17rem] mx-1 mb-4">
        <ProfileCard
          avatar="https://api.dicebear.com/7.x/notionists/svg?seed=Innei"
          name="PEACE-SPACE"
        />
      </div>

      <!-- 图片列（根据columnCount计算，移动端通常是2列） -->
      <div class="flex w-full">
        <template v-for="(col, colIndex) in deviceColumns" :key="colIndex">
          <div class="flex-1 flex flex-col">
            <div
              v-for="(item, itemIndex) in col"
              :key="item.id"
              :data-photo-card="true"
              :data-id="item.id"
              :data-date="item.date"
              :data-address="item.address"
            >
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
      <!-- 第一列特殊处理 -->
      <div class="flex-1 flex flex-col" v-if="deviceColumns.length > 0">
        <!-- 个人信息格子 -->
        <div ref="profileCardRef" class="personal-info-card h-[17rem] mx-1">
          <ProfileCard
            avatar="https://api.dicebear.com/7.x/notionists/svg?seed=Innei"
            name="PEACE-SPACE"
          />
        </div>
        <!-- 第一列的图片 -->
        <transition-group name="gallery" tag="div" class="gallery-grid">
          <div
            v-for="(item, itemIndex) in deviceColumns[0]"
            :key="item.id"
            :data-photo-card="true"
            :data-id="item.id"
            :data-date="item.date"
            :data-address="item.address"
          >
            <CanvasPhotoCard
              :src="item.url"
              :title="item.title"
              :meta="item.meta"
              :delay="itemIndex * 50"
              :address="item.address"
              :date="item.date"
              @click="$emit('image-click', item._index)"
            />
          </div>
        </transition-group>
      </div>

      <!-- 其他列正常显示 -->
      <template v-if="deviceColumns.length > 1">
        <div
          v-for="(col, colIndex) in deviceColumns.slice(1)"
          :key="colIndex + 1"
          class="flex-1 flex flex-col"
        >
          <div
            v-for="(item, itemIndex) in col"
            :key="item.id"
            :data-photo-card="true"
            :data-id="item.id"
            :data-date="item.date"
            :data-address="item.address"
          >
            <CanvasPhotoCard
              :src="item.url"
              :title="item.title"
              :meta="item.meta"
              :delay="(colIndex + 1) * 100 + itemIndex * 50"
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
.stats-enter-active,
.stats-leave-active {
  transition: all 0.3s ease;
}

.stats-enter-from {
  opacity: 0;
  transform: translateX(-40px) translateY(-20px) scale(0.8);
}

.stats-enter-to {
  opacity: 1;
  transform: translateX(0) translateY(0) scale(1);
}

.stats-leave-from {
  opacity: 1;
  transform: translateX(0) translateY(0) scale(1);
}

.stats-leave-to {
  opacity: 0;
  transform: translateX(-40px) translateY(-20px) scale(0.8);
}

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

/* 响应式调整 */
@media (max-width: 768px) {
  .personal-info-card {
    margin-left: 0.25rem;
    margin-right: 0.25rem;
  }
}
</style>
