// stores/loading.ts
import { defineStore } from "pinia";
import { ref } from "vue";
import { useCookie } from "#app";

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

interface UserState {
  token: string;
}

export const useUserStore = defineStore("user", {
  state: (): UserState => ({
    token: "",
  }),

  getters: {
    isLogin(): boolean {
      return !!this.token;
    },
  },

  actions: {
    setToken(token: string, rememberMe: boolean) {
      this.token = token;

      const cookie = useCookie("token", {
        maxAge: rememberMe
          ? 60 * 60 * 24 * 365 * 10 // 10 年（等同“永久”）
          : 60 * 60 * 24 * 1, // 1 天
        path: "/",
        sameSite: "lax",
      });

      cookie.value = token;
    },

    clearToken() {
      this.token = "";

      const cookie = useCookie("token", {
        path: "/",
      });

      cookie.value = null;
    },

    initToken() {
      const cookie = useCookie<string>("token");
      this.token = cookie.value || "";
    },
  },
});

// 如果需要，可以导出类型
export type LoadingStore = ReturnType<typeof useLoadingStore>;
