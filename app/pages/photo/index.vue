<!-- pages/dashboard/photos.vue -->
<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  alias: '/photos',
  requiresAuth: true,
})

// 直接导入组件，不要用 defineAsyncComponent
import GalleryPhotos from './photoList.vue'
import SyncPhotos from './photoSync.vue'

// 使用组件引用
const components = {
  sync: markRaw(SyncPhotos),
  gallery: markRaw(GalleryPhotos),
}

// 当前选中的组件
const activeKey = ref('sync')
const activeComponent = computed(() => components[activeKey.value])

// 菜单项
const menuItems = [
  { label: '同步图片', key: 'sync', icon: 'i-heroicons-cloud-arrow-up' },
  { label: '图库', key: 'gallery', icon: 'i-heroicons-photo' },
]
</script>

<template>
  <div class="space-y-4 md:space-y-6 animate-fade-in">
    <!-- 头部 -->
    <div
      class="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-0 md:-mb-[2rem]"
    >
      <div>
        <h1 class="text-2xl md:text-3xl font-bold my-1 md:my-2">图库</h1>
        <p class="text-xs md:text-sm text-gray-400">在这里管理你的图片</p>

        <!-- 菜单导航 -->
        <div class="flex flex-wrap gap-2 mt-4">
          <button
            v-for="item in menuItems"
            :key="item.key"
            @click="activeKey = item.key"
            class="flex items-center gap-2 px-4 text-xs py-2 rounded-sm transition-colors cursor-pointer"
            :class="[
              activeKey === item.key
                ? 'bg-zinc-900 text-white shadow dark:bg-sky-900'
                : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300',
            ]"
          >
            <UIcon :name="item.icon" class="w-4 h-4" />
            <span>{{ item.label }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 组件显示区域 - 使用 KeepAlive -->
    <div class="w-full max-w-(--ui-container) mx-auto">
      <Transition name="fade" mode="out-in">
        <KeepAlive>
          <ClientOnly>
            <component :is="activeComponent" />
          </ClientOnly>
        </KeepAlive>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
