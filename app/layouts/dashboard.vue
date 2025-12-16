<template>
  <UHeader mode="drawer">
    <!-- 左侧：Logo + Menu -->
    <template #title>
      <div class="flex items-center gap-4">
        <span class="font-semibold whitespace-nowrap"> SOLSTICE-GALLERY </span>

        <!-- 桌面端显示，移动端隐藏 -->
        <UNavigationMenu :items="items" class="hidden lg:flex" />
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
      <UButton @click="clearToken">清空token</UButton>
    </template>

    <!-- 抽屉菜单（移动端） -->
    <template #body>
      <UNavigationMenu :items="items" orientation="vertical" class="-mx-2.5" />
    </template>
  </UHeader>
  <div class="w-full max-w-(--ui-container) mx-auto px-4 sm:px-6 lg:px-8 mt-24">
    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "#app";
import type { NavigationMenuItem } from "@nuxt/ui";

const route = useRoute();
const message = useMessage();
const userStore = useUserStore();

const items = computed<NavigationMenuItem[]>(() => [
  { label: "Dashboard", to: "/dashboard", icon: "mage:dashboard-chart-notification" },
  { label: "Photos", to: "/photos", icon: "mdi:image-filter-hdr-outline" },
  {
    label: "Settings",
    to: "/settings",
    icon: "mingcute:settings-6-line",
  },
]);

const outLogin = () => {
  message.show({
    text: `即将退出登录`,
    messageType: "warning",
    duration: 2000,
  });
};
const clearToken = () => {
  userStore.clearToken();
  console.log(userStore);
};
</script>
