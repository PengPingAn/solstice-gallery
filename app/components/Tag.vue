<script setup lang="ts">
import { computed, defineProps } from "vue";

interface TagProps {
  color?: string; // 支持 tailwind class 或 颜色值
  textColor?: string; // 同上
  size?: "sm" | "md" | "lg";
  radius?: "sm" | "md" | "lg" | "full";
  opacity?: number;
}

const props = defineProps<TagProps>();

// 判断是否是 Tailwind 类名
const isTailwindClass = (v?: string) => {
  if (!v) return false;

  // 几乎所有 tailwind class 都是 a-z 开头，且不含 # 或 (
  return /^[a-z-]/i.test(v) && !v.includes("#") && !v.includes("(");
};

// 背景处理
const colorClass = computed(() => (isTailwindClass(props.color) ? props.color : ""));

const colorStyle = computed(() =>
  !isTailwindClass(props.color) && props.color ? { backgroundColor: props.color } : {}
);

// 文字颜色处理
const textClass = computed(() =>
  isTailwindClass(props.textColor) ? props.textColor : ""
);

const textStyle = computed(() =>
  !isTailwindClass(props.textColor) && props.textColor ? { color: props.textColor } : {}
);

// 透明度
const opacityStyle = computed(() =>
  props.opacity != null ? { opacity: props.opacity } : {}
);

// 尺寸
const sizeClass = computed(() => {
  switch (props.size) {
    case "sm":
      return "text-xs px-1.5 py-0.5";
    case "lg":
      return "text-lg px-3 py-1.5";
    default:
      return "text-sm px-2.5 py-1";
  }
});

// 圆角
const radiusClass = computed(() => {
  switch (props.radius) {
    case "sm":
      return "rounded-sm";
    case "lg":
      return "rounded-lg";
    case "full":
      return "rounded-full";
    default:
      return "rounded-md";
  }
});

// 暗黑模式默认样式（仅当没有传 color 时）
const darkClass = computed(() =>
  props.color ? "" : "dark:bg-gray-700 dark:text-gray-300"
);
</script>

<template>
  <span
    :class="[
      'inline-block font-medium backdrop-blur-sm text-black dark:text-white bg-[#099fa130] z-10',
      sizeClass,
      radiusClass,
      darkClass,
      colorClass,
      textClass,
    ]"
    :style="{
      ...colorStyle,
      ...textStyle,
      ...opacityStyle,
    }"
    class="mr-1 break-words mt-2 max-w-full"
  >
    <slot />
  </span>
</template>

<style scoped>
span {
  border: 1px solid rgba(255, 255, 255, 0.3);
}
</style>
