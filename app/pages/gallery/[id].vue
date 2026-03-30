<template>
  <div>
    <!-- 加载提示 -->
    <div v-if="loadingRef" class="flex justify-center p-4">
      <span>加载中...</span>
    </div>

    <!-- 瀑布流画廊 -->
    <MasonryGallery :items="items" @image-click="openImageDetail" />

    <!-- 哨兵元素，用于触发加载更多 -->
    <div ref="sentinelRef" class="h-10 flex items-center justify-center">
      <span v-if="noMoreRef" class="text-gray-400">没有更多了</span>
      <span v-else-if="loadingRef" class="text-gray-400">加载中...</span>
    </div>

    <!-- 图片详情模态框 -->
    <UModal
      :fullscreen="true"
      :dismissible="false"
      v-model:open="showDetail"
      close-icon="i-lucide-arrow-right"
    >
      <template #content>
        <ImageViewer
          :images="items"
          :initial-index="currentImageIndex"
          @closePhoneView="closeDetail"
        />
      </template>
    </UModal>
    <!-- <div v-show="showDetail">
      <ImageViewer
        :images="items"
        :initial-index="currentImageIndex"
        @closePhoneView="closeDetail"
      />
    </div> -->
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const albumIdParam = computed(() => route.params.id as string)

const items = ref<any[]>([])
const pageSize = 40
const offsetRef = ref(0)
const loadingRef = ref(false)
const noMoreRef = ref(false)
const sentinelRef = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

const currentImageIndex = ref<number>(0)
const showDetail = ref(false)

// 打开详情
const openImageDetail = (index: number) => {
  currentImageIndex.value = index
  showDetail.value = true
}

// 关闭详情
const closeDetail = () => {
  showDetail.value = false
}

// 格式化图片数据
const mapItems = (list: any[]) =>
  list.map((r: any, idx: number) => ({
    id: r.id,
    url: r.url,
    thumbUrl: r.thumbUrl,
    title: r.filename,
    meta: r.storageType === 'aliyun-oss' ? '阿里云' : r.storageType === 'local' ? '本地' : '',
    date: r.createdAt,
    _index: offsetRef.value + idx,
  }))

// 加载更多数据
const fetchMore = async () => {
  if (loadingRef.value || noMoreRef.value) return
  loadingRef.value = true
  try {
    const query: any = { limit: pageSize, offset: offsetRef.value }
    if (albumIdParam.value !== 'all') query.albumId = Number(albumIdParam.value)
    const res: any = await $fetch('/api/photo/query', { query })
    const mapped = mapItems(res.data || [])
    items.value.push(...mapped)
    offsetRef.value += mapped.length
    if (mapped.length < pageSize) noMoreRef.value = true
  } catch (error) {
    console.error('加载失败:', error)
    // 可以显示错误提示
  } finally {
    loadingRef.value = false
  }
}

// 初始化加载（清空数据，重置状态）
const initLoad = async () => {
  items.value = []
  offsetRef.value = 0
  noMoreRef.value = false
  await fetchMore()
}

// 监听路由参数变化，重新加载数据
watch(albumIdParam, async () => {
  await initLoad()
})

// 设置交叉观察器
onMounted(async () => {
  await initLoad()
  observer = new IntersectionObserver(
    async (entries) => {
      const entry = entries[0]
      if (entry && entry.isIntersecting) {
        await fetchMore()
      }
    },
    { root: null, rootMargin: '200px', threshold: 0.1 } // rootMargin 增加提前加载
  )
  if (sentinelRef.value) observer.observe(sentinelRef.value)
})

// 组件卸载时断开观察器
onUnmounted(() => {
  if (observer) {
    observer.disconnect()
    observer = null
  }
})
</script>
