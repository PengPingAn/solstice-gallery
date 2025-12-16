<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from "vue";
import { useMessage } from "@/composables/useMessage";
import type { PhotoItem, EmojiItem, SwipeState, TransformState } from "./types";

// 导入子组件
import ImageBackground from "./ImageBackground.vue";
import MainImage from "./MainImage.vue";
import ThumbnailStrip from "./ThumbnailStrip.vue";
import DesktopSidebar from "./DesktopSidebar.vue";
import MobileDrawer from "./MobileDrawer.vue";
import EmojiButtons from "./EmojiButtons.vue";
import ZoomControls from "./ZoomControls.vue";
import TopControls from "./TopControls.vue";

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

const emit = defineEmits<{
  closePhoneView: [];
}>();

const currentIndex = ref(props.initialIndex);
const isMobile = ref(false);
const drawerOpen = ref(false);
const message = useMessage();

// 缩放状态
const scale = ref(1);
const position = ref<TransformState["position"]>({ x: 0, y: 0 });
const isDragging = ref(false);

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
});

// 表情相关状态
const emojiList = ref<EmojiItem[]>([
  {
    id: "like",
    emoji: "👍",
    label: "React with 👍",
    src:
      "https://registry.npmmirror.com/@lobehub/fluent-emoji-anim-1/latest/files/assets/1f44d.webp",
    count: 5,
  },
  {
    id: "fire",
    emoji: "🔥",
    label: "React with 🔥",
    src:
      "https://registry.npmmirror.com/@lobehub/fluent-emoji-anim-2/latest/files/assets/1f525.webp",
    count: 7,
  },
  {
    id: "clap",
    emoji: "👏",
    label: "React with 👏",
    src:
      "https://registry.npmmirror.com/@lobehub/fluent-emoji-anim-1/latest/files/assets/1f44f.webp",
    count: 3,
  },
  {
    id: "praise",
    emoji: "🙌",
    label: "React with 🙌",
    src:
      "https://registry.npmmirror.com/@lobehub/fluent-emoji-anim-3/latest/files/assets/1f62e.webp",
    count: 0,
  },
]);

const emojiStates = ref<Record<string, boolean>>({
  like: false,
  love: false,
  fire: false,
  clap: false,
  star: false,
  praise: false,
});

const currentImage = computed(() => props.images[currentIndex.value]);

// 常量
const MIN_SCALE = 0.1;
const MAX_SCALE = 5;
const SCALE_STEP = 0.25;
const SWIPE_THRESHOLD = 80;
const SWIPE_VERTICAL_THRESHOLD = 30;

// 检查是否为移动设备
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768;
};

// 导航函数
const gotoPrev = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--;
    resetTransform();
  }
};

const gotoNext = () => {
  if (currentIndex.value < props.images.length - 1) {
    currentIndex.value++;
    resetTransform();
  }
};

const gotoIndex = (index: number) => {
  if (index >= 0 && index < props.images.length) {
    currentIndex.value = index;
    resetTransform();
  }
};

// 缩放函数
const resetTransform = () => {
  scale.value = 1;
  position.value = { x: 0, y: 0 };
};

const zoom = (newScale: number, centerX?: number, centerY?: number) => {
  const oldScale = scale.value;
  newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));

  if (Math.abs(newScale - oldScale) < 0.01) return;

  // 保存旧的缩放比例和位置
  const oldPosition = { ...position.value };

  // 计算缩放比例
  const scaleRatio = newScale / oldScale;

  // 如果缩放比例小于等于1（100%），或者用户点击了适应屏幕按钮，重置到中心
  const shouldResetPosition = newScale <= 1 || newScale === 1;

  if (shouldResetPosition) {
    // 重置到中心
    position.value = { x: 0, y: 0 };
  } else if (centerX !== undefined && centerY !== undefined) {
    // 基于中心点进行缩放时的位置计算
    const container = document.querySelector(".main-image-wrapper");
    if (container) {
      const rect = container.getBoundingClientRect();
      const containerCenterX = rect.width / 2;
      const containerCenterY = rect.height / 2;

      const centerOffsetX = centerX - rect.left - containerCenterX;
      const centerOffsetY = centerY - rect.top - containerCenterY;

      // 更新位置，使缩放中心保持不变
      position.value.x = centerOffsetX - (centerOffsetX - oldPosition.x) * scaleRatio;
      position.value.y = centerOffsetY - (centerOffsetY - oldPosition.y) * scaleRatio;
    }
  } else {
    // 没有指定中心点，仅按比例缩放位置
    position.value.x *= scaleRatio;
    position.value.y *= scaleRatio;
  }

  // 更新缩放比例
  scale.value = newScale;

  // 限制位置，确保图片不会超出边界
  constrainPosition();

  // 显示缩放指示器
  showScaleIndicator();
};

// 显示缩放比例指示器
const showScaleText = ref(false);
let scaleTextTimer: ReturnType<typeof setTimeout> | null = null;

const showScaleIndicator = () => {
  showScaleText.value = true;
  if (scaleTextTimer) clearTimeout(scaleTextTimer);
  scaleTextTimer = setTimeout(() => {
    showScaleText.value = false;
  }, 1500);
};

// 限制位置，防止图片被拖出边界
const constrainPosition = () => {
  // 这里简化处理，实际应用中需要根据图片和容器大小计算最大偏移
  // 当scale <= 1时，位置应该为0
  if (scale.value <= 1) {
    position.value = { x: 0, y: 0 };
    return;
  }

  // 对于缩放大于1的情况，可以设置最大偏移限制
  // 这里简单限制在±500像素内，实际应根据图片大小动态计算
  const maxOffset = 500 * (scale.value - 1);
  position.value.x = Math.max(-maxOffset, Math.min(maxOffset, position.value.x));
  position.value.y = Math.max(-maxOffset, Math.min(maxOffset, position.value.y));
};

const zoomIn = () => {
  zoom(scale.value + SCALE_STEP);
};

const zoomOut = () => {
  zoom(scale.value - SCALE_STEP);
};

const zoomToFit = () => {
  resetTransform();
};

// 处理关闭
const handleClose = () => {
  emit("closePhoneView");
};

// 切换抽屉
const toggleDrawer = () => {
  drawerOpen.value = !drawerOpen.value;
};

// 处理表情点击
const handleEmojiClick = (emojiId: string) => {
  emojiStates.value[emojiId] = !emojiStates.value[emojiId];
  message.show({
    text: `点击了表情: ${emojiId}`,
    messageType: "glass",
    duration: 2000,
  });
};

// 更新滑动状态
const updateSwipeState = (newState: SwipeState) => {
  swipeState.value = newState;
};

// 更新拖动状态
const updateDragging = (dragging: boolean) => {
  isDragging.value = dragging;
};

const handleUpdatePosition = (newPosition: { x: number; y: number }) => {
  position.value = newPosition;
};

// 键盘快捷键
const handleKeyDown = (e: KeyboardEvent) => {
  switch (e.key) {
    case "Escape":
      handleClose();
      break;
    case "ArrowLeft":
      if (scale.value === 1) gotoPrev();
      break;
    case "ArrowRight":
      if (scale.value === 1) gotoNext();
      break;
    case "+":
    case "=":
      e.preventDefault();
      zoomIn();
      break;
    case "-":
      e.preventDefault();
      zoomOut();
      break;
    case "0":
      e.preventDefault();
      zoomToFit();
      break;
  }
};

// 监听窗口大小变化
const handleResize = () => {
  checkMobile();
};

onMounted(() => {
  gotoIndex(props.initialIndex);
  document.addEventListener("keydown", handleKeyDown);
  window.addEventListener("resize", handleResize);
  checkMobile();
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleKeyDown);
  window.removeEventListener("resize", handleResize);
});
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
            :current-image="currentImage"
            :scale="scale"
            :position="position"
            :swipe-state="swipeState"
            :is-mobile="isMobile"
            :images="images"
            :current-index="currentIndex"
            @prev="gotoPrev"
            @next="gotoNext"
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
        </div>

        <ThumbnailStrip
          v-if="images.length > 0"
          :images="images"
          :current-index="currentIndex"
          :is-mobile="isMobile"
          @goto-index="gotoIndex"
        />
        <!-- 桌面端侧边栏 -->
        <!-- <DesktopSidebar
          v-if="!isMobile"
          :current-image="currentImage"
          :scale="scale"
          :min-scale="MIN_SCALE"
          :max-scale="MAX_SCALE"
          @zoom-in="zoomIn"
          @zoom-out="zoomOut"
          @zoom-to-fit="zoomToFit"
        /> -->
      </div>

      <!-- 缩略图区域 -->
      <!-- <ThumbnailStrip
        v-if="images.length > 0"
        :images="images"
        :current-index="currentIndex"
        :is-mobile="isMobile"
        @goto-index="gotoIndex"
      /> -->

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

/* 移动端布局 */
@media (max-width: 768px) {
  .main-content-wrapper {
    flex-direction: column;
  }

  .main-image-wrapper {
    height: calc(100% - 90px);
  }
}
</style>
