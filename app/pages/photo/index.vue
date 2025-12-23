<!-- pages/dashboard/photos.vue -->
<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  alias: '/photos',
  requiresAuth: true,
})

// 图片数据 - 添加更多字段记录图片信息
const photos = ref<any>([])
const selectPhotos = ref<any>([])

const btnLoading = ref(false)

const isAllSelect = ref(false)

const mcRef = ref()

// 筛选相关
const items = ref(['ALL', '相册一', '相册二', '相册三'])
const value = ref('ALL')

// 文件选择器引用
const fileInputRef = ref<HTMLInputElement>()

// 打开文件选择器
const openFilePicker = () => {
  fileInputRef.value?.click()
}

const syncFile = () => {
  btnLoading.value = true
  setTimeout(() => {
    btnLoading.value = false
  }, 1000)
}

// 获取图片真实尺寸的辅助函数
const getImageDimensions = (url: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      })
    }
    img.onerror = reject
    img.src = url
  })
}

// 格式化文件大小为可读格式
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 处理文件选择
const handleFileSelect = async (event: Event) => {
  const input = event.target as HTMLInputElement

  if (!input.files || input.files.length === 0) {
    return
  }

  // 将 FileList 转换为数组
  const files = Array.from(input.files)

  // 过滤只保留图片文件
  const imageFiles = files.filter((file) => file.type.startsWith('image/'))

  if (imageFiles.length === 0) {
    alert('请选择图片文件')
    return
  }

  // 遍历每个图片文件，创建预览并添加到 photos 数组
  for (const [index, file] of imageFiles.entries()) {
    // 创建 FileReader 来读取文件
    const reader = new FileReader()

    const dataUrl = await new Promise<string>((resolve, reject) => {
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

    // 获取图片真实尺寸
    let width = 800
    let height = 600
    try {
      const dimensions = await getImageDimensions(dataUrl)
      width = dimensions.width
      height = dimensions.height
    } catch (error) {
      console.warn('无法获取图片尺寸:', error)
    }

    // 创建新的图片对象 - 添加更多字段记录信息
    const newPhoto = {
      id: Date.now() + index, // 使用时间戳作为ID
      url: dataUrl, // Data URL
      title: file.name.replace(/\.[^/.]+$/, ''), // 移除扩展名作为标题
      fileName: file.name, // 原始文件名
      width: width, // 真实宽度
      height: height, // 真实高度
      fileSize: file.size, // 文件大小（字节）
      fileSizeFormatted: formatFileSize(file.size), // 格式化后的文件大小
      fileType: file.type, // 文件类型（如image/jpeg）
      uploadTime: new Date().toISOString(), // 上传时间（ISO格式）
      uploadTimeFormatted: new Date().toLocaleString('zh-CN'), // 格式化后的上传时间
      lastModified: file.lastModified, // 文件最后修改时间戳
      resolution: `${width} × ${height}`, // 分辨率字符串
      aspectRatio: (width / height).toFixed(2), // 宽高比
    }

    // 添加到 photos 数组
    photos.value.push(newPhoto)
    console.log(photos.value)
  }

  // 重置 input 的值，允许再次选择相同的文件
  input.value = ''
}

// 删除图片
const deleteImage = (id: number) => {
  photos.value = photos.value.filter((photo) => photo.id !== id)
}

// 显示图片详细信息
const showImageInfo = (photo: any) => {
  const info = `
标题: ${photo.title}
文件名: ${photo.fileName}
分辨率: ${photo.resolution} (${photo.width} × ${photo.height})
文件大小: ${photo.fileSizeFormatted} (${photo.fileSize} 字节)
文件类型: ${photo.fileType}
上传时间: ${photo.uploadTimeFormatted}
最后修改: ${new Date(photo.lastModified).toLocaleString('zh-CN')}
宽高比: ${photo.aspectRatio}
  `

  message.show({
    text: `${info}`,
    messageType: 'info',
    duration: 2000,
  })
}

const allCheck = () => {
  mcRef.value?.toggleSelectAll(isAllSelect.value)
}

const btnCheckCount = (val: any) => {
  const ids = val.map(Number)

  const selectedPhotos = photos.value.filter((p) => ids.includes(p.id))

  if (selectedPhotos) {
    selectPhotos.value = selectedPhotos
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- 头部 -->
    <div class="flex items-end justify-between">
      <div>
        <h1 class="text-3xl font-bold my-2">图库</h1>
        <p class="text-sm text-gray-400">在这里管理你的图片</p>
        <!-- 简单统计信息 -->
        <div v-if="photos.length > 0" class="mt-2 text-sm text-gray-500">
          共 {{ photos.length }} 张图片 • 总大小:
          {{ formatFileSize(photos.reduce((sum, photo) => sum + photo.fileSize, 0)) }}
          选中 <Tag size="sm"> {{ selectPhotos.length }} / {{ photos.length }}</Tag>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <UCheckbox v-model="isAllSelect" label="全选" @change="allCheck"></UCheckbox>
        <USelectMenu v-model="value" :items="items" :searchable="false" />
        <UButton icon="material-symbols:upload-sharp" color="primary" @click="openFilePicker">
          上传图片
        </UButton>

        <UButton
          :loading="btnLoading"
          loading-icon="i-lucide-loader"
          icon="si-glyph:arrow-reload"
          color="neutral"
          @click="syncFile"
        >
          同步Server
        </UButton>

        <!-- 隐藏的文件输入 -->
        <input
          ref="fileInputRef"
          type="file"
          multiple
          accept="image/*"
          class="hidden"
          @change="handleFileSelect"
        />
      </div>
    </div>

    <!-- 瀑布流展示 - 可以通过props传递额外信息给MasonryCollection组件 -->
    <div v-if="photos.length > 0">
      <MasonryCollection
        ref="mcRef"
        :items="photos"
        @image-click="showImageInfo"
        @selection-change="btnCheckCount"
      />
    </div>

    <!-- 如果没有图片，显示提示 -->
    <div
      v-if="photos.length === 0"
      class="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer"
      @click="openFilePicker"
    >
      <div class="max-w-sm mx-auto space-y-4">
        <div class="w-16 h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center">
          <UIcon name="fluent:image-off-28-regular" class="text-3xl text-gray-400" />
        </div>
        <div class="space-y-2">
          <h3 class="text-lg font-medium">还没有图片</h3>
          <p class="text-sm text-gray-500">点击"上传图片"按钮添加你的第一张图片</p>
          <p class="text-xs text-gray-400">
            支持 JPG, PNG, GIF, WebP 等格式<br />
            系统将自动记录图片的分辨率、大小等信息
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
