<template>
  <div class="loading-overlay">
    <div class="loading-container">
      <!-- 相册图标 -->
      <div class="album-icon">
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M56 48H8C5.79086 48 4 46.2091 4 44V16C4 13.7909 5.79086 12 8 12H56C58.2091 12 60 13.7909 60 16V44C60 46.2091 58.2091 48 56 48Z"
            stroke="currentColor"
            stroke-width="4"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M20 28C22.2091 28 24 26.2091 24 24C24 21.7909 22.2091 20 20 20C17.7909 20 16 21.7909 16 24C16 26.2091 17.7909 28 20 28Z"
            stroke="currentColor"
            stroke-width="4"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M60 36L44 24L20 40L8 32"
            stroke="currentColor"
            stroke-width="4"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>

      <!-- 随机语句 -->
      <div class="random-quote">
        {{ textList[index] }}
      </div>

      <!-- 加载动画 -->
      <div class="loading-animation">
        <svg width="64px" height="48px">
          <polyline
            points="0.157 23.954, 14 23.954, 21.843 48, 43 0, 50 24, 64 24"
            id="back"
          ></polyline>
          <polyline
            points="0.157 23.954, 14 23.954, 21.843 48, 43 0, 50 24, 64 24"
            id="front"
          ></polyline>
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";

const textList = [
  "Immortalizing the fleeting beauty of everyday life, one frame at a time.",
  "Through the lens, I capture the quiet whispers of the world around me.",
  "Preserving moments, painting memories with light and shadow.",
  "Finding beauty in the simplest of moments, capturing the heart of life.",
  "Turning fleeting moments into timeless memories through the click of a shutter.",
  "Every picture tells a story, every shot is a piece of the heart.",
  "Capturing the warmth of the world, one image at a time.",
  "Documenting life's quiet moments, where memories are born.",
  "Chasing light, capturing emotions, and making moments eternal.",
  "In every click, a memory is born, a moment preserved forever.",
  "Through my lens, I freeze time and let memories live on.",
  "Every shot is a snapshot of the emotions that make us human.",
  "Life is made of little moments; I capture them to tell the story of us.",
  "Every frame holds the warmth of today, the memory of tomorrow.",
  "Capturing more than just pictures – I capture the essence of life.",
];
const index = ref(0);
index.value = Math.floor(Math.random() * 15);
</script>

<style scoped>
/* 全屏覆盖层 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, var(--background) 0%, #1e293b 100%);
  /* background-color: var(--background); */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  backdrop-filter: blur(10px);
}

/* 容器 - 垂直三行布局 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3rem;
  padding: 2rem;
  max-width: 800px;
  width: 90%;
}

/* 相册图标 */
.album-icon {
  color: #f8fafc;
  animation: float 3s ease-in-out infinite;
}

.album-icon svg {
  width: 80px;
  height: 80px;
  opacity: 0.9;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-10px) scale(1.05);
  }
}

/* 随机语句 */
.random-quote {
  font-size: 1rem;
  line-height: 1.6;
  color: #e2e8f0;
  text-align: center;
  font-family: "Georgia", serif;
  font-style: italic;
  padding: 0 1rem;
  max-width: 600px;
  animation: fadeIn 0.3s ease-out;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
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

/* 加载动画 */
.loading-animation {
  margin-top: 1rem;
}

.loading-animation svg polyline {
  fill: none;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.loading-animation svg polyline#back {
  fill: none;
  stroke: rgba(255, 255, 255, 0.1);
}

.loading-animation svg polyline#front {
  fill: none;
  stroke: #f8fafc;
  stroke-dasharray: 48, 144;
  stroke-dashoffset: 192;
  animation: dash_682 1.4s linear infinite;
}

@keyframes dash_682 {
  72.5% {
    opacity: 0;
  }
  to {
    stroke-dashoffset: 0;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .loading-container {
    gap: 2rem;
    padding: 1rem;
  }

  .album-icon svg {
    width: 60px;
    height: 60px;
  }

  .random-quote {
    font-size: 1.2rem;
    line-height: 1.5;
  }
}

@media (max-width: 480px) {
  .loading-container {
    gap: 1.5rem;
  }

  .album-icon svg {
    width: 50px;
    height: 50px;
  }

  .random-quote {
    font-size: 1rem;
    line-height: 1.4;
  }
}
</style>
