<script setup lang="ts">
import * as THREE from 'three'
import { nextTick, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue'
import type { PhotoItem, SwipeState, TransformState } from './types'

const props = defineProps<{
  currentImage?: PhotoItem
  scale: number
  position: TransformState['position']
  swipeState: SwipeState
  isMobile: boolean
  images: PhotoItem[]
  currentIndex: number
  animating?: boolean
}>()

const emit = defineEmits<{
  prev: []
  next: []
  swipePrev: []
  swipeNext: []
  zoom: [newScale: number, centerX?: number, centerY?: number]
  zoomIn: []
  zoomOut: []
  zoomToFit: []
  resetTransform: []
  updateSwipeState: [state: SwipeState]
  updateDragging: [dragging: boolean]
  updatePosition: [position: { x: number; y: number }]
}>()

// ---------- WebGL & DOM 状态 ----------
const canvasElement = ref<HTMLCanvasElement | null>(null)
const imageWrapper = ref<HTMLElement | null>(null)

let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.OrthographicCamera | null = null
let material: THREE.MeshBasicMaterial | null = null
let mesh: THREE.Mesh | null = null

let originalTexture: THREE.Texture | null = null
let maxTextureSize = 4096

// ---------- 图片加载与显示状态 ----------
const displayThumbSrc = shallowRef('')
const thumbLoaded = ref(false)
const imageError = ref(false)
const originalImageLoading = ref(false)
const originalReady = ref(false)

const thumbOpacity = ref(1)
const canvasOpacity = ref(0)

let abortController: AbortController | null = null
let transitionRAF: number | null = null

// ---------- WebGL 初始化与渲染 ----------
const initWebGL = () => {
  if (!canvasElement.value) return

  renderer = new THREE.WebGLRenderer({
    canvas: canvasElement.value,
    alpha: true,
    antialias: false,
    powerPreference: 'high-performance',
  })

  renderer.setPixelRatio(1)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  maxTextureSize = renderer.capabilities.maxTextureSize || 4096

  scene = new THREE.Scene()

  // 设置相机的近裁和远裁平面，并将相机稍微后移，防止 z-fighting 或被近裁平面裁剪导致空白
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10)
  camera.position.z = 1

  material = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 1,
  })

  const geometry = new THREE.PlaneGeometry(2, 2)
  mesh = new THREE.Mesh(geometry, material)
  scene.add(mesh)
}

const renderWebGL = () => {
  if (renderer && scene && camera) {
    renderer.render(scene, camera)
  }
}

const disposeWebGLTexture = () => {
  if (originalTexture) {
    originalTexture.dispose()
    originalTexture = null
  }
  if (material) {
    material.map = null
    material.needsUpdate = true
  }
  if (transitionRAF) cancelAnimationFrame(transitionRAF)

  originalReady.value = false
  canvasOpacity.value = 0
  thumbOpacity.value = 1
}

const getSafeSize = (width: number, height: number, maxSize: number) => {
  if (width <= maxSize && height <= maxSize) return { width, height }
  const ratio = width / height
  if (width > height) {
    return { width: maxSize, height: Math.round(maxSize / ratio) }
  } else {
    return { width: Math.round(maxSize * ratio), height: maxSize }
  }
}

// 存储原图尺寸，用于后续同步 CSS
let originalImageWidth = 0
let originalImageHeight = 0

const updateCanvasSize = (width: number, height: number) => {
  if (!canvasElement.value || !renderer || !camera || !mesh) return

  // 保存原图尺寸
  originalImageWidth = width
  originalImageHeight = height

  // 1. Canvas 像素分辨率使用原图的 safeSize（保持高质量）
  const safeSize = getSafeSize(width, height, maxTextureSize)
  canvasElement.value.width = safeSize.width
  canvasElement.value.height = safeSize.height
  renderer.setSize(safeSize.width, safeSize.height, false)

  // 2. 相机和 Plane 与 canvas 像素分辨率完全匹配
  camera.left = -safeSize.width / 2
  camera.right = safeSize.width / 2
  camera.top = safeSize.height / 2
  camera.bottom = -safeSize.height / 2
  camera.updateProjectionMatrix()

  mesh.geometry.dispose()
  mesh.geometry = new THREE.PlaneGeometry(safeSize.width, safeSize.height)

  // 3. CSS 尺寸稍后由 syncCanvasDisplaySize 根据 img 的显示尺寸设置
  //    这里先清空，避免残留的内联样式干扰
  canvasElement.value.style.width = ''
  canvasElement.value.style.height = ''

  console.log('[v0] Canvas size updated:', {
    originalImageSize: { w: width, h: height },
    safeSize
  })

  renderWebGL()
}

// 同步 canvas 的 CSS 显示尺寸与 img 完全一致
// canvas 的像素分辨率保持不变（高质量），只调整 CSS 显示尺寸
const syncCanvasDisplaySize = (imgElement: HTMLImageElement) => {
  if (!canvasElement.value) return
  
  const imgWidth = imgElement.offsetWidth
  const imgHeight = imgElement.offsetHeight
  
  console.log('[v0] syncCanvasDisplaySize:', {
    imgDisplaySize: { w: imgWidth, h: imgHeight },
    canvasPixelSize: { w: canvasElement.value.width, h: canvasElement.value.height }
  })
  
  // 只设置 CSS 尺寸，不改变 canvas 的像素分辨率
  // 浏览器会自动做高质量的降采样
  if (imgWidth > 0 && imgHeight > 0) {
    canvasElement.value.style.width = `${imgWidth}px`
    canvasElement.value.style.height = `${imgHeight}px`
  }
}

// ---------- 原生缩略图加载事件 ----------
const handleThumbLoad = () => {
  thumbLoaded.value = true
  imageError.value = false
  emit('zoomToFit')
  nextTick(() => {
    // 获取 img 元素的实际显示尺寸，同步到 canvas
    const imgElements = document.querySelectorAll('.thumb-layer')
    if (imgElements.length > 0 && imgElements[0] instanceof HTMLImageElement) {
      syncCanvasDisplaySize(imgElements[0] as HTMLImageElement)
    }
    applyTransform()
  })
}

const handleThumbError = () => {
  imageError.value = true
}

// 封装异步图片加载（自动处理 EXIF 旋转）
const loadImageAsync = (
  url: string,
  signal: AbortSignal,
  useCors = true
): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.decoding = 'async'

    const cleanup = () => {
      signal.removeEventListener('abort', onAbort)
      img.onload = null
      img.onerror = null
    }

    const onAbort = () => {
      cleanup()
      img.src = ''
      reject(new DOMException('Aborted', 'AbortError'))
    }

    if (signal.aborted) return onAbort()
    signal.addEventListener('abort', onAbort)

    img.onload = () => {
      cleanup()
      resolve(img)
    }
    img.onerror = () => {
      cleanup()
      reject(new Error('Image load failed'))
    }

    if (useCors) img.crossOrigin = 'anonymous'
    img.src = url
  })
}

// ---------- 核心图片显示逻辑 ----------
const showImage = async (image: PhotoItem) => {
  if (abortController) {
    abortController.abort()
    abortController = null
  }

  disposeWebGLTexture()
  thumbLoaded.value = false
  imageError.value = false
  originalImageLoading.value = false

  const thumbUrl = (image as any).thumbUrl || image.url
  const originalUrl = image.url

  // 1. 立即加载原生缩略图（利用浏览器缓存，瞬间显示）
  displayThumbSrc.value = thumbUrl
  
  // 当图片源改变时，也要重新设置 ResizeObserver
  nextTick(() => {
    const thumbImg = document.querySelector('.thumb-layer') as HTMLImageElement
    if (thumbImg && typeof ResizeObserver !== 'undefined') {
      if (resizeObserver) resizeObserver.disconnect()
      resizeObserver = new ResizeObserver(() => {
        syncCanvasDisplaySize(thumbImg)
      })
      resizeObserver.observe(thumbImg)
    }
  })

  // 2. 如果存在高清原图，在后台进行 WebGL 异步加载
  if (thumbUrl !== originalUrl) {
    abortController = new AbortController()
    const signal = abortController.signal

    originalImageLoading.value = true

    try {
      let img: HTMLImageElement | null = null
      try {
        img = await loadImageAsync(originalUrl, signal, true)
      } catch (e: any) {
        if (e.name === 'AbortError') return
        img = await loadImageAsync(originalUrl, signal, false)
      }
      if (signal.aborted || !img) return

      // 更新画布尺寸为原图的物理分辨率，并重新计算相机比例！
      console.log('[v0] Original image loaded:', img.naturalWidth, 'x', img.naturalHeight)
      updateCanvasSize(img.naturalWidth, img.naturalHeight)

      originalTexture = new THREE.Texture(img)
      originalTexture.flipY = true // WebGL Y轴翻转，结合 HTMLImageElement 可完美保留 EXIF 旋转
      originalTexture.colorSpace = THREE.SRGBColorSpace // 修复颜色偏暗
      originalTexture.minFilter = THREE.LinearFilter
      originalTexture.magFilter = THREE.LinearFilter
      originalTexture.generateMipmaps = false
      originalTexture.needsUpdate = true

      if (material) {
        material.map = originalTexture
        material.needsUpdate = true
      }

      originalReady.value = true
      originalImageLoading.value = false

      // 等待 Vue 将 display: none 移除后渲染，防止尺寸计算异常
      nextTick(() => {
        if (signal.aborted) return
        
        // 同步 canvas 尺寸与显示的 img 完全一致
        const imgElements = document.querySelectorAll('.thumb-layer')
        if (imgElements.length > 0 && imgElements[0] instanceof HTMLImageElement) {
          syncCanvasDisplaySize(imgElements[0] as HTMLImageElement)
        }
        
        renderWebGL()

        // 执行原图交叉溶解（Crossfade）动画
        const animateFade = () => {
          if (canvasOpacity.value < 1.0) {
            canvasOpacity.value = Math.min(1.0, canvasOpacity.value + 0.08) // 约 200ms
            thumbOpacity.value = Math.max(0.0, 1.0 - canvasOpacity.value)

            if (canvasOpacity.value < 1.0) {
              transitionRAF = requestAnimationFrame(animateFade)
            } else {
              thumbOpacity.value = 0
            }
          }
        }
        transitionRAF = requestAnimationFrame(animateFade)
      })
    } catch (error: any) {
      if (error.name === 'AbortError') return
      console.error('High-res image load error:', error)
      originalImageLoading.value = false
      // 原图加载失败时，降级保留并显示缩略图
    }
  } else {
    // 缩略图就是原图，无需 WebGL 额外处理
    originalReady.value = false
  }
}

// ---------- 交互与事件处理 ----------
const isMouseDragging = ref(false)
const mouseDragStart = ref({ x: 0, y: 0, offsetX: 0, offsetY: 0 })

let lastTapTime = 0
let initialPinchDistance = 0
let initialScaleValue = 1
let isPinching = false
const isTouchDragging = ref(false)
const touchDragStart = ref({ x: 0, y: 0, offsetX: 0, offsetY: 0 })

let wheelTimeout: ReturnType<typeof setTimeout> | null = null
let moveRAF: number | null = null
let touchMoveRAF: number | null = null

const handleMouseDown = (e: MouseEvent) => {
  if (props.animating) return
  if (e.button !== 0 || props.scale <= 1) return

  isMouseDragging.value = true
  mouseDragStart.value = {
    x: e.clientX,
    y: e.clientY,
    offsetX: props.position.x,
    offsetY: props.position.y,
  }

  if (imageWrapper.value) {
    imageWrapper.value.style.cursor = 'grabbing'
  }
  emit('updateDragging', true)

  e.preventDefault()
  e.stopPropagation()
}

const handleMouseMove = (e: MouseEvent) => {
  if (props.animating) return
  if (!isMouseDragging.value || props.scale <= 1) return

  if (moveRAF) return
  moveRAF = requestAnimationFrame(() => {
    const deltaX = e.clientX - mouseDragStart.value.x
    const deltaY = e.clientY - mouseDragStart.value.y
    const newX = mouseDragStart.value.offsetX + deltaX
    const newY = mouseDragStart.value.offsetY + deltaY
    emit('updatePosition', { x: newX, y: newY })
    moveRAF = null
  })
}

const handleMouseUp = (e: MouseEvent) => {
  if (!isMouseDragging.value) return

  isMouseDragging.value = false
  if (imageWrapper.value) {
    imageWrapper.value.style.cursor = props.scale > 1 ? 'grab' : 'default'
  }
  emit('updateDragging', false)
  e.preventDefault()
  e.stopPropagation()
}

const handleMouseLeave = (e: MouseEvent) => {
  if (isMouseDragging.value) {
    isMouseDragging.value = false
    if (imageWrapper.value) {
      imageWrapper.value.style.cursor = props.scale > 1 ? 'grab' : 'default'
    }
    emit('updateDragging', false)
  }
}

const handleWheel = (e: WheelEvent) => {
  if (props.animating) return
  if (props.isMobile) return
  e.preventDefault()

  if (wheelTimeout) return

  const delta = e.deltaY < 0 ? -0.1 : 0.1
  const newScale = props.scale * (1 - delta)
  emit('zoom', newScale, e.clientX, e.clientY)

  wheelTimeout = setTimeout(() => {
    wheelTimeout = null
  }, 16)
}

const handleTouchStart = (e: TouchEvent) => {
  if (props.animating) return
  const touches = e.touches

  if (touches.length === 1) {
    const touch = touches[0]
    const newSwipeState = {
      ...props.swipeState,
      isSwiping: true,
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      deltaX: 0,
      deltaY: 0,
      direction: 0,
      opacity: 1,
      isHorizontalSwipe: false,
    }
    emit('updateSwipeState', newSwipeState)

    if (props.scale > 1) {
      isTouchDragging.value = true
      touchDragStart.value = {
        x: touch.clientX,
        y: touch.clientY,
        offsetX: props.position.x,
        offsetY: props.position.y,
      }
      if (imageWrapper.value) {
        imageWrapper.value.style.cursor = 'grabbing'
      }
      emit('updateDragging', true)
    }

    const currentTime = Date.now()
    if (currentTime - lastTapTime < 300) {
      if (props.scale < 1.5) {
        emit('zoom', 2, touch.clientX, touch.clientY)
      } else {
        emit('zoomToFit')
      }
    }
    lastTapTime = currentTime

    e.preventDefault()
  } else if (touches.length === 2) {
    isPinching = true
    isTouchDragging.value = false

    const touch1 = touches[0]
    const touch2 = touches[1]
    initialPinchDistance = Math.hypot(
      touch2.clientX - touch1.clientX,
      touch2.clientY - touch1.clientY
    )
    initialScaleValue = props.scale

    emit('updateSwipeState', { ...props.swipeState, isSwiping: false })
    e.preventDefault()
  }
}

const handleTouchMove = (e: TouchEvent) => {
  if (props.animating) return
  const touches = e.touches

  if (touches.length === 1 && props.swipeState.isSwiping) {
    if (touchMoveRAF) return
    touchMoveRAF = requestAnimationFrame(() => {
      const touch = touches[0]
      const deltaX = touch.clientX - props.swipeState.startX
      const deltaY = touch.clientY - props.swipeState.startY

      const newSwipeState = {
        ...props.swipeState,
        currentX: touch.clientX,
        deltaX,
        deltaY,
      }

      if (!props.swipeState.isHorizontalSwipe) {
        if (Math.abs(deltaX) > 30 || Math.abs(deltaY) > 30) {
          newSwipeState.isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY)
        }
      }

      if (props.scale === 1 && newSwipeState.isHorizontalSwipe) {
        newSwipeState.direction = deltaX > 0 ? 1 : -1
        const opacity = Math.max(0.3, 1 - Math.abs(deltaX) / 200)
        newSwipeState.opacity = opacity
      } else if (props.scale > 1 && isTouchDragging.value) {
        const touchDeltaX = touch.clientX - touchDragStart.value.x
        const touchDeltaY = touch.clientY - touchDragStart.value.y
        const newX = touchDragStart.value.offsetX + touchDeltaX
        const newY = touchDragStart.value.offsetY + touchDeltaY
        emit('updatePosition', { x: newX, y: newY })
      }

      emit('updateSwipeState', newSwipeState)
      touchMoveRAF = null
    })
    e.preventDefault()
  } else if (touches.length === 2 && isPinching) {
    const touch1 = touches[0]
    const touch2 = touches[1]
    const currentPinchDistance = Math.hypot(
      touch2.clientX - touch1.clientX,
      touch2.clientY - touch1.clientY
    )
    if (initialPinchDistance > 0) {
      const newScale = initialScaleValue * (currentPinchDistance / initialPinchDistance)
      const centerX = (touch1.clientX + touch2.clientX) / 2
      const centerY = (touch1.clientY + touch2.clientY) / 2
      emit('zoom', newScale, centerX, centerY)
    }
    e.preventDefault()
  }
}

const handleTouchEnd = (e: TouchEvent) => {
  if (props.animating) return
  if (props.swipeState.isSwiping && props.scale === 1 && props.swipeState.isHorizontalSwipe) {
    const deltaX = props.swipeState.deltaX
    if (Math.abs(deltaX) > 80) {
      if (deltaX > 0) {
        emit('swipePrev')
      } else {
        emit('swipeNext')
      }
    }
    const newSwipeState = {
      ...props.swipeState,
      isSwiping: false,
      opacity: 1,
    }
    emit('updateSwipeState', newSwipeState)
  } else if (props.swipeState.isSwiping && !props.swipeState.isHorizontalSwipe) {
    emit('updateSwipeState', { ...props.swipeState, isSwiping: false })
  }

  if (isPinching) {
    isPinching = false
    initialPinchDistance = 0
  }

  if (isTouchDragging.value) {
    isTouchDragging.value = false
    if (imageWrapper.value) {
      imageWrapper.value.style.cursor = props.scale > 1 ? 'grab' : 'default'
    }
    emit('updateDragging', false)
  }

  e.preventDefault()
}

const handleImageDoubleClick = (e: MouseEvent) => {
  if (props.animating) return
  e.stopPropagation()
  if (props.scale < 1.5) {
    emit('zoom', 2, e.clientX, e.clientY)
  } else {
    emit('zoomToFit')
  }
}

const applyTransform = () => {
  if (imageWrapper.value) {
    imageWrapper.value.style.transform = `translate3d(${props.position.x}px, ${props.position.y}px, 0) scale(${props.scale})`
  }
}

// 暴露给父组件用于动画测量
defineExpose({
  getImageElement: () => imageWrapper.value,
  getContainerElement: () => document.querySelector('.image-display-container') as HTMLElement,
})

// ---------- 生命周期与监听 ----------
watch(
  () => props.currentImage,
  (newImage) => {
    if (newImage) showImage(newImage)
  },
  { immediate: false }
)

watch(
  () => props.scale,
  (newScale) => {
    if (imageWrapper.value) {
      imageWrapper.value.style.cursor = newScale > 1 ? 'grab' : 'default'
    }
    applyTransform()
  }
)

watch(
  () => props.position,
  () => {
    applyTransform()
  },
  { deep: true, flush: 'sync' }
)

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  initWebGL()
  if (props.currentImage) {
    showImage(props.currentImage)
  }
  
  // 监听 img 元素尺寸变化，自动同步到 canvas
  const thumbImg = document.querySelector('.thumb-layer') as HTMLImageElement
  if (thumbImg && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      syncCanvasDisplaySize(thumbImg)
    })
    resizeObserver.observe(thumbImg)
  }
})

onUnmounted(() => {
  if (wheelTimeout) clearTimeout(wheelTimeout)
  if (moveRAF) cancelAnimationFrame(moveRAF)
  if (touchMoveRAF) cancelAnimationFrame(touchMoveRAF)
  if (abortController) abortController.abort()
  if (resizeObserver) resizeObserver.disconnect()
  disposeWebGLTexture()
  if (renderer) renderer.dispose()
})
</script>

<template>
  <div
    class="main-image-container"
    :class="{ 'animating-disabled': animating }"
    @mousedown="handleMouseDown"
    @mousemove="handleMouseMove"
    @mouseup="handleMouseUp"
    @mouseleave="handleMouseLeave"
    @wheel="handleWheel"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
    @touchcancel="handleTouchEnd"
  >
    <div class="image-display-container">
      <div v-if="!thumbLoaded && !originalReady && !imageError" class="loading-overlay">
        <div class="loading-spinner"></div>
        <div class="loading-text">加载中...</div>
      </div>

      <div v-if="imageError" class="error-overlay">
        <UIcon name="material-symbols:error-outline" class="error-icon" />
        <div class="error-text">图片加载失败</div>
      </div>

      <div v-if="originalImageLoading && thumbLoaded" class="hq-loading-indicator">
        <UIcon name="material-symbols:sync-rounded" class="hq-loading-icon" />
        <span>正在加载高清原图</span>
      </div>

      <!-- 图片层叠包装器：接管缩放和拖拽动画 -->
      <div
        ref="imageWrapper"
        class="image-wrapper"
        :class="{ 'zoom-cursor': scale > 1 }"
        @dblclick="handleImageDoubleClick"
        :style="{
          opacity: swipeState.opacity,
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          cursor: scale > 1 ? 'grab' : 'default',
        }"
      >
        <!-- 原生缩略图层（利用浏览器缓存，瞬间显示） -->
        <img
          v-show="currentImage && !imageError"
          :src="displayThumbSrc"
          class="main-image-content thumb-layer"
          @load="handleThumbLoad"
          @error="handleThumbError"
          :style="{ opacity: thumbOpacity }"
          alt="图片"
        />

        <!-- 高清原图 WebGL 渲染层 -->
        <canvas
          v-show="originalReady && !imageError"
          ref="canvasElement"
          class="main-image-content webgl-layer"
          :style="{ opacity: canvasOpacity }"
        ></canvas>
      </div>

      <transition name="slide-indicator">
        <div
          v-if="
            swipeState.isSwiping &&
            swipeState.isHorizontalSwipe &&
            Math.abs(swipeState.deltaX) > 20 &&
            scale === 1
          "
          class="swipe-indicator"
        >
          <div v-if="swipeState.direction > 0 && currentIndex > 0" class="indicator-left">
            <div class="indicator-content">
              <UIcon name="material-symbols:chevron-left" class="indicator-icon" />
              上一张
            </div>
          </div>
          <div
            v-if="swipeState.direction < 0 && currentIndex < images.length - 1"
            class="indicator-right"
          >
            <div class="indicator-content">
              下一张
              <UIcon name="material-symbols:chevron-right" class="indicator-icon" />
            </div>
          </div>
        </div>
      </transition>
    </div>

    <div class="hint-text" :class="{ 'hint-mobile': isMobile, 'hint-desktop': !isMobile }">
      {{ isMobile ? '双指缩放 • 左右滑动切换 • 双击放大' : '双击缩放 • 滚轮缩放 • 拖拽查看' }}
    </div>
  </div>
</template>

<style scoped>
.main-image-container {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  overflow: hidden;
  touch-action: none;
  user-select: none;
}

.main-image-container.animating-disabled {
  pointer-events: none;
}

.image-display-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.image-wrapper {
  position: relative;
  /* 这里由内部的 img 标签撑起实际尺寸 */
  transition: transform 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  will-change: transform;
}

/* 可见的 img（缩略图）：正常显示并撑起容器尺寸 */
.main-image-content {
  display: block;
  max-width: 100%;
  max-height: 100vh;
  width: auto;
  height: auto;
  user-select: none;
  -webkit-user-drag: none;
}

.thumb-layer {
  position: relative;
  z-index: 1;
}

/* canvas 覆盖在 img 上面，尺寸和位置与 img 完全一致 */
.webgl-layer {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
  display: block;
}

.zoom-cursor {
  cursor: grab !important;
}
.zoom-cursor:active {
  cursor: grabbing !important;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  z-index: 5;
}
.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 1s ease-in-out infinite;
}

/* 高清原图加载提示 */
.hq-loading-indicator {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 10;
  backdrop-filter: blur(8px);
  animation: fade-in 0.3s ease;
}
.hq-loading-icon {
  font-size: 16px;
  animation: spin 1.5s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.loading-text {
  color: white;
  font-size: 14px;
}

.error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  z-index: 5;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 10px;
  padding: 20px;
}
.error-icon {
  font-size: 48px;
  color: #ff6b6b;
}
.error-text {
  color: white;
  font-size: 16px;
  font-weight: bold;
}

.swipe-indicator {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 10;
}
.indicator-left {
  position: absolute;
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
}
.indicator-right {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
}
.indicator-content {
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 14px;
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
.indicator-icon {
  font-size: 18px;
}

.hint-text {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 12px;
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
  white-space: nowrap;
  z-index: 30;
}
.main-image-container:hover .hint-text {
  opacity: 0.8;
}

.slide-indicator-enter-active {
  animation: slide-in 0.2s ease-out;
}
.slide-indicator-leave-active {
  animation: slide-out 0.2s ease-out;
}
@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes slide-out {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(10px);
  }
}

@media (hover: none) and (pointer: coarse) {
  .main-image-container {
    -webkit-tap-highlight-color: transparent;
  }
}

:global(.image-switch-animation-layer) {
  position: fixed;
  z-index: 1000;
  pointer-events: none;
  will-change: transform;
  background: transparent;
}
</style>
