<script setup lang="ts">
definePageMeta({
  layout: "dashboard",
  requiresAuth: true,
});
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold my-2">Dashboard</h1>
    <p class="text-sm text-gray-400">你可以在这里获取到图库的一些运行信息</p>
    <div class="my-4 w-full mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <UCard class="rounded-sm">
        <template #header><Placeholder class="h-8" /></template>
        <Placeholder class="h-32" />
        <template #footer><Placeholder class="h-8" /></template>
      </UCard>

      <UCard class="rounded-sm">
        <template #header><Placeholder class="h-8" /></template>
        <Placeholder class="h-32" />
        <template #footer><Placeholder class="h-8" /></template>
      </UCard>

      <UCard class="rounded-sm">
        <template #header><Placeholder class="h-8" /></template>
        <Placeholder class="h-32" />
        <template #footer><Placeholder class="h-8" /></template>
      </UCard>

      <UCard class="rounded-sm">
        <template #header><Placeholder class="h-8" /></template>
        <Placeholder class="h-32" />
        <template #footer><Placeholder class="h-8" /></template>
      </UCard>
    </div>
    <div>
      <UCard class="rounded-sm">
        <p>最近的活动</p>
        <p class="text-xs text-gray-400">仅展示近一个月的信息</p>
      </UCard>
    </div>
  </div>
</template>
