<script setup lang="ts">
import { Comment, computed, Text, useSlots } from 'vue'

interface TagProps {
  color?: string
  textColor?: string
  size?: 'sm' | 'md' | 'lg'
  radius?: 'sm' | 'md' | 'lg' | 'full'
  opacity?: number
  closable?: boolean
  loading?: boolean // 手动控制加载状态（可选）
  skeletonWidth?: string // 骨架屏宽度
  skeletonHeight?: string // 骨架屏高度
  autoSkeleton?: boolean // 是否自动检测空内容显示骨架屏
}

const props = withDefaults(defineProps<TagProps>(), {
  size: 'md',
  radius: 'md',
  opacity: 1,
  closable: false,
  loading: undefined, // 默认 undefined 表示自动检测
  skeletonWidth: '80px',
  skeletonHeight: '24px',
  autoSkeleton: true, // 默认开启自动骨架屏
})

const slots = useSlots()
const emit = defineEmits<{
  (e: 'close'): void
}>()

// 检测插槽内容是否为空
const hasContent = computed(() => {
  if (!slots.default) return false

  const slotContent = slots.default()
  if (!slotContent || slotContent.length === 0) return false

  // 检查每个插槽节点
  for (const node of slotContent) {
    // 如果是文本节点
    if (node.type === Text) {
      const text = node.children as string
      if (text && text.trim() !== '') return true
    }
    // 如果是元素节点
    else if (node.type !== Comment) {
      if (node.children) return true
    }
  }

  return false
})

// 决定是否显示骨架屏
const showSkeleton = computed(() => {
  // 1. 如果手动设置了 loading 属性，优先使用
  if (props.loading !== undefined) {
    return props.loading
  }

  // 2. 如果关闭了自动骨架屏，不显示
  if (!props.autoSkeleton) {
    return false
  }

  // 3. 自动检测：内容为空时显示骨架屏
  return !hasContent.value
})

const isTailwindClass = (v?: string) =>
  !!v && /^[a-z-]/i.test(v) && !v.includes('#') && !v.includes('(')

const colorClass = computed(() => (isTailwindClass(props.color) ? props.color : ''))

const colorStyle = computed(() =>
  !isTailwindClass(props.color) && props.color ? { backgroundColor: props.color } : {}
)

const textClass = computed(() => (isTailwindClass(props.textColor) ? props.textColor : ''))

const textStyle = computed(() =>
  !isTailwindClass(props.textColor) && props.textColor ? { color: props.textColor } : {}
)

const opacityStyle = computed(() => (props.opacity != null ? { opacity: props.opacity } : {}))

const sizeClass = computed(() => {
  if (showSkeleton.value) return ''

  switch (props.size) {
    case 'sm':
      return 'text-xs px-1.5 py-0.5'
    case 'lg':
      return 'text-lg px-3 py-1.5'
    default:
      return 'text-sm px-2.5 py-1'
  }
})

const radiusClass = computed(() => {
  switch (props.radius) {
    case 'sm':
      return 'rounded-sm'
    case 'lg':
      return 'rounded-lg'
    case 'full':
      return 'rounded-full'
    default:
      return 'rounded-md'
  }
})

const darkClass = computed(() =>
  props.color && !showSkeleton.value ? '' : 'dark:bg-gray-700 dark:text-gray-300'
)

// 骨架屏样式 - 根据 size 自动调整
const skeletonSizeStyle = computed(() => {
  // 如果没有设置宽高，根据 size 属性自动设置
  let width = props.skeletonWidth
  let height = props.skeletonHeight

  // 根据 size 设置默认高度
  if (props.skeletonHeight === '24px') {
    switch (props.size) {
      case 'sm':
        height = '15px'
        break
      case 'lg':
        height = '20px'
        break
      default:
        height = '20px'
    }
  }

  return {
    width,
    height,
    ...colorStyle.value,
    ...opacityStyle.value,
  }
})
</script>

<template>
  <!-- 骨架屏状态 -->
  <span
    v-if="showSkeleton"
    :class="[
      'inline-flex items-center relative overflow-hidden mr-1 mt-2',
      'bg-gray-200 dark:bg-gray-700',
      radiusClass,
      sizeClass,
    ]"
    :style="skeletonSizeStyle"
    aria-label="加载中..."
    :title="hasContent ? '内容加载中...' : '暂无内容'"
  >
    <!-- 骨架屏动画效果 -->
    <span
      class="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent"
    />

    <!-- 可选：显示一个小的提示文本 -->
    <span
      v-if="props.loading === undefined && autoSkeleton"
      class="absolute inset-0 flex items-center justify-center text-xs text-gray-400 dark:text-gray-500 pointer-events-none"
    >
      <!-- 如果内容为空，显示"空" -->
      <span v-if="!hasContent"></span>
    </span>
  </span>

  <!-- 正常状态 -->
  <span
    v-else
    :class="[
      'inline-flex items-center gap-1 font-medium backdrop-blur-sm z-10',
      'text-black dark:text-white bg-[#099fa130]',
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
    <!-- 内容 -->
    <span class="leading-none">
      <slot />
    </span>

    <!-- 删除按钮 -->
    <button
      v-if="props.closable"
      type="button"
      class="cursor-pointer p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition"
      @click.stop="emit('close')"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="w-3 h-3"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
  </span>
</template>

<style scoped>
/* 正常状态的边框 */
span:not(.loading) {
  border: 1px solid rgba(255, 255, 255, 0.3);
}

/* 骨架屏闪烁动画 */
@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}
</style>
