export default defineNuxtRouteMiddleware((to) => {
  if (!to.meta.requiresAuth) return;

  const userStore = useUserStore();
  userStore.initToken();

  if (userStore.isLogin) return;

  return navigateTo({
    path: "/login-tip",
    query: { redirect: to.fullPath },
  });
});
