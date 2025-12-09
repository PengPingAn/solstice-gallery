// stores/loading.ts
import { defineStore } from "pinia";
import { ref } from "vue";

export const useLoadingStore = defineStore("loading", () => {
  // 状态
  const isLoading = ref(false);
  const isTransitioning = ref(false);

  // 动作
  const show = (text?: string) => {
    isLoading.value = true;
    isTransitioning.value = true;
  };

  const hide = () => {
    isTransitioning.value = false;

    // 延迟隐藏，确保淡出动画完成
    setTimeout(() => {
      isLoading.value = false;
    }, 300);
  };

  return {
    // 状态
    isLoading,
    isTransitioning,

    // 动作
    show,
    hide,
  };
});

// 如果需要，可以导出类型
export type LoadingStore = ReturnType<typeof useLoadingStore>;
