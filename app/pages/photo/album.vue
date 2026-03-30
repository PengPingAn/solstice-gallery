<script setup lang="ts">
import defBgImg from '~/data/defaultBgImg'

definePageMeta({
  layout: 'dashboard',
  alias: '/album',
  requiresAuth: true,
})

interface Album {
  id?: number
  name: string
  tags: string[]
  urlData: string[]
  coverMode: boolean
  path: string
  imgCount?: number
  updateDate?: string
}

const albums = ref<Album[]>([])

const showModal = ref(false)
const newTag = ref('')
const currentAlbum = ref<Album | null>(null)
const isUpdate = ref(false)
const albumImages = ref<{ id: number; url: string }[]>([])
const coverPickerOpen = ref(false)
const selectedCoverId = ref<number | null>(null)

/** 编辑 */
const openAlbum = (album: Album) => {
  // 深拷贝，避免直接污染原数据
  currentAlbum.value = JSON.parse(JSON.stringify(album))
  showModal.value = true
  isUpdate.value = true
  selectedCoverId.value = null

  // 预加载相册图片列表，便于选择封面
  if (album.id) {
    $fetch(`/api/album/images`, { query: { albumId: album.id } }).then((res: any) => {
      albumImages.value = res.data || []
    })
  } else {
    albumImages.value = []
  }
}

/** 新建 */
const btn_AddAlbum = () => {
  currentAlbum.value = {
    name: '',
    tags: [],
    urlData: [defBgImg],
    coverMode: true,
    path: '',
  }
  showModal.value = true
  isUpdate.value = false
  albumImages.value = []
  selectedCoverId.value = null
}

/** 保存（新增 / 编辑） */
const saveAlbum = async () => {
  if (!currentAlbum.value) return

  await createAlbum(currentAlbum.value)

  if (isUpdate.value && selectedCoverId.value && currentAlbum.value.coverMode === false) {
    await $fetch('/api/album/cover', {
      method: 'POST',
      body: {
        albumId: currentAlbum.value.id,
        imageId: selectedCoverId.value,
      },
    })
  }

  showModal.value = false

  // 重新拉取列表
  const res: any = await $fetch('/api/album/list')
  albums.value = (res.data || []).map((a: any) => ({
    ...a,
    urlData: a.urlData.length ? a.urlData : [defBgImg],
  }))
}

const createAlbum = async (album: any) => {
  const res = await $fetch('/api/album/create', {
    method: 'POST',
    body: album,
  })

  return res
}

onMounted(async () => {
  const res: any = await $fetch('/api/album/list')
  albums.value = (res.data || []).map((a: any) => {
    const storageTag =
      a.coverStorageType === 'aliyun-oss'
        ? '阿里云'
        : a.coverStorageType === 'local'
          ? '本地'
          : null
    return {
      ...a,
      tags: storageTag ? Array.from(new Set([storageTag, ...(a.tags || [])])) : a.tags || [],
    }
  })
})

const openCoverPicker = () => {
  if (!currentAlbum.value?.id) return
  coverPickerOpen.value = true
}

const setAlbumCover = (imageId: number) => {
  if (!currentAlbum.value?.id) return
  selectedCoverId.value = imageId
  // 本地预览更新（不落库）
  const img = albumImages.value.find((i) => i.id === imageId)
  if (img && currentAlbum.value) {
    currentAlbum.value.coverMode = false
    currentAlbum.value.urlData = [img.url]
  }
  coverPickerOpen.value = false
}
</script>

<template>
  <div class="flex items-center justify-between items-end animate-fade-in">
    <div>
      <h1 class="text-3xl font-bold my-2">相册</h1>
      <p class="text-sm text-gray-400">在这里可以编辑你的相册信息</p>
    </div>
    <div>
      <UButton icon="material-symbols:add-a-photo-outline-rounded" @click="btn_AddAlbum"
        >创建相册</UButton
      >
    </div>
  </div>

  <div class="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-12">
    <div
      v-for="value in albums"
      :key="value.id"
      class="flex justify-center cursor-pointer"
      @click="openAlbum(value)"
    >
      <AlbumCard :photo="value.urlData[0]" :tags="value.tags" :title="value.name" />
    </div>
  </div>
  <div
    v-if="albums && albums.length === 0"
    class="border-2 border-dashed border-gray-300 rounded-xl p-6 md:p-12 text-center cursor-pointer"
    @click="btn_AddAlbum"
  >
    <div class="max-w-sm mx-auto space-y-3 md:space-y-4">
      <div
        class="w-12 h-12 md:w-16 md:h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center"
      >
        <UIcon name="fluent:image-off-28-regular" class="text-2xl md:text-3xl text-gray-400" />
      </div>
      <div class="space-y-1 md:space-y-2">
        <h3 class="text-base md:text-lg font-medium">还没有相册</h3>
        <p class="text-xs md:text-sm text-gray-500">点击"创建相册"按钮创建你的第个相册吧</p>
      </div>
    </div>
  </div>

  <UModal v-model:open="showModal" :title="isUpdate ? '编辑相册' : '创建相册'">
    <template #body>
      <div v-if="currentAlbum" class="space-y-6">
        <!-- 封面 -->
        <div>
          <p class="text-sm font-medium mb-2">封面</p>
          <div class="relative group w-full h-56">
            <img :src="currentAlbum.urlData[0]" class="w-full h-full object-cover rounded-sm" />
          </div>
        </div>

        <!-- 标题 -->
        <div>
          <p class="text-sm font-medium mb-2">相册标题</p>
          <div class="flex items-center gap-4 flex-wrap">
            <UInput v-model="currentAlbum.name" placeholder="请输入相册标题" />
            <UCheckbox v-model="currentAlbum.coverMode" label="最新图片作为封面" />
            <UButton
              v-if="!currentAlbum.coverMode && isUpdate"
              size="sm"
              variant="outline"
              icon="i-heroicons-photo"
              @click.stop="openCoverPicker"
            >
              更换封面
            </UButton>
          </div>
        </div>

        <!-- 地址 -->
        <div>
          <p class="text-sm font-medium mb-2">相册路径</p>

          <UInput
            class="w-full"
            :disabled="isUpdate"
            v-model="currentAlbum.path"
            placeholder="请输入相册路径"
          />
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
              placeholder="新增标签"
              @keyup.enter="newTag && (currentAlbum.tags.push(newTag), (newTag = ''))"
            />
            <UButton size="sm" @click="newTag && (currentAlbum.tags.push(newTag), (newTag = ''))">
              添加
            </UButton>
          </div>
        </div>
        <div v-if="isUpdate">
          <UAlert color="neutral" variant="subtle" description="" icon="i-lucide-terminal">
            <template #description>
              <div>
                该相册最后上传图片于 <Tag>{{ currentAlbum.updateDate ?? '暂无' }}</Tag>
              </div>
              <div>
                图片总数： <Tag>{{ currentAlbum.imgCount }}</Tag>
              </div>
            </template>
          </UAlert>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="w-full flex gap-2 justify-end">
        <UButton variant="ghost" @click="showModal = false">取消</UButton>
        <UButton color="primary" @click="saveAlbum"> 保存 </UButton>
      </div>
    </template>
  </UModal>

  <!-- 选择封面弹窗 -->
  <UModal v-model:open="coverPickerOpen" title="选择封面">
    <template #body>
      <div class="grid grid-cols-3 gap-3 max-h-[60vh] overflow-auto">
        <div
          v-for="img in albumImages"
          :key="img.id"
          class="relative group cursor-pointer"
          @click="selectedCoverId = img.id"
        >
          <img
            :src="img.thumbUrl || img.url"
            class="w-full h-28 object-cover rounded border"
            :class="selectedCoverId === img.id ? 'ring-2 ring-primary-500' : ''"
          />
        </div>
      </div>
    </template>
    <template #footer>
      <div class="w-full flex gap-2 justify-end">
        <UButton variant="ghost" @click="coverPickerOpen = false">取消</UButton>
        <UButton
          :disabled="!selectedCoverId"
          color="primary"
          @click="setAlbumCover(selectedCoverId!)"
          >设为封面</UButton
        >
      </div>
    </template>
  </UModal>
</template>

<style lang="css" scoped>
/* 淡入动画 */
.animate-fade-in {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
