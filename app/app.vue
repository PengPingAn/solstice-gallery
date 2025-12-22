<script setup lang="ts">
import { useHead } from "#imports";
import { ref, watch } from "vue";

const pageTitle = ref("SOLSTICE-GALLERY");
const pageIcon = ref("/logo.png");

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
</script>

<template>
  <div>
    <UApp>
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
      <Loading />
    </UApp>
  </div>
</template>

<style>
span{
  border:none !important;
  
}
</style>