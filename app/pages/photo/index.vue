<!-- pages/dashboard/photos.vue -->
<script setup lang="ts">
import photos from "~/data/photos";

definePageMeta({
  layout: "dashboard",
  alias: "/photos",
  requiresAuth: true,
});
</script>

<template>
  <div class="flex items-center justify-between items-end">
    <div>
      <h1 class="text-3xl font-bold my-2">图库</h1>
      <p class="text-sm text-gray-400">在这里处理你的图片</p>
    </div>
    <div>
      <UButton icon="material-symbols:upload-sharp">上传图片</UButton>
    </div>
  </div>

  <div>
    <MasonryCollection :items="photos" />
  </div>
</template>
