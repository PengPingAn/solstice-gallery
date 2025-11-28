<script setup lang="ts">
defineProps<{
  avatar: string;
  name: string;
}>();

const isDark = computed({
  get() {
    return colorMode.value === "dark";
  },
  set(_isDark) {
    colorMode.preference = _isDark ? "dark" : "light";
  },
});
const colorMode = useColorMode();

onBeforeMount(() => {});
function toggleTheme() {
  colorMode.preference = colorMode.value === "dark" ? "light" : "dark";
}
</script>

<template>
  <div
    class="relative w-full py-4 px-4 md:px-0 flex flex-col items-center md:items-center gap-8 md:gap-4 animate-fade-in"
  >
    <!-- 头像区域 -->
    <div class="relative group shrink-0">
      <!-- 头像本体 -->
      <div
        class="relative w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border border-white/10 ring-1 ring-white/5 shadow-2xl"
      >
        <img
          :src="avatar"
          alt="Avatar"
          class="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-110"
        />
      </div>

      <div class="absolute bottom-2 w-4 h-4 md:right-2">
        <span class="twemoji--camera"></span>
      </div>
    </div>
    <div class="flex flex-col items-center">
      <h1 class="text-xl font-bold tracking-tight text-[var(--font-color)]">
        {{ name }}
      </h1>
      <span>29张照片</span>
      <div>
        <Tag size="md" radius="full">
          <div class="flex gap-2">
            <UPopover
              :content="{
                align: 'center',
                side: 'bottom',
                sideOffset: 8,
              }"
            >
              <UTooltip text="照片筛选">
                <UButton
                  icon="mdi:text-search-variant"
                  color="neutral"
                  variant="subtle"
                  size="sm"
                  class="rounded-full"
                />
              </UTooltip>

              <template #content>
                <Placeholder class="size-48 m-4 inline-flex" />
              </template>
            </UPopover>

            <UPopover
              :content="{
                align: 'center',
                side: 'bottom',
                sideOffset: 8,
              }"
            >
              <UTooltip text="照片排序">
                <UButton
                  icon="solar:sort-vertical-linear"
                  color="neutral"
                  variant="subtle"
                  size="sm"
                  class="rounded-full"
                />
              </UTooltip>

              <template #content>
                <Placeholder class="size-48 m-4 inline-flex">
                  <div>你好</div>
                </Placeholder>
              </template>
            </UPopover>
            <UTooltip text="主题切换">
              <UButton
                :icon="
                  isDark
                    ? 'material-symbols:sunny-outline'
                    : 'material-symbols:dark-mode-outline'
                "
                color="neutral"
                variant="subtle"
                size="sm"
                class="rounded-full"
                @click="toggleTheme"
              />
            </UTooltip>
          </div>
        </Tag>
      </div>
    </div>
    <div class="flex items-center justify-center gap-2 p-1 text-sm">
      <UIcon name="material-symbols:calendar-month-outline-rounded"></UIcon>
      Last Time 2025-11-28
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
    filter: blur(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
    filter: blur(0);
  }
}

.twemoji--camera {
  display: inline-block;
  width: 28px;
  height: 28px;
  background-repeat: no-repeat;
  background-size: 100% 100%;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 36 36'%3E%3Cpath fill='%2366757f' d='M4 5s0-1 1-1h6s1 0 1 1v2H4z' stroke-width='1' stroke='%2366757f'/%3E%3Cpath fill='%2331373d' d='M0 10s0-4 4-4h28s4 0 4 4v18s0 4-4 4H4s-4 0-4-4z' stroke-width='1' stroke='%2331373d'/%3E%3Ccircle cx='21' cy='19' r='10' fill='%23ccd6dd' stroke-width='1' stroke='%23ccd6dd'/%3E%3Ccircle cx='21' cy='19' r='8' fill='%2331373d' stroke-width='1' stroke='%2331373d'/%3E%3Ccircle cx='21' cy='19' r='5' fill='%233b88c3' stroke-width='1' stroke='%233b88c3'/%3E%3Ccircle cx='32.5' cy='9.5' r='1.5' fill='%23fff' stroke-width='1' stroke='%23fff'/%3E%3Cpath fill='%23f5f8fa' d='M12 9.5a1.5 1.5 0 0 1-1.5 1.5h-5a1.5 1.5 0 1 1 0-3h5A1.5 1.5 0 0 1 12 9.5' stroke-width='1' stroke='%23f5f8fa'/%3E%3C/svg%3E");
}
</style>
