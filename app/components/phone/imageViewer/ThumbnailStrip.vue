<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import type { PhotoItem } from './types'

const props = defineProps<{
  images: PhotoItem[]
  currentIndex: number
  isMobile: boolean
}>()

const emit = defineEmits<{
  gotoIndex: [index: number]
}>()

const thumbnailContainer = ref<HTMLElement | null>(null)
const thumbnailWidth = 68 // 缩略图宽度 + 间隙

// 简易节流函数
function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0
  return (...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastCall >= delay) {
      lastCall = now
      fn(...args)
    }
  }
}

// 滚动到当前缩略图（使用 requestAnimationFrame 优化）
const scrollToCurrent = () => {
  if (!thumbnailContainer.value || props.images.length === 0) return

  nextTick(() => {
    requestAnimationFrame(() => {
      const container = thumbnailContainer.value
      if (!container) return

      const containerWidth = container.clientWidth
      let targetScroll =
        props.currentIndex * thumbnailWidth - containerWidth / 2 + thumbnailWidth / 2
      const maxScroll = container.scrollWidth - containerWidth
      targetScroll = Math.max(0, Math.min(targetScroll, maxScroll))

      container.scrollTo({
        left: targetScroll,
        behavior: 'smooth',
      })
    })
  })
}

// 节流版滚动
const throttledScroll = throttle(scrollToCurrent, 100)

// 监听当前索引变化
watch(() => props.currentIndex, throttledScroll)

// 监听图片列表长度变化
watch(
  () => props.images.length,
  () => {
    if (props.images.length) {
      nextTick(throttledScroll)
    }
  }
)

// 缩略图点击事件
const handleThumbnailClick = (index: number) => {
  emit('gotoIndex', index)
}

// 鼠标滚轮滚动
const handleWheel = (e: WheelEvent) => {
  if (!thumbnailContainer.value || props.isMobile) return
  e.preventDefault()
  thumbnailContainer.value.scrollLeft += e.deltaY
}

// 窗口大小变化时重新调整滚动位置
const handleResize = () => {
  throttledScroll()
}

// ========== 懒加载实现 ==========
const observer = ref<IntersectionObserver | null>(null)

// 加载单张图片
const loadImage = (img: HTMLImageElement) => {
  const src = img.getAttribute('data-src')
  if (src && !img.src) {
    img.src = src
  }
}

// 初始化 Intersection Observer，观察所有带有 data-src 的图片
const initLazyLoad = () => {
  if (observer.value) observer.value.disconnect()

  observer.value = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement
          loadImage(img)
          observer.value?.unobserve(img)
        }
      })
    },
    {
      rootMargin: '100px', // 提前 100px 开始加载
      threshold: 0.01,
    }
  )

  // 观察所有待加载图片
  document.querySelectorAll('[data-src]').forEach((img) => {
    observer.value?.observe(img)
  })
}

// 当图片列表变化或容器滚动时重新观察（防止新添加图片未被观察）
watch(
  () => props.images.length,
  () => {
    nextTick(() => {
      initLazyLoad()
    })
  }
)

// 监听滚动容器滚动事件，重新触发懒加载（可选，Observer 本身会处理）
const onContainerScroll = () => {
  // 无额外操作，Observer 会自动处理可见性变化
}

// ========== 生命周期 ==========
onMounted(() => {
  window.addEventListener('resize', handleResize)
  // 延迟执行初始滚动，避免阻塞首屏渲染
  requestIdleCallback(
    () => {
      throttledScroll()
    },
    { timeout: 200 }
  )
  // 初始化懒加载
  initLazyLoad()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (observer.value) observer.value.disconnect()
})
</script>

<template>
  <!-- 缩略图区域 -->
  <div
    class="bg-material-medium z-10 shrink-0 backdrop-blur-2xl"
    :class="{ 'order-2': isMobile }"
    style="
      pointer-events: auto;
      box-shadow:
        0 -8px 32px color-mix(in srgb, var(--color-accent) 8%, transparent),
        0 -4px 16px color-mix(in srgb, var(--color-accent) 6%, transparent),
        0 -2px 8px rgba(0, 0, 0, 0.1);
    "
  >
    <!-- 渐变背景 -->
    <div
      class="pointer-events-none absolute inset-0"
      style="
        background: linear-gradient(
          to top,
          color-mix(in srgb, var(--color-accent) 5%, transparent),
          transparent
        );
      "
    ></div>

    <!-- 缩略图滚动容器 -->
    <div class="relative p-2">
      <div
        ref="thumbnailContainer"
        class="scrollbar-none relative overflow-x-auto overflow-y-hidden flex gap-2"
        :style="{
          'scroll-snap-type': isMobile ? 'x mandatory' : 'none',
          'scroll-behavior': 'smooth',
          '-webkit-overflow-scrolling': 'touch',
        }"
        @wheel="handleWheel"
        @scroll="onContainerScroll"
      >
        <button
          v-for="(image, index) in props.images"
          :key="image.id"
          type="button"
          class="flex-shrink-0 h-16 w-16 overflow-hidden transition-transform duration-200 rounded-lg flex items-center justify-center"
          :class="[
            currentIndex === index
              ? 'ring-accent grayscale-0 scale-105'
              : 'grayscale border border-accent/20',
          ]"
          :style="isMobile ? 'scroll-snap-align: center' : ''"
          @click="handleThumbnailClick(index)"
        >
          <!-- 使用 data-src 存储真实地址，src 为空或占位图 -->
          <img
            :alt="image.title || '缩略图'"
            class="h-full w-full object-cover pointer-events-none"
            :data-src="image.thumbUrl"
            loading="lazy"
          />
        </button>
      </div>

      <!-- 滚动指示器（仅移动端） -->
      <template v-if="isMobile">
        <div
          class="absolute top-0 bottom-0 left-0 w-4 bg-gradient-to-r from-black/20 to-transparent pointer-events-none"
        ></div>
        <div
          class="absolute top-0 bottom-0 right-0 w-4 bg-gradient-to-l from-black/20 to-transparent pointer-events-none"
        ></div>
      </template>
    </div>
  </div>
</template>

<style scoped>
/* 隐藏滚动条（保持可滚动） */
.scrollbar-none {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.scrollbar-none::-webkit-scrollbar {
  display: none;
}

/* 开启硬件加速，提升滚动流畅度 */
.scrollbar-none {
  will-change: transform;
  -webkit-overflow-scrolling: touch;
}

/* 图片不可交互 */
img {
  pointer-events: none;
  user-select: none;
  -webkit-user-drag: none;
}

/* 按钮过渡仅针对 transform，减少重绘 */
button {
  transition: transform 0.2s ease;
  outline: none;
  will-change: transform;
}

button:active {
  transform: scale(0.95);
}

/* 移动端布局调整 */
@media (max-width: 768px) {
  .order-2 {
    order: 2;
  }
}
</style>
