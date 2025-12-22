<template>
  <div>
    <!-- <Loading></Loading> -->
    <MasonryGallery :items="photos" @image-click="openImageDetail" />

    <UModal
      :fullscreen="true"
      :dismissible="false"
      v-model:open="showDetail"
      close-icon="i-lucide-arrow-right"
    >
      <template #content>
        <!-- <PhoneView
          :images="photos"
          :initial-index="currentImageIndex"
          @closePhoneView="closeDetail"
        >
        </PhoneView> -->
        <ImageViewer
          :images="photos"
          :initial-index="currentImageIndex"
          @closePhoneView="closeDetail"
        >
        </ImageViewer>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from "vue-router";
import { ref } from "vue";
import photos from "~/data/photos";

// 获取路由参数
const route = useRoute();
const id = route.params.id; // 获取动态参数

const currentImageIndex = ref<number>(0);
// 详情组件相关
const showDetail = ref(false);

// 打开详情
const openImageDetail = (index: number) => {
  console.log("------------", index);
  currentImageIndex.value = index;
  showDetail.value = true;
};

// 关闭详情
const closeDetail = () => {
  showDetail.value = false;
};
</script>
