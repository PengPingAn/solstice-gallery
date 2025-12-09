// middleware/loading.global.ts
export default defineNuxtRouteMiddleware((to, from) => {
  // 只在客户端执行
  if (import.meta.client) {
    // 使用组合式 API
    const loading = useLoadingStore();

    // 显示 loading
    loading.show();

    // 监听路由完成
    const router = useRouter();

    const hideLoading = () => {
      setTimeout(() => {
        loading.hide();
      }, 300);
    };

    // 监听路由完成
    router.afterEach(hideLoading);

    // 设置超时
    setTimeout(() => {
      if (loading.isLoading.value) {
        loading.hide();
      }
    }, 10000);
  } else {
  }
});
