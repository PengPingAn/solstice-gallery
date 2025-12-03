<template>
  <!-- 背景遮罩层 -->
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="visible"
        ref="viewerContainer"
        class="fixed inset-0 z-[9999] overflow-hidden"
        :style="{ '--color-accent': accentColor }"
        @click.self="handleBackdropClick"
        @keydown="handleKeydown"
        tabindex="0"
      >
        <!-- 背景模糊层 -->
        <div
          class="bg-material-opaque fixed inset-0"
          :style="{ opacity: backdropOpacity }"
        ></div>

        <!-- 背景图片 -->
        <div class="fixed inset-0" :style="{ opacity: backgroundOpacity }">
          <img
            class="h-full w-full size-fill scale-110 object-cover"
            :src="currentImage.thumbnail"
            :alt="currentImage.filename"
          />
        </div>

        <!-- 主内容区域 -->
        <div
          class="fixed inset-0 z-50 flex items-center justify-center"
          style="touch-action: none; pointer-events: auto"
        >
          <div class="flex size-full flex-row">
            <!-- 左侧：图片展示区 -->
            <div class="z-1 flex min-h-0 min-w-0 flex-1 flex-col">
              <!-- 顶部操作栏 -->
              <div
                class="pointer-events-none absolute top-4 right-4 left-4 z-30 flex items-center justify-between"
                style="opacity: 1"
              >
                <div class="flex items-center gap-2">
                  <!-- 左侧操作按钮区域 -->
                  <button
                    v-if="showDownload"
                    type="button"
                    class="bg-material-ultra-thick pointer-events-auto flex size-8 items-center justify-center rounded-full text-white backdrop-blur-2xl duration-200 hover:bg-black/40"
                    title="下载图片"
                    @click="downloadImage"
                  >
                    <i class="i-mingcute-download-line"></i>
                  </button>
                </div>
                <div class="flex items-center gap-2">
                  <button
                    v-if="showShare"
                    type="button"
                    class="bg-material-ultra-thick pointer-events-auto flex size-8 items-center justify-center rounded-full text-white backdrop-blur-2xl duration-200 hover:bg-black/40"
                    title="分享照片"
                    @click="handleShare"
                  >
                    <i class="i-mingcute-share-2-line"></i>
                  </button>
                  <button
                    type="button"
                    class="bg-material-ultra-thick pointer-events-auto flex size-8 items-center justify-center rounded-full text-white backdrop-blur-2xl duration-200 hover:bg-black/40"
                    @click="handleClose"
                    title="关闭"
                  >
                    <i class="i-mingcute-close-line"></i>
                  </button>
                </div>
              </div>

              <!-- 图片区域 -->
              <div class="group relative flex min-h-0 min-w-0 flex-1" style="opacity: 1">
                <!-- Swiper 容器 -->
                <div
                  v-if="showSwiper"
                  ref="swiperContainer"
                  class="swiper h-full w-full"
                  :class="{
                    'cursor-grab': !isZoomed,
                    'cursor-grabbing': isDragging && !isZoomed,
                  }"
                  @mousedown="handleMouseDown"
                  @touchstart="handleTouchStart"
                >
                  <div class="swiper-wrapper">
                    <div
                      v-for="(image, index) in images"
                      :key="image.id"
                      :class="[
                        'swiper-slide',
                        'flex',
                        'items-center',
                        'justify-center',
                        { 'swiper-slide-active': index === currentIndex },
                      ]"
                    >
                      <div
                        class="relative flex h-full w-full items-center justify-center"
                      >
                        <div
                          class="relative overflow-hidden h-full w-full"
                          @dblclick="handleDoubleClick"
                          @wheel="handleWheel"
                        >
                          <img
                            :src="image.src"
                            :alt="image.alt || image.filename"
                            class="absolute inset-0 h-full w-full object-contain transition-opacity duration-300 opacity-100"
                            :style="{
                              transform: `scale(${zoomScale}) translate(${dragOffset.x}px, ${dragOffset.y}px)`,
                              transformOrigin: 'center center',
                              transition: isDragging ? 'none' : 'transform 0.3s ease',
                              cursor: zoomScale > 1 ? 'grab' : 'default',
                            }"
                            @load="handleImageLoad"
                            @error="handleImageError"
                          />
                          <!-- 加载状态 -->
                          <div
                            v-if="imageLoadingStates[index]"
                            class="absolute inset-0 flex items-center justify-center bg-black/20"
                          >
                            <div
                              class="animate-spin rounded-full h-12 w-12 border-t-2 border-white"
                            ></div>
                          </div>
                          <!-- 缩放提示 -->
                          <div
                            v-if="showZoomHint"
                            class="pointer-events-none absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded bg-black/50 px-2 py-1 text-xs text-white opacity-0 duration-200 group-hover:opacity-50"
                          >
                            双击或滚轮缩放
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 分页器 -->
                  <div v-if="showPagination" class="swiper-pagination"></div>
                </div>

                <!-- 导航按钮 -->
                <button
                  v-if="showNavigation && hasPrev"
                  type="button"
                  class="bg-material-medium absolute top-1/2 left-4 z-20 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-white opacity-0 backdrop-blur-sm duration-200 group-hover:opacity-100 hover:bg-black/40"
                  @click="goToPrev"
                >
                  <i class="i-mingcute-left-line text-xl"></i>
                </button>
                <button
                  v-if="showNavigation && hasNext"
                  type="button"
                  class="bg-material-medium absolute top-1/2 right-4 z-20 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-white opacity-0 backdrop-blur-sm duration-200 group-hover:opacity-100 hover:bg-black/40"
                  @click="goToNext"
                >
                  <i class="i-mingcute-right-line text-xl"></i>
                </button>

                <!-- 缩放控制 -->
                <div
                  v-if="showZoomControls"
                  class="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 opacity-0 duration-200 group-hover:opacity-100"
                >
                  <button
                    type="button"
                    class="bg-material-ultra-thick flex size-8 items-center justify-center rounded-full text-white backdrop-blur-2xl duration-200 hover:bg-black/40"
                    @click="zoomOut"
                    title="缩小"
                  >
                    <i class="i-mingcute-zoom-out-line"></i>
                  </button>
                  <button
                    type="button"
                    class="bg-material-ultra-thick flex size-8 items-center justify-center rounded-full text-white backdrop-blur-2xl duration-200 hover:bg-black/40"
                    @click="resetZoom"
                    title="重置缩放"
                  >
                    {{ Math.round(zoomScale * 100) }}%
                  </button>
                  <button
                    type="button"
                    class="bg-material-ultra-thick flex size-8 items-center justify-center rounded-full text-white backdrop-blur-2xl duration-200 hover:bg-black/40"
                    @click="zoomIn"
                    title="放大"
                  >
                    <i class="i-mingcute-zoom-in-line"></i>
                  </button>
                </div>
              </div>

              <!-- 缩略图区域 -->
              <Transition name="slide-up">
                <div
                  v-if="showThumbnails"
                  class="pb-safe bg-material-medium z-10 shrink-0 backdrop-blur-2xl"
                  :style="{
                    pointerEvents: 'auto',
                    boxShadow:
                      '0 -8px 32px color-mix(in srgb, var(--color-accent) 8%, transparent), 0 -4px 16px color-mix(in srgb, var(--color-accent) 6%, transparent), 0 -2px 8px rgba(0, 0, 0, 0.1)',
                    opacity: thumbnailsOpacity,
                    transform: 'none',
                  }"
                >
                  <div
                    class="pointer-events-none absolute inset-0"
                    :style="{
                      background:
                        'linear-gradient(to top, color-mix(in srgb, var(--color-accent) 5%, transparent), transparent)',
                    }"
                  ></div>
                  <div class="scrollbar-none relative z-10 overflow-x-auto">
                    <div class="flex space-x-2 px-4 py-3">
                      <button
                        v-for="(image, index) in images"
                        :key="image.id"
                        type="button"
                        :class="[
                          'contain-intrinsic-size h-16 w-16 flex-shrink-0 overflow-hidden transition-all duration-200 hover:grayscale-0 border-2',
                          {
                            'scale-110 border-accent shadow-[0_0_20px_color-mix(in_srgb,var(--color-accent)_20%,transparent)]':
                              index === currentIndex,
                            'grayscale border-accent/20': index !== currentIndex,
                          },
                        ]"
                        @click="goToIndex(index)"
                      >
                        <img
                          class="absolute inset-0 h-full w-full object-cover"
                          :src="image.thumbnail"
                          :alt="image.alt || image.filename"
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </Transition>
            </div>

            <!-- 右侧：信息面板 -->
            <Transition name="slide-in">
              <div
                v-if="showInfoPanel"
                class="relative w-80 shrink-0 backdrop-blur-2xl border-accent/20 flex flex-col text-white"
                :style="{
                  pointerEvents: 'auto',
                  backgroundImage:
                    'linear-gradient(to bottom right, rgba(var(--color-materialMedium)), rgba(var(--color-materialThick)))',
                  boxShadow:
                    '0 8px 32px color-mix(in srgb, var(--color-accent) 8%, transparent), 0 4px 16px color-mix(in srgb, var(--color-accent) 6%, transparent), 0 2px 8px rgba(0, 0, 0, 0.1)',
                }"
              >
                <!-- 面板渐变背景 -->
                <div
                  class="pointer-events-none absolute inset-0"
                  :style="{
                    background:
                      'linear-gradient(to bottom right, color-mix(in srgb, var(--color-accent) 5%, transparent), transparent, color-mix(in srgb, var(--color-accent) 5%, transparent))',
                  }"
                ></div>

                <!-- 面板头部 -->
                <div class="relative z-50 shrink-0">
                  <div
                    class="relative mt-3.5 mb-3 flex items-center justify-between px-3.5"
                  >
                    <div class="size-8">
                      <button
                        v-if="showFullscreen"
                        type="button"
                        class="bg-material-ultra-thick pointer-events-auto flex size-8 items-center justify-center rounded-full text-white backdrop-blur-2xl duration-200 hover:bg-black/40"
                        @click="toggleFullscreen"
                        title="全屏"
                      >
                        <i class="i-mingcute-fullscreen-line"></i>
                      </button>
                    </div>
                    <div
                      role="tablist"
                      class="inline-flex h-9 items-center justify-center p-1 outline-none border-accent/20 bg-material-ultra-thick rounded text-white"
                    >
                      <button
                        type="button"
                        role="tab"
                        class="ring-offset-background relative inline-flex items-center justify-center px-3 text-sm font-medium whitespace-nowrap transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-accent/30 h-full rounded-md text-white data-[state=active]:text-white"
                        @click="activeTab = 'info'"
                        :class="{
                          'text-white/60 hover:text-white/80': activeTab !== 'info',
                        }"
                      >
                        <span class="z-[1]">
                          <div class="flex items-center">
                            <i class="i-mingcute-information-line mr-1.5"></i>信息
                          </div>
                        </span>
                        <span
                          v-if="activeTab === 'info'"
                          class="absolute inset-0 z-0 rounded-md bg-accent/20"
                        ></span>
                      </button>
                      <button
                        type="button"
                        role="tab"
                        class="ring-offset-background relative inline-flex items-center justify-center px-3 text-sm font-medium whitespace-nowrap transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-accent/30 h-full rounded-md text-white/60 hover:text-white/80"
                        @click="activeTab = 'comments'"
                        :class="{
                          'text-white/60 hover:text-white/80': activeTab !== 'comments',
                        }"
                      >
                        <span class="z-[1]">
                          <div class="flex items-center">
                            <i class="i-mingcute-comment-line mr-1.5"></i>评论
                          </div>
                        </span>
                        <span
                          v-if="activeTab === 'comments'"
                          class="absolute inset-0 z-0 rounded-md bg-accent/20"
                        ></span>
                      </button>
                    </div>
                    <button
                      type="button"
                      class="bg-material-ultra-thick pointer-events-auto flex size-8 items-center justify-center rounded-full text-white backdrop-blur-2xl duration-200 hover:bg-black/40"
                      @click="toggleInfoPanel"
                      aria-label="折叠/展开信息面板"
                    >
                      <i class="i-lucide-panel-right-close"></i>
                    </button>
                  </div>
                </div>

                <!-- 面板内容 -->
                <div class="relative z-10 flex min-h-0 flex-1">
                  <div class="flex-1 min-h-0 overflow-auto px-4 pb-4">
                    <!-- 信息标签页 -->
                    <div v-if="activeTab === 'info'" class="space-y-4">
                      <!-- 基本信息 -->
                      <div>
                        <h4 class="mb-2 text-sm font-medium text-white/80">基本信息</h4>
                        <div class="space-y-1 text-sm">
                          <div class="flex justify-between gap-4 text-sm">
                            <span class="text-text-secondary shrink-0">文件名</span>
                            <span class="text-text min-w-0 text-right truncate">{{
                              currentImage.filename
                            }}</span>
                          </div>
                          <div class="flex justify-between gap-4 text-sm">
                            <span class="text-text-secondary shrink-0">格式</span>
                            <span class="text-text min-w-0 text-right">{{
                              currentImage.format
                            }}</span>
                          </div>
                          <div class="flex justify-between gap-4 text-sm">
                            <span class="text-text-secondary shrink-0">尺寸</span>
                            <span class="text-text min-w-0 text-right">{{
                              currentImage.dimensions
                            }}</span>
                          </div>
                          <div class="flex justify-between gap-4 text-sm">
                            <span class="text-text-secondary shrink-0">文件大小</span>
                            <span class="text-text min-w-0 text-right">{{
                              currentImage.size
                            }}</span>
                          </div>
                          <div class="flex justify-between gap-4 text-sm">
                            <span class="text-text-secondary shrink-0">像素</span>
                            <span class="text-text min-w-0 text-right">{{
                              currentImage.megapixels
                            }}</span>
                          </div>
                          <div class="flex justify-between gap-4 text-sm">
                            <span class="text-text-secondary shrink-0">拍摄时间</span>
                            <span class="text-text min-w-0 text-right">{{
                              currentImage.captureTime
                            }}</span>
                          </div>
                          <div class="flex justify-between gap-4 text-sm">
                            <span class="text-text-secondary shrink-0">时区</span>
                            <span class="text-text min-w-0 text-right">{{
                              currentImage.timezone
                            }}</span>
                          </div>
                          <div class="flex justify-between gap-4 text-sm">
                            <span class="text-text-secondary shrink-0">艺术家</span>
                            <span class="text-text min-w-0 text-right">{{
                              currentImage.artist
                            }}</span>
                          </div>
                          <div class="flex justify-between gap-4 text-sm">
                            <span class="text-text-secondary shrink-0">软件</span>
                            <span class="text-text min-w-0 text-right">{{
                              currentImage.software
                            }}</span>
                          </div>
                        </div>
                      </div>

                      <!-- 拍摄参数 -->
                      <div v-if="currentImage.exif">
                        <h4 class="my-2 text-sm font-medium text-white/80">拍摄参数</h4>
                        <div class="grid grid-cols-2 gap-2">
                          <div
                            v-if="currentImage.exif.focalLength"
                            class="border-accent/20 bg-accent/10 flex h-6 items-center gap-2 rounded-md border px-2"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="1em"
                              height="1em"
                              viewBox="0 0 14 14"
                              class="text-sm text-white/70"
                            >
                              <g
                                fill="none"
                                stroke="currentColor"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                              >
                                <circle cx="7" cy="7" r="6.5"></circle>
                                <circle cx="7" cy="7" r="2.5"></circle>
                                <path d="M4.5 7V1M7 4.5h6M9.5 7v6M7 9.5H1"></path>
                              </g>
                            </svg>
                            <span class="text-xs">{{
                              currentImage.exif.focalLength
                            }}</span>
                          </div>
                          <div
                            v-if="currentImage.exif.aperture"
                            class="border-accent/20 bg-accent/10 flex h-6 items-center gap-2 rounded-md border px-2"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="1em"
                              height="1em"
                              viewBox="0 0 24 24"
                              class="text-sm text-white/70"
                            >
                              <path
                                fill="none"
                                stroke="currentColor"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0-18 0m.6 3h10.55M6.551 4.938l3.26 10.034m7.221-10.336l-8.535 6.201m12.062 3.673l-8.535-6.201m.233 12.607l3.261-10.034"
                              ></path>
                            </svg>
                            <span class="text-xs">{{ currentImage.exif.aperture }}</span>
                          </div>
                          <div
                            v-if="currentImage.exif.shutterSpeed"
                            class="border-accent/20 bg-accent/10 flex h-6 items-center gap-2 rounded-md border px-2"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="1em"
                              height="1em"
                              viewBox="0 0 24 24"
                              class="text-sm text-white/70"
                            >
                              <path
                                fill="currentColor"
                                d="M9 3V1h6v2zm3 19q-1.875 0-3.512-.712T5.625 19.35T3.7 16.487T3 13t.713-3.488T5.65 6.65t2.863-1.937T12 4q1.575 0 3 .525T17.6 6l1.45-1.45l1.4 1.4l-1.4 1.45q.9 1.175 1.425 2.6T21 13q0 1.85-.7 3.488t-1.925 2.862t-2.863 1.938T12 22m0-2q2.925 0 4.963-2.037T19 13t-2.037-4.962T12 6T7.038 8.038T5 13t2.038 4.963T12 20m0-9h5.65q-.45-1.275-1.4-2.238T14.1 7.375zm-1.725 1L13.1 7.1q-1.275-.25-2.562.075t-2.363 1.2zM6.1 14h4.175L7.45 9.1q-.875.975-1.225 2.263T6.1 14m3.8 4.625L12 15H6.35q.425 1.25 1.388 2.225t2.162 1.4m1 .275q1.425.275 2.725-.112t2.2-1.163L13.725 14zm5.65-2q.9-1.025 1.238-2.287T17.9 12h-4.175z"
                              ></path>
                            </svg>
                            <span class="text-xs">{{
                              currentImage.exif.shutterSpeed
                            }}</span>
                          </div>
                          <div
                            v-if="currentImage.exif.iso"
                            class="border-accent/20 bg-accent/10 flex h-6 items-center gap-2 rounded-md border px-2"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="1em"
                              height="1em"
                              viewBox="0 0 32 32"
                              class="text-sm text-white/70"
                            >
                              <path
                                fill="currentColor"
                                d="M24 21h-3a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2m-3-8v6h3v-6zm-6 8h-5v-2h5v-2h-3a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h5v2h-5v2h3a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2M6 11h2v10H6z"
                              ></path>
                              <path
                                fill="currentColor"
                                d="M28 6H4a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h24a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2M4 24V8h24v16Z"
                              ></path>
                            </svg>
                            <span class="text-xs">{{ currentImage.exif.iso }}</span>
                          </div>
                        </div>
                      </div>

                      <!-- 标签 -->
                      <div
                        v-if="currentImage.tags && currentImage.tags.length"
                        class="mt-3 mb-3"
                      >
                        <h4 class="mb-2 text-sm font-medium text-white/80">标签</h4>
                        <div class="-ml-1 flex flex-wrap gap-1.5">
                          <span
                            v-for="tag in currentImage.tags"
                            :key="tag"
                            class="glassmorphic-btn border-accent/20 bg-accent/10 inline-flex items-center rounded-full border px-2 py-1 text-xs text-white/90 backdrop-blur-sm"
                          >
                            {{ tag }}
                          </span>
                        </div>
                      </div>

                      <!-- 设备信息 -->
                      <div v-if="currentImage.exif && currentImage.exif.camera">
                        <h4 class="my-2 text-sm font-medium text-white/80">设备信息</h4>
                        <div class="space-y-1 text-sm">
                          <div class="flex justify-between gap-4 text-sm">
                            <span class="text-text-secondary shrink-0">相机</span>
                            <span class="text-text min-w-0 text-right">{{
                              currentImage.exif.camera
                            }}</span>
                          </div>
                          <div
                            v-if="currentImage.exif.lens"
                            class="flex justify-between gap-4 text-sm"
                          >
                            <span class="text-text-secondary shrink-0">镜头</span>
                            <span class="text-text min-w-0 text-right">{{
                              currentImage.exif.lens
                            }}</span>
                          </div>
                        </div>
                      </div>

                      <!-- 拍摄模式 -->
                      <div v-if="currentImage.exif && currentImage.exif.exposureMode">
                        <h4 class="my-2 text-sm font-medium text-white/80">拍摄模式</h4>
                        <div class="space-y-1 text-sm">
                          <div class="flex justify-between gap-4 text-sm">
                            <span class="text-text-secondary shrink-0">曝光模式</span>
                            <span class="text-text min-w-0 text-right">{{
                              currentImage.exif.exposureMode
                            }}</span>
                          </div>
                          <div
                            v-if="currentImage.exif.whiteBalance"
                            class="flex justify-between gap-4 text-sm"
                          >
                            <span class="text-text-secondary shrink-0">白平衡</span>
                            <span class="text-text min-w-0 text-right">{{
                              currentImage.exif.whiteBalance
                            }}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- 评论标签页 -->
                    <div v-if="activeTab === 'comments'" class="space-y-4">
                      <div class="text-center py-8 text-white/60">
                        <i class="i-mingcute-comment-line text-4xl mb-2"></i>
                        <p>暂无评论</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from "vue";
import type { PropType } from "vue";

// 类型定义
export interface ImageInfo {
  id: string | number;
  src: string;
  thumbnail: string;
  alt?: string;
  filename: string;
  format: string;
  size: string;
  dimensions: string;
  megapixels: string;
  captureTime: string;
  timezone: string;
  artist: string;
  software: string;
  tags?: string[];
  exif?: {
    focalLength?: string;
    aperture?: string;
    shutterSpeed?: string;
    iso?: string;
    camera?: string;
    lens?: string;
    exposureMode?: string;
    whiteBalance?: string;
  };
  location?: {
    latitude: string;
    longitude: string;
    altitude: string;
  };
}

// Props
const props = defineProps({
  // 图片数据
  images: {
    type: Array as PropType<ImageInfo[]>,
    required: true,
    default: () => [],
  },

  // 初始显示索引
  initialIndex: {
    type: Number,
    default: 0,
  },

  // 是否显示
  visible: {
    type: Boolean,
    default: false,
  },

  // 主题色
  accentColor: {
    type: String,
    default: "#626670",
  },

  // 配置选项
  config: {
    type: Object as PropType<{
      showInfoPanel?: boolean;
      showThumbnails?: boolean;
      showNavigation?: boolean;
      showZoomControls?: boolean;
      showDownload?: boolean;
      showShare?: boolean;
      showFullscreen?: boolean;
      showSwiper?: boolean;
      showPagination?: boolean;
      backdropOpacity?: number;
      backgroundOpacity?: number;
      thumbnailsOpacity?: number;
      closeOnBackdropClick?: boolean;
      keyboardNavigation?: boolean;
      showZoomHint?: boolean;
    }>,
    default: () => ({
      showInfoPanel: true,
      showThumbnails: true,
      showNavigation: true,
      showZoomControls: true,
      showDownload: true,
      showShare: true,
      showFullscreen: true,
      showSwiper: true,
      showPagination: true,
      backdropOpacity: 1,
      backgroundOpacity: 1,
      thumbnailsOpacity: 1,
      closeOnBackdropClick: true,
      keyboardNavigation: true,
      showZoomHint: true,
    }),
  },
});

// Emits
const emit = defineEmits<{
  "update:visible": [value: boolean];
  close: [];
  change: [index: number, image: ImageInfo];
  share: [image: ImageInfo];
  download: [image: ImageInfo];
  "fullscreen-change": [isFullscreen: boolean];
}>();

// 响应式状态
const currentIndex = ref(props.initialIndex);
const isInfoPanelOpen = ref(props.config.showInfoPanel ?? true);
const activeTab = ref<"info" | "comments">("info");
const zoomScale = ref(1);
const isDragging = ref(false);
const dragStart = ref({ x: 0, y: 0 });
const dragOffset = ref({ x: 0, y: 0 });
const isZoomed = ref(false);
const imageLoadingStates = ref<boolean[]>([]);
const isFullscreen = ref(false);
const viewerContainer = ref<HTMLElement>();
const swiperContainer = ref<HTMLElement>();

// 计算属性
const currentImage = computed(() => {
  return props.images[currentIndex.value] || props.images[0];
});

const hasPrev = computed(() => {
  return currentIndex.value > 0;
});

const hasNext = computed(() => {
  return currentIndex.value < props.images.length - 1;
});

// 配置计算属性
const showInfoPanel = computed(() => isInfoPanelOpen.value);
const showThumbnails = computed(() => props.config.showThumbnails ?? true);
const showNavigation = computed(() => props.config.showNavigation ?? true);
const showZoomControls = computed(() => props.config.showZoomControls ?? true);
const showDownload = computed(() => props.config.showDownload ?? true);
const showShare = computed(() => props.config.showShare ?? true);
const showFullscreen = computed(() => props.config.showFullscreen ?? true);
const showSwiper = computed(() => props.config.showSwiper ?? true);
const showPagination = computed(() => props.config.showPagination ?? true);
const backdropOpacity = computed(() => props.config.backdropOpacity ?? 1);
const backgroundOpacity = computed(() => props.config.backgroundOpacity ?? 1);
const thumbnailsOpacity = computed(() => props.config.thumbnailsOpacity ?? 1);
const closeOnBackdropClick = computed(() => props.config.closeOnBackdropClick ?? true);
const keyboardNavigation = computed(() => props.config.keyboardNavigation ?? true);
const showZoomHint = computed(() => props.config.showZoomHint ?? true);

// 方法
const goToIndex = (index: number) => {
  if (index >= 0 && index < props.images.length) {
    currentIndex.value = index;
    resetZoom();
    emit("change", index, props.images[index]);
  }
};

const goToPrev = () => {
  if (hasPrev.value) {
    goToIndex(currentIndex.value - 1);
  }
};

const goToNext = () => {
  if (hasNext.value) {
    goToIndex(currentIndex.value + 1);
  }
};

const handleClose = () => {
  emit("update:visible", false);
  emit("close");
  resetZoom();
};

const handleBackdropClick = () => {
  if (closeOnBackdropClick.value) {
    handleClose();
  }
};

const handleShare = () => {
  emit("share", currentImage.value);
};

const downloadImage = () => {
  emit("download", currentImage.value);
};

const toggleInfoPanel = () => {
  isInfoPanelOpen.value = !isInfoPanelOpen.value;
};

const zoomIn = () => {
  zoomScale.value = Math.min(zoomScale.value + 0.5, 5);
  isZoomed.value = zoomScale.value > 1;
};

const zoomOut = () => {
  zoomScale.value = Math.max(zoomScale.value - 0.5, 0.5);
  isZoomed.value = zoomScale.value > 1;
  if (zoomScale.value === 1) {
    dragOffset.value = { x: 0, y: 0 };
  }
};

const resetZoom = () => {
  zoomScale.value = 1;
  dragOffset.value = { x: 0, y: 0 };
  isZoomed.value = false;
};

const handleDoubleClick = (event: MouseEvent) => {
  if (zoomScale.value === 1) {
    zoomScale.value = 2;
    isZoomed.value = true;
  } else {
    resetZoom();
  }
};

const handleWheel = (event: WheelEvent) => {
  event.preventDefault();
  if (event.deltaY < 0) {
    zoomIn();
  } else {
    zoomOut();
  }
};

const handleMouseDown = (event: MouseEvent) => {
  if (zoomScale.value > 1) {
    isDragging.value = true;
    dragStart.value = {
      x: event.clientX - dragOffset.value.x,
      y: event.clientY - dragOffset.value.y,
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging.value) {
        dragOffset.value = {
          x: e.clientX - dragStart.value.x,
          y: e.clientY - dragStart.value.y,
        };
      }
    };

    const handleMouseUp = () => {
      isDragging.value = false;
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }
};

const handleTouchStart = (event: TouchEvent) => {
  if (zoomScale.value > 1) {
    event.preventDefault();
    const touch = event.touches[0];
    isDragging.value = true;
    dragStart.value = {
      x: touch.clientX - dragOffset.value.x,
      y: touch.clientY - dragOffset.value.y,
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging.value) {
        const touch = e.touches[0];
        dragOffset.value = {
          x: touch.clientX - dragStart.value.x,
          y: touch.clientY - dragStart.value.y,
        };
      }
    };

    const handleTouchEnd = () => {
      isDragging.value = false;
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };

    document.addEventListener("touchmove", handleTouchMove);
    document.addEventListener("touchend", handleTouchEnd);
  }
};

const handleKeydown = (event: KeyboardEvent) => {
  if (!keyboardNavigation.value || !props.visible) return;

  switch (event.key) {
    case "Escape":
      handleClose();
      break;
    case "ArrowLeft":
      goToPrev();
      break;
    case "ArrowRight":
      goToNext();
      break;
    case "+":
    case "=":
      event.preventDefault();
      zoomIn();
      break;
    case "-":
      event.preventDefault();
      zoomOut();
      break;
    case "0":
      resetZoom();
      break;
    case "i":
      toggleInfoPanel();
      break;
    case "f":
      toggleFullscreen();
      break;
  }
};

const handleImageLoad = (index: number) => {
  imageLoadingStates.value[index] = false;
};

const handleImageError = (index: number) => {
  imageLoadingStates.value[index] = false;
  console.error(`Failed to load image at index ${index}`);
};

const toggleFullscreen = () => {
  if (!viewerContainer.value) return;

  if (!isFullscreen.value) {
    if (viewerContainer.value.requestFullscreen) {
      viewerContainer.value.requestFullscreen();
    } else if ((viewerContainer.value as any).webkitRequestFullscreen) {
      (viewerContainer.value as any).webkitRequestFullscreen();
    } else if ((viewerContainer.value as any).msRequestFullscreen) {
      (viewerContainer.value as any).msRequestFullscreen();
    }
    isFullscreen.value = true;
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if ((document as any).webkitExitFullscreen) {
      (document as any).webkitExitFullscreen();
    } else if ((document as any).msExitFullscreen) {
      (document as any).msExitFullscreen();
    }
    isFullscreen.value = false;
  }

  emit("fullscreen-change", isFullscreen.value);
};

// 初始化图片加载状态
const initImageLoadingStates = () => {
  imageLoadingStates.value = new Array(props.images.length).fill(true);
};

// 监听变化
watch(
  () => props.initialIndex,
  (newIndex) => {
    currentIndex.value = newIndex;
    resetZoom();
  }
);

watch(
  () => props.images,
  () => {
    initImageLoadingStates();
  },
  { immediate: true }
);

watch(
  () => props.visible,
  (isVisible) => {
    if (isVisible) {
      // 确保焦点在容器上以接收键盘事件
      nextTick(() => {
        viewerContainer.value?.focus();
      });
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      resetZoom();
    }
  }
);

// 全屏变化监听
const handleFullscreenChange = () => {
  isFullscreen.value = !!(
    document.fullscreenElement ||
    (document as any).webkitFullscreenElement ||
    (document as any).msFullscreenElement
  );
};

// 生命周期
onMounted(() => {
  document.addEventListener("fullscreenchange", handleFullscreenChange);
  document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
  document.addEventListener("MSFullscreenChange", handleFullscreenChange);

  // 初始化图片加载状态
  initImageLoadingStates();
});

onUnmounted(() => {
  document.removeEventListener("fullscreenchange", handleFullscreenChange);
  document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
  document.removeEventListener("MSFullscreenChange", handleFullscreenChange);

  // 恢复 body 滚动
  document.body.style.overflow = "";
});
</script>

<style scoped>
/* 动画效果 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(100%);
}

.slide-in-enter-active,
.slide-in-leave-active {
  transition: all 0.3s ease;
}

.slide-in-enter-from,
.slide-in-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

/* 自定义滚动条 */
.scrollbar-none {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-none::-webkit-scrollbar {
  display: none;
}

/* 玻璃态效果 */
.glassmorphic-btn {
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

/* 图片容器 */
.contain-intrinsic-size {
  contain-intrinsic-size: 64px;
}

/* Swiper 基本样式 */
.swiper {
  width: 100%;
  height: 100%;
}

.swiper-wrapper {
  display: flex;
  align-items: center;
}

.swiper-slide {
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 自定义光标 */
.cursor-grab {
  cursor: grab;
}

.cursor-grabbing {
  cursor: grabbing;
}

/* 加载动画 */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
