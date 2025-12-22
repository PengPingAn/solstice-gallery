<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps<{
  src: string
  title?: string
  meta?: string
  delay?: number
  address?: string
  date?: string
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)
const isLoading = ref(true)
const isVisible = ref(false)
const showSecondaryInfo = ref(true) // 控制地址和日期的显示

const HEIGHT_THRESHOLD = 250 // 临界高度

// 更新显示状态
const updateVisibility = () => {
  if (!canvasRef.value || !containerRef.value) return

  // 获取canvas的实际显示高度
  const canvasRect = canvasRef.value.getBoundingClientRect()
  const containerRect = containerRef.value.getBoundingClientRect()

  // 使用canvas的实际高度或容器的较小值
  const actualHeight = canvasRect.height || containerRect.height

  // 如果高度小于阈值，则不显示地址和日期
  showSecondaryInfo.value = actualHeight > HEIGHT_THRESHOLD
}

const renderImage = () => {
  if (!canvasRef.value) return
  const ctx = canvasRef.value.getContext('2d')
  const img = new Image()
  img.crossOrigin = 'Anonymous'
  img.src = props.src

  img.onload = () => {
    if (!canvasRef.value || !ctx) return
    canvasRef.value.width = img.naturalWidth
    canvasRef.value.height = img.naturalHeight
    ctx.drawImage(img, 0, 0)
    isLoading.value = false

    // 图片加载完成后，延迟一点更新显示状态
    setTimeout(() => {
      updateVisibility()
      // 入场动画触发
      requestAnimationFrame(() => {
        isVisible.value = true
      })
    }, 100) // 等待布局更新
  }

  img.onerror = () => {
    isLoading.value = false
    updateVisibility() // 即使加载失败也更新状态
  }
}

let observer: IntersectionObserver | null = null
let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  // 初始时隐藏地址和日期
  showSecondaryInfo.value = false

  // 监听容器尺寸变化
  resizeObserver = new ResizeObserver(() => {
    updateVisibility()
  })

  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        renderImage()
        if (containerRef.value) {
          resizeObserver?.observe(containerRef.value)
        }
        observer?.disconnect()
      }
    },
    { threshold: 0.1 }
  )

  if (containerRef.value) observer.observe(containerRef.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  resizeObserver?.disconnect()
})
</script>

<template>
  <div
    ref="containerRef"
    class="relative m-0.5 group overflow-hidden bg-[#111] select-none"
    :style="{
      transition: 'transform 0.6s cubic-bezier(0.34,1.56,0.64,1), opacity 0.6s ease-out',
      transitionDelay: `${props.delay || 0}ms`,
      transform: isVisible ? 'translateY(0px) scale(1)' : 'translateY(30px) scale(0.9)',
      opacity: isVisible ? 1 : 0,
    }"
  >
    <div v-if="isLoading" class="w-full aspect-[3/4] bg-neutral-900 animate-pulse"></div>

    <canvas
      ref="canvasRef"
      class="w-full h-auto block outline-none cursor-pointer"
      @contextmenu.prevent
    />

    <!-- 悬浮遮盖层 -->
    <div class="pointer-events-none cursor-pointer">
      <div
        class="pointer-events-none absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      ></div>
      <div class="absolute inset-x-0 bottom-0 p-4 pb-0 text-white">
        <div class="**:duration-300">
          <h3 class="mb-2 truncate text-sm font-medium opacity-0 group-hover:opacity-100">
            {{ props.title }}
          </h3>
          <div class="flex flex-wrap gap-2 text-xs text-white/80 opacity-0 group-hover:opacity-100">
            <span>JPG</span><span>•</span><span>4587 × 6880</span><span>•</span><span>6.6MB</span>
          </div>
          <div class="flex flex-wrap gap-1.5" :class="{ 'mb-4': !showSecondaryInfo }">
            <Tag
              size="sm"
              radius="full"
              color="bg-white/20 backdrop-blur-sm !opacity-0 group-hover:!opacity-100"
              textColor="text-white/90"
            >
              <div class="flex items-center gap-1">
                <UIcon name="material-symbols:android-camera-outline"></UIcon>
                {{ props.meta }}
              </div>
            </Tag>
          </div>
        </div>
        <!-- 地址和日期容器，根据高度条件显示 -->
        <div
          v-if="showSecondaryInfo && (props.address || props.date)"
          class="flex items-center gap-2 pb-4 text-xs opacity-0 group-hover:opacity-100"
        >
          <Tag
            v-if="props.address"
            size="sm"
            color="bg-white/20 backdrop-blur-sm"
            textColor="text-white/90"
          >
            <div class="flex items-center gap-1">
              <UIcon name="material-symbols:location-on-outline-rounded"></UIcon>
              {{ props.address }}
            </div>
          </Tag>
          <Tag
            v-if="props.date"
            size="sm"
            color="bg-white/20 backdrop-blur-sm"
            textColor="text-white/90"
          >
            <div class="flex items-center gap-1">
              <UIcon name="material-symbols:calendar-month-outline"></UIcon>
              {{ props.date }}
            </div>
          </Tag>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
canvas {
  width: 100%;
  height: auto;
  display: block;
}
</style>
