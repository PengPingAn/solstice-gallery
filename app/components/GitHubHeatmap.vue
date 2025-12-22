<template>
  <div class="heatmap-wrapper">
    <!-- 横向滚动容器 -->
    <div class="heatmap-scroll">
      <!-- 月份和热力图一起滚动 -->
      <div
        class="heatmap-inner"
        :style="{ transform: `scale(${scale})`, transformOrigin: 'top left' }"
      >
        <!-- 月份 -->
        <div class="months">
          <span
            v-for="(month, index) in monthLabels"
            :key="index"
            class="month-label"
            :style="{ left: month.left + 'px' }"
          >
            {{ month.name }}
          </span>
        </div>

        <!-- 热力图 -->
        <div class="heatmap">
          <div v-for="(week, wIndex) in weeks" :key="wIndex" class="week">
            <div
              v-for="day in week"
              :key="day.date"
              class="day"
              :title="`${day.date}: ${day.count} photos`"
              :class="[getColorClass(day.count), isFly ? 'fly-in' : '']"
              :style="isFly ? { '--col-delay': wIndex * 50 + 'ms' } : {}"
            />
          </div>
        </div>

        <div class="legend">
          <span class="legend-label">Less</span>
          <div class="legend-colors">
            <div
              v-for="(level, index) in legendColors"
              :key="index"
              class="legend-box"
              :class="level"
              title="颜色越深，同步越多"
            ></div>
          </div>
          <span class="legend-label">More</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

interface Props {
  data: Record<string, number>;
  isFly: boolean;
}
const props = defineProps<Props>();

const DAY_SIZE = 12;
const GAP = 2;

// 获取最近一年的日期范围（从今天往回推364天，共365天）
const getRecentYearDateRange = () => {
  const endDate = dayjs().endOf("day"); // 今天
  const startDate = endDate.subtract(364, "day"); // 364天前
  return { startDate, endDate };
};

// 所有天 - 固定最近365天
const allDays = computed(() => {
  const { startDate, endDate } = getRecentYearDateRange();

  // 调整开始日期到最近的周日（每周的第一天）
  const adjustedStartDate = startDate.startOf("week");

  const days: { date: string; count: number }[] = [];
  let current = adjustedStartDate;

  // 确保我们显示完整的53周（371天）以包括完整的第一周和最后一周
  while (current.isSameOrBefore(endDate)) {
    const key = current.format("YYYY-MM-DD");
    const dateStr = current.format("YYYY-MM-DD 00:00:00");
    days.push({
      date: key,
      count: props.data[dateStr] || 0,
    });
    current = current.add(1, "day");
  }

  return days;
});

// 每列一周
const weeks = computed(() => {
  const cols: { date: string; count: number }[][] = [];
  for (let i = 0; i < allDays.value.length; i += 7) {
    cols.push(allDays.value.slice(i, i + 7));
  }
  return cols;
});

// GitHub 风格颜色
const getColorClass = (count: number) => {
  if (count === 0) return "bg-gray-200 dark:bg-gray-700";
  if (count < 3) return "bg-green-200 dark:bg-green-800";
  if (count < 5) return "bg-green-400 dark:bg-green-600";
  if (count < 10) return "bg-green-600 dark:bg-green-500";
  return "bg-green-800 dark:bg-green-400";
};

// 缩放适配屏幕
const scale = ref(1);
onMounted(() => {
  const updateScale = () => {
    const containerWidth = window.innerWidth - 32;
    const totalWidth = weeks.value.length * (DAY_SIZE + GAP);
    if (totalWidth > containerWidth) {
      scale.value = containerWidth / totalWidth;
    } else {
      scale.value = 1;
    }
  };

  // updateScale();
  window.addEventListener("resize", updateScale);
});

// 月份标记
const monthLabels = computed(() => {
  const months: { name: string; left: number }[] = [];
  let lastMonth = "";
  weeks.value.forEach((week, wIndex) => {
    const firstDay = week[0];
    if (!firstDay) return;
    const month = dayjs(firstDay.date).format("MMM");
    if (month !== lastMonth) {
      months.push({ name: month, left: wIndex * (DAY_SIZE + GAP) });
      lastMonth = month;
    }
  });
  return months;
});

// 图例颜色
const legendColors = [
  "bg-gray-200 dark:bg-gray-700",
  "bg-green-200 dark:bg-green-800",
  "bg-green-400 dark:bg-green-600",
  "bg-green-600 dark:bg-green-500",
  "bg-green-800 dark:bg-green-400",
];
</script>

<style scoped>
.heatmap-wrapper {
  padding: 16px;
  width: 100%;
  position: relative;
}

/* 横向滚动容器 */
.heatmap-scroll {
  overflow-x: auto;
  overflow-y: hidden;
  max-width: 100%;
  padding-bottom: 28px;
  text-align: center;
}

/* 内部整体，包含月份和热力图 */
.heatmap-inner {
  position: relative;
  display: inline-block; /* 宽度自适应内容 */
}

/* 月份 */
.months {
  position: relative;
  height: 16px;
  margin-bottom: 4px;
}
.month-label {
  position: absolute;
  font-size: 12px;
  color: #fff;
}

/* 热力图列 */
.heatmap {
  display: flex;
  gap: 2px;
}

.week {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.day {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.day:hover {
  outline: 1px solid rgba(27, 31, 35, 0.3);
  outline-offset: -1px;
}

/* 飞入动画 */
.fly-in {
  opacity: 0;
  transform: translateY(-6px);
  animation: flyIn 0.3s forwards;
  animation-delay: var(--col-delay);
}

@keyframes flyIn {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 图例 */
.legend {
  display: flex;
  align-items: center;
  gap: 4px;
  position: absolute;
  right: 0px;
  bottom: -1.5rem;
  font-size: 12px;
}
.legend-colors {
  display: flex;
  gap: 2px;
}
.legend-box {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}
</style>
