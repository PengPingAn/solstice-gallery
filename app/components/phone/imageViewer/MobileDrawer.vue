<script setup lang="ts">
import type { PhotoItem } from "./types";

const props = defineProps<{
  drawerOpen: boolean;
  currentImage?: PhotoItem;
  scale: number;
  minScale: number;
  maxScale: number;
}>();

const emit = defineEmits<{
  toggleDrawer: [];
  zoomIn: [];
  zoomOut: [];
  zoomToFit: [];
}>();
</script>

<template>
  <!-- 移动端抽屉 -->
  <transition name="slide-up">
    <div v-if="drawerOpen" class="mobile-drawer" @click.stop>
      <!-- 抽屉拖拽手柄 -->
      <div class="drawer-handle" @touchstart="$emit('toggleDrawer')">
        <div class="handle-bar"></div>
      </div>

      <!-- 抽屉内容 -->
      <div class="drawer-content">
        <!-- 标题和信息 -->
        <div class="drawer-section">
          <h2 class="drawer-title">
            {{ currentImage?.title || "无标题" }}
          </h2>
          <div class="drawer-info">
            <div class="info-row">
              <i class="i-mingcute-calendar-line"></i>
              <span>{{ currentImage?.date || "无日期" }}</span>
            </div>
            <div class="info-row">
              <i class="i-mingcute-location-line"></i>
              <span>{{ currentImage?.address || "无地址" }}</span>
            </div>
            <div class="info-row">
              <i class="i-mingcute-zoom-in-line"></i>
              <span>缩放: {{ Math.round(scale * 100) }}%</span>
            </div>
          </div>
        </div>

        <!-- 标签 -->
        <div class="drawer-section">
          <h4 class="section-title">标签</h4>
          <div class="tags-row">
            <button type="button" class="mobile-tag-button" tabindex="0">湖州</button
            ><button type="button" class="mobile-tag-button" tabindex="0">
              龙之梦太湖古镇</button
            ><button type="button" class="mobile-tag-button" tabindex="0">NPC</button>
          </div>
        </div>

        <!-- 缩放控制面板 -->
        <div class="drawer-section zoom-panel">
          <h4 class="section-title">缩放控制</h4>
          <div class="mobile-zoom-controls">
            <button
              type="button"
              class="mobile-zoom-button"
              @click="$emit('zoomOut')"
              title="缩小"
            >
              <UIcon name="ic:baseline-remove" />
            </button>
            <div class="mobile-zoom-percentage">{{ Math.round(scale * 100) }}%</div>
            <button
              type="button"
              class="mobile-zoom-button"
              @click="$emit('zoomIn')"
              title="放大"
            >
              <UIcon name="ic:baseline-add" />
            </button>
          </div>
          <div class="mobile-zoom-slider">
            <div class="mobile-zoom-track">
              <div
                class="mobile-zoom-progress"
                :style="{
                  width: `${Math.min(
                    100,
                    ((scale - minScale) / (maxScale - minScale)) * 100
                  )}%`,
                }"
              ></div>
            </div>
            <div class="mobile-zoom-labels">
              <span>{{ Math.round(minScale * 100) }}%</span>
              <span>{{ Math.round(maxScale * 100) }}%</span>
            </div>
          </div>
          <button
            v-if="scale !== 1"
            type="button"
            class="mobile-fit-button"
            @click="$emit('zoomToFit')"
          >
            <UIcon name="ic:baseline-fullscreen-exit" />
            适应屏幕
          </button>
        </div>

        <!-- 操作提示 -->
        <div class="drawer-section hint-panel">
          <h4 class="section-title">操作提示</h4>
          <div class="mobile-hints">
            <div class="mobile-hint-item">
              <span>双击图片</span>
              <span class="mobile-hint-value">放大/恢复</span>
            </div>
            <div class="mobile-hint-item">
              <span>双指缩放</span>
              <span class="mobile-hint-value">缩放图片</span>
            </div>
            <div class="mobile-hint-item">
              <span>左右滑动</span>
              <span class="mobile-hint-value">切换图片</span>
            </div>
            <div v-if="scale > 1" class="mobile-hint-item">
              <span>单指拖拽</span>
              <span class="mobile-hint-value">查看细节</span>
            </div>
            <div class="mobile-hint-item">
              <span>向下滑动</span>
              <span class="mobile-hint-value">关闭抽屉</span>
            </div>
          </div>
        </div>

        <!-- 影调分析 -->
        <div class="drawer-section">
          <h4 class="section-title">影调分析</h4>
          <div class="mobile-analysis-grid">
            <div class="mobile-analysis-item">
              <span class="mobile-analysis-label">亮度</span>
              <span class="mobile-analysis-value">41%</span>
            </div>
            <div class="mobile-analysis-item">
              <span class="mobile-analysis-label">对比度</span>
              <span class="mobile-analysis-value">49%</span>
            </div>
            <div class="mobile-analysis-item">
              <span class="mobile-analysis-label">阴影占比</span>
              <span class="mobile-analysis-value">47%</span>
            </div>
            <div class="mobile-analysis-item">
              <span class="mobile-analysis-label">高光占比</span>
              <span class="mobile-analysis-value">24%</span>
            </div>
          </div>
        </div>

        <!-- 设备信息 -->
        <div class="drawer-section">
          <h4 class="section-title">设备信息</h4>
          <div class="mobile-device-info">
            <div class="mobile-info-item">
              <span class="mobile-info-label">相机</span>
              <span class="mobile-info-value">FUJIFILM X-T5</span>
            </div>
            <div class="mobile-info-item">
              <span class="mobile-info-label">镜头</span>
              <span class="mobile-info-value">FUJIFILM Fujinon XF70-300mm</span>
            </div>
            <div class="mobile-info-item">
              <span class="mobile-info-label">焦距</span>
              <span class="mobile-info-value">84mm</span>
            </div>
            <div class="mobile-info-item">
              <span class="mobile-info-label">光圈</span>
              <span class="mobile-info-value">f/4</span>
            </div>
          </div>
        </div>

        <!-- 关闭按钮 -->
        <button type="button" class="close-drawer-button" @click="$emit('toggleDrawer')">
          <UIcon name="material-symbols:close" />
          关闭详情
        </button>
      </div>
    </div>
  </transition>

  <!-- 移动端抽屉遮罩层 -->
  <transition name="fade">
    <div
      v-if="drawerOpen"
      class="drawer-overlay"
      @click.stop="$emit('toggleDrawer')"
    ></div>
  </transition>
</template>

<style scoped>
.mobile-drawer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  max-height: 85vh;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(20px);
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.5);
  z-index: 120;
  overflow-y: auto;
}

.drawer-handle {
  padding: 12px 0;
  display: flex;
  justify-content: center;
  background: transparent;
  cursor: pointer;
}

.handle-bar {
  width: 40px;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
}

.drawer-content {
  padding: 0 20px 20px;
  color: white;
}

.drawer-section {
  margin-bottom: 24px;
}

.drawer-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 12px;
  color: white;
}

.drawer-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}

.section-title {
  font-size: 16px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 12px;
}

.tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.mobile-tag-button {
  padding: 6px 14px;
  background: rgba(98, 102, 112, 0.2);
  border: 1px solid rgba(98, 102, 112, 0.3);
  color: rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  backdrop-filter: blur(10px);
}

.mobile-tag-button:hover {
  background: rgba(98, 102, 112, 0.3);
}

.zoom-panel {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 16px;
}

.mobile-zoom-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.mobile-zoom-button {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.mobile-zoom-button:hover {
  background: rgba(255, 255, 255, 0.2);
}

.mobile-zoom-percentage {
  font-size: 18px;
  color: white;
  font-weight: 600;
}

.mobile-zoom-slider {
  margin-bottom: 16px;
}

.mobile-zoom-track {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  margin-bottom: 8px;
  position: relative;
}

.mobile-zoom-progress {
  height: 100%;
  background: white;
  border-radius: 4px;
  transition: width 0.2s;
}

.mobile-zoom-labels {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.mobile-fit-button {
  width: 100%;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 25px;
  border: none;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
}

.mobile-fit-button:hover {
  background: rgba(255, 255, 255, 0.2);
}

.hint-panel {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 16px;
}

.mobile-hints {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mobile-hint-item {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.mobile-hint-item span:first-child {
  color: rgba(255, 255, 255, 0.7);
}

.mobile-hint-value {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}

.mobile-analysis-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.mobile-analysis-item {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.mobile-analysis-label {
  color: rgba(255, 255, 255, 0.7);
}

.mobile-analysis-value {
  color: white;
  font-weight: 500;
}

.mobile-device-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mobile-info-item {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.mobile-info-label {
  color: rgba(255, 255, 255, 0.7);
}

.mobile-info-value {
  color: white;
  text-align: right;
  max-width: 60%;
}

.close-drawer-button {
  width: 100%;
  padding: 16px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 16px;
  border: none;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
  margin-top: 20px;
}

.close-drawer-button:hover {
  background: rgba(255, 255, 255, 0.2);
}

.drawer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(5px);
  z-index: 110;
}

/* 移动端抽屉动画 */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

.slide-up-enter-to,
.slide-up-leave-from {
  transform: translateY(0);
  opacity: 1;
}

/* 遮罩层动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
}

/* 移动端优化 */
@media (max-width: 768px) {
  .mobile-drawer {
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }
}
</style>
