<script setup lang="ts">
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export interface ActivityItem {
  id: string | number;
  type: "like" | "sync" | "view" | "system";
  title: string;
  description?: string;
  time: string;
}

defineProps<{
  list: ActivityItem[];
}>();

const typeConfig: Record<ActivityItem["type"], { icon: string; color: string }> = {
  like: {
    icon: "mdi:heart-outline",
    color: "#ef4444",
  },
  sync: {
    icon: "mdi:cloud-sync-outline",
    color: "#22c55e",
  },
  view: {
    icon: "mdi:eye-outline",
    color: "#0ea5e9",
  },
  system: {
    icon: "mdi:cog-outline",
    color: "#8b5cf6",
  },
};

const formatTime = (t: string) => {
  return dayjs(t).fromNow();
};
</script>

<template>
  <div class="space-y-3">
    <div
      v-for="(item, index) in list"
      :key="item.id"
      class="activity-item"
      :style="{ animationDelay: index * 80 + 'ms' }"
    >
      <!-- 左侧图标 -->
      <div class="activity-icon" :style="{ color: typeConfig[item.type].color }">
        <UIcon :name="typeConfig[item.type].icon" class="size-5" />
      </div>

      <!-- 内容 -->
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-gray-700 dark:text-gray-200">
          {{ item.title }}
        </p>
        <p v-if="item.description" class="text-xs text-gray-400 truncate">
          {{ item.description }}
        </p>
      </div>

      <!-- 时间 -->
      <span class="text-xs text-gray-400 whitespace-nowrap">
        {{ formatTime(item.time) }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.activity-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.02);
  animation: fadeInUp 0.35s ease forwards;
  opacity: 0;
}

.dark .activity-item {
  background: rgba(255, 255, 255, 0.04);
}

.activity-item:hover {
  background: rgba(0, 0, 0, 0.05);
}

.dark .activity-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

.activity-icon {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.04);
  display: flex;
  align-items: center;
  justify-content: center;
}

.dark .activity-icon {
  background: rgba(255, 255, 255, 0.08);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
