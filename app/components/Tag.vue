<template>
  <span
    :class="[
      'inline-block font-medium backdrop-blur-sm text-black dark:text-white dark:bg-[rgba(255,255,255,0.2)] bg-[#099fa130] ',
      sizeClass,
      radiusClass,
      darkClass,
    ]"
    :style="{
      backgroundColor: backgroundColor,
      color: textColor,
      opacity: opacity,
    }"
    class="mr-1 break-words mt-2 max-w-full"
  >
    <slot />
  </span>
</template>

<script setup lang="ts">
import { computed, defineProps } from "vue";

interface TagProps {
  color?: string; // 背景色，可传 Tailwind 色值或自定义色
  textColor?: string; // 文字颜色
  size?: "sm" | "md" | "lg"; // 尺寸
  radius?: "sm" | "md" | "lg" | "full"; // 圆角
  opacity?: number; // 透明度 0~1
}

const props = defineProps<TagProps>();

const sizeClass = computed(() => {
  switch (props.size) {
    case "sm":
      return "text-xs px-1.5 py-0.5";
    case "lg":
      return "text-lg px-3 py-1.5";
    case "md":
    default:
      return "text-sm px-2.5 py-1";
  }
});

const radiusClass = computed(() => {
  switch (props.radius) {
    case "sm":
      return "rounded-sm";
    case "lg":
      return "rounded-lg";
    case "full":
      return "rounded-full";
    case "md":
    default:
      return "rounded-md";
  }
});

// 默认玻璃透明效果
const backgroundColor = computed(() => props.color || "");
const textColor = computed(() => props.textColor || "");
const opacity = computed(() => props.opacity ?? 1);

// 根据黑暗模式和亮色模式调整颜色
const darkClass = computed(() => {
  // 自定义颜色传递时，背景和文字色保持为自定义颜色
  if (props.color) {
    return "";
  }
  // 默认的透明背景色在黑暗模式下需要调整
  return "dark:bg-gray-700 dark:text-gray-300";
});
</script>

<style scoped>
/* 可选：增加阴影或边框玻璃效果 */
span {
  border: 1px solid rgba(255, 255, 255, 0.3);
}
</style>
