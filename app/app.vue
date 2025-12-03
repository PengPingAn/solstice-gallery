<script setup lang="ts">
import { useHead, onMounted } from "#imports";
import { ref, watch } from "vue";

// 页面标题和图标
const pageTitle = ref("SOLSTICE-GALLERY");
const pageIcon = ref("/logo.png");

// 设定 isLoading，初始为 false，避免页面过快加载时显示 loading
const isLoading = useState("isLoading", () => false);

// 监听变化并动态更新
watch(
  [pageTitle, pageIcon],
  () => {
    useHead({
      title: pageTitle.value,
      link: [{ rel: "icon", type: "image/png", href: pageIcon.value }],
    });
  },
  { immediate: true }
);

// 延时 1 秒后显示 loading
onMounted(() => {
  const timeout = setTimeout(() => {
    isLoading.value = true;
  }, 100); // 1 秒后才显示 loading

  // 页面加载完成后清除定时器，关闭 loading
  isLoading.value = false; // 页面完成加载后，关闭 loading
  clearTimeout(timeout);
});
</script>

<template>
  <div>
    <UApp>
      <NuxtPage />
      <Loading v-if="isLoading" />
    </UApp>
  </div>
</template>
