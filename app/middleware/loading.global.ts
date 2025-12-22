// middleware/loading.global.ts

let showTimer: ReturnType<typeof setTimeout> | null = null;
let initialized = false;

export default defineNuxtRouteMiddleware(() => {
  if (!import.meta.client) return;

  const loading = useLoadingStore();
  const router = useRouter();

  // 清理上一次的延迟任务（非常重要）
  if (showTimer) {
    clearTimeout(showTimer);
    showTimer = null;
  }

  // 延迟显示 loading（快跳转不显示）
  showTimer = setTimeout(() => {
    loading.show();
  }, 200);

  // 只初始化一次全局监听
  if (!initialized) {
    initialized = true;

    router.afterEach(() => {
      // 路由完成，取消延迟显示
      if (showTimer) {
        clearTimeout(showTimer);
        showTimer = null;
      }

      // ⚠️ Pinia 中不要用 .value
      if (loading.isLoading) {
        setTimeout(() => {
          loading.hide();
        }, 300);
      }
    });
  }

  // 兜底：防止任何异常情况卡死
  setTimeout(() => {
    if (loading.isLoading) {
      loading.hide();
    }
  }, 8000);
});
