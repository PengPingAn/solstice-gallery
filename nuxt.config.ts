// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  app: {
    head: {
      title: "SOLSTICE-GALLERY",
      meta: [{ name: "referrer", content: "no-referrer" }],
      link: [
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&display=swap",
        },
      ],
      htmlAttrs: {
        class: "light", // 默认设置为 light，后续根据用户偏好更改为 dark
      },
      // script: [
      //   {
      //     innerHTML: `
      //       (function () {
      //         try {
      //           var saved = null;
      //           try { saved = localStorage.getItem('theme'); } catch(e) {}
      //           var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      //           var isDark = (saved === 'dark') || (saved === null && prefersDark);

      //           if (isDark) {
      //             document.documentElement.classList.add('dark');
      //           } else {
      //             document.documentElement.classList.remove('dark');
      //           }

      //           var bg = isDark ? '#050505' : '#ffffff';
      //           document.documentElement.style.backgroundColor = bg;
      //           if (document.body) document.body.style.backgroundColor = bg;
      //         } catch (e) {}
      //       })();
      //     `,
      //     tagPosition: "head", // 确保脚本在 head 内最早执行
      //   } as any, // 防止 TS 类型检查报错
      // ],
    },
  },
  components: [
    { path: "~/components", pathPrefix: false }, // 递归扫描
  ],
  modules: ["@nuxt/ui", "@nuxt/image", "@pinia/nuxt"],
  css: ["~/assets/css/tailwind.css", "~/assets/css/style.css"],
  colorMode: {
    preference: "dark", // 默认是 dark
    fallback: "dark", // SSR fallback 也是 dark
    storageKey: "cframe-color-mode",
  },
  ui: {
    fonts: false, // 完全禁用 @nuxt/fonts 模块
  },
  experimental: {
    payloadExtraction: false,
    renderJsonPayloads: false,
  },
  nitro: {
    preset: "vercel",
    // 尝试禁用模块预打包
    esbuild: {
      options: {
        format: "esm",
      },
    },
  },
  vite: {
    ssr: {
      noExternal: ["vue"], // 确保 Vue 被正确打包
    },
    build: {
      rollupOptions: {
        external: [], // 确保没有排除 vue
      },
    },
  },
});
