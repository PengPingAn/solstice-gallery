<script setup lang="ts">
defineProps<{
  avatar: string;
  name: string;
  poem: string;
  source: string;
  description: string;
}>();

const userStore = useUserStore();
userStore.initToken();

const clearToken = () => {
  message.show({
    text: `即将退出登录`,
    messageType: "warning",
    duration: 2000,
  });
  userStore.clearToken();
};

const jumpDashboard = () => {
  navigateTo("/dashboard");
};
</script>

<template>
  <div
    class="relative w-full py-20 px-4 md:px-0 flex flex-col items-center md:items-start md:flex-row gap-8 md:gap-12 animate-fade-in"
  >
    <!-- 头像区域 -->
    <div class="relative group shrink-0">
      <!-- 背景光晕 -->
      <div
        class="absolute -inset-4 bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 rounded-full blur-2xl opacity-40 group-hover:opacity-70 transition-opacity duration-700"
      ></div>

      <!-- 头像本体 -->
      <div
        class="relative w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border border-white/10 ring-1 ring-white/5 shadow-2xl"
      >
        <img
          :src="avatar"
          alt="Avatar"
          class="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-110"
        />
      </div>

      <div class="absolute bottom-6 w-4 h-4 md:right-6 right-4">
        <span class="twemoji--camera"></span>
      </div>
    </div>

    <!-- 文本区域 -->
    <div class="text-center md:text-left pt-2 space-y-4 max-w-2xl">
      <div class="flex items-center gap-2">
        <h1
          class="text-3xl md:text-4xl font-bold tracking-tight text-[var(--font-color)]"
        >
          {{ name }}
        </h1>
        <div>
          <img
            height="40"
            loading="lazy"
            width="40"
            src="https://registry.npmmirror.com/@lobehub/fluent-emoji-anim-1/latest/files/assets/1f44b.webp"
            style="flex: 0 0 auto"
            class="m-1"
          />
        </div>
      </div>

      <div>
        <p class="text-lg md:text-xl text-neutral-400 font-light leading-relaxed">
          "{{ poem }}"
        </p>
        <p
          class="text-lg md:text-xl text-neutral-400 font-light leading-relaxed text-right"
        >
          —— {{ source }}
        </p>
        <p class="text-neutral-400 font-light leading-relaxed text-sm">
          {{ description }}
        </p>
      </div>

      <!-- 社交图标/标签 -->
      <div class="flex flex-wrap justify-center md:justify-start gap-3 pt-2">
        <Tag size="md" radius="full">📸 PHOTOGRAPHY</Tag>

        <Tag size="md" radius="full">💻 DEVELOPER</Tag>
      </div>
      <div v-if="userStore.isLogin" class="flex gap-2">
        <UButton
          class="cursor-pointer"
          icon="mage:dashboard-chart-notification"
          size="xs"
          color="primary"
          variant="solid"
          @click="jumpDashboard"
          >控制台</UButton
        >
        <UButton
          class="cursor-pointer"
          icon="basil:login-outline"
          size="xs"
          color="primary"
          variant="solid"
          @click="clearToken"
          >登出</UButton
        >
      </div>
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
  width: 38px;
  height: 38px;
  background-repeat: no-repeat;
  background-size: 100% 100%;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 36 36'%3E%3Cpath fill='%2366757f' d='M4 5s0-1 1-1h6s1 0 1 1v2H4z' stroke-width='1' stroke='%2366757f'/%3E%3Cpath fill='%2331373d' d='M0 10s0-4 4-4h28s4 0 4 4v18s0 4-4 4H4s-4 0-4-4z' stroke-width='1' stroke='%2331373d'/%3E%3Ccircle cx='21' cy='19' r='10' fill='%23ccd6dd' stroke-width='1' stroke='%23ccd6dd'/%3E%3Ccircle cx='21' cy='19' r='8' fill='%2331373d' stroke-width='1' stroke='%2331373d'/%3E%3Ccircle cx='21' cy='19' r='5' fill='%233b88c3' stroke-width='1' stroke='%233b88c3'/%3E%3Ccircle cx='32.5' cy='9.5' r='1.5' fill='%23fff' stroke-width='1' stroke='%23fff'/%3E%3Cpath fill='%23f5f8fa' d='M12 9.5a1.5 1.5 0 0 1-1.5 1.5h-5a1.5 1.5 0 1 1 0-3h5A1.5 1.5 0 0 1 12 9.5' stroke-width='1' stroke='%23f5f8fa'/%3E%3C/svg%3E");
}
</style>
