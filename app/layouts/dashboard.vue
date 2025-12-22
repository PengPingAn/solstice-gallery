<template>
  <UHeader mode="drawer">
    <!-- 左侧：Logo + Menu -->
    <template #title>
      <div class="flex items-center gap-4">
        <span class="font-semibold whitespace-nowrap"> SOLSTICE-GALLERY </span>

        <!-- 桌面端显示，移动端隐藏 -->
        <UNavigationMenu
          arrow
          :items="itemsWithActive"
          content-orientation="vertical"
          class="-mx-2.5 hidden lg:flex"
        />
      </div>
    </template>

    <!-- 右侧 -->
    <template #right>
      <UColorModeButton />

      <UTooltip text="Open on GitHub" :kbds="['meta', 'G']">
        <UButton
          color="neutral"
          variant="ghost"
          to="https://github.com/nuxt/ui"
          target="_blank"
          icon="i-simple-icons-github"
          aria-label="GitHub"
        />
      </UTooltip>
      <div class="mx-3 w-px h-8 bg-gray-300"></div>
      <div class="items-center gap-3 hidden lg:flex">
        <!-- Avatar 区域 -->
        <div class="relative group cursor-pointer" @click="outLogin">
          <UAvatar src="https://github.com/benjamincanac.png" size="sm" />

          <!-- Hover Overlay（只覆盖头像） -->
          <div
            class="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <UIcon name="mdi:logout" class="text-white text-lg" />
          </div>
        </div>

        <!-- 文本区域（不受 hover 影响） -->
        <div class="leading-tight">
          <div class="font-medium text-xs">PEACE-SPACE</div>
        </div>
      </div>
    </template>

    <!-- 抽屉菜单（移动端） -->
    <template #body>
      <UNavigationMenu
        arrow
        :items="itemsWithActive"
        content-orientation="vertical"
        class="-mx-2.5"
        highlight
        highlight-color="primary"
        orientation="horizontal"
      />
    </template>
  </UHeader>

  <div class="w-full max-w-(--ui-container) mx-auto px-4 sm:px-6 lg:px-8 my-24">
    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
import { useRoute } from '#app'
import type { NavigationMenuItem } from '@nuxt/ui'
import { computed } from 'vue'

const route = useRoute()
const message = useMessage()
const userStore = useUserStore()

// 原始菜单
const rawItems: NavigationMenuItem[] = [
  {
    label: 'Dashboard',
    to: '/dashboard',
    icon: 'mage:dashboard-chart-notification',
  },
  {
    label: 'Photos',
    icon: 'mdi:image-filter-hdr-outline',
    onClick: (event: MouseEvent) => {
      event.preventDefault()
      // 阻止默认行为
    },
    children: [
      {
        label: '相册',
        icon: 'material-symbols-light:settings-heart-outline',
        to: '/album',
      },
      {
        label: '图库',
        icon: 'material-symbols:database',
        to: '/photos',
      },
    ],
  },
  {
    label: 'Settings',
    icon: 'mingcute:settings-6-line',
    onClick: (event: MouseEvent) => {
      event.preventDefault()
      // 阻止默认行为
    },
    children: [
      {
        label: '基础设置',
        icon: 'material-symbols-light:settings-heart-outline',
        to: '/settings',
        onClick: (event: MouseEvent) => {
          event.preventDefault()
        },
      },
      {
        label: '储存设置',
        icon: 'material-symbols:database',
        to: '/storageSetting',
      },
    ],
  },
  {
    label: 'Log',
    to: '/log',
    icon: 'mdi-light:note-text',
  },
]

// 当前路由路径
const currentPath = computed(() => route.path)

// 给每个菜单计算 active 属性（父菜单根据子菜单高亮）
const itemsWithActive = computed(() =>
  rawItems.map((item) => {
    if (item.children) {
      return {
        ...item,
        active: item.children.some((child) => child.to && child.to === currentPath.value),
      }
    }
    return {
      ...item,
      active: item.to === currentPath.value,
    }
  })
)

const outLogin = () => {
  message.show({
    text: `即将退出登录`,
    messageType: 'warning',
    duration: 2000,
  })
}
</script>
