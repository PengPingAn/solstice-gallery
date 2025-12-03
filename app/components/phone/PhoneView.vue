<template>
  <div class="p-6 bg-gray-900 min-h-screen text-white">
    <h1 class="text-3xl font-bold mb-6">图片查看器演示</h1>

    <!-- 控制面板 -->
    <div class="mb-8 p-4 bg-gray-800 rounded-lg">
      <div class="flex flex-wrap gap-4 items-center">
        <button
          @click="openViewer"
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          打开图片查看器
        </button>

        <label class="flex items-center gap-2">
          <input type="checkbox" v-model="showInfoPanel" class="rounded" />
          显示信息面板
        </label>

        <label class="flex items-center gap-2">
          <input type="checkbox" v-model="showThumbnails" class="rounded" />
          显示缩略图
        </label>

        <label class="flex items-center gap-2">
          <input type="checkbox" v-model="keyboardNavigation" class="rounded" />
          键盘导航
        </label>
      </div>
    </div>

    <!-- 图片网格 -->
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <div
        v-for="(image, index) in images"
        :key="image.id"
        class="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
        @click="openViewerAtIndex(index)"
      >
        <img
          :src="image.thumbnail"
          :alt="image.filename"
          class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div
          class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors"
        ></div>
        <div
          class="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent text-white text-sm truncate"
        >
          {{ image.filename }}
        </div>
      </div>
    </div>

    <!-- 图片查看器 -->
    <ImageViewer
      :images="images"
      :initial-index="currentIndex"
      :visible="isViewerOpen"
      :config="viewerConfig"
      @update:visible="isViewerOpen = $event"
      @close="handleClose"
      @change="handleImageChange"
      @share="handleShare"
      @download="handleDownload"
      @fullscreen-change="handleFullscreenChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";

// 测试图片数据
const images = ref([
  {
    id: "4732",
    src: "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
    thumbnail:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=400&fit=crop",
    alt: "Mountain landscape",
    filename: "DSCF4732.jpg",
    format: "JPG",
    size: "4.9MB",
    dimensions: "4894 × 7341",
    megapixels: "35 MP",
    captureTime: "2025/8/30 16:28:30",
    timezone: "UTC+8",
    artist: "INNEI",
    software: "Capture One Macintosh",
    tags: ["山脉", "风景", "自然"],
    exif: {
      focalLength: "126mm",
      aperture: "f/4.5",
      shutterSpeed: "1/250s",
      iso: "ISO 500",
      camera: "FUJIFILM X-T5",
      lens: "FUJIFILM Fujinon XF70-300mmF4-5.6",
      exposureMode: "手动",
      whiteBalance: "自动",
    },
  },
  {
    id: "4637",
    src: "https://images.unsplash.com/photo-1519681393784-d120267933ba",
    thumbnail:
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&h=400&fit=crop",
    alt: "Night sky with stars",
    filename: "DSCF4637.jpg",
    format: "JPG",
    size: "5.2MB",
    dimensions: "6000 × 4000",
    megapixels: "24 MP",
    captureTime: "2025/8/29 21:15:45",
    timezone: "UTC+8",
    artist: "INNEI",
    software: "Lightroom Classic",
    tags: ["星空", "夜景", "天文"],
    exif: {
      focalLength: "24mm",
      aperture: "f/2.8",
      shutterSpeed: "30s",
      iso: "ISO 3200",
      camera: "SONY A7III",
      lens: "SONY FE 24mm F1.4 GM",
      exposureMode: "B门",
      whiteBalance: "手动",
    },
  },
  {
    id: "4792",
    src: "https://images.unsplash.com/photo-1518837695005-2083093ee35b",
    thumbnail:
      "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400&h=400&fit=crop",
    alt: "City skyline at sunset",
    filename: "DSCF4792.jpg",
    format: "JPG",
    size: "3.8MB",
    dimensions: "4000 × 6000",
    megapixels: "24 MP",
    captureTime: "2025/8/31 18:45:22",
    timezone: "UTC+8",
    artist: "INNEI",
    software: "Capture One Macintosh",
    tags: ["城市", "日落", "建筑"],
    exif: {
      focalLength: "35mm",
      aperture: "f/8",
      shutterSpeed: "1/125s",
      iso: "ISO 200",
      camera: "FUJIFILM X-T5",
      lens: "FUJIFILM XF 35mm F2",
      exposureMode: "光圈优先",
      whiteBalance: "日光",
    },
  },
  {
    id: "4756",
    src: "https://images.unsplash.com/photo-1439066615861-d1af74d74000",
    thumbnail:
      "https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=400&h=400&fit=crop",
    alt: "Lake and mountains",
    filename: "DSCF4756.jpg",
    format: "JPG",
    size: "4.5MB",
    dimensions: "5000 × 3333",
    megapixels: "16 MP",
    captureTime: "2025/8/28 10:30:15",
    timezone: "UTC+8",
    artist: "INNEI",
    software: "Lightroom Classic",
    tags: ["湖泊", "山脉", "倒影"],
    exif: {
      focalLength: "50mm",
      aperture: "f/11",
      shutterSpeed: "1/60s",
      iso: "ISO 100",
      camera: "CANON EOS R5",
      lens: "CANON RF 50mm F1.2",
      exposureMode: "光圈优先",
      whiteBalance: "阴天",
    },
  },
  {
    id: "4523",
    src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
    thumbnail:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop",
    alt: "Snowy mountain peak",
    filename: "DSCF4523.jpg",
    format: "JPG",
    size: "6.1MB",
    dimensions: "6720 × 4480",
    megapixels: "30 MP",
    captureTime: "2025/8/27 14:20:33",
    timezone: "UTC+8",
    artist: "INNEI",
    software: "Capture One Macintosh",
    tags: ["雪山", "冰川", "户外"],
    exif: {
      focalLength: "200mm",
      aperture: "f/5.6",
      shutterSpeed: "1/1000s",
      iso: "ISO 400",
      camera: "SONY A7IV",
      lens: "SONY FE 70-200mm F2.8 GM",
      exposureMode: "快门优先",
      whiteBalance: "自动",
    },
  },
  {
    id: "4570",
    src: "https://images.unsplash.com/photo-1519996529931-28324d5a630e",
    thumbnail:
      "https://images.unsplash.com/photo-1519996529931-28324d5a630e?w=400&h=400&fit=crop",
    alt: "Forest path",
    filename: "DSCF4570.jpg",
    format: "JPG",
    size: "3.2MB",
    dimensions: "4000 × 6000",
    megapixels: "24 MP",
    captureTime: "2025/8/26 09:45:12",
    timezone: "UTC+8",
    artist: "INNEI",
    software: "Lightroom Classic",
    tags: ["森林", "小径", "自然"],
    exif: {
      focalLength: "85mm",
      aperture: "f/1.8",
      shutterSpeed: "1/200s",
      iso: "ISO 100",
      camera: "NIKON Z6",
      lens: "NIKON Z 85mm F1.8",
      exposureMode: "手动",
      whiteBalance: "自动",
    },
  },
]);

// 控制状态
const isViewerOpen = ref(false);
const currentIndex = ref(0);
const showInfoPanel = ref(true);
const showThumbnails = ref(true);
const keyboardNavigation = ref(true);

// 计算配置
const viewerConfig = computed(() => ({
  showInfoPanel: showInfoPanel.value,
  showThumbnails: showThumbnails.value,
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
  keyboardNavigation: keyboardNavigation.value,
  showZoomHint: true,
}));

// 方法
const openViewer = () => {
  currentIndex.value = 0;
  isViewerOpen.value = true;
};

const openViewerAtIndex = (index: number) => {
  currentIndex.value = index;
  isViewerOpen.value = true;
};

const handleClose = () => {
  console.log("查看器已关闭");
};

const handleImageChange = (index: number, image: any) => {
  console.log("切换到图片:", index, image.filename);
};

const handleShare = (image: any) => {
  console.log("分享图片:", image.filename);
  // 这里可以添加实际的分享逻辑
  if (navigator.share) {
    navigator.share({
      title: image.filename,
      text: `分享图片: ${image.filename}`,
      url: image.src,
    });
  } else {
    alert("分享功能在当前浏览器不可用");
  }
};

const handleDownload = (image: any) => {
  console.log("下载图片:", image.filename);
  // 这里可以添加实际的下载逻辑
  const link = document.createElement("a");
  link.href = image.src;
  link.download = image.filename;
  link.click();
};

const handleFullscreenChange = (isFullscreen: boolean) => {
  console.log("全屏状态:", isFullscreen ? "已全屏" : "退出全屏");
};
</script>

<style>
/* 全局样式 */
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu,
    Cantarell, sans-serif;
}

* {
  box-sizing: border-box;
}
</style>
