import { useState, defineNuxtRouteMiddleware } from "nuxt/app";

export default defineNuxtRouteMiddleware((to, from) => {
  const loading = useState("isLoading", () => false); // 初始化为 false

  // 页面切换前显示 loading
  const loadingTimeout = setTimeout(() => {
    loading.value = true; // 超过 1 秒后显示 loading
  }, 1000);

  // 页面加载完成后关闭 loading
  const { $router } = useNuxtApp();

  // 使用 Vue Router 的 afterEach 钩子来监听路由变化
  $router.afterEach(() => {
    clearTimeout(loadingTimeout); // 清除定时器，防止加载完成前显示 loading
    loading.value = false; // 页面加载完成，关闭 loading
  });
});
