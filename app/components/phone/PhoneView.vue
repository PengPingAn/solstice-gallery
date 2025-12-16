<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { useMessage } from "@/composables/useMessage";

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

// 响应式数据
const currentIndex = ref(props.initialIndex);
const thumbnailContainer = ref<HTMLElement | null>(null);
const imageElement = ref<HTMLImageElement | null>(null);

// H5响应式
const isMobile = ref(false);
const drawerOpen = ref(false);

// 背景图相关
const backgroundImageUrl = ref<string>("");
const backgroundImageLoaded = ref<boolean>(false);
const isTransitioningBackground = ref<boolean>(false);
const previousBackgroundUrl = ref<string>("");
const imageCache = new Map<string, boolean>();

// 默认背景图
const DEFAULT_BACKGROUND =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAAgCAYAAAD5VeO1AAAMRklEQVR4AQBdAKL/AF16p/9ifqr/aoWx/3aOuP+ClsD/jZ3F/5WhyP+bosf/nJ7C/5qYuf+Wj67/j4Wi/4h6lv+BcIr/emd//3Nedf9tVmz/Zk9j/2BIXP9aQlX/Vj1Q/1I6TP9QOEn/AF0Aov8AXnyo/2N/q/9rhrH/do64/4KWv/+MncX/lKDH/5mgxf+ancD/mJa3/5SNrP+Og6D/h3mU/39viP95Zn7/cl10/2xWa/9lT2P/YEhb/1pCVf9VPk//UjpL/1A4Sf8AXQCi/wBffqn/ZIGs/2yHsf92j7j/gZa+/4ucw/+SnsT/lp7C/5eavP+Uk7P/j4qo/4l/nP+CdZD/fGyF/3Vje/9vW3H/aVRp/2ROYf9eR1r/WUJU/1Q9Tv9ROkr/TzhI/wBdAKL/AF9+qf9jgav/a4ew/3SNtv9+lLv/hpi+/42avv+Qmbv/kJS1/42Mq/+Ig6H/gnmV/3xwif92Z3//cF91/2tYbf9lUWX/YEte/1tFV/9WQFH/UjxM/044SP9MN0b/AF0Aov8AXX2l/2B/qP9nhKz/b4qx/3iPtf9/krf/hJO2/4aQsv+Gi6r/goOh/356lv94cIv/cmeA/21fdv9oWG3/ZFJm/19MX/9bR1j/VkJS/1E9TP9NOUj/SjVE/0g0Qv8AXQCi/wBWeJ7/Wnqg/19+pP9ngqj/boaq/3SJq/94iKn/eoWk/3h/nf91d5P/cG6I/2tlfv9mXXT/YlZr/15QY/9bS13/V0ZX/1NBUf9PPUv/SzhG/0c0Qf9DMT7/Qi88/wBdAKL/AExvlP9PcZX/VXSY/1t4m/9he53/Z3yd/2p7mv9qd5X/aXGN/2Vpg/9hYXn/XVhv/1lRZf9WS1//U0dY/1FDU/9OP07/SztJ/0c3RP9DMj//Py46/zwrN/86KjX/AF0Aov8AQGSH/0NmiP9HaYr/TWyM/1Nujv9Xbo3/Wm2K/1pohP9ZYnz/Vltz/1JTaf9PTGH/TEZZ/0pCU/9JPk7/RztK/0U4Rf9DNUH/PzE8/zstN/83KTP/NCYv/zMkLv8AXQCi/wAzWHn/Nlp6/zpcfP8/X37/RWF+/0lhff9LX3r/S1t0/0pVbf9IT2Z/RUhc/0NCVf9CPk7/QTpK/0E4Rv9ANkP/PzQ//z0xO/86Ljf/Nioy/zImLf8vIir/LSEo/wBdAKL/AChObP8qUG3/LlJv/zNVcP85VnH/PVdw/z9Vbf9AUWj/P0xh/z5GWv88QVP/OzxM/zs5SP88N0R/PTZC/z01P/89ND3/OzE5/zguNf80KjD/LyUr/ywiJ/8qICX/AF0Aov8AH0dj/yJIYf8mS2X/K01n/zBPaP81UGf/OE9k/zlMYP85R1r/OUNU/zg+Tv85O0n/OjlG/zw5Q/89OUL/PzhB/z83Pv89NTv/OjI3/zUtMv8xKS3/LSUp/ysjJv8AXQCi/wAbQ1z/HUVd/yJHX/8nSmH/LU1j/zJOYf81TWD/N0td/zhHWP85RFP/OUFO/zs+Sv89Pkj/Pz5H/0I/Rf9EP0X/RD9E/0I8QP8/OTz/OjQ3/zUvMf8xKy3/Lykr/wBdAKL/ABpDWf8cRFr/IUdd/ydLX/8tTmH/M09i/zdPYP85Tl3/O0tZ/zxIVf8+RlH/QEVO/0NFTf9GRkz/SUdN/0tITP9MSEv/SkZI/0ZCQv9BPT3/PDg4/zg0M/81MTH/AF0Aov8AHEVZ/x9HW/8kSl3/Kk5g/zBRY/82U2T/O1Rj/z5TYP9AUV3/QU5Z/0NMVf9GTFP/SUxS/01OUv9QT1P/UlFT/1NQUv9RTk//TUpK/0hFRP9DQD7/Pjw6/zz5N/8AXQCi/wAgSVr/Iktc/yhOX/8uUmL/NVZl/ztYZf8/WWb/Q1hj/0RWYP9GU1z/SFFZ/0pRVv9NUVb/UVNW/1VVV/9XVlf/WFZW/1ZUU/9SUU//TUxJ/0hGQ/9DQj//QT88/wBdAKL/ACRNXP8nT17/LFJh/zNWZf85Wmf/P1xp/0RdaP9GW2X/SFlh/0lWXf9KU1n/TFJW/05TVf9SVFb/VVZW/1hYV/9ZWFb/WFZU/1RTUP9PTkr/SklF/0ZFQP9DQz7/AF0Aov8AKFBe/ytSYP8xVmP/N1pn/z5eaf9DYGr/R19p/0ldZf9JWmH/SVZb/0lSVv9KUFP/TFBR/09RUf9SU1L/VVVT/1ZVUv9VVFH/UlJN/05OSf9JSUT/RUZA/0NDPf8AXQCi/wAuVWH/MVdj/zhZZ/8+XWj/Q2Fr/0Vfa/9HXmj/SVph/0lVXP9IUlj/SExR/0VITf9FR0n/R0hI/0lKSv9NTEz/T01O/1FOT/9ST1D/UU9P/09OTf9LS0j/SEhF/0ZGQ/8AXQCi/wA1W2T/N1tl/z1caP9CX2r/SWFt/0thbP9MXmj/SVpi/0dWXf9FUFX/QktO/0BHSv8+RUX/PkRD/0BGRf9DSEf/SEpL/0tMTf9OTk//T09P/05OTf9LS0n/SEhF/0ZGRP8AXQCi/wBBZG7/QWVu/0Rnb/9JaHH/TWpy/05rcv9NaG7/SmNp/0ZdYf9DVlj/QE9O/zxKRv86RkL/PEZC/z1IQ/9AS0X/RE1I/0lQTP9LUk7/TlRQ/09VUf9QVVH/T1VQ/wBdAKL/AFBye/9Sc3z/VXV+/1p3f/9feoH/YnqB/2F4fv9ec3j/WGxr/1JfY/9MVlX/Q0lJ/z9EQP89Ozv/Pzs6/0E9PP9HQj7/TUhC/1JNR/9XUUr/W1ZN/19aT/9gW1H/YVxS/wBdAKL/AGOEjf9lhY//a4iR/3CKk/9zi5P/dIiO/3CAhf9pdnz/XmZt/1ZXXv9MTlD/QkND/0A9PP8+Ozr/QT07/0ZCPv9MSEP/U09J/1hUTv9cWVL/XltU/2BdVv9gXlb/AF0Aov8AeZig/32Zof+BnKT/hp6m/4mfpv+Jm6L/hZOY/32Hi/9vdXr/YmRo/1pYWv9RTU3/SUZE/0dDQP9KRUH/UEpF/1dSTP9fWlT/Z2Jb/21oYf9wbGX/c3Bp/3Vyav8AXQCi/wCQqrP/kq21/5iwuP+ds7r/oLO6/6Cwtv+bp6z/kpue/4SIi/92eHn/aWdm/1xZWf9VT0//U01K/1VOS/9cVFD/ZV1Y/29oYf94cmv/gHp0/4eBev+Lhn//jYiB/wBdAKL/AKO7w/+mvcX/q8HI/7HEy/+0xcz/tMHH/6+6v/+krK//lpqe/4eIif94dnX/amdm/2JbWv9gWFb/YFhV/2hfW/9zamT/fnZw/4qBe/+UjIb/m5WN/6Cbk/+jnZb/AF0Aov8Ar8XO/7PIz/+4zNT/vtDX/8LR2P/CztP/vcXJ/7K3uv+kpaf/kpGS/4F9fv90bm3/amFh/2ZcWv9oXlv/cGZk/3txbP+Jfnn/lYyG/6GYkv+ropz/samj/7Stpv8AXQCi/wCzx9D/t8rS/73P1//E09v/ydXc/8nT2f/Fys//ur3A/6qprP+YlZb/hoCB/3dvb/9tY2L/aV1c/2tfXP9zZ2P/f3Nv/42Bff+bkIv/qZ6Z/7OppP+7saz/v7Ww/wBdAKL/AK/Byv+zxM3/usrS/8LP1//I0tn/ydHX/8XKzv+6u8D/qqir/5iTlf+FfX//dWts/2peXv9lWFf/Z1pY/25iX/98bmr/i356/5qOiv+pnZj/tamk/72yrf/BtrH/AF0Aov8ApbW+/6q5wv+xv8j/usXN/8DJ0f/CyM//vsHH/7T0uf+loaX/kouO/351d/9uYmP/YlVV/11PTv9fUE7/Z1hV/3RlYv+DdXL/lIaC/6OWkv+vo5//uKyo/72xrP8AXQCi/wCYp7D/nau0/6Wyuv+uucH/tr3F/7m9xP+1t73/rKqv/5yXm/+JgYT/dWtt/2RYWf9YSkr/UkNC/1REQ/9cTEr/aVlX/3lqZ/+KfHj/moyI/6ealf+wo5//taik/wBdAKL/AI2apP+Sn6j/mqav/6Sttv+ss7r/r7O6/6yts/+joKX/k46S/4B4e/9sYWT/W05P/05AQP9JOTj/Sjo4/1JCQP9fT03/cGBd/4Fybv+Rg3//npCN/6ialv+toJv/AV0Aov8AhpOd/4uXof+Un6j/nqev/6astP+qrbT/p6eu/56boP+OiIz/e3J1/2dcXv9VSEn/STo6/0MzMv9ENDL/TDs6/1pJR/9qWlf/e2xp/4x9ef+Zi4f/o5WR/6ialv+2c2TbOXt8GAAAAABJRU5ErkJggg==";

const message = useMessage();

// 缩放状态
const scale = ref(1);
const position = ref({ x: 0, y: 0 });
const isDragging = ref(false);
const dragStart = ref({ x: 0, y: 0 });

// 滑动切换状态
const swipeState = ref({
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

// 缩略图滚动相关
const isThumbnailDragging = ref(false);
const thumbnailDragStart = ref({ x: 0, scrollLeft: 0 });

// UI状态
const showScaleText = ref(false);
let scaleTextTimer: ReturnType<typeof setTimeout> | null = null;

// 常量
const MIN_SCALE = 0.1;
const MAX_SCALE = 5;
const SCALE_STEP = 0.25;
const SWIPE_THRESHOLD = 80; // 拖动切换阈值（像素）
const SWIPE_VERTICAL_THRESHOLD = 30; // 垂直滚动阈值

const currentImage = computed(() => props.images[currentIndex.value]);

// 检查是否为移动设备
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768;
};

// 优化背景加载 - 预加载所有图片
const preloadImages = () => {
  if (!props.images || props.images.length === 0) return;

  props.images.forEach((image) => {
    if (!image.url || imageCache.has(image.url)) return;

    const img = new Image();
    img.src = image.url;
    img.onload = () => {
      imageCache.set(image.url, true);
    };
    img.onerror = () => {
      imageCache.set(image.url, false);
    };
  });
};

// 优化背景切换 - 平滑过渡
const switchBackground = (url: string) => {
  if (!url) {
    backgroundImageUrl.value = DEFAULT_BACKGROUND;
    backgroundImageLoaded.value = true;
    return;
  }

  if (backgroundImageUrl.value === url && backgroundImageLoaded.value) return;

  previousBackgroundUrl.value = backgroundImageUrl.value;
  isTransitioningBackground.value = true;

  if (imageCache.has(url) && imageCache.get(url)) {
    backgroundImageUrl.value = url;
    backgroundImageLoaded.value = true;
    isTransitioningBackground.value = false;
    return;
  }

  backgroundImageUrl.value = DEFAULT_BACKGROUND;
  backgroundImageLoaded.value = true;

  const img = new Image();
  img.src = url;
  img.onload = () => {
    imageCache.set(url, true);
    setTimeout(() => {
      backgroundImageUrl.value = url;
      isTransitioningBackground.value = false;
    }, 100);
  };
  img.onerror = () => {
    imageCache.set(url, false);
    backgroundImageUrl.value = DEFAULT_BACKGROUND;
    isTransitioningBackground.value = false;
  };
};

// 定义表情列表
const emojiList = ref([
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

// 存储每个表情的点击状态
const emojiStates = ref<Record<string, boolean>>({
  like: false,
  love: false,
  fire: false,
  clap: false,
  star: false,
  praise: false,
});

// 表情按钮点击处理
const handleEmojiClick = (emojiId: string) => {
  emojiStates.value[emojiId] = !emojiStates.value[emojiId];
  message.show({
    text: `点击了表情: ${emojiId}`,
    messageType: "glass",
    duration: 2000,
  });
};

// 导航函数
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
  if (!thumbnailContainer.value) return;

  const containerWidth = thumbnailContainer.value.clientWidth;
  const thumbnailWidth = 68; // 缩略图宽度+间隙
  const targetScroll = index * thumbnailWidth - containerWidth / 2 + thumbnailWidth / 2;

  thumbnailContainer.value.scrollTo({
    left: Math.max(
      0,
      Math.min(targetScroll, thumbnailContainer.value.scrollWidth - containerWidth)
    ),
    behavior: "smooth",
  });
};

const emit = defineEmits<{
  closePhoneView: [];
}>();

const handleClose = () => {
  emit("closePhoneView");
};

// 缩放核心函数
const resetTransform = () => {
  scale.value = 1;
  position.value = { x: 0, y: 0 };
  if (imageElement.value) {
    imageElement.value.style.transform = `translate(0px, 0px) scale(1)`;
    imageElement.value.style.cursor = "default";
    imageElement.value.style.opacity = "1";
  }
  showScaleText.value = false;
  if (scaleTextTimer) clearTimeout(scaleTextTimer);
};

const applyTransform = () => {
  if (imageElement.value) {
    imageElement.value.style.transform = `translate(${position.value.x}px, ${position.value.y}px) scale(${scale.value})`;
  }
};

const zoom = (newScale: number, centerX?: number, centerY?: number) => {
  const oldScale = scale.value;
  newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));

  if (Math.abs(newScale - oldScale) < 0.01) return;

  const container = imageElement.value?.parentElement?.parentElement;
  if (!container) return;

  const rect = container.getBoundingClientRect();
  const containerCenterX = rect.width / 2;
  const containerCenterY = rect.height / 2;

  if (centerX === undefined || centerY === undefined) {
    centerX = rect.left + containerCenterX;
    centerY = rect.top + containerCenterY;
  }

  const centerOffsetX = centerX - rect.left - containerCenterX;
  const centerOffsetY = centerY - rect.top - containerCenterY;

  const scaleRatio = newScale / oldScale;
  position.value.x = centerOffsetX - (centerOffsetX - position.value.x) * scaleRatio;
  position.value.y = centerOffsetY - (centerOffsetY - position.value.y) * scaleRatio;

  scale.value = newScale;

  applyTransform();
  constrainPosition();
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

// 约束位置
const constrainPosition = () => {
  if (!imageElement.value) return;

  const container = imageElement.value.parentElement?.parentElement;
  if (!container) return;

  const containerRect = container.getBoundingClientRect();
  const imageRect = imageElement.value.getBoundingClientRect();

  const maxX = Math.max(0, (imageRect.width - containerRect.width) / 2);
  const maxY = Math.max(0, (imageRect.height - containerRect.height) / 2);

  position.value.x = Math.max(-maxX, Math.min(maxX, position.value.x));
  position.value.y = Math.max(-maxY, Math.min(maxY, position.value.y));

  applyTransform();
};

// 显示缩放比例
const showScaleIndicator = () => {
  showScaleText.value = true;
  if (scaleTextTimer) clearTimeout(scaleTextTimer);
  scaleTextTimer = setTimeout(() => {
    showScaleText.value = false;
  }, 1500);
};

// ==================== 触摸事件处理 - 主图片区域 ====================

// 触摸开始
let lastTapTime = 0;
let initialPinchDistance = 0;
let initialScaleValue = 1;
let isPinching = false;

const handleTouchStart = (e: TouchEvent) => {
  const touches = e.touches;

  if (touches.length === 1) {
    // 单指触摸 - 准备拖动或切换
    const touch = touches[0];
    swipeState.value = {
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

    // 检测双击
    const currentTime = Date.now();
    if (currentTime - lastTapTime < 300) {
      // 双击事件
      if (scale.value < 1.5) {
        zoom(2, touch.clientX, touch.clientY);
      } else {
        zoomToFit();
      }
    }
    lastTapTime = currentTime;
  } else if (touches.length === 2) {
    // 双指触摸 - 开始缩放
    isPinching = true;

    const touch1 = touches[0];
    const touch2 = touches[1];
    initialPinchDistance = Math.hypot(
      touch2.clientX - touch1.clientX,
      touch2.clientY - touch1.clientY
    );
    initialScaleValue = scale.value;

    // 重置单指滑动状态
    swipeState.value.isSwiping = false;
  }
};

// 触摸移动
const handleTouchMove = (e: TouchEvent) => {
  const touches = e.touches;

  if (touches.length === 1 && swipeState.value.isSwiping) {
    // 单指移动
    const touch = touches[0];
    const deltaX = touch.clientX - swipeState.value.startX;
    const deltaY = touch.clientY - swipeState.value.startY;

    swipeState.value.currentX = touch.clientX;
    swipeState.value.deltaX = deltaX;
    swipeState.value.deltaY = deltaY;

    if (!swipeState.value.isHorizontalSwipe) {
      // 判断滑动方向
      if (
        Math.abs(deltaX) > SWIPE_VERTICAL_THRESHOLD ||
        Math.abs(deltaY) > SWIPE_VERTICAL_THRESHOLD
      ) {
        swipeState.value.isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);
      }
    }

    if (scale.value === 1 && swipeState.value.isHorizontalSwipe) {
      // 未缩放时水平滑动 - 准备切换图片
      swipeState.value.direction = deltaX > 0 ? 1 : -1;

      // 计算透明度（仅在未缩放时）
      const opacity = Math.max(0.3, 1 - Math.abs(deltaX) / 200);
      swipeState.value.opacity = opacity;

      if (imageElement.value) {
        imageElement.value.style.opacity = opacity.toString();
      }

      // 阻止默认滚动行为
      e.preventDefault();
    } else if (scale.value > 1) {
      // 缩放状态下 - 拖动图片
      if (!isDragging.value) {
        isDragging.value = true;
        dragStart.value = {
          x: touch.clientX - position.value.x,
          y: touch.clientY - position.value.y,
        };

        if (imageElement.value) {
          imageElement.value.style.cursor = "grabbing";
        }
      }

      const newX = touch.clientX - dragStart.value.x;
      const newY = touch.clientY - dragStart.value.y;

      position.value.x = newX;
      position.value.y = newY;

      applyTransform();

      e.preventDefault();
    }
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

      zoom(newScale, centerX, centerY);
    }

    e.preventDefault();
  }
};

// 触摸结束
const handleTouchEnd = (e: TouchEvent) => {
  if (
    swipeState.value.isSwiping &&
    scale.value === 1 &&
    swipeState.value.isHorizontalSwipe
  ) {
    // 单指水平滑动结束 - 检查是否需要切换图片
    const deltaX = swipeState.value.deltaX;

    if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
      // 达到阈值，执行切换
      if (deltaX > 0 && currentIndex.value > 0) {
        // 向右滑动，显示上一张
        gotoPrev();
      } else if (deltaX < 0 && currentIndex.value < props.images.length - 1) {
        // 向左滑动，显示下一张
        gotoNext();
      }
    }

    // 重置状态
    swipeState.value.isSwiping = false;
    swipeState.value.opacity = 1;

    // 恢复图片透明度
    if (imageElement.value) {
      imageElement.value.style.opacity = "1";
    }
  } else if (swipeState.value.isSwiping && !swipeState.value.isHorizontalSwipe) {
    // 垂直滑动，不处理
    swipeState.value.isSwiping = false;
  }

  if (isPinching) {
    // 双指缩放结束
    isPinching = false;
    initialPinchDistance = 0;
  }

  if (isDragging.value) {
    // 拖动结束
    isDragging.value = false;
    constrainPosition();

    if (imageElement.value) {
      imageElement.value.style.cursor = scale.value > 1.1 ? "grab" : "default";
    }
  }
};

// ==================== 缩略图区域触摸事件 ====================

const onThumbnailTouchStart = (e: TouchEvent) => {
  if (!thumbnailContainer.value || !isMobile.value) return;

  const touch = e.touches[0];
  isThumbnailDragging.value = true;
  thumbnailDragStart.value = {
    x: touch.clientX,
    scrollLeft: thumbnailContainer.value.scrollLeft,
  };

  // 阻止事件冒泡到主图片区域
  e.stopPropagation();
};

const onThumbnailTouchMove = (e: TouchEvent) => {
  if (!isThumbnailDragging.value || !thumbnailContainer.value || !isMobile.value) return;

  const touch = e.touches[0];
  const deltaX = touch.clientX - thumbnailDragStart.value.x;

  // 更新滚动位置
  thumbnailContainer.value.scrollLeft = thumbnailDragStart.value.scrollLeft - deltaX;

  // 阻止默认滚动行为
  e.preventDefault();
  e.stopPropagation();
};

const onThumbnailTouchEnd = () => {
  if (isThumbnailDragging.value) {
    isThumbnailDragging.value = false;
  }
};

// 缩略图点击处理（防误触）
const onThumbnailClick = (index: number, e: Event) => {
  if (isThumbnailDragging.value) {
    e.preventDefault();
    return;
  }
  gotoIndex(index);
};

// ==================== 鼠标事件处理（桌面端）====================

// 图片双击事件
const handleImageDoubleClick = (e: MouseEvent) => {
  e.stopPropagation();

  if (scale.value < 1.5) {
    zoom(2, e.clientX, e.clientY);
  } else {
    zoomToFit();
  }
};

// 鼠标按下
const handleMouseDown = (e: MouseEvent) => {
  if (e.button !== 0) return;

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

// 鼠标移动
const handleMouseMove = (e: MouseEvent) => {
  if (!isDragging.value) return;

  const newX = e.clientX - dragStart.value.x;
  const newY = e.clientY - dragStart.value.y;

  position.value.x = newX;
  position.value.y = newY;

  applyTransform();
};

// 鼠标抬起
const handleMouseUp = () => {
  if (isDragging.value) {
    isDragging.value = false;
    constrainPosition();

    if (imageElement.value) {
      imageElement.value.style.cursor = scale.value > 1.1 ? "grab" : "default";
    }
  }
};

// 鼠标离开
const handleMouseLeave = () => {
  if (isDragging.value) {
    isDragging.value = false;
    constrainPosition();

    if (imageElement.value) {
      imageElement.value.style.cursor = scale.value > 1.1 ? "grab" : "default";
    }
  }
};

// 鼠标滚轮缩放
let wheelTimeout: ReturnType<typeof setTimeout> | null = null;
const handleWheel = (e: WheelEvent) => {
  if (isMobile.value) return;

  e.preventDefault();

  if (wheelTimeout) return;

  const delta = e.deltaY < 0 ? -0.1 : 0.1;
  const newScale = scale.value * (1 - delta);

  zoom(newScale, e.clientX, e.clientY);

  wheelTimeout = setTimeout(() => {
    wheelTimeout = null;
  }, 16);
};

// 缩略图鼠标滚轮
const onThumbnailWheel = (e: WheelEvent) => {
  if (!thumbnailContainer.value || isMobile.value) return;
  e.preventDefault();
  thumbnailContainer.value.scrollLeft += e.deltaY;
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

// 切换抽屉状态
const toggleDrawer = () => {
  drawerOpen.value = !drawerOpen.value;
};

// 监听图片变化
watch(
  currentImage,
  (newImage) => {
    if (newImage?.url) {
      switchBackground(newImage.url);
    } else {
      backgroundImageUrl.value = DEFAULT_BACKGROUND;
      backgroundImageLoaded.value = true;
    }
  },
  { immediate: true }
);

// 监听窗口大小变化
const handleResize = () => {
  checkMobile();
};

// 生命周期
onMounted(() => {
  gotoIndex(props.initialIndex);
  document.addEventListener("keydown", handleKeyDown);
  window.addEventListener("resize", handleResize);

  // 初始检查
  checkMobile();

  // 预加载所有图片
  preloadImages();
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleKeyDown);
  window.removeEventListener("resize", handleResize);
  if (scaleTextTimer) clearTimeout(scaleTextTimer);
  if (wheelTimeout) clearTimeout(wheelTimeout);
});
</script>

<template>
  <div class="fixed inset-0 z-9999" style="--color-accent: #626670" @click.stop>
    <!-- 背景模糊层 -->
    <div class="bg-material-opaque fixed inset-0" style="opacity: 1" @click.stop></div>

    <!-- 动态背景图片 -->
    <div class="fixed inset-0" style="opacity: 1">
      <!-- 前一个背景（用于平滑过渡） -->
      <div
        v-if="previousBackgroundUrl && isTransitioningBackground"
        class="h-full w-full size-fill scale-110 bg-cover bg-center absolute inset-0"
        :style="{
          backgroundImage: `url(${previousBackgroundUrl})`,
          filter: 'blur(50px) brightness(0.3) saturate(1.2)',
          transition: 'opacity 0.3s ease-out',
          opacity: 0.5,
        }"
      ></div>

      <!-- 当前背景 -->
      <div
        class="h-full w-full size-fill scale-110 bg-cover bg-center"
        :style="{
          backgroundImage: `url(${DEFAULT_BACKGROUND})`,
        }"
      ></div>

      <!-- 额外的暗色遮罩层 -->
      <div
        class="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/40"
        style="mix-blend-mode: multiply"
      ></div>
    </div>

    <div
      class="fixed inset-0 z-50 flex items-center justify-center"
      @click.stop
      style="touch-action: none; pointer-events: auto; opacity: 1"
    >
      <div class="flex size-full flex-row" :class="{ 'flex-col': isMobile }">
        <!-- 主内容区域 -->
        <div
          class="z-1 flex min-h-0 min-w-0 flex-1 flex-col"
          :class="{ 'order-1': isMobile }"
        >
          <!-- 主图显示区域 -->
          <div
            class="group relative flex min-h-0 min-w-0 flex-1"
            style="opacity: 1"
            @mousedown="handleMouseDown"
            @mousemove="handleMouseMove"
            @mouseup="handleMouseUp"
            @mouseleave="handleMouseLeave"
            @wheel="handleWheel"
            @touchstart="handleTouchStart"
            @touchmove="handleTouchMove"
            @touchend="handleTouchEnd"
          >
            <div
              class="absolute h-full w-full size-fill bg-cover bg-center"
              :style="{
                backgroundImage: `url(${backgroundImageUrl})`,
                filter: 'blur(70px) brightness(0.5) saturate(0.2)',
                transition:
                  'background-image 0.3s ease-out, filter 0.3s ease-out, opacity 0.3s ease-out',
                opacity: isTransitioningBackground ? 10.5 : 1,
              }"
            ></div>

            <!-- 缩放比例指示器 -->
            <transition
              enter-active-class="transition-all duration-200"
              leave-active-class="transition-all duration-300"
              enter-from-class="opacity-0 translate-y-2"
              leave-to-class="opacity-0 translate-y-2"
            >
              <div
                v-if="showScaleText"
                class="absolute top-10 left-1/2 z-50 -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ease-out bg-gray-500/20 text-white backdrop-blur-lg"
                style="pointer-events: none"
              >
                {{ Math.round(scale * 100) }}%
              </div>
            </transition>

            <!-- 缩放控制按钮 -->
            <transition
              enter-active-class="transition-all duration-200"
              leave-active-class="transition-all duration-200"
              enter-from-class="opacity-0 scale-90"
              leave-to-class="opacity-0 scale-90"
            >
              <div
                v-if="scale > 1 && !isMobile"
                class="absolute bottom-4 left-18 z-50 -translate-x-1/2 flex items-center gap-1 rounded-full p-1 shadow-lg bg-gray-500/20 text-white backdrop-blur-lg"
              >
                <button
                  type="button"
                  class="flex size-8 items-center justify-center text-white hover:bg-white/20 rounded-full transition-colors"
                  @click.stop="zoomOut"
                  title="缩小"
                >
                  <UIcon name="ic:baseline-remove" />
                </button>
                <button
                  type="button"
                  class="flex size-8 items-center justify-center text-white hover:bg-white/20 rounded-full transition-colors"
                  @click.stop="zoomToFit"
                  title="适应屏幕"
                >
                  <UIcon name="ic:baseline-fullscreen-exit" />
                </button>
                <button
                  type="button"
                  class="flex size-8 items-center justify-center text-white hover:bg-white/20 rounded-full transition-colors"
                  @click.stop="zoomIn"
                  title="放大"
                >
                  <UIcon name="ic:baseline-add" />
                </button>
              </div>
            </transition>

            <!-- 移动端缩放控制 -->
            <div
              v-if="scale > 1 && isMobile"
              class="absolute bottom-1 scale-50 left-1/2 z-50 -translate-x-1/2 flex items-center gap-2 rounded-full p-2 shadow-lg bg-gray-500/40 text-white backdrop-blur-lg"
            >
              <button
                type="button"
                class="flex size-10 items-center justify-center text-white hover:bg-white/20 rounded-full transition-colors"
                @click.stop="zoomOut"
                title="缩小"
              >
                <UIcon name="ic:baseline-remove" class="text-xl" />
              </button>
              <button
                type="button"
                class="flex size-10 items-center justify-center text-white hover:bg-white/20 rounded-full transition-colors"
                @click.stop="zoomToFit"
                title="适应屏幕"
              >
                <UIcon name="ic:baseline-fullscreen-exit" class="text-xl" />
              </button>
              <button
                type="button"
                class="flex size-10 items-center justify-center text-white hover:bg-white/20 rounded-full transition-colors"
                @click.stop="zoomIn"
                title="放大"
              >
                <UIcon name="ic:baseline-add" class="text-xl" />
              </button>
            </div>

            <div
              class="pointer-events-none absolute top-4 right-4 left-4 z-30 flex items-center justify-between"
              style="opacity: 1"
            >
              <div class="flex w-full md:justify-end justify-between">
                <!-- 移动端信息按钮 -->
                <button
                  v-if="isMobile"
                  type="button"
                  class="bg-material-ultra-thick pointer-events-auto flex size-8 items-center justify-center bg-neutral-800 rounded-full text-white backdrop-blur-2xl duration-200 hover:bg-black/20 focus:outline-none focus-visible:outline-none"
                  @click.stop="toggleDrawer"
                  title="查看详情"
                >
                  <UIcon name="material-symbols:info-outline" class="text-lg"></UIcon>
                </button>

                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    class="bg-material-ultra-thick pointer-events-auto flex size-8 items-center justify-center bg-neutral-800 rounded-full text-white backdrop-blur-2xl duration-200 hover:bg-black/20 focus:outline-none focus-visible:outline-none"
                    title="分享照片"
                  >
                    <UIcon name="iconoir:share-android"></UIcon>
                  </button>
                  <button
                    type="button"
                    class="bg-material-ultra-thick pointer-events-auto flex size-8 items-center justify-center bg-neutral-800 rounded-full text-white backdrop-blur-2xl duration-200 hover:bg-black/20"
                    @click="handleClose"
                  >
                    <UIcon name="material-symbols:close"></UIcon>
                  </button>
                </div>
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
                    class="absolute inset-0 h-full w-full object-contain transition-transform duration-150 ease-out"
                    :class="
                      scale > 1.1
                        ? 'cursor-grab active:cursor-grabbing'
                        : 'cursor-default'
                    "
                    :src="currentImage.url"
                    ref="imageElement"
                    @dblclick="handleImageDoubleClick"
                    :style="{ opacity: swipeState.opacity }"
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
                      class="absolute inset-0 pointer-events-none"
                    >
                      <!-- 左侧指示器（向右滑动显示上一张） -->
                      <div
                        v-if="swipeState.direction > 0 && currentIndex > 0"
                        class="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center"
                      >
                        <div
                          class="bg-black/60 text-white px-4 py-2 rounded-xl text-sm backdrop-blur-lg flex items-center gap-2 shadow-lg"
                        >
                          <UIcon name="material-symbols:chevron-left" class="text-lg" />
                          上一张
                        </div>
                      </div>
                      <!-- 右侧指示器（向左滑动显示下一张） -->
                      <div
                        v-if="
                          swipeState.direction < 0 && currentIndex < images.length - 1
                        "
                        class="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center"
                      >
                        <div
                          class="bg-black/60 text-white px-4 py-2 rounded-xl text-sm backdrop-blur-lg flex items-center gap-2 shadow-lg"
                        >
                          下一张
                          <UIcon name="material-symbols:chevron-right" class="text-lg" />
                        </div>
                      </div>
                    </div>
                  </transition>

                  <div
                    v-if="!isMobile"
                    class="pointer-events-none absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded bg-black/50 px-2 py-1 text-xs text-white opacity-0 duration-200 group-hover:opacity-50"
                  >
                    双击缩放 • 滚轮缩放 • 拖拽查看
                  </div>
                  <div
                    v-else
                    class="pointer-events-none absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded bg-black/50 px-2 py-1 text-xs text-white opacity-0 duration-200 group-hover:opacity-50"
                  >
                    双指缩放 • 左右滑动切换 • 双击放大
                  </div>
                </div>
              </div>
            </div>

            <!-- 表情按钮 -->
            <div
              class="pointer-events-auto absolute bottom-2 right-2 z-20 flex justify-center"
              :class="{ 'bottom-20': isMobile && drawerOpen }"
            >
              <div class="group/rail relative flex w-full justify-center gap-2 flex-col">
                <template v-for="emoji in emojiList" :key="emoji.id">
                  <button
                    type="button"
                    class="group/reaction-item cursor-pointer relative flex size-11 items-center justify-center rounded-2xl bg-white/1 text-xl text-white/60 backdrop-blur-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-110 hover:bg-white/12 hover:text-white hover:backdrop-blur-lg active:scale-95 disabled:pointer-events-none disabled:opacity-40"
                    :class="{
                      'bg-accent/18 text-accent backdrop-blur-xl': emojiStates[emoji.id],
                      'size-10': isMobile,
                    }"
                    :data-active="emojiStates[emoji.id]"
                    :aria-pressed="emojiStates[emoji.id]"
                    :aria-label="emoji.label"
                    @click.stop="handleEmojiClick(emoji.id)"
                  >
                    <UChip
                      :text="emoji.count"
                      size="3xl"
                      color="neutral"
                      class="ring-0"
                      :show="emoji.count > 0 ? true : false"
                    >
                      <img
                        :alt="emoji.emoji"
                        height="24"
                        loading="lazy"
                        width="24"
                        :src="emoji.src"
                        style="flex: 0 0 auto"
                        class="m-1"
                      />
                    </UChip>
                  </button>
                </template>
              </div>
            </div>

            <!-- 左右切换按钮 -->
            <button
              v-show="currentIndex > 0"
              type="button"
              class="bg-material-medium absolute top-1/2 left-4 z-20 flex size-8 -translate-y-1/2 items-center justify-center bg-neutral-800 rounded-full text-white opacity-0 backdrop-blur-sm duration-200 group-hover:opacity-100 hover:bg-black/20"
              :class="{ 'opacity-100': isMobile, 'size-10': isMobile }"
              @click="gotoPrev"
            >
              <UIcon name="ic:baseline-keyboard-arrow-left"></UIcon>
            </button>
            <button
              v-show="currentIndex < images.length - 1"
              type="button"
              class="bg-material-medium absolute top-1/2 right-4 z-20 flex size-8 -translate-y-1/2 items-center justify-center bg-neutral-800 rounded-full text-white opacity-0 backdrop-blur-sm duration-200 group-hover:opacity-100 hover:bg-black/20"
              :class="{ 'opacity-100': isMobile, 'size-10': isMobile }"
              @click="gotoNext"
            >
              <UIcon name="material-symbols:chevron-right"></UIcon>
            </button>

            <!-- 移动端信息按钮 -->
            <!-- <button
              v-if="isMobile"
              type="button"
              class="absolute bottom-4 left-4 z-30 flex size-10 items-center justify-center bg-neutral-800/80 rounded-full text-white backdrop-blur-lg"
              @click.stop="toggleDrawer"
              title="查看详情"
            >
              <UIcon name="material-symbols:info-outline" class="text-lg"></UIcon>
            </button> -->
          </div>

          <!-- 优化的缩略图区域 -->
          <div
            class="pb-safe bg-material-medium z-10 shrink-0 backdrop-blur-2xl"
            :class="{ 'order-2': isMobile }"
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

            <!-- 优化的缩略图滚动容器 -->
            <div class="relative p-2">
              <div
                ref="thumbnailContainer"
                class="scrollbar-none relative overflow-x-auto overflow-y-hidden flex gap-2 touch-pan-x"
                @wheel="onThumbnailWheel"
                @touchstart="onThumbnailTouchStart"
                @touchmove="onThumbnailTouchMove"
                @touchend="onThumbnailTouchEnd"
                :style="{
                  'scroll-snap-type': isMobile ? 'x mandatory' : 'none',
                  'touch-action': 'pan-x',
                  'scroll-behavior': 'smooth',
                  'overscroll-behavior-x': 'contain',
                }"
              >
                <button
                  v-for="(image, index) in props.images"
                  :key="image.id"
                  type="button"
                  class="flex-shrink-0 h-16 w-16 overflow-hidden transition-all hover:grayscale-0 rounded-lg flex items-center justify-center"
                  :class="[
                    currentIndex === index
                      ? 'ring-2 ring-accent grayscale-0 shadow-lg scale-105'
                      : 'grayscale border border-accent/20',
                  ]"
                  @click="onThumbnailClick(index, $event)"
                  :style="isMobile ? 'scroll-snap-align: center' : ''"
                >
                  <img
                    :alt="image.title"
                    class="h-full w-full object-cover pointer-events-none"
                    :src="image.url"
                    loading="lazy"
                  />
                </button>
              </div>

              <!-- 滚动指示器 -->
              <div
                v-if="isMobile"
                class="absolute top-0 bottom-0 left-0 w-4 bg-gradient-to-r from-black/20 to-transparent pointer-events-none"
              ></div>
              <div
                v-if="isMobile"
                class="absolute top-0 bottom-0 right-0 w-4 bg-gradient-to-l from-black/20 to-transparent pointer-events-none"
              ></div>
            </div>
          </div>
        </div>

        <!-- 桌面端右侧信息栏 -->
        <div
          v-if="!isMobile"
          class="bg-material-opaque z-30 w-[280px] shrink-0 overflow-y-auto border-l border-white/10 p-4 backdrop-blur-2xl"
          style="opacity: 1"
        >
          <!-- 右侧信息栏内容保持不变 -->
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
              <div class="flex items-center gap-2 text-sm text-white/80">
                <i class="i-mingcute-zoom-in-line"></i>
                <span>缩放: {{ Math.round(scale * 100) }}%</span>
              </div>
            </div>
          </div>

          <!-- 缩放控制面板 -->
          <div class="mt-4 p-3 bg-white/5 rounded-lg">
            <h4 class="mb-2 text-sm font-medium text-white/80">缩放控制</h4>
            <div class="flex items-center justify-between mb-3">
              <button
                type="button"
                class="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                @click="zoomOut"
                title="缩小"
              >
                <UIcon name="ic:baseline-remove" />
              </button>
              <div class="text-sm text-white/80">{{ Math.round(scale * 100) }}%</div>
              <button
                type="button"
                class="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                @click="zoomIn"
                title="放大"
              >
                <UIcon name="ic:baseline-add" />
              </button>
            </div>
            <div class="w-full bg-white/10 rounded-full h-1.5">
              <div
                class="bg-white h-full rounded-full transition-all duration-200"
                :style="{
                  width: `${Math.min(
                    100,
                    ((scale - MIN_SCALE) / (MAX_SCALE - MIN_SCALE)) * 100
                  )}%`,
                }"
              ></div>
            </div>
            <div class="mt-2 flex justify-between text-xs text-white/60">
              <span>{{ Math.round(MIN_SCALE * 100) }}%</span>
              <span>{{ Math.round(MAX_SCALE * 100) }}%</span>
            </div>
            <button
              v-if="scale !== 1"
              type="button"
              class="w-full mt-3 px-3 py-1.5 text-sm bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors flex items-center justify-center gap-2"
              @click="zoomToFit"
            >
              <UIcon name="ic:baseline-fullscreen-exit" />
              适应屏幕
            </button>
          </div>

          <!-- 操作提示 -->
          <div class="mt-4 p-3 bg-white/5 rounded-lg">
            <h4 class="mb-2 text-sm font-medium text-white/80">操作提示</h4>
            <div class="space-y-1 text-xs text-white/60">
              <div class="flex justify-between">
                <span>双击图片</span>
                <span class="text-white/80">放大/恢复</span>
              </div>
              <div class="flex justify-between">
                <span>鼠标滚轮</span>
                <span class="text-white/80">缩放</span>
              </div>
              <div v-if="scale > 1" class="flex justify-between">
                <span>拖拽图片</span>
                <span class="text-white/80">查看细节</span>
              </div>
              <div class="flex justify-between">
                <span>ESC</span>
                <span class="text-white/80">关闭</span>
              </div>
            </div>
          </div>

          <!-- 标签 -->
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

          <!-- 影调分析 -->
          <div class="text-white/70 mt-4">
            <h4 class="my-2 text-sm font-medium text-white/80">影调分析</h4>
            <div class="grid grid-cols-2 gap-x-2 gap-y-1 text-sm">
              <div class="flex justify-between gap-4 text-sm">
                <span class="text-text-secondary shrink-0">亮度</span>
                <span class="text-text min-w-0 text-right">41%</span>
              </div>
              <div class="flex justify-between gap-4 text-sm">
                <span class="text-text-secondary shrink-0">对比度</span>
                <span class="text-text min-w-0 text-right">49%</span>
              </div>
              <div class="flex justify-between gap-4 text-sm">
                <span class="text-text-secondary shrink-0">阴影占比</span>
                <span class="text-text min-w-0 text-right">47%</span>
              </div>
              <div class="flex justify-between gap-4 text-sm">
                <span class="text-text-secondary shrink-0">高光占比</span>
                <span class="text-text min-w-0 text-right">24%</span>
              </div>
            </div>
          </div>

          <!-- 设备信息 -->
          <div class="text-white/70 mt-4">
            <h4 class="my-2 text-sm font-medium text-white/80">设备信息</h4>
            <div class="space-y-1 text-sm">
              <div class="flex justify-between gap-4 text-sm">
                <span class="text-text-secondary shrink-0">相机</span>
                <span class="text-text min-w-0 text-right">FUJIFILM X-T5</span>
              </div>
              <div class="flex justify-between gap-4 text-sm">
                <span class="text-text-secondary shrink-0">镜头</span>
                <span class="text-text min-w-0 text-right"
                  >FUJIFILM Fujinon XF70-300mm</span
                >
              </div>
              <div class="flex justify-between gap-4 text-sm">
                <span class="text-text-secondary shrink-0">焦距</span>
                <span class="text-text min-w-0 text-right">84mm</span>
              </div>
              <div class="flex justify-between gap-4 text-sm">
                <span class="text-text-secondary shrink-0">光圈</span>
                <span class="text-text min-w-0 text-right">f/4</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 移动端抽屉 -->
      <transition name="slide-up">
        <div
          v-if="isMobile && drawerOpen"
          class="fixed inset-x-0 bottom-0 z-40 max-h-[85vh] overflow-y-auto bg-material-opaque backdrop-blur-2xl rounded-t-2xl border-t border-white/10 shadow-2xl"
          @click.stop
        >
          <!-- 抽屉拖拽手柄 -->
          <div
            class="sticky top-0 z-10 flex h-6 items-center justify-center bg-transparent"
            @touchstart="toggleDrawer"
          >
            <div class="h-1 w-10 rounded-full bg-white/30"></div>
          </div>

          <!-- 抽屉内容 -->
          <div class="p-4 space-y-4">
            <!-- 标题和信息 -->
            <div>
              <h2 class="text-lg font-semibold text-white mb-2">
                {{ currentImage?.title || "无标题" }}
              </h2>
              <div class="space-y-2">
                <div class="flex items-center gap-2 text-sm text-white/80">
                  <i class="i-mingcute-calendar-line"></i>
                  <span>{{ currentImage?.date || "无日期" }}</span>
                </div>
                <div class="flex items-center gap-2 text-sm text-white/80">
                  <i class="i-mingcute-location-line"></i>
                  <span>{{ currentImage?.address || "无地址" }}</span>
                </div>
                <div class="flex items-center gap-2 text-sm text-white/80">
                  <i class="i-mingcute-zoom-in-line"></i>
                  <span>缩放: {{ Math.round(scale * 100) }}%</span>
                </div>
              </div>
            </div>

            <!-- 标签 -->
            <div>
              <h4 class="text-sm font-medium text-white/80 mb-2">标签</h4>
              <div class="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  class="glassmorphic-btn border-accent/20 bg-accent/10 inline-flex cursor-pointer items-center rounded-full border px-3 py-1 text-xs text-white/90 backdrop-blur-sm"
                  tabindex="0"
                >
                  湖州</button
                ><button
                  type="button"
                  class="glassmorphic-btn border-accent/20 bg-accent/10 inline-flex cursor-pointer items-center rounded-full border px-3 py-1 text-xs text-white/90 backdrop-blur-sm"
                  tabindex="0"
                >
                  龙之梦太湖古镇</button
                ><button
                  type="button"
                  class="glassmorphic-btn border-accent/20 bg-accent/10 inline-flex cursor-pointer items-center rounded-full border px-3 py-1 text-xs text-white/90 backdrop-blur-sm"
                  tabindex="0"
                >
                  NPC
                </button>
              </div>
            </div>

            <!-- 缩放控制面板 -->
            <div class="p-3 bg-white/5 rounded-lg">
              <h4 class="mb-3 text-sm font-medium text-white/80">缩放控制</h4>
              <div class="flex items-center justify-between mb-3">
                <button
                  type="button"
                  class="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                  @click="zoomOut"
                  title="缩小"
                >
                  <UIcon name="ic:baseline-remove" class="text-lg" />
                </button>
                <div class="text-base text-white/80 font-medium">
                  {{ Math.round(scale * 100) }}%
                </div>
                <button
                  type="button"
                  class="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                  @click="zoomIn"
                  title="放大"
                >
                  <UIcon name="ic:baseline-add" class="text-lg" />
                </button>
              </div>
              <div class="w-full bg-white/10 rounded-full h-2 mb-2">
                <div
                  class="bg-white h-full rounded-full transition-all duration-200"
                  :style="{
                    width: `${Math.min(
                      100,
                      ((scale - MIN_SCALE) / (MAX_SCALE - MIN_SCALE)) * 100
                    )}%`,
                  }"
                ></div>
              </div>
              <div class="flex justify-between text-xs text-white/60">
                <span>{{ Math.round(MIN_SCALE * 100) }}%</span>
                <span>{{ Math.round(MAX_SCALE * 100) }}%</span>
              </div>
              <button
                v-if="scale !== 1"
                type="button"
                class="w-full mt-3 px-4 py-2 text-sm bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors flex items-center justify-center gap-2"
                @click="zoomToFit"
              >
                <UIcon name="ic:baseline-fullscreen-exit" />
                适应屏幕
              </button>
            </div>

            <!-- 操作提示 -->
            <div class="p-3 bg-white/5 rounded-lg">
              <h4 class="mb-2 text-sm font-medium text-white/80">操作提示</h4>
              <div class="space-y-1 text-xs text-white/60">
                <div class="flex justify-between">
                  <span>双击图片</span>
                  <span class="text-white/80">放大/恢复</span>
                </div>
                <div class="flex justify-between">
                  <span>双指缩放</span>
                  <span class="text-white/80">缩放图片</span>
                </div>
                <div class="flex justify-between">
                  <span>左右滑动</span>
                  <span class="text-white/80">切换图片</span>
                </div>
                <div v-if="scale > 1" class="flex justify-between">
                  <span>单指拖拽</span>
                  <span class="text-white/80">查看细节</span>
                </div>
                <div class="flex justify-between">
                  <span>向下滑动</span>
                  <span class="text-white/80">关闭抽屉</span>
                </div>
              </div>
            </div>

            <!-- 影调分析 -->
            <div class="text-white/70">
              <h4 class="text-sm font-medium text-white/80 mb-2">影调分析</h4>
              <div class="grid grid-cols-2 gap-x-2 gap-y-1 text-sm">
                <div class="flex justify-between gap-4 text-sm">
                  <span class="text-text-secondary shrink-0">亮度</span>
                  <span class="text-text min-w-0 text-right">41%</span>
                </div>
                <div class="flex justify-between gap-4 text-sm">
                  <span class="text-text-secondary shrink-0">对比度</span>
                  <span class="text-text min-w-0 text-right">49%</span>
                </div>
                <div class="flex justify-between gap-4 text-sm">
                  <span class="text-text-secondary shrink-0">阴影占比</span>
                  <span class="text-text min-w-0 text-right">47%</span>
                </div>
                <div class="flex justify-between gap-4 text-sm">
                  <span class="text-text-secondary shrink-0">高光占比</span>
                  <span class="text-text min-w-0 text-right">24%</span>
                </div>
              </div>
            </div>

            <!-- 设备信息 -->
            <div class="text-white/70">
              <h4 class="text-sm font-medium text-white/80 mb-2">设备信息</h4>
              <div class="space-y-1 text-sm">
                <div class="flex justify-between gap-4 text-sm">
                  <span class="text-text-secondary shrink-0">相机</span>
                  <span class="text-text min-w-0 text-right">FUJIFILM X-T5</span>
                </div>
                <div class="flex justify-between gap-4 text-sm">
                  <span class="text-text-secondary shrink-0">镜头</span>
                  <span class="text-text min-w-0 text-right"
                    >FUJIFILM Fujinon XF70-300mm</span
                  >
                </div>
                <div class="flex justify-between gap-4 text-sm">
                  <span class="text-text-secondary shrink-0">焦距</span>
                  <span class="text-text min-w-0 text-right">84mm</span>
                </div>
                <div class="flex justify-between gap-4 text-sm">
                  <span class="text-text-secondary shrink-0">光圈</span>
                  <span class="text-text min-w-0 text-right">f/4</span>
                </div>
              </div>
            </div>

            <!-- 关闭按钮 -->
            <button
              type="button"
              class="w-full mt-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors flex items-center justify-center gap-2"
              @click="toggleDrawer"
            >
              <UIcon name="material-symbols:close" />
              关闭详情
            </button>
          </div>
        </div>
      </transition>

      <!-- 移动端抽屉遮罩层 -->
      <transition name="fade">
        <div
          v-if="isMobile && drawerOpen"
          class="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm"
          @click.stop="toggleDrawer"
        ></div>
      </transition>
    </div>
  </div>
</template>

<style scoped>
img {
  transform-origin: center center;
  will-change: transform;
  user-select: none;
  -webkit-user-drag: none;
}

.scrollbar-none {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.scrollbar-none::-webkit-scrollbar {
  display: none;
}

.cursor-grab {
  cursor: grab;
}

.cursor-grab:active {
  cursor: grabbing;
}

/* 平滑过渡 */
img {
  transition: transform 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

/* 确保图片缩放时的性能 */
img {
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  image-rendering: -webkit-optimize-contrast;
}

/* 按钮悬停效果 */
button {
  outline: none;
  -webkit-tap-highlight-color: transparent;
}

button:active {
  transform: scale(0.98);
}

/* 背景图片过渡效果 */
.bg-cover {
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
}

/* 优化性能：减少重绘 */
* {
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  transform-style: preserve-3d;
}

/* 优化滚动性能 */
.overflow-x-hidden {
  transform: translateZ(0);
  will-change: scroll-position;
}

/* 优化模糊效果性能 */
.backdrop-blur-2xl {
  -webkit-backdrop-filter: blur(24px);
  backdrop-filter: blur(24px);
}

/* 优化过渡效果 */
.transition-transform {
  will-change: transform;
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
  .pb-safe {
    padding-bottom: env(safe-area-inset-bottom);
  }

  /* 防止抽屉内容被键盘遮挡 */
  .fixed.inset-x-0.bottom-0 {
    padding-bottom: env(safe-area-inset-bottom);
  }

  /* 优化触摸体验 */
  button {
    min-height: 44px;
    min-width: 44px;
  }

  /* 缩略图区域触摸优化 */
  .overflow-x-auto {
    -webkit-overflow-scrolling: touch;
    overflow-scrolling: touch;
    scroll-behavior: smooth;
  }
}

/* 防止iOS橡皮筋效果 */
body {
  overscroll-behavior-y: none;
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

/* 触摸优化 */
.touch-pan-x {
  touch-action: pan-x pinch-zoom;
}

/* 缩略图滚动指示器渐变效果 */
.bg-gradient-to-r {
  background: linear-gradient(to right, rgba(0, 0, 0, 0.2), transparent);
}

.bg-gradient-to-l {
  background: linear-gradient(to left, rgba(0, 0, 0, 0.2), transparent);
}

/* 缩略图容器优化 */
.overflow-y-hidden {
  overflow-y: hidden !important;
}

/* 确保缩略图图片不会响应点击 */
.pointer-events-none {
  pointer-events: none;
}
</style>
