<script setup lang="ts">
import { onBeforeMount } from 'vue'

const router = useRouter()
const isDark = computed({
  get() {
    return colorMode.value === 'dark'
  },
  set(_isDark) {
    colorMode.preference = _isDark ? 'dark' : 'light'
  },
})
const colorMode = useColorMode()

onBeforeMount(() => {})
function toggleTheme() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

const albums = ref<any[]>([])
const allTile = computed(() => ({
  id: null,
  title: 'ALL',
  tags: ['ALL'],
  urlData: albums.value.length ? albums.value[0].urlData?.[0] : '',
}))

onMounted(async () => {
  const res: any = await $fetch('/api/album/list')
  albums.value = res.data || []
})

const jumpPhoto = (album: any) => {
  if (!album || album.id == null) {
    router.push(`/gallery/all`)
  } else {
    router.push(`/gallery/${album.id}`)
  }
}
</script>

<template>
  <div
    class="min-h-screen bg-[#050505] text-white selection:bg-cyan-500/30 selection:text-cyan-200 font-sans bg-[var(--background)]"
  >
    <!-- 顶部导航栏模拟 -->
    <nav
      class="fixed top-0 left-0 right-0 z-50 h-16 bg-[#050505]/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 bg-[var(--background-head)]"
    >
      <span class="font-bold tracking-tight text-[var(--font-color)]">SNAPSTORY</span>
      <div class="flex items-center gap-4">
        <div class="text-xs text-neutral-500 font-mono">VUE 3 REPLICA</div>

        <UTooltip text="主题切换">
          <UButton
            :icon="isDark ? 'material-symbols:sunny-outline' : 'material-symbols:dark-mode-outline'"
            color="neutral"
            variant="subtle"
            size="sm"
            class="rounded-full"
            @click="toggleTheme"
          />
        </UTooltip>
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
              :photo="allTile.urlData"
              :tags="allTile.tags"
              :title="allTile.title"
              @jumpPhoto="() => jumpPhoto(null)"
            ></AlbumCard>
          </div>
          <template v-for="value in albums" :key="value.id">
            <div class="w-full flex justify-center">
              <AlbumCard
                :photo="value.urlData?.[0]"
                :tags="value.tags"
                :title="value.name"
                @jumpPhoto="() => jumpPhoto(value)"
              ></AlbumCard>
            </div>
          </template>
        </div>
      </div>

      <!-- 瀑布流 -->
      <!-- <MasonryGallery :items="photos" /> -->
    </main>

    <!-- 底部 -->
    <footer
      class="text-center py-10 text-neutral-600 text-sm border-t border-white/5 bg-[#050505] bg-[var(--background)]"
    >
      <p>&copy; 2024 Vue Canvas Gallery</p>
    </footer>
  </div>
</template>
