<script setup lang="ts">
import type { EmojiItem } from "./types";

const props = defineProps<{
  emojiList: EmojiItem[];
  emojiStates: Record<string, boolean>;
  isMobile: boolean;
  drawerOpen: boolean;
}>();

const emit = defineEmits<{
  emojiClick: [emojiId: string];
}>();
</script>

<template>
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
          @click.stop="$emit('emojiClick', emoji.id)"
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
</template>
