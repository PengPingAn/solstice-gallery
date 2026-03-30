<script setup lang="ts">
import { useMessage } from '@/composables/useMessage'
import { computed, onMounted, onUnmounted, ref, shallowRef } from 'vue'
import type { EmojiItem, PhotoItem, SwipeState, TransformState } from './types'

// 导入子组件
import DesktopSidebar from './DesktopSidebar.vue'
import EmojiButtons from './EmojiButtons.vue'
import ImageBackground from './ImageBackground.vue'
import MainImage from './MainImage.vue'
import MobileDrawer from './MobileDrawer.vue'
import TopControls from './TopControls.vue'
import ZoomControls from './ZoomControls.vue'

const props = withDefaults(
  defineProps<{
    images: PhotoItem[]
    initialIndex: number
  }>(),
  {
    images: () => [],
    initialIndex: () => 0,
  }
)
console.log(props.images, '-------------')
const emit = defineEmits<{
  closePhoneView: []
}>()

// ✅ 使用 shallowRef 避免深度监听数组内对象变化（性能优化）
const imagesShallow = shallowRef(props.images)
const currentIndex = ref(props.initialIndex)
const isMobile = ref(false)
const drawerOpen = ref(false)
const message = useMessage()

// 缩放状态
const scale = ref(1)
const position = ref<TransformState['position']>({ x: 0, y: 0 })
const isDragging = ref(false)

// 滑动切换状态
const swipeState = ref<SwipeState>({
  isSwiping: false,
  startX: 0,
  startY: 0,
  currentX: 0,
  deltaX: 0,
  deltaY: 0,
  direction: 0,
  opacity: 1,
  isHorizontalSwipe: false,
})

// ---------- 切换动画相关 ----------
const mainImageRef = ref<InstanceType<typeof MainImage> | null>(null)
const isAnimating = ref(false)
let animationTimeout: ReturnType<typeof setTimeout> | null = null
const forceButtonVisible = ref(false) // 动画期间强制按钮可见
const showPrevBtn = ref(true) // 控制“上一张”按钮显示
const showNextBtn = ref(true) // 控制“下一张”按钮显示

// 图片加载并发控制
const imageCache = new Map<string, HTMLImageElement | 'loading'>()
let abortController: AbortController | null = null
let activeLoadCount = 0
const MAX_CONCURRENT_LOADS = 2
const pendingLoads: Array<{
  url: string
  resolve: (img: HTMLImageElement) => void
  reject: () => void
}> = []

function runWhenIdle(callback: () => void) {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(callback, { timeout: 2000 })
  } else {
    setTimeout(callback, 100)
  }
}

function getCachedImage(url: string): HTMLImageElement | undefined {
  const cached = imageCache.get(url)
  if (cached && cached !== 'loading') return cached
  return undefined
}

function setCachedImage(url: string, img: HTMLImageElement) {
  imageCache.set(url, img)
}

function setLoadingState(url: string) {
  imageCache.set(url, 'loading')
}

function clearLoadingState(url: string) {
  if (imageCache.get(url) === 'loading') {
    imageCache.delete(url)
  }
}

async function decodeImage(img: HTMLImageElement): Promise<void> {
  if ('decode' in img) {
    await img.decode()
  }
}

async function loadAndDecodeOriginalImage(url: string): Promise<HTMLImageElement | null> {
  const cached = getCachedImage(url)
  if (cached) return cached

  if (imageCache.get(url) === 'loading') {
    return new Promise((resolve) => {
      const check = setInterval(() => {
        const img = getCachedImage(url)
        if (img) {
          clearInterval(check)
          resolve(img)
        } else if (imageCache.get(url) !== 'loading') {
          clearInterval(check)
          resolve(null)
        }
      }, 50)
    })
  }

  setLoadingState(url)
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = async () => {
      try {
        await decodeImage(img)
        setCachedImage(url, img)
        resolve(img)
      } catch (err) {
        clearLoadingState(url)
        reject(err)
      }
    }
    img.onerror = () => {
      clearLoadingState(url)
      reject(new Error('加载失败'))
    }
    img.src = url
  })
}

function loadWithConcurrency(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve, reject) => {
    const loadTask = () => {
      activeLoadCount++
      loadAndDecodeOriginalImage(url)
        .then((img) => {
          activeLoadCount--
          processPending()
          resolve(img)
        })
        .catch((err) => {
          activeLoadCount--
          processPending()
          reject(err)
        })
    }

    if (activeLoadCount < MAX_CONCURRENT_LOADS) {
      loadTask()
    } else {
      pendingLoads.push({ url, resolve, reject })
    }
  })
}

function processPending() {
  while (pendingLoads.length > 0 && activeLoadCount < MAX_CONCURRENT_LOADS) {
    const { url, resolve, reject } = pendingLoads.shift()!
    activeLoadCount++
    loadAndDecodeOriginalImage(url)
      .then((img) => {
        activeLoadCount--
        processPending()
        resolve(img)
      })
      .catch((err) => {
        activeLoadCount--
        processPending()
        reject(err)
      })
  }
}

function preloadAdjacentImages() {
  const prevIndex = currentIndex.value - 1
  const nextIndex = currentIndex.value + 1
  const toPreload = []
  if (prevIndex >= 0) toPreload.push(imagesShallow.value[prevIndex])
  if (nextIndex < imagesShallow.value.length) toPreload.push(imagesShallow.value[nextIndex])

  for (const img of toPreload) {
    const originalUrl = img.url
    if (!getCachedImage(originalUrl) && imageCache.get(originalUrl) !== 'loading') {
      runWhenIdle(() => loadWithConcurrency(originalUrl).catch(() => {}))
    }
  }
}

// 更新按钮显示状态（根据当前索引）
function updateButtonVisibility() {
  showPrevBtn.value = currentIndex.value > 0
  showNextBtn.value = currentIndex.value < imagesShallow.value.length - 1
}

// 切换动画
async function performSwitchAnimation(direction: 'prev' | 'next') {
  // 动画开始：强制显示两个按钮
  forceButtonVisible.value = true
  showPrevBtn.value = true
  showNextBtn.value = true

  if (isAnimating.value) {
    forceButtonVisible.value = false
    updateButtonVisibility()
    return false
  }

  const targetIndex = direction === 'prev' ? currentIndex.value - 1 : currentIndex.value + 1
  if (targetIndex < 0 || targetIndex >= imagesShallow.value.length) {
    forceButtonVisible.value = false
    updateButtonVisibility()
    return false
  }

  const targetImage = imagesShallow.value[targetIndex]
  if (!targetImage) {
    forceButtonVisible.value = false
    updateButtonVisibility()
    return false
  }

  // 如果图片被缩放，先重置缩放（让动画更自然）
  if (scale.value !== 1) {
    zoomToFit()
    await new Promise((resolve) => setTimeout(resolve, 50))
  }

  // 预加载目标图片（如果未加载）
  let targetImgElement: HTMLImageElement | undefined = getCachedImage(targetImage.url)
  if (!targetImgElement) {
    try {
      targetImgElement = (await loadWithConcurrency(targetImage.url)) || undefined
    } catch {
      forceButtonVisible.value = false
      updateButtonVisibility()
      return false // 降级到无动画切换
    }
  }

  isAnimating.value = true

  const container = mainImageRef.value?.getContainerElement()
  const currentImgElement = mainImageRef.value?.getImageElement()
  if (!container || !currentImgElement) {
    isAnimating.value = false
    forceButtonVisible.value = false
    updateButtonVisibility()
    return false
  }

  const containerRect = container.getBoundingClientRect()

  // 创建动画层
  const animationLayer = document.createElement('div')
  animationLayer.className = 'image-switch-animation-layer'
  animationLayer.style.cssText = `
    position: fixed;
    top: ${containerRect.top}px;
    left: ${containerRect.left}px;
    width: ${containerRect.width}px;
    height: ${containerRect.height}px;
    z-index: 0;
    overflow: hidden;
    pointer-events: none;
    will-change: transform;
  `

  const currentClone = document.createElement('div')
  currentClone.className = 'animation-current-image'
  const currentUrl = currentImgElement.src
  currentClone.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: url(${currentUrl});
    background-size: contain;
    background-position: center;
    background-repeat: no-repeat;
    transform: translateX(0);
    transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    will-change: transform;
  `

  const targetClone = document.createElement('div')
  targetClone.className = 'animation-target-image'
  targetClone.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: url(${targetImage.url});
    background-size: contain;
    background-position: center;
    background-repeat: no-repeat;
    transform: translateX(${direction === 'next' ? '100%' : '-100%'});
    transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    will-change: transform;
  `

  animationLayer.appendChild(currentClone)
  animationLayer.appendChild(targetClone)
  const overlay = document.querySelector('.image-viewer-overlay')
  if (overlay) {
    overlay.appendChild(animationLayer)
  } else {
    // 降级方案
    document.body.appendChild(animationLayer)
  }

  // 隐藏原始图片
  currentImgElement.style.visibility = 'hidden'
  currentImgElement.style.opacity = '0'
  currentImgElement.style.pointerEvents = 'none'

  await new Promise((resolve) => requestAnimationFrame(resolve))

  // 执行动画
  currentClone.style.transform = `translateX(${direction === 'next' ? '-100%' : '100%'})`
  targetClone.style.transform = 'translateX(0)'

  await new Promise<void>((resolve) => {
    animationTimeout = setTimeout(resolve, 320)
  })

  // 更新索引
  if (direction === 'prev') {
    gotoPrev()
  } else {
    gotoNext()
  }

  // 移除动画层
  animationLayer.remove()
  if (animationTimeout) clearTimeout(animationTimeout)
  animationTimeout = null

  isAnimating.value = false

  // 动画结束：恢复按钮显示状态
  forceButtonVisible.value = false
  updateButtonVisibility()

  currentImgElement.style.visibility = 'visible'
  return true
}

async function handleSwitch(direction: 'prev' | 'next') {
  if (isAnimating.value) return
  try {
    await performSwitchAnimation(direction)
  } finally {
    // 确保异常情况下恢复
    forceButtonVisible.value = false
    updateButtonVisibility()
  }
}
// ---------- 动画相关结束 ----------

// ✅ 使用 shallowRef 优化不频繁变化的静态数据
const emojiList = shallowRef<EmojiItem[]>([
  {
    id: 'like',
    emoji: '👍',
    label: 'React with 👍',
    src: 'https://registry.npmmirror.com/@lobehub/fluent-emoji-anim-1/latest/files/assets/1f44d.webp',
    count: 5,
  },
  {
    id: 'fire',
    emoji: '🔥',
    label: 'React with 🔥',
    src: 'https://registry.npmmirror.com/@lobehub/fluent-emoji-anim-2/latest/files/assets/1f525.webp',
    count: 7,
  },
  {
    id: 'clap',
    emoji: '👏',
    label: 'React with 👏',
    src: 'https://registry.npmmirror.com/@lobehub/fluent-emoji-anim-1/latest/files/assets/1f44f.webp',
    count: 3,
  },
  {
    id: 'praise',
    emoji: '🙌',
    label: 'React with 🙌',
    src: 'https://registry.npmmirror.com/@lobehub/fluent-emoji-anim-3/latest/files/assets/1f62e.webp',
    count: 0,
  },
])

const emojiStates = shallowRef<Record<string, boolean>>({
  like: false,
  love: false,
  fire: false,
  clap: false,
  star: false,
  praise: false,
})

const currentImage = computed(() => imagesShallow.value[currentIndex.value])

// 常量
const MIN_SCALE = 0.1
const MAX_SCALE = 5
const SCALE_STEP = 0.25

// 检查是否为移动设备
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

// 导航函数（更新按钮状态）
const gotoPrev = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--
    resetTransform()
    preloadAdjacentImages()
    updateButtonVisibility()
  }
}

const gotoNext = () => {
  if (currentIndex.value < imagesShallow.value.length - 1) {
    currentIndex.value++
    resetTransform()
    preloadAdjacentImages()
    updateButtonVisibility()
  }
}

const gotoIndex = (index: number) => {
  if (index >= 0 && index < imagesShallow.value.length) {
    currentIndex.value = index
    resetTransform()
    preloadAdjacentImages()
    updateButtonVisibility()
  }
}

// 缩放函数
const resetTransform = () => {
  scale.value = 1
  position.value = { x: 0, y: 0 }
}

const showScaleText = ref(false)
let scaleTextTimer: ReturnType<typeof setTimeout> | null = null

const showScaleIndicator = () => {
  showScaleText.value = true
  if (scaleTextTimer) clearTimeout(scaleTextTimer)
  scaleTextTimer = setTimeout(() => {
    showScaleText.value = false
  }, 1500)
}

const constrainPosition = () => {
  if (scale.value <= 1) {
    position.value = { x: 0, y: 0 }
    return
  }
  const maxOffset = 500 * (scale.value - 1)
  position.value.x = Math.max(-maxOffset, Math.min(maxOffset, position.value.x))
  position.value.y = Math.max(-maxOffset, Math.min(maxOffset, position.value.y))
}

const zoom = (newScale: number, centerX?: number, centerY?: number) => {
  const oldScale = scale.value
  newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale))

  if (Math.abs(newScale - oldScale) < 0.01) return

  const oldPosition = { ...position.value }
  const scaleRatio = newScale / oldScale

  const shouldResetPosition = newScale <= 1 || newScale === 1

  if (shouldResetPosition) {
    position.value = { x: 0, y: 0 }
  } else if (centerX !== undefined && centerY !== undefined) {
    const container = document.querySelector('.main-image-wrapper')
    if (container) {
      const rect = container.getBoundingClientRect()
      const containerCenterX = rect.width / 2
      const containerCenterY = rect.height / 2

      const centerOffsetX = centerX - rect.left - containerCenterX
      const centerOffsetY = centerY - rect.top - containerCenterY

      position.value.x = centerOffsetX - (centerOffsetX - oldPosition.x) * scaleRatio
      position.value.y = centerOffsetY - (centerOffsetY - oldPosition.y) * scaleRatio
    }
  } else {
    position.value.x *= scaleRatio
    position.value.y *= scaleRatio
  }

  scale.value = newScale
  constrainPosition()
  showScaleIndicator()
}

const zoomIn = () => {
  zoom(scale.value + SCALE_STEP)
}

const zoomOut = () => {
  zoom(scale.value - SCALE_STEP)
}

const zoomToFit = () => {
  resetTransform()
}

// 处理关闭
const handleClose = () => {
  emit('closePhoneView')
}

// 切换抽屉
const toggleDrawer = () => {
  drawerOpen.value = !drawerOpen.value
}

// 处理表情点击
const handleEmojiClick = (emojiId: string) => {
  emojiStates.value[emojiId] = !emojiStates.value[emojiId]
  message.show({
    text: `点击了表情: ${emojiId}`,
    messageType: 'glass',
    duration: 2000,
  })
}

// 更新滑动状态
const updateSwipeState = (newState: SwipeState) => {
  swipeState.value = newState
}

// 更新拖动状态
const updateDragging = (dragging: boolean) => {
  isDragging.value = dragging
}

const handleUpdatePosition = (newPosition: { x: number; y: number }) => {
  position.value = newPosition
}

// 键盘快捷键
const handleKeyDown = (e: KeyboardEvent) => {
  switch (e.key) {
    case 'Escape':
      handleClose()
      break
    case 'ArrowLeft':
      if (scale.value === 1) handleSwitch('prev')
      break
    case 'ArrowRight':
      if (scale.value === 1) handleSwitch('next')
      break
    case '+':
    case '=':
      e.preventDefault()
      zoomIn()
      break
    case '-':
      e.preventDefault()
      zoomOut()
      break
    case '0':
      e.preventDefault()
      zoomToFit()
      break
  }
}

// 监听窗口大小变化
const handleResize = () => {
  checkMobile()
}

const onAllThumbnailsLoaded = () => {
  console.log('所有缩略图已加载完成')
}

onMounted(() => {
  gotoIndex(props.initialIndex)
  updateButtonVisibility()
  document.addEventListener('keydown', handleKeyDown)
  window.addEventListener('resize', handleResize)
  checkMobile()
  preloadAdjacentImages()
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('resize', handleResize)
  if (abortController) abortController.abort()
  if (animationTimeout) clearTimeout(animationTimeout)
})
</script>

<template>
  <div class="image-viewer-overlay" @click.stop>
    <!-- 背景层 -->
    <ImageBackground :current-image="currentImage" />

    <!-- 主容器 -->
    <div class="main-viewer-container">
      <!-- 主要内容区域 -->
      <div class="main-content-wrapper">
        <!-- 主图片区域 -->
        <div class="main-image-wrapper">
          <!-- 顶部控制栏 -->
          <TopControls
            :is-mobile="isMobile"
            :drawer-open="drawerOpen"
            @close="handleClose"
            @toggle-drawer="toggleDrawer"
          />
          <MainImage
            ref="mainImageRef"
            :current-image="currentImage"
            :scale="scale"
            :position="position"
            :swipe-state="swipeState"
            :is-mobile="isMobile"
            :images="imagesShallow"
            :current-index="currentIndex"
            :animating="isAnimating"
            @prev="gotoPrev"
            @next="gotoNext"
            @swipe-prev="handleSwitch('prev')"
            @swipe-next="handleSwitch('next')"
            @zoom="zoom"
            @zoom-in="zoomIn"
            @zoom-out="zoomOut"
            @zoom-to-fit="zoomToFit"
            @reset-transform="resetTransform"
            @update-swipe-state="updateSwipeState"
            @update-dragging="updateDragging"
            @update-position="handleUpdatePosition"
          />

          <!-- 缩放控制 -->
          <ZoomControls
            v-if="scale > 1"
            :scale="scale"
            :is-mobile="isMobile"
            @zoom-in="zoomIn"
            @zoom-out="zoomOut"
            @zoom-to-fit="zoomToFit"
          />

          <!-- 表情按钮 -->
          <EmojiButtons
            :emoji-list="emojiList"
            :emoji-states="emojiStates"
            :is-mobile="isMobile"
            :drawer-open="drawerOpen"
            @emoji-click="handleEmojiClick"
          />

          <!-- 左右切换按钮（从子组件移动至此） -->
          <button
            v-show="showPrevBtn"
            type="button"
            class="nav-button prev-button"
            :class="{ 'mobile-visible': isMobile, 'force-visible': forceButtonVisible }"
            @click="handleSwitch('prev')"
          >
            <UIcon name="ic:baseline-keyboard-arrow-left" />
          </button>
          <button
            v-show="showNextBtn"
            type="button"
            class="nav-button next-button"
            :class="{ 'mobile-visible': isMobile, 'force-visible': forceButtonVisible }"
            @click="handleSwitch('next')"
          >
            <UIcon name="material-symbols:chevron-right" />
          </button>
        </div>

        <!-- 缩略图条（可选，已注释） -->
        <!-- <ThumbnailStrip
          v-if="imagesShallow.length > 0"
          :images="imagesShallow"
          :current-index="currentIndex"
          :is-mobile="isMobile"
          @goto-index="gotoIndex"
          @all-loaded="onAllThumbnailsLoaded"
        /> -->
      </div>

      <DesktopSidebar
        v-if="!isMobile"
        :current-image="currentImage"
        :scale="scale"
        :min-scale="MIN_SCALE"
        :max-scale="MAX_SCALE"
        @zoom-in="zoomIn"
        @zoom-out="zoomOut"
        @zoom-to-fit="zoomToFit"
      />
    </div>

    <!-- 移动端抽屉 -->
    <MobileDrawer
      v-if="isMobile"
      :drawer-open="drawerOpen"
      :current-image="currentImage"
      :scale="scale"
      :min-scale="MIN_SCALE"
      :max-scale="MAX_SCALE"
      @toggle-drawer="toggleDrawer"
      @zoom-in="zoomIn"
      @zoom-out="zoomOut"
      @zoom-to-fit="zoomToFit"
    />
  </div>
</template>

<style scoped>
.image-viewer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  --color-accent: #626670;
}

.main-viewer-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 50;
  display: flex;
}

.main-content-wrapper {
  flex: 1;
  display: flex;
  overflow: hidden;
  position: relative;
  flex-direction: column;
}

.main-image-wrapper {
  flex: 1;
  position: relative;
  overflow: hidden;
  z-index: 1;
}

/* 切换按钮样式 */
.nav-button {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 33px;
  height: 33px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
  backdrop-filter: blur(10px);
  z-index: 1010; /* 高于动画层的 1000 */
}
.nav-button:hover {
  background: rgba(0, 0, 0, 0.7);
  opacity: 1 !important;
}
.prev-button {
  left: 20px;
}
.next-button {
  right: 20px;
}
.mobile-visible {
  opacity: 0.8; /* 移动端始终显示 */
}
/* 动画期间强制可见类 */
.force-visible {
  opacity: 1 !important;
  visibility: visible !important;
}

.main-image-wrapper:hover .nav-button {
  opacity: 0.8; /* 桌面端 hover 时显示 */
}
.main-image-wrapper:hover .nav-button.force-visible {
  opacity: 1 !important; /* 如果强制可见，优先使用高亮 */
}

@media (max-width: 768px) {
  .main-content-wrapper {
    flex-direction: column;
  }

  .main-image-wrapper {
    height: calc(100% - 90px);
  }

  .nav-button {
    min-width: 44px;
    min-height: 44px;
  }
}
</style>
