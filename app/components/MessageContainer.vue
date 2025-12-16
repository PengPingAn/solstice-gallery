<template>
  <transition name="message" appear @after-leave="onAfterLeave">
    <div
      v-if="visible"
      ref="messageRef"
      class="message-item"
      :class="[messageType, { 'glass-effect': isGlassType }]"
      :style="{ top: `${top}px` }"
    >
      <!-- 图标区域 -->
      <div class="message-icon">
        <svg
          v-if="messageType === 'success'"
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M5 13l4 4L19 7"
          />
        </svg>
        <svg
          v-else-if="messageType === 'warning'"
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.282 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
        <svg
          v-else-if="messageType === 'error'"
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <svg
          v-else-if="messageType === 'glass'"
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
        <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      <!-- 消息内容 -->
      <div class="message-content">
        {{ text }}
      </div>

      <!-- 关闭按钮 -->
      <button class="message-close" @click.stop="closeMessage">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";

interface Props {
  messageType?: "success" | "info" | "warning" | "error" | "glass";
  text: string;
  duration?: number;
  top?: number;
}

const props = withDefaults(defineProps<Props>(), {
  messageType: "info",
  duration: 3000,
  top: 32,
});

const emits = defineEmits<{
  (e: "destroy"): void;
}>();

const visible = ref(false);
const messageRef = ref<HTMLElement>();
let timer: number | null = null;

// 计算是否是毛玻璃类型
const isGlassType = computed(() => props.messageType === "glass");

onMounted(() => {
  visible.value = true;
  startTimer();

  // 设置高 z-index，确保在 UModal 之上
  if (messageRef.value) {
    messageRef.value.style.zIndex = "99999";
  }

  // 添加事件监听器来阻止事件冒泡到 UModal
  addEventListeners();
});

onUnmounted(() => {
  if (timer) {
    clearTimeout(timer);
  }
  removeEventListeners();
});

function startTimer() {
  if (timer) {
    clearTimeout(timer);
  }

  timer = window.setTimeout(() => {
    closeMessage();
  }, props.duration);
}

function closeMessage() {
  visible.value = false;
}

function onAfterLeave() {
  emits("destroy");
}

// 添加事件监听器来阻止事件冒泡
function addEventListeners() {
  if (!messageRef.value) return;

  const element = messageRef.value;

  // 处理 mousedown 事件（UModal 可能监听这个）
  const handleMouseDown = (e: MouseEvent) => {
    e.stopPropagation();
  };

  // 处理 click 事件
  const handleClick = (e: MouseEvent) => {
    e.stopPropagation();
  };

  // 在 Message 元素上添加事件监听器
  element.addEventListener("mousedown", handleMouseDown, true);
  element.addEventListener("click", handleClick, true);

  // 保存引用以便清理
  (element as any)._messageMouseDownHandler = handleMouseDown;
  (element as any)._messageClickHandler = handleClick;

  // 在 document 上添加捕获阶段的事件监听器，确保在 UModal 之前处理
  const documentHandler = (e: Event) => {
    if (e.target && (e.target as Element).closest(".message-item") === element) {
      e.stopPropagation();
    }
  };

  document.addEventListener("mousedown", documentHandler, true);
  document.addEventListener("click", documentHandler, true);

  (element as any)._documentHandler = documentHandler;
}

function removeEventListeners() {
  if (!messageRef.value) return;

  const element = messageRef.value;

  // 移除 Message 元素上的事件监听器
  if ((element as any)._messageMouseDownHandler) {
    element.removeEventListener(
      "mousedown",
      (element as any)._messageMouseDownHandler,
      true
    );
  }
  if ((element as any)._messageClickHandler) {
    element.removeEventListener("click", (element as any)._messageClickHandler, true);
  }

  // 移除 document 上的事件监听器
  if ((element as any)._documentHandler) {
    document.removeEventListener("mousedown", (element as any)._documentHandler, true);
    document.removeEventListener("click", (element as any)._documentHandler, true);
  }
}

// 暴露方法供父组件调用
defineExpose({
  closeMessage,
});
</script>

<style scoped>
.message-item {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  min-width: 100px;
  max-width: 480px;
  padding: 16px 20px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 99999; /* 高于 UModal */
  pointer-events: auto;
  transition: all 0.3s ease;
}

/* 原有的背景颜色保持不变 */
.message-item.success {
  background: rgba(16, 185, 129, 0.9);
  color: white;
  /* box-shadow: 0 20px 40px rgba(16, 185, 129, 0.2), 0 10px 20px rgba(16, 185, 129, 0.15); */
}

.message-item.info {
  background: rgba(59, 130, 246, 0.9);
  color: white;
  /* box-shadow: 0 20px 40px rgba(59, 130, 246, 0.2), 0 10px 20px rgba(59, 130, 246, 0.15); */
}

.message-item.warning {
  background: rgba(245, 158, 11, 0.9);
  color: white;
  /* box-shadow: 0 20px 40px rgba(245, 158, 11, 0.2), 0 10px 20px rgba(245, 158, 11, 0.15); */
}

.message-item.error {
  background: rgba(239, 68, 68, 0.9);
  color: white;
  /* box-shadow: 0 20px 40px rgba(239, 68, 68, 0.2), 0 10px 20px rgba(239, 68, 68, 0.15); */
}

/* 优化的毛玻璃效果 - 深色版本 */
.message-item.glass {
  color: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.15);
}

/* 毛玻璃效果 - 深色背景 */
.glass-effect {
  background: linear-gradient(
    135deg,
    rgba(40, 40, 40, 0.25) 0%,
    rgba(60, 60, 60, 0.2) 50%,
    rgba(80, 80, 80, 0.15) 100%
  );
  backdrop-filter: blur(16px) saturate(200%);
  -webkit-backdrop-filter: blur(16px) saturate(200%);
  border-radius: 12px;
}

.message-icon {
  flex-shrink: 0;
}

.message-content {
  flex: 1;
  font-size: 14px;
  line-height: 1.5;
  font-weight: 500;
}

.message-close {
  flex-shrink: 0;
  opacity: 0.7;
  transition: opacity 0.2s ease;
  cursor: pointer;
  background: none;
  border: none;
  color: inherit;
  padding: 0;
  margin: 0;
}

.message-close:hover {
  opacity: 1;
}

/* Vue Transition 动画 */
.message-enter-active {
  animation: messageIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.message-leave-active {
  animation: messageOut 0.4s cubic-bezier(0.36, 0, 0.66, -0.56);
}

@keyframes messageIn {
  0% {
    opacity: 0;
    transform: translateX(-50%) translateY(-30px) scale(0.9);
  }
  50% {
    opacity: 1;
    transform: translateX(-50%) translateY(5px) scale(1.02);
  }
  100% {
    opacity: 1;
    transform: translateX(-50%) translateY(0) scale(1);
  }
}

@keyframes messageOut {
  0% {
    opacity: 1;
    transform: translateX(-50%) translateY(0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateX(-50%) translateY(-20px) scale(0.95);
  }
}
</style>
