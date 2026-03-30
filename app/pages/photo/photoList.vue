<!-- pages/dashboard/photos.vue -->
<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  alias: '/photoList',
  requiresAuth: true,
})

// 图片数据 - 添加更多字段记录图片信息
const photos = ref<any>([])
const selectPhotos = ref<any>([])
const deleteMode = ref<'single' | 'batch'>('single')

const modalOpen = ref(false)
const delId = ref<any>(null)
const isAllSelect = ref(false)
const mcRef = ref()

// 筛选相关
const albumlItems = ref<any>([])
const albumlValue = ref<any>(null)
const storageFilter = ref<'all' | 'local' | 'aliyun-oss' | 'external'>('all')
const storageCounts = computed(() => {
  const counts: Record<string, number> = { local: 0, 'aliyun-oss': 0, external: 0 }
  for (const p of photos.value) {
    if (p.storageType && counts[p.storageType] !== undefined) counts[p.storageType]++
  }
  return counts
})
const filteredPhotos = computed(() => {
  if (storageFilter.value === 'all') return photos.value
  return photos.value.filter((p: any) => p.storageType === storageFilter.value)
})

const pageSize = 30
const offsetRef = ref(0)
const loadingRef = ref(false)
const noMoreRef = ref(false)
const sentinelRef = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

const mapItems = (list: any[]) =>
  list.map((r: any) => ({
    id: r.id,
    url: r.url,
    thumbUrl: r.thumbUrl,
    title: r.filename,
    fileType: r.fileType,
    createdAt: r.createdAt,
    uploadTimeFormatted: r.createdAt,
    storageType: r.storageType,
    meta: `${r.storageType === 'aliyun-oss' ? '阿里云' : r.storageType === 'local' ? '本地' : '外部'} • ${
      r.fileType?.replace('.', '').toUpperCase() || ''
    }`,
  }))

const fetchMore = async () => {
  if (loadingRef.value || noMoreRef.value) return
  loadingRef.value = true
  try {
    const query: any = { limit: pageSize, offset: offsetRef.value }
    if (albumlValue.value && albumlValue.value.id) query.albumId = albumlValue.value.id
    const res: any = await $fetch('/api/photo/query', { query })
    const mapped = mapItems(res.data || [])
    photos.value.push(...mapped)
    offsetRef.value += mapped.length
    if (mapped.length < pageSize) noMoreRef.value = true
  } finally {
    loadingRef.value = false
  }
}

// 移动端相关状态
const isMobile = ref(false)
const windowWidth = ref(0)
const MOBILE_BREAKPOINT = 768 // 移动端断点

// 检查是否为移动端
const checkMobile = () => {
  isMobile.value = windowWidth.value < MOBILE_BREAKPOINT
}

// 更新窗口宽度和移动端状态
const updateWidth = () => {
  windowWidth.value = window.innerWidth
  checkMobile()
}

// 删除图片
const deleteImage = (id: number) => {
  photos.value = photos.value.filter((photo) => photo.id !== id)
}

// 显示图片详细信息（简化为真实数据）
const showImageInfo = (photo: any) => {
  const info = `文件名: ${photo.title || photo.filename || ''}
类型: ${photo.fileType || ''}
时间: ${photo.uploadTimeFormatted || photo.createdAt || ''}`
  message.show({ text: info, messageType: 'info', duration: 2000 })
}

const btnCheckCount = (val: any) => {
  const ids = val.map(Number)
  const selectedPhotos = photos.value.filter((p) => ids.includes(p.id))
  if (selectedPhotos) {
    selectPhotos.value = selectedPhotos
  }
}

const btnOpenModal = (id: string | number) => {
  // modalOpen.value = true
  // delId.value = val
  deleteMode.value = 'single'
  delId.value = id
  modalOpen.value = true
}
const btnOpenBatchModal = () => {
  if (!selectPhotos.value.length) {
    message.warning('请先选择要删除的图片')
    return
  }
  deleteMode.value = 'batch'
  modalOpen.value = true
}
const btnDelImg = async () => {
  const ids = deleteMode.value === 'single' ? [delId.value] : selectPhotos.value.map((p) => p.id)
  await deleteByIds(ids)
  modalOpen.value = false
}
const deleteByIds = async (ids: Array<string | number>) => {
  if (!ids.length) return
  try {
    await Promise.all(
      ids.map((id) =>
        $fetch(`/api/photo/${id}`, {
          method: 'DELETE',
        })
      )
    )
    photos.value = photos.value.filter((p) => !ids.includes(p.id))
    selectPhotos.value = selectPhotos.value.filter((p) => !ids.includes(p.id))
    message.success('删除成功')
  } catch (err: any) {
    message.error(`删除失败：${err?.message || '未知错误'}`)
  }
}

const allCheck = () => {
  mcRef.value?.toggleSelectAll(isAllSelect.value)
}

const loadPhotos = async () => {
  photos.value = []
  offsetRef.value = 0
  noMoreRef.value = false
  await fetchMore()
}

// 移动端适配：监听窗口大小变化
onMounted(async () => {
  try {
    const res: any = await $fetch('/api/album/list')

    // 统一处理返回结构
    const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : []

    albumlItems.value = [
      { id: null, label: '全部' },
      ...list.map((e: any) => ({
        id: e.id,
        label: e.name,
      })),
    ]

    updateWidth()
    await loadPhotos()
    window.addEventListener('resize', updateWidth)

    observer = new IntersectionObserver(
      async (entries) => {
        const entry = entries[0]
        if (entry?.isIntersecting) {
          await fetchMore()
        }
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0.1,
      }
    )

    if (sentinelRef.value) {
      observer.observe(sentinelRef.value)
    }
  } catch (err) {
    console.error('加载相册失败:', err)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateWidth)
  if (observer && sentinelRef.value) observer.unobserve(sentinelRef.value)
  observer = null
})

// 移动端全屏查看图片
const viewImageFullscreen = (photo: any) => {
  if (isMobile.value) {
    // 在移动端，点击图片时显示全屏预览
    const modalOpen = ref(true)

    // 这里可以集成一个图片查看器组件
    // 暂时使用简单的alert提示
    alert(
      `查看图片: ${photo.title}\n分辨率: ${photo.resolution}\n文件大小: ${photo.fileSizeFormatted}`
    )
  }
}

watch(
  () => albumlValue.value,
  async () => {
    await loadPhotos()
  }
)
</script>

<template>
  <div class="space-y-4 md:space-y-6 animate-fade-in animate-fade-in">
    <!-- 头部 - 移动端适配 -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-0">
      <div></div>
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <!-- 移动端：全选和上传按钮放在一行 -->
        <div class="flex items-center gap-2">
          <UCheckbox v-model="isAllSelect" label="全选" class="text-sm" @change="allCheck">
          </UCheckbox>

          <UButton
            icon="material-symbols:delete-outline-rounded"
            color="error"
            size="md"
            class="flex-1"
            @click="btnOpenBatchModal"
            :disabled="!(selectPhotos && selectPhotos.length > 0)"
          >
            <span class="">批量删除</span>
          </UButton>
        </div>
      </div>
    </div>

    <!-- 瀑布流展示 - 移动端适配 -->
    <div v-if="photos.length > 0">
      <div class="flex items-center gap-2 mb-2">
        <UBadge color="neutral" variant="soft">筛选存储</UBadge>
        <USelect
          v-model="storageFilter"
          :items="[
            { label: '全部', value: 'all' },
            { label: `本地 (${storageCounts.local})`, value: 'local' },
            { label: `阿里云 (${storageCounts['aliyun-oss']})`, value: 'aliyun-oss' },
            { label: `外部 (${storageCounts.external})`, value: 'external' },
          ]"
          size="sm"
          class="w-44"
        />
      </div>
      <MasonryCollection
        ref="mcRef"
        :items="filteredPhotos"
        :show-info="false"
        @image-click="isMobile ? viewImageFullscreen($event) : showImageInfo($event)"
        @selection-change="btnCheckCount"
        @image-delete="btnOpenModal"
      />
      <div class="flex justify-center py-3">
        <USkeleton v-if="loadingRef" class="h-8 w-24" />
        <div v-else-if="noMoreRef" class="text-xs text-gray-500">没有更多了</div>
      </div>
      <div ref="sentinelRef" style="height: 1px"></div>
    </div>

    <div
      v-if="!albumlItems || albumlItems.length == 0"
      class="border-2 border-dashed border-gray-300 rounded-xl p-6 md:p-12 text-center"
    >
      <div
        class="w-12 h-12 md:w-16 md:h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center"
      >
        <UIcon name="fluent:image-off-28-regular" class="text-2xl md:text-3xl text-gray-400" />
      </div>
      <br />
      <h3 class="text-base md:text-lg font-medium">你貌似还没有创建相册，请先创建相册</h3>
    </div>
    <!-- 如果没有图片，显示提示 - 移动端适配 -->
    <div
      v-else-if="photos.length === 0"
      class="border-2 border-dashed border-gray-300 rounded-xl p-6 md:p-12 text-center"
    >
      <div class="max-w-sm mx-auto space-y-3 md:space-y-4">
        <div
          class="w-12 h-12 md:w-16 md:h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center"
        >
          <UIcon name="fluent:image-off-28-regular" class="text-2xl md:text-3xl text-gray-400" />
        </div>
        <div class="space-y-1 md:space-y-2">
          <h3 class="text-base md:text-lg font-medium">还没有图片</h3>
          <p class="text-xs md:text-sm text-gray-500">先上传一些图片吧，然后你可以在这看到它</p>
        </div>
      </div>
    </div>
  </div>

  <!-- 删除确认模态框 - 移动端适配 -->
  <UModal
    v-model:open="modalOpen"
    title="删除图片"
    :ui="{
      footer: 'justify-end',
      width: isMobile ? 'w-[90vw]' : 'sm:max-w-lg',
      padding: isMobile ? 'p-4' : 'p-6',
    }"
  >
    <template #body>
      <p class="text-sm md:text-base">你确定要删除吗？删除后无法恢复。</p>
    </template>

    <template #footer="{ close }">
      <UButton label="手滑了" variant="outline" size="md" @click="close" />
      <UButton label="嗯" color="neutral" size="md" @click="btnDelImg" />
    </template>
  </UModal>
</template>

<style scoped>
/* 淡入动画 */
.animate-fade-in {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.console-log {
  font-family: 'Menlo', 'Monaco', 'Cascadia Code', 'Consolas', monospace;
  scroll-behavior: smooth;
}

.log-entry {
  font-family: 'Menlo', 'Monaco', 'Cascadia Code', 'Consolas', monospace;
}

/* 自定义滚动条样式 */
.console-log::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.console-log::-webkit-scrollbar-track {
  background: #2d2d2d;
  border-radius: 4px;
}

.console-log::-webkit-scrollbar-thumb {
  background: #555;
  border-radius: 4px;
}

.console-log::-webkit-scrollbar-thumb:hover {
  background: #777;
}

/* 移动端优化 */
@media (max-width: 768px) {
  .text-sm-mobile {
    font-size: 0.875rem;
  }

  .text-xs-mobile {
    font-size: 0.75rem;
  }

  .p-mobile {
    padding: 0.75rem;
  }
}

/* 触摸优化 */
@media (hover: none) and (pointer: coarse) {
  button,
  [role='button'] {
    min-height: 44px;
    min-width: 44px;
  }

  .cursor-pointer {
    cursor: default;
  }
}

/* 防止移动端缩放 */
@viewport {
  width: device-width;
  initial-scale: 1;
  maximum-scale: 1;
  user-zoom: fixed;
}
</style>
