<script setup lang="ts">
import { ref, onBeforeMount } from "vue";
import { useHead } from "#app";

const router = useRouter();
const isDark = computed({
  get() {
    return colorMode.value === "dark";
  },
  set(_isDark) {
    colorMode.preference = _isDark ? "dark" : "light";
  },
});
const colorMode = useColorMode();

onBeforeMount(() => {});
function toggleTheme() {
  colorMode.preference = colorMode.value === "dark" ? "light" : "dark";
}

const testimonials = [
  {
    title: "测试图片1",
    tags: ["英国", "瑞士"],
    urlData: [
      "https://res.liuyuyang.net/thrive/album/68f4d70e60b2036e8a43ed5f.JPG",
      // "https://res.liuyuyang.net/thrive/album/68f4d93a60b2036e8a43ed64.JPG",
      // "https://res.liuyuyang.net/thrive/album/68f4cfce60b2036e8a43ed4b.JPG",
    ],
  },
  {
    title: "测试图片2",
    tags: ["东极岛"],
    urlData: [
      "https://res.liuyuyang.net/thrive/album/68f4d1fb60b2036e8a43ed57.JPG",
      // "https://res.liuyuyang.net/thrive/album/68f4ce8560b2036e8a43ed48.JPG",
      // "https://res.liuyuyang.net/thrive/album/68f4ce5f60b2036e8a43ed47.JPG",
    ],
  },
  {
    title: "测试图片3",
    tags: ["云南", "怒江"],
    urlData: [
      "https://res.liuyuyang.net/thrive/album/68f4d92f60b2036e8a43ed62.JPG",
      // "https://res.liuyuyang.net/thrive/album/68f4d92960b2036e8a43ed61.JPG",
      // "https://res.liuyuyang.net/thrive/album/68f4da9e60b2036e8a43ed69.JPG",
    ],
  },
  {
    title: "测试图片4",
    tags: ["最美之海"],
    urlData: [
      "https://res.liuyuyang.net/thrive/album/68f4cfe960b2036e8a43ed4f.JPG",
      // "https://res.liuyuyang.net/thrive/album/68f4dd4760b2036e8a43ed6f.JPG",
      // "https://res.liuyuyang.net/thrive/album/68f4dd4260b2036e8a43ed6e.JPG",
    ],
  },
  {
    title: "测试图片5",
    tags: ["钟"],
    urlData: [
      "https://res.liuyuyang.net/thrive/album/68f4da9a60b2036e8a43ed68.JPG",
      // "https://res.liuyuyang.net/thrive/album/68f4d70360b2036e8a43ed5d.JPG",
      // "https://res.liuyuyang.net/thrive/album/68f4daab60b2036e8a43ed6c.JPG",
    ],
  },
  {
    title: "测试图片6",
    tags: ["香格里拉"],
    urlData: [
      "https://res.liuyuyang.net/thrive/album/68f4daab60b2036e8a43ed6c.JPG",
      // "https://res.liuyuyang.net/thrive/album/68f4d70360b2036e8a43ed5d.JPG",
      // "https://res.liuyuyang.net/thrive/album/68f4daab60b2036e8a43ed6c.JPG",
    ],
  },
];
const allPhoto = {
  title: "ALL",
  tags: ["ALL"],
  urlData: "https://res.liuyuyang.net/thrive/album/68f4d70e60b2036e8a43ed5f.JPG",
};

const jumpPhoto = (val: any) => {
  router.push(`/gallery/1`);
};
</script>

<template>
  <div
    class="min-h-screen bg-[#050505] text-white selection:bg-cyan-500/30 selection:text-cyan-200 font-sans bg-[var(--background)]"
  >
    <!-- 顶部导航栏模拟 -->
    <nav
      class="fixed top-0 left-0 right-0 z-50 h-16 bg-[#050505]/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 bg-[var(--background-head)]"
    >
      <span class="font-bold tracking-tight text-[var(--font-color)]"
        >SOLSTICE-GALLERY</span
      >
      <div class="flex items-center gap-4">
        <div class="text-xs text-neutral-500 font-mono">VUE 3 REPLICA</div>

        <UButton
          color="neutral"
          variant="outline"
          @click="toggleTheme"
          :title="isDark ? '切换到亮色模式' : '切换到黑暗模式'"
          class="cursor-pointer"
        >
          <!-- 太阳图标 (亮色模式) -->
          <svg
            v-if="!isDark"
            class="w-5 h-3 text-amber-500 transform rotate-0 scale-100 transition-all duration-300"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fill-rule="evenodd"
              d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
              clip-rule="evenodd"
            />
          </svg>

          <!-- 月亮图标 (黑暗模式) -->
          <svg
            v-else
            class="w-5 h-3 text-cyan-400 transform rotate-0 scale-100 transition-all duration-300"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        </UButton>
      </div>
    </nav>

    <!-- 主容器 -->
    <main class="max-w-7xl mx-auto px-6 pb-20 pt-16 bg-[var(--background)]">
      <ProfileHeader
        avatar="https://api.dicebear.com/7.x/notionists/svg?seed=Innei"
        name="PEACE-SPACE"
        poem="此情可待成追忆，只是当时已惘然。"
        source="李商隐《锦瑟》"
        description="每一张照片，都是时光的标本，记忆的锚点。"
      />

      <!-- 分割线 -->
      <div
        class="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent my-12"
      ></div>

      <div class="flex justify-center w-full">
        <div
          class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-12 w-full max-w-full"
        >
          <div class="w-full flex justify-center">
            <AlbumCard
              :photo="allPhoto.urlData"
              :tags="allPhoto.tags"
              :title="allPhoto.title"
              @jumpPhoto="jumpPhoto"
            ></AlbumCard>
          </div>
          <template v-for="value in testimonials">
            <div class="w-full flex justify-center">
              <AlbumCard
                :photo="value.urlData[0]"
                :tags="value.tags"
                :title="value.title"
                @jumpPhoto="jumpPhoto"
              ></AlbumCard>
            </div>
          </template>
        </div>
      </div>

      <!-- 瀑布流 -->
      <!-- <MasonryGrid :items="photos" /> -->
    </main>

    <!-- 底部 -->
    <footer
      class="text-center py-10 text-neutral-600 text-sm border-t border-white/5 bg-[#050505] bg-[var(--background)]"
    >
      <p>&copy; 2024 Vue Canvas Gallery</p>
    </footer>
  </div>
</template>
