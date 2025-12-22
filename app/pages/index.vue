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

const testimonials = [
  {
    title: '测试图片1',
    tags: ['英国', '瑞士'],
    urlData: ['https://inews.gtimg.com/om_bt/OWumJZCG9jHXDKrHQjSezIIcIg1NITThJBXJrH8ps31VQAA/641'],
  },
  {
    title: '测试图片2',
    tags: ['东极岛'],
    urlData: [
      'https://img1.baidu.com/it/u=2038813437,949072289&fm=253&fmt=auto&app=138&f=JPEG?w=1067&h=800',
    ],
  },
  {
    title: '测试图片3',
    tags: ['云南', '怒江'],
    urlData: [
      'https://img2.baidu.com/it/u=3536488503,2654862171&fm=253&fmt=auto&app=138&f=JPEG?w=800&h=1200',
    ],
  },
  {
    title: '测试图片4',
    tags: ['最美之海'],
    urlData: [
      'https://img0.baidu.com/it/u=3266618230,1308514086&fm=253&app=138&f=JPEG?w=800&h=1067',
    ],
  },
  {
    title: '测试图片5',
    tags: ['钟'],
    urlData: [
      'https://img0.baidu.com/it/u=2003626523,2470071325&fm=253&app=138&f=JPEG?w=800&h=1067',
    ],
  },
  {
    title: '测试图片6',
    tags: ['香格里拉'],
    urlData: [
      'https://qcloud.dpfile.com/pc/h0jK_DfiFV_fQjL3CQpOVgRTnPIjwQlmZHNHjRv2n3Yrg3bZmogVH6Ln8ywR4Guo.jpg',
    ],
  },
]
const allPhoto = {
  title: 'ALL',
  tags: ['ALL'],
  urlData:
    'https://qcloud.dpfile.com/pc/GxQVns6a7oE_uWvzCvQ_jkLGXRlo0O2ZBczMdvbk76oT_p_NlQV3-I3R8sFMnjwG.jpg',
}

const jumpPhoto = (val: any) => {
  router.push(`/gallery/1`)
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
      <span class="font-bold tracking-tight text-[var(--font-color)]">SOLSTICE-GALLERY</span>
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
