<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from "vue";

interface PhotoItem {
  id: string | number;
  url: string;
  title?: string;
  meta?: string;
  date?: string;
  address?: string;
  [key: string]: any;
}

const props = withDefaults(
  defineProps<{
    images: PhotoItem[];
    initialIndex: number;
  }>(),
  {
    images: () => [],
    initialIndex: () => 0,
  }
);

// 核心状态
const currentIndex = ref(props.initialIndex);
const thumbnailContainer = ref<HTMLElement | null>(null);
const imageElement = ref<HTMLImageElement | null>(null);

// 缩放状态
const scale = ref(1);
const position = ref({ x: 0, y: 0 });
const isDragging = ref(false);
const dragStart = ref({ x: 0, y: 0 });

// UI 状态
const showScaleText = ref(false);
const scaleTextTimeout = ref<NodeJS.Timeout | null>(null);

// 常量
const MIN_SCALE = 0.5;
const MAX_SCALE = 5;
const SCALE_STEP = 0.25;
const SCALE_TEXT_DURATION = 1000;

// 双击相关
let lastClickTime = 0;
let clickCount = 0;

const currentImage = computed(() => props.images[currentIndex.value]);

// 导航
const gotoPrev = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--;
    resetTransform();
    scrollToThumbnail(currentIndex.value);
  }
};

const gotoNext = () => {
  if (currentIndex.value < props.images.length - 1) {
    currentIndex.value++;
    resetTransform();
    scrollToThumbnail(currentIndex.value);
  }
};

const gotoIndex = (index: number) => {
  currentIndex.value = index;
  resetTransform();
  scrollToThumbnail(index);
};

const scrollToThumbnail = (index: number) => {
  if (thumbnailContainer.value) {
    const thumbnail = thumbnailContainer.value.children[index] as HTMLElement;
    if (thumbnail) {
      thumbnail.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }
};

const emit = defineEmits<{
  close: [];
}>();

const handleClose = () => {
  emit("close");
};

// 缩放核心函数
const resetTransform = () => {
  scale.value = 1;
  position.value = { x: 0, y: 0 };
  if (imageElement.value) {
    imageElement.value.style.transform = `translate(0px, 0px) scale(1)`;
  }
};

const applyTransform = () => {
  if (imageElement.value) {
    imageElement.value.style.transform = `translate(${position.value.x}px, ${position.value.y}px) scale(${scale.value})`;
  }
};

const zoom = (newScale: number, clientX?: number, clientY?: number) => {
  const oldScale = scale.value;
  newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));

  if (Math.abs(newScale - oldScale) < 0.01) return;

  // 如果图片还没有加载完成，直接设置缩放
  if (!imageElement.value || !imageElement.value.complete) {
    scale.value = newScale;
    applyTransform();
    showScaleIndicator();
    return;
  }

  // 计算容器中心
  const container = imageElement.value.parentElement;
  if (!container) return;

  const rect = container.getBoundingClientRect();
  const containerCenterX = rect.width / 2;
  const containerCenterY = rect.height / 2;

  // 默认以中心缩放
  let mouseX = containerCenterX;
  let mouseY = containerCenterY;

  // 如果有鼠标位置，以鼠标位置为中心缩放
  if (clientX !== undefined && clientY !== undefined) {
    mouseX = clientX - rect.left;
    mouseY = clientY - rect.top;
  }

  // 计算缩放比例
  const scaleRatio = newScale / oldScale;

  // 计算新的位置，使鼠标点保持在同一位置
  position.value.x =
    mouseX -
    containerCenterX -
    (mouseX - containerCenterX - position.value.x) * scaleRatio;
  position.value.y =
    mouseY -
    containerCenterY -
    (mouseY - containerCenterY - position.value.y) * scaleRatio;

  scale.value = newScale;

  // 约束位置
  constrainPosition();
  applyTransform();
  showScaleIndicator();
};

const zoomIn = () => {
  zoom(scale.value + SCALE_STEP);
};

const zoomOut = () => {
  zoom(scale.value - SCALE_STEP);
};

const zoomToFit = () => {
  resetTransform();
  showScaleIndicator();
};

const constrainPosition = () => {
  if (!imageElement.value) return;

  const container = imageElement.value.parentElement;
  if (!container) return;

  const containerRect = container.getBoundingClientRect();
  const imageRect = imageElement.value.getBoundingClientRect();

  // 计算图片的显示尺寸
  const displayedWidth = imageRect.width;
  const displayedHeight = imageRect.height;

  // 如果图片比容器小，则居中
  if (displayedWidth <= containerRect.width && displayedHeight <= containerRect.height) {
    position.value.x = 0;
    position.value.y = 0;
    return;
  }

  // 计算最大偏移量
  const maxX = Math.max(0, (displayedWidth - containerRect.width) / 2);
  const maxY = Math.max(0, (displayedHeight - containerRect.height) / 2);

  // 约束位置
  position.value.x = Math.max(-maxX, Math.min(maxX, position.value.x));
  position.value.y = Math.max(-maxY, Math.min(maxY, position.value.y));
};

// 显示缩放指示器
const showScaleIndicator = () => {
  showScaleText.value = true;

  if (scaleTextTimeout.value) {
    clearTimeout(scaleTextTimeout.value);
  }

  scaleTextTimeout.value = setTimeout(() => {
    showScaleText.value = false;
  }, SCALE_TEXT_DURATION);
};

// 事件处理
const handleWheel = (e: WheelEvent) => {
  e.preventDefault();

  // 计算缩放方向
  const delta = e.deltaY < 0 ? 1 : -1;
  const newScale = scale.value * (1 + delta * 0.1);

  zoom(newScale, e.clientX, e.clientY);
};

const handleMouseDown = (e: MouseEvent) => {
  if (e.button !== 0) return;

  // 双击检测
  const currentTime = Date.now();
  if (currentTime - lastClickTime < 300) {
    clickCount++;
    if (clickCount === 2) {
      // 双击处理
      if (scale.value < 1.5) {
        zoom(2, e.clientX, e.clientY);
      } else {
        zoomToFit();
      }
      clickCount = 0;
      lastClickTime = 0;
      return;
    }
  } else {
    clickCount = 1;
  }
  lastClickTime = currentTime;

  // 如果已放大，开始拖拽
  if (scale.value > 1.1) {
    isDragging.value = true;
    dragStart.value = {
      x: e.clientX - position.value.x,
      y: e.clientY - position.value.y,
    };

    if (imageElement.value) {
      imageElement.value.style.cursor = "grabbing";
    }

    e.preventDefault();
  }
};

const handleMouseMove = (e: MouseEvent) => {
  if (!isDragging.value) return;

  const newX = e.clientX - dragStart.value.x;
  const newY = e.clientY - dragStart.value.y;

  // 临时设置位置，不立即约束
  position.value.x = newX;
  position.value.y = newY;

  applyTransform();
};

const handleMouseUp = () => {
  if (isDragging.value) {
    isDragging.value = false;

    // 约束最终位置
    constrainPosition();
    applyTransform();

    if (imageElement.value) {
      imageElement.value.style.cursor = scale.value > 1.1 ? "grab" : "default";
    }
  }
};

// 缩略图滚轮
const onThumbnailWheel = (e: WheelEvent) => {
  if (!thumbnailContainer.value) return;
  e.preventDefault();
  thumbnailContainer.value.scrollLeft += e.deltaY * 2;
};

// 键盘快捷键
const handleKeyDown = (e: KeyboardEvent) => {
  switch (e.key) {
    case "Escape":
      handleClose();
      break;
    case "ArrowLeft":
      if (scale.value === 1) {
        gotoPrev();
      }
      break;
    case "ArrowRight":
      if (scale.value === 1) {
        gotoNext();
      }
      break;
    case "+":
    case "=":
      zoomIn();
      break;
    case "-":
      zoomOut();
      break;
    case "0":
      zoomToFit();
      break;
  }
};

// 监听变化
watch(currentImage, () => {
  resetTransform();
});

onMounted(() => {
  gotoIndex(props.initialIndex);
  document.addEventListener("keydown", handleKeyDown);
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleKeyDown);
  if (scaleTextTimeout.value) {
    clearTimeout(scaleTextTimeout.value);
  }
});
</script>

<template>
  <div class="image-viewer" @keydown="handleKeyDown">
    <!-- 背景遮罩 -->
    <div class="background-overlay" @click="handleClose" />

    <!-- 主容器 -->
    <div class="main-container">
      <div class="content-wrapper">
        <!-- 图片区域 -->
        <div
          class="image-area"
          @mousedown="handleMouseDown"
          @mousemove="handleMouseMove"
          @mouseup="handleMouseUp"
          @mouseleave="handleMouseUp"
          @wheel="handleWheel"
        >
          <!-- 缩放指示器 -->
          <div v-if="showScaleText" class="scale-indicator">
            {{ Math.round(scale * 100) }}%
          </div>

          <!-- 顶部工具栏 -->
          <div class="toolbar top-toolbar">
            <div class="toolbar-left">
              <button v-if="scale > 1" class="hint-button">拖拽查看细节</button>
            </div>
            <div class="toolbar-right">
              <button class="icon-button" @click="handleClose">
                <UIcon name="i-mingcute-close-line" />
              </button>
            </div>
          </div>

          <!-- 图片容器 -->
          <div class="image-wrapper">
            <img
              v-if="currentImage"
              ref="imageElement"
              :src="currentImage.url"
              :alt="currentImage.title || '图片'"
              class="main-image"
              :class="{ 'zoom-mode': scale > 1 }"
              @load="applyTransform"
            />
          </div>

          <!-- 导航按钮 -->
          <button
            v-if="currentIndex > 0"
            class="nav-button prev-button"
            @click="gotoPrev"
          >
            <UIcon name="i-mingcute-arrow-left-line" />
          </button>
          <button
            v-if="currentIndex < images.length - 1"
            class="nav-button next-button"
            @click="gotoNext"
          >
            <UIcon name="i-mingcute-arrow-right-line" />
          </button>

          <!-- 缩放控制 -->
          <div v-if="scale > 1" class="zoom-controls">
            <button class="zoom-button" @click="zoomOut">
              <UIcon name="i-mingcute-subtract-line" />
            </button>
            <button class="zoom-button" @click="zoomToFit">
              <UIcon name="i-mingcute-fullscreen-exit-line" />
            </button>
            <button class="zoom-button" @click="zoomIn">
              <UIcon name="i-mingcute-add-line" />
            </button>
          </div>

          <!-- 操作提示 -->
          <div class="hint-bar">
            双击缩放 • 滚轮缩放
            <span v-if="scale > 1">• 拖拽查看</span>
          </div>
        </div>

        <!-- 缩略图区域 -->
        <div class="thumbnail-area">
          <div
            ref="thumbnailContainer"
            class="thumbnail-container"
            @wheel="onThumbnailWheel"
          >
            <button
              v-for="(image, index) in images"
              :key="image.id"
              class="thumbnail"
              :class="{ active: currentIndex === index }"
              @click="gotoIndex(index)"
            >
              <img :src="image.url" :alt="image.title" />
            </button>
          </div>
        </div>
      </div>

      <!-- 侧边信息栏 -->
      <div class="sidebar">
        <!-- 基本信息 -->
        <div class="info-section">
          <h2 class="image-title">{{ currentImage?.title || "无标题" }}</h2>
          <p class="image-meta">{{ currentImage?.meta || "无设备信息" }}</p>

          <div class="info-grid">
            <div class="info-item">
              <UIcon name="i-mingcute-calendar-line" />
              <span>{{ currentImage?.date || "无日期" }}</span>
            </div>
            <div class="info-item">
              <UIcon name="i-mingcute-location-line" />
              <span>{{ currentImage?.address || "无地址" }}</span>
            </div>
            <div class="info-item">
              <UIcon name="i-mingcute-zoom-in-line" />
              <span>缩放: {{ Math.round(scale * 100) }}%</span>
            </div>
          </div>
        </div>

        <!-- 缩放控制 -->
        <div class="control-section">
          <div class="scale-slider">
            <button class="slider-button" @click="zoomOut">
              <UIcon name="i-mingcute-subtract-line" />
            </button>
            <div class="slider-track">
              <div
                class="slider-fill"
                :style="{
                  width: `${((scale - MIN_SCALE) / (MAX_SCALE - MIN_SCALE)) * 100}%`,
                }"
              />
            </div>
            <button class="slider-button" @click="zoomIn">
              <UIcon name="i-mingcute-add-line" />
            </button>
          </div>
          <div class="scale-labels">
            <span>{{ Math.round(MIN_SCALE * 100) }}%</span>
            <span>{{ Math.round(MAX_SCALE * 100) }}%</span>
          </div>
          <button v-if="scale !== 1" class="fit-button" @click="zoomToFit">
            <UIcon name="i-mingcute-fullscreen-line" />
            适应屏幕
          </button>
        </div>

        <!-- 操作提示 -->
        <div class="hint-section">
          <h3>操作提示</h3>
          <div class="hint-list">
            <div class="hint-item">
              <UIcon name="i-mingcute-mouse-line" />
              <span>双击图片</span>
              <span class="hint-action">放大/恢复</span>
            </div>
            <div class="hint-item">
              <UIcon name="i-mingcute-mouse-line" />
              <span>滚轮</span>
              <span class="hint-action">缩放</span>
            </div>
            <div v-if="scale > 1" class="hint-item">
              <UIcon name="i-mingcute-hand-line" />
              <span>拖拽</span>
              <span class="hint-action">移动查看</span>
            </div>
            <div class="hint-item">
              <UIcon name="i-mingcute-keyboard-line" />
              <span>ESC</span>
              <span class="hint-action">关闭</span>
            </div>
          </div>
        </div>

        <!-- 标签 -->
        <div class="tags-section">
          <h3>标签</h3>
          <div class="tags-list">
            <span class="tag">湖州</span>
            <span class="tag">龙之梦太湖古镇</span>
            <span class="tag">NPC</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.image-viewer {
  position: fixed;
  inset: 0;
  z-index: 9999;
}

.background-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.9);
}

.main-container {
  position: relative;
  display: flex;
  height: 100vh;
  z-index: 1;
}

.content-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

/* 图片区域 */
.image-area {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  cursor: default;
}

.scale-indicator {
  position: absolute;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  backdrop-filter: blur(10px);
  z-index: 10;
  pointer-events: none;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.toolbar {
  position: absolute;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  z-index: 5;
  pointer-events: none;
}

.toolbar > * {
  pointer-events: auto;
}

.top-toolbar {
  top: 0;
}

.icon-button {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.icon-button:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: scale(1.05);
}

.hint-button {
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  border: none;
  font-size: 14px;
  backdrop-filter: blur(10px);
}

.image-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.main-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  transition: transform 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  will-change: transform;
}

.main-image.zoom-mode {
  cursor: grab;
}

.main-image.zoom-mode:active {
  cursor: grabbing;
}

/* 导航按钮 */
.nav-button {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s ease;
  z-index: 5;
}

.image-area:hover .nav-button {
  opacity: 1;
}

.nav-button:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-50%) scale(1.1);
}

.prev-button {
  left: 16px;
}

.next-button {
  right: 16px;
}

/* 缩放控制 */
.zoom-controls {
  position: absolute;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  background: rgba(0, 0, 0, 0.6);
  padding: 8px;
  border-radius: 24px;
  backdrop-filter: blur(10px);
  z-index: 5;
}

.zoom-button {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: white;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.zoom-button:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: scale(1.1);
}

/* 提示栏 */
.hint-bar {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.6);
  color: rgba(255, 255, 255, 0.8);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 12px;
  backdrop-filter: blur(10px);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.image-area:hover .hint-bar {
  opacity: 1;
}

/* 缩略图区域 */
.thumbnail-area {
  height: 100px;
  background: rgba(0, 0, 0, 0.5);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  overflow: hidden;
}

.thumbnail-container {
  display: flex;
  gap: 8px;
  padding: 16px;
  overflow-x: auto;
  height: 100%;
  scroll-behavior: smooth;
}

.thumbnail-container::-webkit-scrollbar {
  display: none;
}

.thumbnail {
  flex-shrink: 0;
  width: 68px;
  height: 68px;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  background: transparent;
  padding: 0;
}

.thumbnail:hover {
  transform: scale(1.05);
}

.thumbnail.active {
  border-color: #3b82f6;
  transform: scale(1.05);
}

.thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 侧边栏 */
.sidebar {
  width: 300px;
  background: rgba(0, 0, 0, 0.8);
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  padding: 24px;
  overflow-y: auto;
  backdrop-filter: blur(20px);
}

.info-section {
  margin-bottom: 24px;
}

.image-title {
  font-size: 18px;
  font-weight: 600;
  color: white;
  margin-bottom: 4px;
}

.image-meta {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 16px;
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}

.control-section {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;
}

.scale-slider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.slider-button {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.slider-button:hover {
  background: rgba(255, 255, 255, 0.2);
}

.slider-track {
  flex: 1;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.slider-fill {
  height: 100%;
  background: #3b82f6;
  border-radius: 2px;
  transition: width 0.2s ease;
}

.scale-labels {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 12px;
}

.fit-button {
  width: 100%;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.fit-button:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
}

.hint-section {
  margin-bottom: 24px;
}

.hint-section h3 {
  font-size: 16px;
  font-weight: 600;
  color: white;
  margin-bottom: 12px;
}

.hint-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.hint-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.hint-item span:first-of-type {
  color: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  gap: 8px;
}

.hint-action {
  color: #3b82f6;
  font-weight: 500;
}

.tags-section h3 {
  font-size: 16px;
  font-weight: 600;
  color: white;
  margin-bottom: 12px;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  padding: 4px 12px;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
  border-radius: 16px;
  font-size: 12px;
}
</style>
