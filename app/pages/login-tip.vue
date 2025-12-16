<template>
  <div class="flex flex-col items-center justify-center min-h-[100vh] text-center gap-4">
    <UIcon name="tdesign:shield-error" class="w-16 h-16 text-primary" />

    <h1 class="text-3xl font-semibold">你貌似没有登录</h1>

    <p class="text-gray-500 dark:text-gray-400">请登录后再访问该页面</p>

    <UButton to="/login" color="primary"> GO LOGIN </UButton>
  </div>
</template>
