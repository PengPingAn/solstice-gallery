<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from "vue";
import type { PhotoItem, SwipeState, TransformState } from "./types";

const props = defineProps<{
  currentImage?: PhotoItem;
  scale: number;
  position: TransformState["position"];
  swipeState: SwipeState;
  isMobile: boolean;
  images: PhotoItem[];
  currentIndex: number;
}>();

const emit = defineEmits<{
  prev: [];
  next: [];
  zoom: [newScale: number, centerX?: number, centerY?: number];
  zoomIn: [];
  zoomOut: [];
  zoomToFit: [];
  resetTransform: [];
  updateSwipeState: [state: SwipeState];
  updateDragging: [dragging: boolean];
  updatePosition: [position: { x: number; y: number }];
}>();

const imageElement = ref<HTMLImageElement | null>(null);
const imageLoaded = ref(false);
const imageError = ref(false);

// 鼠标拖动状态
const isMouseDragging = ref(false);
const mouseDragStart = ref({ x: 0, y: 0, offsetX: 0, offsetY: 0 });

// 触摸状态
let lastTapTime = 0;
let initialPinchDistance = 0;
let initialScaleValue = 1;
let isPinching = false;
const isTouchDragging = ref(false);
const touchDragStart = ref({ x: 0, y: 0, offsetX: 0, offsetY: 0 });

// 鼠标滚轮
let wheelTimeout: ReturnType<typeof setTimeout> | null = null;

// 图片加载处理
const handleImageLoad = () => {
  imageLoaded.value = true;
  imageError.value = false;
  applyTransform();
};

const handleImageError = () => {
  imageLoaded.value = false;
  imageError.value = true;
};

// 应用变换
const applyTransform = () => {
  if (imageElement.value) {
    imageElement.value.style.transform = `translate(${props.position.x}px, ${props.position.y}px) scale(${props.scale})`;
  }
};

// ==================== 鼠标事件处理 ====================
const handleMouseDown = (e: MouseEvent) => {
  if (e.button !== 0 || props.scale <= 1) return;

  isMouseDragging.value = true;
  mouseDragStart.value = {
    x: e.clientX,
    y: e.clientY,
    offsetX: props.position.x,
    offsetY: props.position.y,
  };

  if (imageElement.value) {
    imageElement.value.style.cursor = "grabbing";
  }
  emit("updateDragging", true);

  e.preventDefault();
  e.stopPropagation();
};

const handleMouseMove = (e: MouseEvent) => {
  if (!isMouseDragging.value || props.scale <= 1) return;

  const deltaX = e.clientX - mouseDragStart.value.x;
  const deltaY = e.clientY - mouseDragStart.value.y;

  const newX = mouseDragStart.value.offsetX + deltaX;
  const newY = mouseDragStart.value.offsetY + deltaY;

  emit("updatePosition", { x: newX, y: newY });

  e.preventDefault();
  e.stopPropagation();
};

const handleMouseUp = (e: MouseEvent) => {
  if (!isMouseDragging.value) return;

  isMouseDragging.value = false;

  if (imageElement.value) {
    imageElement.value.style.cursor = props.scale > 1 ? "grab" : "default";
  }
  emit("updateDragging", false);

  e.preventDefault();
  e.stopPropagation();
};

const handleMouseLeave = (e: MouseEvent) => {
  if (isMouseDragging.value) {
    isMouseDragging.value = false;

    if (imageElement.value) {
      imageElement.value.style.cursor = props.scale > 1 ? "grab" : "default";
    }
    emit("updateDragging", false);
  }
};

// 鼠标滚轮缩放
const handleWheel = (e: WheelEvent) => {
  if (props.isMobile) return;

  e.preventDefault();

  if (wheelTimeout) return;

  const delta = e.deltaY < 0 ? -0.1 : 0.1;
  const newScale = props.scale * (1 - delta);

  emit("zoom", newScale, e.clientX, e.clientY);

  wheelTimeout = setTimeout(() => {
    wheelTimeout = null;
  }, 16);
};

// ==================== 触摸事件处理 ====================
const handleTouchStart = (e: TouchEvent) => {
  const touches = e.touches;

  if (touches.length === 1) {
    // 单指触摸 - 准备拖动或切换
    const touch = touches[0];
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
    };
    emit("updateSwipeState", newSwipeState);

    // 如果已经缩放，准备拖动
    if (props.scale > 1) {
      isTouchDragging.value = true;
      touchDragStart.value = {
        x: touch.clientX,
        y: touch.clientY,
        offsetX: props.position.x,
        offsetY: props.position.y,
      };

      if (imageElement.value) {
        imageElement.value.style.cursor = "grabbing";
      }
      emit("updateDragging", true);
    }

    // 检测双击
    const currentTime = Date.now();
    if (currentTime - lastTapTime < 300) {
      if (props.scale < 1.5) {
        emit("zoom", 2, touch.clientX, touch.clientY);
      } else {
        emit("zoomToFit");
      }
    }
    lastTapTime = currentTime;

    e.preventDefault();
  } else if (touches.length === 2) {
    // 双指触摸 - 开始缩放
    isPinching = true;
    isTouchDragging.value = false;

    const touch1 = touches[0];
    const touch2 = touches[1];
    initialPinchDistance = Math.hypot(
      touch2.clientX - touch1.clientX,
      touch2.clientY - touch1.clientY
    );
    initialScaleValue = props.scale;

    // 重置单指滑动状态
    emit("updateSwipeState", { ...props.swipeState, isSwiping: false });

    e.preventDefault();
  }
};

const handleTouchMove = (e: TouchEvent) => {
  const touches = e.touches;

  if (touches.length === 1 && props.swipeState.isSwiping) {
    // 单指移动
    const touch = touches[0];
    const deltaX = touch.clientX - props.swipeState.startX;
    const deltaY = touch.clientY - props.swipeState.startY;

    const newSwipeState = {
      ...props.swipeState,
      currentX: touch.clientX,
      deltaX,
      deltaY,
    };

    if (!props.swipeState.isHorizontalSwipe) {
      // 判断滑动方向
      if (Math.abs(deltaX) > 30 || Math.abs(deltaY) > 30) {
        newSwipeState.isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);
      }
    }

    if (props.scale === 1 && newSwipeState.isHorizontalSwipe) {
      // 未缩放时水平滑动 - 准备切换图片
      newSwipeState.direction = deltaX > 0 ? 1 : -1;

      // 计算透明度（仅在未缩放时）
      const opacity = Math.max(0.3, 1 - Math.abs(deltaX) / 200);
      newSwipeState.opacity = opacity;

      if (imageElement.value) {
        imageElement.value.style.opacity = opacity.toString();
      }
    } else if (props.scale > 1 && isTouchDragging.value) {
      // 缩放状态下 - 拖动图片
      const touchDeltaX = touch.clientX - touchDragStart.value.x;
      const touchDeltaY = touch.clientY - touchDragStart.value.y;

      const newX = touchDragStart.value.offsetX + touchDeltaX;
      const newY = touchDragStart.value.offsetY + touchDeltaY;

      emit("updatePosition", { x: newX, y: newY });
    }

    emit("updateSwipeState", newSwipeState);
    e.preventDefault();
  } else if (touches.length === 2 && isPinching) {
    // 双指移动 - 缩放
    const touch1 = touches[0];
    const touch2 = touches[1];

    const currentPinchDistance = Math.hypot(
      touch2.clientX - touch1.clientX,
      touch2.clientY - touch1.clientY
    );

    if (initialPinchDistance > 0) {
      const newScale = initialScaleValue * (currentPinchDistance / initialPinchDistance);
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;

      emit("zoom", newScale, centerX, centerY);
    }

    e.preventDefault();
  }
};

const handleTouchEnd = (e: TouchEvent) => {
  if (
    props.swipeState.isSwiping &&
    props.scale === 1 &&
    props.swipeState.isHorizontalSwipe
  ) {
    // 单指水平滑动结束 - 检查是否需要切换图片
    const deltaX = props.swipeState.deltaX;

    if (Math.abs(deltaX) > 80) {
      // 达到阈值，执行切换
      if (deltaX > 0) {
        emit("prev");
      } else if (deltaX < 0) {
        emit("next");
      }
    }

    // 重置状态
    const newSwipeState = {
      ...props.swipeState,
      isSwiping: false,
      opacity: 1,
    };
    emit("updateSwipeState", newSwipeState);

    // 恢复图片透明度
    if (imageElement.value) {
      imageElement.value.style.opacity = "1";
    }
  } else if (props.swipeState.isSwiping && !props.swipeState.isHorizontalSwipe) {
    // 垂直滑动，不处理
    emit("updateSwipeState", { ...props.swipeState, isSwiping: false });
  }

  if (isPinching) {
    // 双指缩放结束
    isPinching = false;
    initialPinchDistance = 0;
  }

  if (isTouchDragging.value) {
    // 拖动结束
    isTouchDragging.value = false;

    if (imageElement.value) {
      imageElement.value.style.cursor = props.scale > 1 ? "grab" : "default";
    }
    emit("updateDragging", false);
  }

  e.preventDefault();
};

// 图片双击事件
const handleImageDoubleClick = (e: MouseEvent) => {
  e.stopPropagation();

  if (props.scale < 1.5) {
    emit("zoom", 2, e.clientX, e.clientY);
  } else {
    emit("zoomToFit");
  }
};

// 监听scale变化，更新光标
watch(
  () => props.scale,
  (newScale) => {
    if (imageElement.value) {
      imageElement.value.style.cursor = newScale > 1 ? "grab" : "default";
    }
    applyTransform();
  }
);

// 监听position变化
watch(
  () => props.position,
  () => {
    applyTransform();
  },
  { deep: true }
);

// 监听当前图片变化
watch(
  () => props.currentImage,
  () => {
    imageLoaded.value = false;
    imageError.value = false;
    nextTick(() => {
      applyTransform();
    });
  }
);

onMounted(() => {
  applyTransform();
});

onUnmounted(() => {
  if (wheelTimeout) clearTimeout(wheelTimeout);
});
</script>

<template>
  <!-- 主图片显示区域 -->
  <div
    class="main-image-container"
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
    <!-- 图片容器 -->
    <div class="image-display-container">
      <!-- 加载状态提示 -->
      <div v-if="!imageLoaded && !imageError" class="loading-overlay">
        <div class="loading-spinner"></div>
        <div class="loading-text">加载中...</div>
      </div>

      <!-- 错误状态提示 -->
      <div v-if="imageError" class="error-overlay">
        <UIcon name="material-symbols:error-outline" class="error-icon" />
        <div class="error-text">图片加载失败</div>
      </div>

      <!-- 主图片 -->
      <img
        v-if="currentImage"
        :key="currentImage.id"
        :alt="currentImage.title || '图片'"
        class="main-image-content"
        :class="{ 'zoom-cursor': scale > 1 }"
        :src="currentImage.url"
        ref="imageElement"
        @load="handleImageLoad"
        @error="handleImageError"
        @dblclick="handleImageDoubleClick"
        :style="{
          opacity: swipeState.opacity,
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          cursor: scale > 1 ? 'grab' : 'default',
        }"
      />

      <!-- 拖动切换指示器 -->
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
          <!-- 左侧指示器（向右滑动显示上一张） -->
          <div v-if="swipeState.direction > 0 && currentIndex > 0" class="indicator-left">
            <div class="indicator-content">
              <UIcon name="material-symbols:chevron-left" class="indicator-icon" />
              上一张
            </div>
          </div>
          <!-- 右侧指示器（向左滑动显示下一张） -->
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

    <!-- 操作提示 -->
    <div
      class="hint-text"
      :class="{ 'hint-mobile': isMobile, 'hint-desktop': !isMobile }"
    >
      {{
        isMobile ? "双指缩放 • 左右滑动切换 • 双击放大" : "双击缩放 • 滚轮缩放 • 拖拽查看"
      }}
    </div>

    <!-- 左右切换按钮 -->
    <button
      v-show="currentIndex > 0"
      type="button"
      class="nav-button prev-button"
      :class="{ 'mobile-visible': isMobile }"
      @click="$emit('prev')"
    >
      <UIcon name="ic:baseline-keyboard-arrow-left" />
    </button>
    <button
      v-show="currentIndex < images.length - 1"
      type="button"
      class="nav-button next-button"
      :class="{ 'mobile-visible': isMobile }"
      @click="$emit('next')"
    >
      <UIcon name="material-symbols:chevron-right" />
    </button>
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
  touch-action: none; /* 禁止浏览器默认触摸行为 */
  user-select: none; /* 禁止选中文本 */
}

.image-display-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.main-image-content {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  transform-origin: center center;
  will-change: transform;
  user-select: none;
  -webkit-user-drag: none;
  transition: transform 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  position: relative;
  z-index: 1;
}

.zoom-cursor {
  cursor: grab;
}

.zoom-cursor:active {
  cursor: grabbing;
}

/* 加载覆盖层 */
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

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  color: white;
  font-size: 14px;
}

/* 错误覆盖层 */
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

/* 滑动指示器 */
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
  display: flex;
  align-items: center;
  justify-content: center;
}

.indicator-right {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
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

/* 操作提示 */
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

/* 导航按钮 */
.nav-button {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 33px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s;
  backdrop-filter: blur(10px);
  z-index: 30;
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
  opacity: 0.8;
}

.main-image-container:hover .nav-button {
  opacity: 0.8;
}

/* 指示器动画 */
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

/* 确保触摸事件正常工作 */
@media (hover: none) and (pointer: coarse) {
  .main-image-container {
    -webkit-tap-highlight-color: transparent;
  }

  .nav-button {
    min-width: 44px;
    min-height: 44px;
  }
}
</style>
