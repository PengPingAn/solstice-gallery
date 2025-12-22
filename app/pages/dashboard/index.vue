<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  requiresAuth: true,
})

/* KPI 数据 */
const stats = [
  { title: '图片总数', value: 1200, icon: 'tdesign:image-1', color: 'emerald' },
  { title: '最近同步', value: 5, icon: 'fluent:image-sparkle-24-regular', color: 'sky' },
  {
    title: '存储空间',
    value: '2.3 GB',
    icon: 'iconoir:database-restore',
    color: 'violet',
  },
  { title: '访问次数', value: 1280, icon: 'uil:statistics', color: 'orange' },
]

/* 年度热力图数据 */
const heatmapData = {
  '2025-12-11 00:00:00': 3,
  '2025-12-13 00:00:00': 1,
  '2025-12-14 00:00:00': 1,
  '2025-12-15 00:00:00': 11,
  '2025-12-16 00:00:00': 1,
  '2025-12-17 00:00:00': 3,
}

/* 活跃时间段 */
const hourlyActivity = Array.from({ length: 24 }).map((_, i) => ({
  hour: `${i}`,
  count: Math.floor(Math.random() * 10),
}))

/* 照片质量 */
const qualityStats = [
  { title: '有 EXIF 信息', value: '95%', icon: 'mdi:camera' },
  { title: '含地理位置', value: '78%', icon: 'mdi:map-marker' },
]

/* 服务器信息示例 */
const serverInfo = ref({
  os: '',
  cpu: '',
  memory: '',
  disk: '',
  uptime: '',
  nodeVersion: '',
  nuxtVersion: '',
})

const $colorMap: Record<string, string> = {
  emerald: '#22c55e',
  sky: '#0ea5e9',
  violet: '#8b5cf6',
  orange: '#f97316',
}

const recentActivities = [
  {
    id: 1,
    type: 'like',
    title: '有人点赞了你的图片',
    description: '《日落海滩》收到 1 个赞',
    time: '2025-12-18 09:10:00',
  },
  {
    id: 2,
    type: 'sync',
    title: '图片同步完成',
    description: '成功同步 12 张图片',
    time: '2025-12-18 08:40:00',
  },
  {
    id: 3,
    type: 'view',
    title: '图片被浏览',
    description: '《城市夜景》被查看 23 次',
    time: '2025-12-17 22:10:00',
  },
  {
    id: 4,
    type: 'system',
    title: '系统维护完成',
    description: '服务器运行状态正常',
    time: '2025-12-17 21:00:00',
  },
]

onMounted(async () => {
  const response: any = await $fetch('/api/system-info')
  serverInfo.value = response.data
})
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-3xl font-bold animate-card" style="animation-delay: 0ms">Dashboard</h1>
    <p class="text-sm text-gray-400 animate-card" style="animation-delay: 50ms">
      这里获取到图库的一些运行信息
    </p>

    <div class="flex flex-col xl:flex-row gap-6">
      <!-- 左侧 -->
      <div class="flex-1 space-y-4">
        <!-- 服务器信息 -->
        <UCard class="rounded-sm animate-card" style="animation-delay: 100ms">
          <p class="font-medium">服务器信息</p>
          <div class="grid grid-cols-2 gap-4 mt-2 text-sm text-gray-700 dark:text-gray-300">
            <div>
              操作系统:
              <Tag class="mt-0" size="sm" radius="sm" color="text-gray-500">{{
                serverInfo.os
              }}</Tag>
            </div>
            <div>
              CPU: <Tag size="sm" radius="sm" color="text-gray-500">{{ serverInfo.cpu }}</Tag>
            </div>
            <div>
              内存: <Tag size="sm" radius="sm" color="text-gray-500">{{ serverInfo.memory }}</Tag>
            </div>
            <div>
              磁盘: <Tag size="sm" radius="sm" color="text-gray-500">{{ serverInfo.disk }}</Tag>
            </div>
            <div>
              运行时长:
              <Tag size="sm" radius="sm" color="text-gray-500">{{ serverInfo.uptime }}</Tag>
            </div>
            <div>
              Node.js:
              <Tag size="sm" radius="sm" color="text-gray-500">{{ serverInfo.nodeVersion }}</Tag>
            </div>
            <div>
              Nuxt 版本:
              <Tag size="sm" radius="sm" color="text-gray-500">{{ serverInfo.nuxtVersion }}</Tag>
            </div>
          </div>
        </UCard>

        <!-- 年度热力图 -->
        <UCard class="rounded-sm animate-card" style="animation-delay: 150ms">
          <p class="font-medium">图片同步热力图</p>
          <GitHubHeatmap :data="heatmapData" :is-fly="false" />
        </UCard>

        <!-- 活跃时间段 -->
        <UCard class="rounded-sm animate-card" style="animation-delay: 200ms">
          <p class="font-medium">活跃时间段</p>
          <div class="flex items-end h-24 gap-1 mt-2">
            <div
              v-for="h in hourlyActivity"
              :key="h.hour"
              class="flex-1 bg-sky-400 dark:bg-sky-600 rounded-sm"
              :style="{ height: h.count * 8 + 'px' }"
              :title="`${h.hour} 点: ${h.count} 张`"
            />
          </div>
          <div class="flex justify-between text-xs text-gray-400 mt-1">
            <span v-for="h in hourlyActivity" :key="h.hour" class="flex-1 text-center">{{
              h.hour
            }}</span>
          </div>
        </UCard>
      </div>

      <!-- 右侧 -->
      <div class="min-w-[350px] space-y-4">
        <!-- KPI 卡片 -->
        <UCard
          v-for="(item, index) in stats"
          :key="item.title"
          class="rounded-sm p-4 flex flex-col gap-2 animate-card"
          :style="{ animationDelay: index * 100 + 250 + 'ms' }"
        >
          <div class="flex items-center justify-between">
            <div class="flex flex-col gap-1">
              <p class="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                {{ item.title }}
              </p>
              <p class="text-3xl font-bold" :style="{ color: $colorMap[item.color] || '#22c55e' }">
                {{ item.value }}
              </p>
            </div>
            <div
              class="flex items-center justify-center rounded-lg bg-white/70 dark:bg-black/30 backdrop-blur-sm p-3"
              :style="{ color: $colorMap[item.color] || '#22c55e' }"
            >
              <UIcon class="size-7" :name="item.icon" />
            </div>
          </div>
        </UCard>

        <!-- 照片质量概览 -->
        <UCard class="rounded-sm space-y-2 p-4 animate-card" style="animation-delay: 650ms">
          <p class="font-medium">照片质量概览</p>
          <div
            v-for="q in qualityStats"
            :key="q.title"
            class="flex justify-between items-center text-sm"
          >
            <div class="flex items-center gap-2">
              <UIcon :name="q.icon" class="size-5 text-sky-500" />
              <span>{{ q.title }}</span>
            </div>
            <span class="font-bold">{{ q.value }}</span>
          </div>
        </UCard>
      </div>
    </div>

    <!-- 最近活动 -->
    <UCard class="rounded-sm mt-4 animate-card" style="animation-delay: 700ms">
      <div class="mb-2">
        <p class="font-medium">最近的活动</p>
        <p class="text-xs text-gray-400">仅展示近一个月的信息</p>
      </div>

      <RecentActivity :list="recentActivities" />
    </UCard>
  </div>
</template>

<style scoped>
@keyframes cardFadeInUp {
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-card {
  opacity: 0;
  animation: cardFadeInUp 0.4s forwards;
}
</style>
