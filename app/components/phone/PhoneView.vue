<script setup lang="ts">
import { ref, computed, watch } from "vue";

// 定义接口
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

const currentIndex = ref(props.initialIndex);

const thumbnailContainer = ref<HTMLElement | null>(null);

const currentImage = computed(() => props.images[currentIndex.value]);

const gotoPrev = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--;
    scrollToThumbnail(currentIndex.value);
  }
};

const gotoNext = () => {
  if (currentIndex.value < props.images.length - 1) {
    currentIndex.value++;
    scrollToThumbnail(currentIndex.value);
  }
};

const gotoIndex = (index: number) => {
  currentIndex.value = index;
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

// 鼠标滚轮横向滚动
const onThumbnailWheel = (e: WheelEvent) => {
  if (!thumbnailContainer.value) return;
  e.preventDefault(); // 阻止垂直滚动
  thumbnailContainer.value.scrollLeft += e.deltaY; // 用 deltaY 控制横向滚动
};

watch(
  () => props.initialIndex,
  (newIndex) => {
    gotoIndex(props.initialIndex);
  }
);

onMounted(() => {
  gotoIndex(props.initialIndex);
});
</script>

<template>
  <div class="fixed inset-0 z-9999" style="--color-accent: #626670">
    <div class="bg-material-opaque fixed inset-0" style="opacity: 1"></div>
    <div class="fixed inset-0" style="opacity: 1">
      <img
        class="h-full w-full size-fill scale-110"
        src="data:image/png;base64,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"
      />
    </div>
    <div
      class="fixed inset-0 z-50 flex items-center justify-center"
      style="touch-action: none; pointer-events: auto; opacity: 1"
    >
      <div class="flex size-full flex-row">
        <div class="z-1 flex min-h-0 min-w-0 flex-1 flex-col">
          <!-- 主图显示区域 -->
          <div class="group relative flex min-h-0 min-w-0 flex-1" style="opacity: 1">
            <div
              class="pointer-events-none absolute top-4 right-4 left-4 z-30 flex items-center justify-between"
              style="opacity: 1"
            >
              <div class="flex items-center gap-2"></div>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  class="bg-material-ultra-thick pointer-events-auto flex size-8 items-center justify-center bg-neutral-800 rounded-full text-white backdrop-blur-2xl duration-200 hover:bg-black/20 focus:outline-none focus-visible:outline-none"
                  title="分享照片"
                >
                  <UIcon name="iconoir:share-android"></UIcon></button
                ><button
                  type="button"
                  class="bg-material-ultra-thick pointer-events-auto flex size-8 items-center justify-center bg-neutral-800 rounded-full text-white backdrop-blur-2xl duration-200 hover:bg-black/20"
                  @click="handleClose"
                >
                  <UIcon name="material-symbols:close"></UIcon>
                </button>
              </div>
            </div>

            <!-- 主图片显示 -->
            <div class="flex items-center justify-center h-full w-full">
              <div
                class="relative flex h-full w-full items-center justify-center"
                style="visibility: visible; opacity: 1; transform: none"
              >
                <div class="relative overflow-hidden h-full w-full object-contain">
                  <img
                    v-if="currentImage"
                    :alt="currentImage.title"
                    class="absolute inset-0 h-full w-full object-contain transition-opacity duration-300 opacity-100"
                    :src="currentImage.url"
                  />
                  <div
                    class="pointer-events-none absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded bg-black/50 px-2 py-1 text-xs text-white opacity-0 duration-200 group-hover:opacity-50"
                  >
                    双击或捏合缩放{{ props.initialIndex }}
                  </div>
                </div>
              </div>
            </div>

            <!-- 左右切换按钮 -->
            <button
              v-show="currentIndex > 0"
              type="button"
              class="bg-material-medium absolute top-1/2 left-4 z-20 flex size-8 -translate-y-1/2 items-center justify-center bg-neutral-800 rounded-full text-white opacity-0 backdrop-blur-sm duration-200 group-hover:opacity-100 hover:bg-black/20"
              @click="gotoPrev"
            >
              <UIcon name="ic:baseline-keyboard-arrow-left"></UIcon></button
            ><button
              v-show="currentIndex < images.length - 1"
              type="button"
              class="bg-material-medium absolute top-1/2 right-4 z-20 flex size-8 -translate-y-1/2 items-center justify-center bg-neutral-800 rounded-full text-white opacity-0 backdrop-blur-sm duration-200 group-hover:opacity-100 hover:bg-black/20"
              @click="gotoNext"
            >
              <UIcon name="material-symbols:chevron-right"></UIcon>
            </button>
          </div>

          <!-- 缩略图区域 -->
          <div
            class="pb-safe bg-material-medium z-10 shrink-0 backdrop-blur-2xl overflow-hidden"
            style="
              pointer-events: auto;
              box-shadow: 0 -8px 32px color-mix(in srgb, var(--color-accent) 8%, transparent),
                0 -4px 16px color-mix(in srgb, var(--color-accent) 6%, transparent),
                0 -2px 8px rgba(0, 0, 0, 0.1);
              opacity: 1;
              transform: none;
            "
          >
            <div
              class="pointer-events-none absolute inset-0 overflow-hidden"
              style="
                background: linear-gradient(
                  to top,
                  color-mix(in srgb, var(--color-accent) 5%, transparent),
                  transparent
                );
              "
            ></div>
            <!-- 缩略图横向滚动容器 -->
            <div
              ref="thumbnailContainer"
              class="scrollbar-none relative z-10 overflow-x-hidden flex gap-1 p-2"
              @wheel="onThumbnailWheel"
            >
              <button
                v-for="(image, index) in images"
                :key="image.id"
                type="button"
                class="contain-intrinsic-size flex-shrink-0 h-16 w-16 overflow-hidden transition-all hover:grayscale-0 rounded"
                :class="[
                  currentIndex === index
                    ? 'ring-2 ring-accent grayscale-0'
                    : 'grayscale border border-accent/20',
                ]"
                @click="gotoIndex(index)"
              >
                <img
                  :alt="image.title"
                  class="h-full w-full object-cover"
                  :src="image.url"
                />
              </button>
            </div>
          </div>
        </div>

        <!-- 右侧信息栏（写死参数） -->
        <div
          class="bg-material-opaque z-30 w-[280px] shrink-0 overflow-y-auto border-l border-white/10 p-4 backdrop-blur-2xl"
          style="opacity: 1"
        >
          <div class="space-y-4">
            <div>
              <h2 class="text-lg font-semibold text-white">
                {{ currentImage?.title || "无标题" }}
              </h2>
              <p class="text-sm text-white/60">
                {{ currentImage?.meta || "无设备信息" }}
              </p>
            </div>
            <div class="space-y-2">
              <div class="flex items-center gap-2 text-sm text-white/80">
                <i class="i-mingcute-calendar-line"></i>
                <span>{{ currentImage?.date || "无日期" }}</span>
              </div>
              <div class="flex items-center gap-2 text-sm text-white/80">
                <i class="i-mingcute-location-line"></i>
                <span>{{ currentImage?.address || "无地址" }}</span>
              </div>
            </div>
          </div>
          <div>
            <h4 class="my-2 text-sm font-medium text-white/80">标签</h4>
            <div class="-ml-1 flex flex-wrap gap-1.5">
              <button
                type="button"
                class="glassmorphic-btn border-accent/20 bg-accent/10 inline-flex cursor-pointer items-center rounded-full border px-2 py-1 text-xs text-white/90 backdrop-blur-sm"
                tabindex="0"
              >
                湖州</button
              ><button
                type="button"
                class="glassmorphic-btn border-accent/20 bg-accent/10 inline-flex cursor-pointer items-center rounded-full border px-2 py-1 text-xs text-white/90 backdrop-blur-sm"
                tabindex="0"
              >
                龙之梦太湖古镇</button
              ><button
                type="button"
                class="glassmorphic-btn border-accent/20 bg-accent/10 inline-flex cursor-pointer items-center rounded-full border px-2 py-1 text-xs text-white/90 backdrop-blur-sm"
                tabindex="0"
              >
                NPC
              </button>
            </div>
          </div>
          <div class="text-white/70">
            <h4 class="my-2 text-sm font-medium text-white/80">影调分析</h4>
            <div class="grid grid-cols-2 gap-x-2 gap-y-1 text-sm">
              <div class="flex justify-between gap-4 text-sm">
                <span class="text-text-secondary shrink-0">亮度</span
                ><span class="text-text min-w-0 text-right">41%</span>
              </div>
              <div class="flex justify-between gap-4 text-sm">
                <span class="text-text-secondary shrink-0">对比度</span
                ><span class="text-text min-w-0 text-right">49%</span>
              </div>
              <div class="flex justify-between gap-4 text-sm">
                <span class="text-text-secondary shrink-0">阴影占比</span
                ><span class="text-text min-w-0 text-right">47%</span>
              </div>
              <div class="flex justify-between gap-4 text-sm">
                <span class="text-text-secondary shrink-0">高光占比</span
                ><span class="text-text min-w-0 text-right">24%</span>
              </div>
            </div>
            <div class="mb-3 text-white/70">
              <div class="mb-2 text-xs font-medium text-white/70">直方图</div>
              <div class="relative grow w-full h-32 group">
                <div
                  class="bg-material-ultra-thin absolute inset-0 flex items-center justify-center rounded-sm backdrop-blur-xl"
                >
                  <div class="text-center">
                    <div class="text-text-secondary text-xs">图片加载失败</div>
                  </div>
                </div>
                <canvas
                  class="bg-material-ultra-thin ring-fill-tertiary/20 group-hover:ring-fill-tertiary/40 h-full w-full rounded-sm ring-1 backdrop-blur-xl transition-all duration-200"
                  width="450"
                  height="224"
                  style="width: 245px; height: 128px"
                ></canvas>
              </div>
            </div>
          </div>
          <div class="text-white/70">
            <h4 class="my-2 text-sm font-medium text-white/80">设备信息</h4>
            <div class="space-y-1 text-sm">
              <div class="flex justify-between gap-4 text-sm">
                <span class="text-text-secondary shrink-0">相机</span
                ><span class="text-text min-w-0 text-right">FUJIFILM X-T5</span>
              </div>
              <div class="flex justify-between gap-4 text-sm">
                <span class="text-text-secondary shrink-0">镜头</span
                ><span class="text-text min-w-0 text-right"
                  >FUJIFILM Fujifilm Fujinon XF70-300mmF4-5.6 R LM OIS WR</span
                >
              </div>
              <div class="flex justify-between gap-4 text-sm">
                <span class="text-text-secondary shrink-0">焦距</span
                ><span class="text-text min-w-0 text-right">84mm</span>
              </div>
              <div class="flex justify-between gap-4 text-sm">
                <span class="text-text-secondary shrink-0">35mm 等效</span
                ><span class="text-text min-w-0 text-right">126mm</span>
              </div>
              <div class="flex justify-between gap-4 text-sm">
                <span class="text-text-secondary shrink-0">最大光圈</span
                ><span class="text-text min-w-0 text-right">f/4</span>
              </div>
            </div>
          </div>
          <div class="text-white/70">
            <h4 class="my-2 text-sm font-medium text-white/80">拍摄模式</h4>
            <div class="space-y-1 text-sm">
              <div class="flex justify-between gap-4 text-sm">
                <span class="text-text-secondary shrink-0">曝光程序</span
                ><span class="text-text min-w-0 text-right">手动</span>
              </div>
              <div class="flex justify-between gap-4 text-sm">
                <span class="text-text-secondary shrink-0">曝光模式</span
                ><span class="text-text min-w-0 text-right">手动</span>
              </div>
              <div class="flex justify-between gap-4 text-sm">
                <span class="text-text-secondary shrink-0">测光模式</span
                ><span class="text-text min-w-0 text-right">多重测光</span>
              </div>
              <div class="flex justify-between gap-4 text-sm">
                <span class="text-text-secondary shrink-0">白平衡</span
                ><span class="text-text min-w-0 text-right">自动</span>
              </div>
              <div class="flex justify-between gap-4 text-sm">
                <span class="text-text-secondary shrink-0">闪光灯</span
                ><span class="text-text min-w-0 text-right">关</span>
              </div>
              <div class="flex justify-between gap-4 text-sm">
                <span class="text-text-secondary shrink-0">光源</span
                ><span class="text-text min-w-0 text-right">未知</span>
              </div>
              <div class="flex justify-between gap-4 text-sm">
                <span class="text-text-secondary shrink-0">场景捕获类型</span
                ><span class="text-text min-w-0 text-right">Standard</span>
              </div>
            </div>
          </div>
          <div class="text-white/70">
            <h4 class="my-2 text-sm font-medium text-white/80">位置信息</h4>
            <div class="space-y-1 text-sm">
              <div class="flex justify-between gap-4 text-sm">
                <span class="text-text-secondary shrink-0">纬度</span
                ><span class="text-text min-w-0 text-right">30.95536° N</span>
              </div>
              <div class="flex justify-between gap-4 text-sm">
                <span class="text-text-secondary shrink-0">经度</span
                ><span class="text-text min-w-0 text-right">120.073288° E</span>
              </div>
              <div class="flex justify-between gap-4 text-sm">
                <span class="text-text-secondary shrink-0">海拔</span
                ><span class="text-text min-w-0 text-right">22m</span>
              </div>
              <div class="mt-3">
                <div
                  class="relative h-40 w-full overflow-hidden rounded-lg border border-white/10"
                >
                  <div
                    style="position: relative; width: 100%; height: 100%"
                    class="maplibregl-map"
                  >
                    <div class="maplibregl-canvas-container">
                      <canvas
                        class="maplibregl-canvas"
                        tabindex="-1"
                        aria-label="Map"
                        role="region"
                        width="502"
                        height="278"
                        style="width: 287px; height: 159px"
                      ></canvas>
                    </div>
                    <div class="maplibregl-control-container">
                      <div class="maplibregl-ctrl-top-left"></div>
                      <div class="maplibregl-ctrl-top-right"></div>
                      <div class="maplibregl-ctrl-bottom-left"></div>
                      <div class="maplibregl-ctrl-bottom-right"></div>
                    </div>
                    <div mapboxgl-children="" style="height: 100%"></div>
                  </div>
                  <div
                    class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                  >
                    <div class="relative">
                      <div
                        class="absolute top-1/2 left-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full bg-blue-400 opacity-75"
                      ></div>
                      <div
                        class="relative h-2 w-2 rounded-full bg-blue-500 ring-2 ring-white/80"
                      ></div>
                    </div>
                  </div>
                  <a
                    class="absolute inset-0 cursor-pointer transition-opacity duration-200 hover:bg-black/10"
                    aria-label="在地图中查看位置"
                    href="/explory?photoId=DSCF4637"
                    target="_blank"
                    data-discover="true"
                  ></a>
                </div>
              </div>
            </div>
          </div>
          <div class="text-white/70">
            <h4 class="my-2 text-sm font-medium text-white/80">技术参数</h4>
            <div class="space-y-1 text-sm">
              <div class="flex justify-between gap-4 text-sm">
                <span class="text-text-secondary shrink-0">亮度</span
                ><span class="text-text min-w-0 text-right">5.0 EV</span>
              </div>
              <div class="flex justify-between gap-4 text-sm">
                <span class="text-text-secondary shrink-0">快门速度</span
                ><span class="text-text min-w-0 text-right">1/250</span>
              </div>
              <div class="flex justify-between gap-4 text-sm">
                <span class="text-text-secondary shrink-0">光圈值</span
                ><span class="text-text min-w-0 text-right">4.5 EV</span>
              </div>
              <div class="flex justify-between gap-4 text-sm">
                <span class="text-text-secondary shrink-0">感光方式</span
                ><span class="text-text min-w-0 text-right">单片彩色区域传感器</span>
              </div>
              <div class="flex justify-between gap-4 text-sm">
                <span class="text-text-secondary shrink-0">焦平面分辨率</span
                ><span class="text-text min-w-0 text-right">1879 × 1879</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
