<!-- pages/dashboard/photos.vue -->
<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  alias: '/photos/sync',
  requiresAuth: true,
})

// 图片数据 - 添加更多字段记录图片信息
const photos = ref<any>([])
const selectPhotos = ref<any>([])

const btnLoading = ref(false)
const syncProcessing = ref(false) // 是否正在处理同步
const stopProcessing = ref(false) // 是否停止处理
const syncCompleted = ref(false) // 新增：同步是否完成

const isAllSelect = ref(false)

const mcRef = ref()

const modalOpen = ref(false)
const syncModalOpen = ref(false)
const delId = ref<number | null>(null)

// 引用日志容器
const logsContainerRef = ref<HTMLDivElement>()

// 同步状态相关
const syncStatus = ref({
  total: 0,
  current: 0,
  exifTotal: 0,
  exifCurrent: 0,
  successCount: 0,
  errorCount: 0,
  warningsCount: 0, // 新增：警告计数
  removedCount: 0, // 新增：移除计数
  logs: [] as Array<{
    time: string
    message: string
    type: 'info' | 'success' | 'warning' | 'error'
  }>,
})

// 筛选相关
const albumlItems = ref<any>([])
const albumlValue = ref('相册一')

// 文件选择器引用
const fileInputRef = ref<HTMLInputElement>()

// 移动端相关状态
const isMobile = ref(false)
const windowWidth = ref(0)
const MOBILE_BREAKPOINT = 768 // 移动端断点

// 检查是否为移动端
const checkMobile = () => {
  isMobile.value = windowWidth.value < MOBILE_BREAKPOINT
}

// 更新窗口宽度和移动端状态
const updateWidth = () => {
  windowWidth.value = window.innerWidth
  checkMobile()
}

// 打开文件选择器
const openFilePicker = () => {
  fileInputRef.value?.click()
}

// 添加日志并滚动到底部
const addLog = async (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
  const timestamp = new Date().toLocaleTimeString('zh-CN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  syncStatus.value.logs.push({
    time: timestamp,
    message,
    type,
  })

  // 如果是警告或错误，增加对应计数
  if (type === 'warning') {
    syncStatus.value.warningsCount++
  } else if (type === 'error') {
    syncStatus.value.errorCount++
  }

  // 限制日志数量
  if (syncStatus.value.logs.length > 1000) {
    syncStatus.value.logs = syncStatus.value.logs.slice(-500)
  }

  // 等待Vue更新DOM，然后滚动到底部
  await nextTick()
  if (logsContainerRef.value) {
    logsContainerRef.value.scrollTop = logsContainerRef.value.scrollHeight
  }
}

// 重置同步状态
const resetSyncStatus = () => {
  syncStatus.value = {
    total: 0,
    current: 0,
    exifTotal: 0,
    exifCurrent: 0,
    successCount: 0,
    errorCount: 0,
    warningsCount: 0,
    removedCount: 0,
    logs: [],
  }
  stopProcessing.value = false
  syncCompleted.value = false
}

// 停止处理
const stopSync = () => {
  stopProcessing.value = true
  addLog('[WARN] 正在停止同步处理...', 'warning')
  syncProcessing.value = false
}

// 关闭同步模态框
const closeSyncModal = () => {
  syncModalOpen.value = false
  // 重置同步状态，以便下次打开时重新开始
  setTimeout(() => {
    resetSyncStatus()
  }, 300)
}

// 新增：打开同步模态框，根据同步状态决定是否重置
const openSyncModal = () => {
  if (!syncProcessing.value) {
    resetSyncStatus()
  }
  syncModalOpen.value = true
}

const syncFile = async () => {
  const needUpload = selectPhotos.value.filter((p: any) => !p.uploaded)

  if (needUpload.length === 0) {
    message.info('没有需要同步的图片')
    return
  }

  // 重置状态
  resetSyncStatus()
  syncProcessing.value = true
  btnLoading.value = true
  syncCompleted.value = false

  // 初始化统计
  syncStatus.value.total = needUpload.length

  addLog('[INFO] 开始图片同步任务', 'info')
  addLog(`[INFO] 共 ${needUpload.length} 张图片需要上传`, 'info')
  addLog('----------------------------------------', 'info')

  // 记录成功上传的图片ID，用于后续移除
  const successfullyUploadedIds: (string | number)[] = []

  try {
    for (let i = 0; i < needUpload.length; i++) {
      if (stopProcessing.value) {
        addLog('[WARN] 同步处理已被手动停止', 'warning')
        break
      }

      const photo = needUpload[i]
      syncStatus.value.current = i + 1

      console.log(photo)
      // return

      addLog(`[PROC] 处理第 ${i + 1}/${needUpload.length} 张: ${photo.fileName}`, 'info')

      try {
        const res: any = await uploadSinglePhoto(photo)

        console.log(res)
        if (res?.success) {
          photo.uploaded = true
          photo.serverPath = res.data.url
          photo.exif = res.exif

          await createImage({
            name: photo.fileName,
            exif: res.data.exif,
            path: res.data.path || res.data.url,
            albumPath: albumlValue.value?.path,
          })

          // 记录成功上传的图片ID
          successfullyUploadedIds.push(photo.id)

          // 根据服务器返回的exif数据判断是否有EXIF信息
          if (res.exif && Object.keys(res.exif).length > 0) {
            syncStatus.value.exifCurrent++
            addLog(
              `[OK] ${photo.fileName} - 上传成功 (EXIF: ${Object.keys(res.exif).length} 个字段)`,
              'success'
            )
          } else {
            addLog(`[OK] ${photo.fileName} - 上传成功 (无EXIF信息)`, 'success')
          }

          syncStatus.value.successCount++
        } else {
          addLog(`[ERROR] ${photo.fileName} - 上传失败: ${res?.error || '未知错误'}`, 'error')
        }
      } catch (err: any) {
        addLog(`[ERROR] ${photo.fileName} - 上传异常: ${err.message || '未知错误'}`, 'error')
        console.error('上传失败:', err)
      }

      // 更新EXIT总数（基于当前处理的图片类型）
      // 假设JPEG和TIFF格式的图片可能有EXIF
      const hasPotentialExif =
        photo.fileType === 'image/jpeg' ||
        photo.fileType === 'image/tiff' ||
        photo.fileType === 'image/png'
      // if (hasPotentialExif) {
      //   syncStatus.value.exifTotal = Math.max(
      //     syncStatus.value.exifTotal,
      //     syncStatus.value.exifCurrent + 1
      //   )
      // }

      // 添加一点延迟，避免请求过于频繁
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    if (stopProcessing.value) {
      addLog('----------------------------------------', 'info')
      addLog(
        `[WARN] 同步已停止，已处理 ${syncStatus.value.successCount} 张，失败 ${syncStatus.value.errorCount} 张`,
        'warning'
      )
      message.warning(`同步已停止，已处理 ${syncStatus.value.successCount} 张图片`)
    } else {
      addLog('----------------------------------------', 'info')
      addLog(`[SUCCESS] 同步完成！`, 'success')
      addLog(
        `[STATS] 成功: ${syncStatus.value.successCount} | 失败: ${syncStatus.value.errorCount} | 警告: ${syncStatus.value.warningsCount}`,
        'success'
      )
      addLog(
        `[STATS] EXIF信息提取: ${syncStatus.value.exifCurrent}/${syncStatus.value.exifTotal}`,
        'success'
      )
      message.success(`成功同步 ${syncStatus.value.successCount} 张图片`)
    }
  } catch (err: any) {
    addLog(`[ERROR] 同步过程发生错误: ${err.message || '未知错误'}`, 'error')
    console.error(err)
    message.error('同步失败，请重试')
  } finally {
    // 同步完成后，移除已成功上传的图片
    if (successfullyUploadedIds.length > 0) {
      // 从主图片列表中移除
      const originalCount = photos.value.length
      photos.value = photos.value.filter(
        (photo: any) => !successfullyUploadedIds.includes(photo.id)
      )
      syncStatus.value.removedCount = originalCount - photos.value.length

      // 从选中列表中移除
      selectPhotos.value = selectPhotos.value.filter(
        (photo: any) => !successfullyUploadedIds.includes(photo.id)
      )

      // 重置全选状态
      isAllSelect.value = false

      // 记录移除日志
      addLog(`[INFO] 已从本地移除 ${syncStatus.value.removedCount} 张已同步的图片`, 'info')
    }

    btnLoading.value = false
    syncProcessing.value = false
    syncCompleted.value = true // 标记同步完成

    // 添加最终完成日志
    if (!stopProcessing.value) {
      addLog('[INFO] 同步任务已完成，请查看上方统计信息', 'info')
      addLog('[INFO] 您可以点击"关闭"按钮返回图片列表', 'info')
    }
  }
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
      rawFile: file, // 原始 File，用于真正上传
      uploaded: false, // 是否已上传到 Server
      serverPath: null, // Server 保存路径
      exif: null, // Server 返回的 EXIF
    }

    // 添加到 photos 数组
    photos.value.push(newPhoto)
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

const btnOpenModal = (val: any) => {
  modalOpen.value = true
  delId.value = val
}
const btnDelImg = () => {
  photos.value = photos.value.filter((p) => p.id !== delId.value)
  selectPhotos.value = selectPhotos.value.filter((p) => p.id !== delId.value)
  message.success('删除成功')
  modalOpen.value = false
}

const uploadSinglePhoto = async (photo: any) => {
  const form = new FormData()
  form.append('file', photo.rawFile)
  form.append('albumPath', albumlValue.value.path)
  // form.append('variant', 'originals')

  const res = await $fetch('/api/upload/image', {
    method: 'POST',
    body: form,
  })

  return res
}

const createImage = async (image: any) => {
  const res = await $fetch('/api/photo/create', {
    method: 'POST',
    body: image,
  })

  return res
}

// 计算进度百分比
const progressPercentage = computed(() => {
  if (syncStatus.value.total === 0) return 0
  return Math.round((syncStatus.value.current / syncStatus.value.total) * 100)
})

// 移动端适配：监听窗口大小变化
onMounted(async () => {
  const res = await $fetch('/api/album/list')
  res.data.forEach((e: any) => {
    albumlItems.value.push({
      id: e.id,
      label: e.name,
      path: e.path,
    })
  })

  if (albumlItems.value.length > 0) albumlValue.value = albumlItems.value[0]
  updateWidth()
  window.addEventListener('resize', updateWidth)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateWidth)
})

// 移动端全屏查看图片
const viewImageFullscreen = (photo: any) => {
  if (isMobile.value) {
    // 在移动端，点击图片时显示全屏预览
    const modalOpen = ref(true)

    // 这里可以集成一个图片查看器组件
    // 暂时使用简单的alert提示
    alert(
      `查看图片: ${photo.title}\n分辨率: ${photo.resolution}\n文件大小: ${photo.fileSizeFormatted}`
    )
  }
}

const themeItems = ref([
  { label: '同步图片', value: '1', slot: 'image-sync' },
  { label: '查看图片', value: '2', slot: 'image-list' },
  { label: '跟随系统', value: 'system' },
])
</script>

<template>
  <div class="space-y-4 md:space-y-6 animate-fade-in">
    <!-- 头部 - 移动端适配 -->
    <div class="flex flex-col justify-end md:flex-row md:items-end justify-between gap-4 md:gap-0">
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <!-- 移动端：全选和上传按钮放在一行 -->
        <div class="flex items-center gap-2">
          <UCheckbox v-model="isAllSelect" label="全选" class="text-sm" @change="allCheck">
          </UCheckbox>

          <UButton
            icon="material-symbols:upload-sharp"
            color="primary"
            size="md"
            class="flex-1"
            @click="openFilePicker"
          >
            <span class="hidden sm:inline">上传图片</span>
            <span class="sm:hidden">上传</span>
          </UButton>

          <!-- 移动端：同步相关按钮 -->
          <div class="flex items-center gap-1">
            <!-- 停止按钮 -->
            <UButton
              v-if="syncProcessing"
              icon="material-symbols:stop-circle"
              variant="outline"
              size="sm"
              :disabled="stopProcessing"
              @click="stopSync"
            >
              <span class="hidden md:inline">停止</span>
            </UButton>

            <!-- 同步按钮 - 修改点击事件调用 openSyncModal -->
            <UButton
              :loading="syncProcessing"
              :loading-icon="syncProcessing ? 'i-lucide-loader' : 'si-glyph:arrow-reload'"
              :icon="syncProcessing ? undefined : 'si-glyph:arrow-reload'"
              :color="syncProcessing ? 'neutral' : 'neutral'"
              :variant="syncProcessing ? 'outline' : 'solid'"
              size="md"
              @click="openSyncModal"
              :disabled="
                syncProcessing || selectPhotos.filter((p: any) => !p.uploaded).length === 0
              "
            >
              <span class="hidden sm:inline">
                {{ syncProcessing ? '处理中...' : '同步Server' }}
              </span>
              <span class="sm:hidden">
                {{ syncProcessing ? '处理中' : '同步' }}
              </span>
            </UButton>
          </div>
        </div>

        <!-- 隐藏的文件输入 -->
        <!-- <input
          ref="fileInputRef"
          type="file"
          multiple
          accept="image/*"
          class="hidden"
          @change="handleFileSelect"
          :capture="isMobile ? 'environment' : undefined"
        /> -->
        <input
          ref="fileInputRef"
          type="file"
          accept="image/*"
          multiple
          style="display: none"
          @change="handleFileSelect"
        />
      </div>
    </div>

    <!-- 简单统计信息 -->
    <div v-if="photos.length > 0" class="mb-2 -mt-4 text-xs md:text-sm text-gray-500">
      共 {{ photos.length }} 张图片 •
      <span class="hidden md:inline"
        >总大小: {{ formatFileSize(photos.reduce((sum, photo) => sum + photo.fileSize, 0)) }} •
      </span>
      选中
      <Tag size="sm" class="!text-xs md:!text-sm">
        {{ selectPhotos.length }} / {{ photos.length }}</Tag
      >
    </div>

    <!-- 瀑布流展示 - 移动端适配 -->
    <div v-if="photos.length > 0">
      <MasonryCollection
        ref="mcRef"
        :items="photos"
        @image-click="isMobile ? viewImageFullscreen($event) : showImageInfo($event)"
        @selection-change="btnCheckCount"
        @image-delete="btnOpenModal"
      />
    </div>

    <div
      v-if="!albumlItems || albumlItems.length == 0"
      class="border-2 border-dashed border-gray-300 rounded-xl p-6 md:p-12 text-center"
    >
      <div
        class="w-12 h-12 md:w-16 md:h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center"
      >
        <UIcon name="fluent:image-off-28-regular" class="text-2xl md:text-3xl text-gray-400" />
      </div>
      <br />
      <h3 class="text-base md:text-lg font-medium">你貌似还没有创建相册，请先创建相册</h3>
    </div>
    <!-- 如果没有图片，显示提示 - 移动端适配 -->
    <div
      v-else-if="photos.length === 0"
      class="border-2 border-dashed border-gray-300 rounded-xl p-6 md:p-12 text-center cursor-pointer"
      @click="openFilePicker"
    >
      <div class="max-w-sm mx-auto space-y-3 md:space-y-4">
        <div
          class="w-12 h-12 md:w-16 md:h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center"
        >
          <UIcon name="fluent:image-off-28-regular" class="text-2xl md:text-3xl text-gray-400" />
        </div>
        <div class="space-y-1 md:space-y-2">
          <h3 class="text-base md:text-lg font-medium">还没有图片</h3>
          <p class="text-xs md:text-sm text-gray-500">点击"上传图片"按钮添加你的第一张图片</p>
          <p class="text-xs text-gray-400 hidden md:block">
            支持 JPG, PNG, GIF, WebP 等格式<br />
            系统将自动记录图片的分辨率、大小等信息
          </p>
          <p class="text-xs text-gray-400 md:hidden">支持 JPG, PNG, GIF, WebP 等格式</p>
        </div>
      </div>
    </div>
  </div>

  <!-- 删除确认模态框 - 移动端适配 -->
  <UModal
    v-model:open="modalOpen"
    title="删除图片"
    :ui="{
      footer: 'justify-end',
      width: isMobile ? 'w-[90vw]' : 'sm:max-w-lg',
      padding: isMobile ? 'p-4' : 'p-6',
    }"
  >
    <template #body>
      <p class="text-sm md:text-base">你确定要删除这张图片吗？删除后无法恢复。</p>
    </template>

    <template #footer="{ close }">
      <UButton label="手滑了" variant="outline" size="md" @click="close" />
      <UButton label="嗯" color="neutral" size="md" @click="btnDelImg" />
    </template>
  </UModal>

  <!-- 同步模态框 - 移动端适配 -->
  <UModal
    v-model:open="syncModalOpen"
    :title="syncProcessing ? '同步进度' : syncCompleted ? '同步完成' : '图片同步'"
    :ui="{
      footer: 'justify-end',
      width: isMobile ? 'w-[95vw]' : 'sm:max-w-3xl',
      padding: isMobile ? 'p-3' : 'p-6',
    }"
    @close="closeSyncModal"
  >
    <template #body>
      <!-- 同步进度信息 -->
      <div v-if="syncProcessing || syncCompleted" class="space-y-3 md:space-y-4">
        <!-- 进度统计卡片 - 移动端适配 -->
        <UCard :ui="{ body: { padding: isMobile ? 'p-3' : 'p-4' } }">
          <div
            :class="
              isMobile ? 'grid grid-cols-3 gap-2' : 'grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4'
            "
          >
            <div>
              <p class="text-xs md:text-sm text-gray-500 mb-1">图片进度</p>
              <p class="text-base md:text-lg font-semibold">
                {{ syncStatus.current }}/{{ syncStatus.total }}
                <span class="text-xs md:text-sm text-gray-500 ml-1"
                  >({{ progressPercentage }}%)</span
                >
              </p>
            </div>
            <div>
              <p class="text-xs md:text-sm text-gray-500 mb-1">EXIF提取</p>
              <p class="text-base md:text-lg font-semibold">
                {{ syncStatus.exifCurrent }}
              </p>
            </div>
            <div>
              <p class="text-xs md:text-sm text-gray-500 mb-1">成功</p>
              <p class="text-base md:text-lg font-semibold text-green-600">
                {{ syncStatus.successCount }}
              </p>
            </div>
            <div :class="isMobile ? 'col-span-3 md:col-span-1' : ''">
              <p class="text-xs md:text-sm text-gray-500 mb-1">移除</p>
              <p class="text-base md:text-lg font-semibold text-blue-600">
                {{ syncStatus.removedCount }}
              </p>
            </div>
            <div>
              <p class="text-xs md:text-sm text-gray-500 mb-1">错误</p>
              <p class="text-base md:text-lg font-semibold text-red-600">
                {{ syncStatus.errorCount }}
              </p>
            </div>
          </div>

          <!-- 同步完成状态指示器 -->
          <div v-if="syncCompleted" class="mt-3 md:mt-4">
            <div
              class="flex items-center justify-center p-3 bg-green-50 rounded-lg border border-green-200"
            >
              <UIcon
                name="material-symbols:check-circle"
                class="w-5 h-5 md:w-6 md:h-6 text-green-600 mr-2"
              />
              <span class="text-sm md:text-base font-medium text-green-700">
                同步{{ stopProcessing ? '已停止' : '已完成' }}！
                {{ stopProcessing ? '已处理' : '成功同步' }} {{ syncStatus.successCount }} 张图片
              </span>
            </div>
          </div>
        </UCard>

        <!-- 进度条 - 只在处理中显示 -->
        <div v-if="syncProcessing && !syncCompleted">
          <div class="flex justify-between mb-1">
            <span class="text-xs md:text-sm font-medium">处理进度</span>
            <span class="text-xs md:text-sm text-gray-500">{{ progressPercentage }}%</span>
          </div>
          <UProgress
            :value="progressPercentage"
            color="primary"
            :size="isMobile ? 'sm' : 'md'"
            class="mb-4 md:mb-6"
            :animated="true"
          />
        </div>

        <!-- 处理日志 - 移动端适配 -->
        <UCard class="overflow-hidden" :ui="{ body: { padding: isMobile ? 'p-2' : 'p-4' } }">
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-1 md:gap-2">
                <UIcon name="material-symbols:terminal" class="w-4 h-4 md:w-5 md:h-5" />
                <h3 class="text-sm md:text-base font-semibold">处理日志</h3>
              </div>
              <UBadge color="neutral" variant="soft" size="sm">
                {{ syncStatus.logs.length }} 条
              </UBadge>
            </div>
          </template>

          <!-- VSCode风格的日志容器 - 移动端适配 -->
          <div
            ref="logsContainerRef"
            class="console-log bg-[#1e1e1e] text-[#d4d4d4] font-mono text-xs md:text-sm p-2 md:p-3 rounded-md"
            :class="isMobile ? 'max-h-40' : 'max-h-60'"
            :style="{
              'overflow-y': 'auto',
              'overflow-x': 'auto',
              'white-space': isMobile ? 'pre-wrap' : 'nowrap',
              'font-size': isMobile ? '11px' : '13px',
            }"
          >
            <div v-if="syncStatus.logs.length === 0" class="text-gray-400 italic py-2">
              &gt; 等待日志输出...
            </div>

            <div
              v-for="(log, index) in syncStatus.logs"
              :key="index"
              class="log-entry py-0.5 md:py-1 border-b border-gray-800 last:border-b-0"
            >
              <span class="text-gray-500 mr-2 md:mr-3 select-none text-xs">{{ log.time }}</span>
              <span
                :class="{
                  'text-[#4fc1ff]': log.type === 'info',
                  'text-[#4ec9b0]': log.type === 'success',
                  'text-[#dcdcaa]': log.type === 'warning',
                  'text-[#f48771]': log.type === 'error',
                }"
              >
                {{ log.message }}
              </span>
            </div>

            <!-- 滚动指示器 -->
            <div
              v-if="syncStatus.logs.length > 0"
              class="text-center text-gray-500 text-xs mt-1 md:mt-2 italic"
            >
              {{ syncStatus.logs.length }} 条日志，滚动到底部查看最新日志
            </div>
          </div>
        </UCard>

        <!-- 同步完成后的总结 -->
        <div v-if="syncCompleted" class="space-y-3">
          <UCard>
            <template #header>
              <h4 class="text-sm md:text-base font-medium">同步总结</h4>
            </template>
            <div class="space-y-3">
              <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div class="text-center p-3 bg-green-50 rounded-lg">
                  <p class="text-2xl md:text-3xl font-bold text-green-600">
                    {{ syncStatus.successCount }}
                  </p>
                  <p class="text-xs md:text-sm text-gray-600 mt-1">成功上传</p>
                </div>
                <div class="text-center p-3 bg-blue-50 rounded-lg">
                  <p class="text-2xl md:text-3xl font-bold text-blue-600">
                    {{ syncStatus.exifCurrent }}
                  </p>
                  <p class="text-xs md:text-sm text-gray-600 mt-1">EXIF提取</p>
                </div>
                <div class="text-center p-3 bg-red-50 rounded-lg">
                  <p class="text-2xl md:text-3xl font-bold text-red-600">
                    {{ syncStatus.errorCount }}
                  </p>
                  <p class="text-xs md:text-sm text-gray-600 mt-1">处理失败</p>
                </div>
                <div class="text-center p-3 bg-purple-50 rounded-lg">
                  <p class="text-2xl md:text-3xl font-bold text-purple-600">
                    {{ syncStatus.removedCount }}
                  </p>
                  <p class="text-xs md:text-sm text-gray-600 mt-1">已从本地移除</p>
                </div>
              </div>
              <div class="text-xs md:text-sm text-gray-500">
                <p class="mb-1">• 同步时间: {{ new Date().toLocaleString('zh-CN') }}</p>
                <p class="mb-1">• 目标相册: {{ albumlValue }}</p>
                <p>• 本地剩余图片: {{ photos.length }} 张</p>
              </div>
            </div>
          </UCard>
        </div>
      </div>

      <!-- 同步前选择相册 -->
      <div v-else class="space-y-3 md:space-y-4">
        <div>
          <label class="block text-sm md:text-base font-medium text-gray-700 mb-2"
            >选择目标相册</label
          >
          <USelectMenu
            v-model="albumlValue"
            :items="albumlItems"
            :searchable="false"
            class="w-full"
            size="md"
          />
        </div>

        <UAlert
          icon="material-symbols:info-outline"
          variant="soft"
          size="md"
          title="同步信息"
          :description="`准备同步 ${selectPhotos.filter((p: any) => !p.uploaded).length} 张未上传的图片`"
        />

        <!-- 同步统计预览 - 移动端适配 -->
        <UCard :ui="{ body: { padding: isMobile ? 'p-3' : 'p-4' } }">
          <template #header>
            <h4 class="text-sm md:text-base font-medium">同步预览</h4>
          </template>
          <div class="space-y-2 text-xs md:text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600">总图片数</span>
              <span class="font-medium">{{ selectPhotos.length }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">未上传图片</span>
              <span class="font-medium text-blue-600">{{
                selectPhotos.filter((p: any) => !p.uploaded).length
              }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">已上传图片</span>
              <span class="font-medium text-gray-500">{{
                selectPhotos.filter((p: any) => p.uploaded).length
              }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">预计耗时</span>
              <span class="font-medium"
                >{{ Math.ceil(selectPhotos.filter((p: any) => !p.uploaded).length * 0.5) }} 秒</span
              >
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">同步后将移除</span>
              <span class="font-medium text-blue-600"
                >{{ selectPhotos.filter((p: any) => !p.uploaded).length }} 张图片</span
              >
            </div>
          </div>
        </UCard>

        <UAlert
          icon="material-symbols:warning"
          variant="soft"
          size="md"
          title="注意"
          description="同步完成后，已成功上传的图片将从本地列表中移除，您可以在服务器相册中查看这些图片。"
        />
      </div>
    </template>

    <template #footer="{ close }">
      <div class="flex items-center justify-between w-full">
        <!-- 停止按钮 - 只在处理中显示 -->
        <UButton
          v-if="syncProcessing && !syncCompleted"
          icon="material-symbols:stop-circle"
          color="red"
          variant="outline"
          size="md"
          :disabled="stopProcessing"
          @click="stopSync"
        >
          <span class="hidden md:inline">{{ stopProcessing ? '正在停止...' : '停止同步' }}</span>
          <span class="md:hidden">{{ stopProcessing ? '停止中...' : '停止' }}</span>
        </UButton>
        <div v-else></div>

        <div class="flex gap-2">
          <!-- 取消/关闭按钮 -->
          <UButton
            :label="syncCompleted ? '关闭' : '取消'"
            variant="outline"
            size="md"
            @click="closeSyncModal"
            :disabled="syncProcessing && !syncCompleted"
          />

          <!-- 开始同步按钮 - 只在未开始同步时显示 -->
          <UButton
            v-if="!syncProcessing && !syncCompleted"
            label="开始同步"
            color="primary"
            size="md"
            @click="syncFile"
            :disabled="selectPhotos.filter((p: any) => !p.uploaded).length === 0"
          />

          <!-- 处理中按钮 - 只在处理中显示 -->
          <UButton
            v-if="syncProcessing && !syncCompleted"
            label="处理中..."
            color="primary"
            size="md"
            :loading="true"
            disabled
          />

          <!-- 重新同步按钮 - 在同步完成后显示 -->
          <UButton
            v-if="syncCompleted"
            label="重新同步"
            color="primary"
            variant="outline"
            size="md"
            @click="resetSyncStatus"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>

<style scoped>
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

.console-log {
  font-family: 'Menlo', 'Monaco', 'Cascadia Code', 'Consolas', monospace;
  scroll-behavior: smooth;
}

.log-entry {
  font-family: 'Menlo', 'Monaco', 'Cascadia Code', 'Consolas', monospace;
}

/* 自定义滚动条样式 */
.console-log::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.console-log::-webkit-scrollbar-track {
  background: #2d2d2d;
  border-radius: 4px;
}

.console-log::-webkit-scrollbar-thumb {
  background: #555;
  border-radius: 4px;
}

.console-log::-webkit-scrollbar-thumb:hover {
  background: #777;
}

/* 移动端优化 */
@media (max-width: 768px) {
  .text-sm-mobile {
    font-size: 0.875rem;
  }

  .text-xs-mobile {
    font-size: 0.75rem;
  }

  .p-mobile {
    padding: 0.75rem;
  }
}

/* 触摸优化 */
@media (hover: none) and (pointer: coarse) {
  button,
  [role='button'] {
    min-height: 44px;
    min-width: 44px;
  }

  .cursor-pointer {
    cursor: default;
  }
}

/* 防止移动端缩放 */
@viewport {
  width: device-width;
  initial-scale: 1;
  maximum-scale: 1;
  user-zoom: fixed;
}
</style>
