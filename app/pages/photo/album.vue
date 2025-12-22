<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  alias: '/album',
  requiresAuth: true,
})

const testimonials = [
  {
    title: '测试图片1',
    tags: ['英国', '瑞士'],
    urlData: [
      'https://qcloud.dpfile.com/pc/GxQVns6a7oE_uWvzCvQ_jkLGXRlo0O2ZBczMdvbk76oT_p_NlQV3-I3R8sFMnjwG.jpg',
    ],
  },
  {
    title: '测试图片2',
    tags: ['东极岛'],
    urlData: [
      'https://img2.baidu.com/it/u=1019051495,554434034&fm=253&app=138&f=JPEG?w=800&h=1201',
    ],
  },
]
const newTag = ref('')
const showModal = ref(false)

const currentAlbum = ref<any | null>(null)

const openAlbum = (album: any) => {
  currentAlbum.value = album
  showModal.value = true
}
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold my-2">相册</h1>
    <p class="text-sm text-gray-400">在这里可以编辑你的相册信息</p>
  </div>

  <div class="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-12">
    <div
      v-for="value in testimonials"
      :key="value.title"
      class="flex justify-center cursor-pointer"
      @click="openAlbum(value)"
    >
      <AlbumCard :photo="value.urlData[0]" :tags="value.tags" :title="value.title" />
    </div>
  </div>

  <UModal v-model:open="showModal" title="编辑相册" :ui="{ width: 'max-w-4xl' }">
    <template #body>
      <div v-if="currentAlbum" class="space-y-6">
        <!-- 封面 -->
        <div>
          <p class="text-sm font-medium mb-2">封面</p>
          <div class="relative group w-full h-56">
            <img :src="currentAlbum.urlData[0]" class="w-full h-full object-cover rounded-sm" />
            <div
              class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition"
            >
              <UButton
                size="sm"
                @click.stop="
                  currentAlbum.urlData[0] =
                    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee'
                "
              >
                更换封面
              </UButton>
            </div>
          </div>
        </div>

        <!-- 标题 -->
        <div>
          <p class="text-sm font-medium mb-2">相册标题</p>
          <UInput v-model="currentAlbum.title" class="w-full" placeholder="请输入相册标题" />
        </div>

        <!-- 标签 -->
        <div>
          <p class="text-sm font-medium">标签</p>

          <div class="flex flex-wrap gap-2 mb-2">
            <Tag
              size="sm"
              v-for="(tag, index) in currentAlbum.tags"
              :key="tag"
              closable
              @close="currentAlbum.tags.splice(index, 1)"
            >
              {{ tag }}
            </Tag>
          </div>

          <div class="flex gap-2">
            <UInput
              v-model="newTag"
              size="sm"
              placeholder="新增标签"
              @keyup.enter="newTag && (currentAlbum.tags.push(newTag), (newTag = ''))"
            />
            <UButton size="sm" @click="newTag && (currentAlbum.tags.push(newTag), (newTag = ''))">
              添加
            </UButton>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="w-full flex gap-2 justify-end">
        <UButton variant="ghost" @click="showModal = false">取消</UButton>
        <UButton color="primary" @click="showModal = false"> 保存 </UButton>
      </div>
    </template>
  </UModal>
</template>
