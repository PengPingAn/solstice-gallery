<template>
  <div
    class="album-card-container w-full transition duration-500 relative card-entrance"
    :style="cardStyle"
  >
    <!-- 相册堆叠效果容器 -->
    <div
      class="album-stack-container relative h-64 w-full p-2 md:p-4 transform transition-all duration-300 group hover:scale-[1.02] hover:translate-y-[-4px]"
    >
      <!-- 底层堆叠卡片 -->
      <div
        class="album-card bottom-card bg-zinc-950 transform transition-all duration-500 group-hover:translate-x-3 group-hover:translate-y-3 group-hover:rotate-2"
      >
        <div class="p-4 text-xs text-white/80 absolute bottom-0 right-0"></div>
      </div>

      <!-- 中层堆叠卡片 -->
      <div
        class="album-card middle-card bg-zinc-950 transform transition-all duration-500 group-hover:translate-x-3 group-hover:translate-y-3 group-hover:rotate-1"
      >
        <div class="p-4 text-xs text-white/80 absolute bottom-0 left-0"></div>
      </div>

      <!-- 顶层封面图片区域 -->
      <div
        class="album-cover-container absolute inset-0 z-30 p-2 cursor-pointer"
        @click="jumpPhoto"
      >
        <!-- Canvas 渲染封面图片 -->
        <canvas
          ref="coverCanvas"
          class="album-canvas w-full h-full rounded-lg shadow-xl border-4 border-white object-cover transform transition-transform duration-300 group-hover:scale-[1.01]"
        ></canvas>

        <!-- 加载状态指示器 -->
        <div
          v-if="!isReady"
          class="loading-overlay absolute inset-0 flex items-center justify-center bg-[var(--album-bg)] rounded-lg z-40"
        >
          <svg
            class="animate-spin h-6 w-6 text-indigo-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </div>
      </div>
    </div>

    <!-- 卡片底部信息 -->
    <div class="album-info p-2 md:p-4">
      <h3
        v-if="props.title"
        class="album-title font-medium text-sm tracking-wide text-[var(--font-color)] break-words"
      >
        {{ title }}
      </h3>
      <p
        v-if="props.tags && props.tags.length > 0"
        class="photo-count text-xs mt-1 font-mono uppercase opacity-80 text-[var(--font-color)]"
      >
        <template v-for="tag in props.tags">
          <Tag size="sm" class="text-[var(--font-color)]">{{ tag }}</Tag>
        </template>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick, defineEmits } from "vue";

// ========== 响应式状态定义 ==========
const coverCanvas = ref(null);
const isReady = ref(false);
const cardVisible = ref(false);
const emit = defineEmits("jumpPhoto");

// ========== Props 定义 ==========
const props = defineProps({
  photo: {
    type: String,
    required: true,
    default: "",
  },
  animationDelay: {
    type: Number,
    default: 0,
  },
  animationDuration: {
    type: Number,
    default: 800,
  },
  title: {
    type: String,
    default: "",
  },
  tags: {
    type: Array,
    default: [],
  },
});

// ========== 计算属性 ==========
const cardStyle = computed(() => ({
  "--animation-delay": `${props.animationDelay}ms`,
  "--animation-duration": `${props.animationDuration}ms`,
}));

// ========== 常量定义 ==========
const MAX_RETRIES = 5;
let currentRetry = 0;

// ========== 核心功能方法 ==========

/**
 * 加载并绘制图片到 Canvas，支持重试机制
 */
const loadAndDrawImageWithRetry = () => {
  const img = new Image();
  img.crossOrigin = "anonymous";

  img.onload = () => {
    // 使用 requestAnimationFrame 确保在下一帧绘制，避免阻塞
    requestAnimationFrame(() => {
      drawImageOnCanvas(img);
      isReady.value = true;
      console.log("✅ Canvas 封面图片绘制成功");
    });
  };

  img.onerror = (error) => {
    console.error("❌ Canvas 图片加载失败:", error);
    handleImageLoadError();
  };

  img.src = props.photo;
};

/**
 * 处理图片加载错误，实现指数退避重试
 */
const handleImageLoadError = () => {
  if (currentRetry < MAX_RETRIES) {
    const delay = Math.pow(2, currentRetry) * 1000; // 指数退避延迟
    currentRetry++;
    console.warn(`🔄 ${delay}ms 后重试加载图片 (${currentRetry}/${MAX_RETRIES})...`);

    setTimeout(() => loadAndDrawImageWithRetry(), delay);
  } else {
    console.error("🚫 达到最大重试次数，无法加载封面图片");
    // 可以在这里设置默认图片或错误状态
    isReady.value = true;
  }
};

/**
 * 在 Canvas 上绘制图片，实现 cover 效果
 * @param {HTMLImageElement} img - 要绘制的图片元素
 */
const drawImageOnCanvas = (img) => {
  if (!coverCanvas.value) {
    console.warn("⚠️ Canvas 元素未找到");
    return;
  }

  const canvas = coverCanvas.value;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    console.error("❌ 无法获取 Canvas 2D 上下文");
    return;
  }

  // 设置 Canvas 尺寸以匹配显示尺寸
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;

  // 清空 Canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 计算图片缩放比例，实现 cover 效果
  const scaleX = canvas.width / img.width;
  const scaleY = canvas.height / img.height;
  const scale = Math.max(scaleX, scaleY);

  // 计算居中位置
  const x = (canvas.width - img.width * scale) / 2;
  const y = (canvas.height - img.height * scale) / 2;

  // 绘制图片
  ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
};

// ========== 初始化方法 ==========

/**
 * 初始化卡片动画
 */
const initializeCardAnimation = () => {
  setTimeout(() => {
    cardVisible.value = true;
  }, props.animationDelay);
};

/**
 * 初始化图片加载
 */
const initializeImageLoading = () => {
  // 等待下一帧确保 DOM 完全渲染
  nextTick(() => {
    loadAndDrawImageWithRetry();
  });
};

const jumpPhoto = () => {
  console.log("11111");
  emit("jumpPhoto");
};

// ========== 生命周期钩子 ==========
onMounted(() => {
  initializeCardAnimation();
  initializeImageLoading();
});
</script>

<style scoped>
/* ========== 基础卡片样式 ========== */
.album-card-container {
  opacity: 0;
  transform: translateY(30px) scale(0.95);
  animation: cardEntrance var(--animation-duration, 800ms) ease-out
    var(--animation-delay, 0ms) forwards;
}

/* ========== 堆叠卡片通用样式 ========== */
.album-card {
  position: absolute;
  z-index: 20;
  border: 4px solid white;
  border-radius: 0.5rem; /* rounded-lg */
  opacity: 0;
  animation: cardLayerEntrance 0.3s ease-out calc(var(--animation-delay, 0ms) + 200ms)
    forwards;
  background-color: var(--album-bg);
}

/* ========== 堆叠卡片定位 ========== */
.middle-card {
  top: 10px;
  left: 10px;
  right: 10px;
  bottom: 10px;
  animation-delay: calc(var(--animation-delay, 0ms) + 300ms) !important;
}

.bottom-card {
  top: 18px;
  left: 18px;
  right: 2px;
  bottom: 2px;
  animation-delay: calc(var(--animation-delay, 0ms) + 400ms) !important;
}

/* ========== Canvas 容器动画 ========== */
.album-cover-container {
  opacity: 0;
  animation: cardLayerEntrance 0.3s ease-out calc(var(--animation-delay, 0ms) + 500ms)
    forwards;
}

/* ========== 关键帧动画 ========== */
@keyframes cardEntrance {
  0% {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  70% {
    opacity: 1;
    transform: translateY(-5px) scale(1.01);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes cardLayerEntrance {
  0% {
    opacity: 0;
    transform: translateY(20px) rotate(2deg);
  }
  100% {
    opacity: 1;
    transform: translateY(0) rotate(0);
  }
}

/* ========== 悬停效果优化 ========== */
.album-stack-container:hover .album-canvas {
  transform: scale(1.01);
}

.hover-overlay {
  backdrop-filter: blur(2px);
}

/* ========== 加载状态样式 ========== */
.loading-overlay {
  background: linear-gradient(45deg, #1a1a1a, #2d2d2d);
}
</style>
