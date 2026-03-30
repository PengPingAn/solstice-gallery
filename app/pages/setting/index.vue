<!-- pages/dashboard/settings.vue -->
<script setup lang="ts">
import { nextTick, onMounted, reactive, ref } from 'vue'

// 定义设置数据接口
interface SiteSettings {
  general: {
    siteName: string
    siteTheme: string
  }
  user: {
    headUrl: string
    tags: Array<{ id: number; text: string }>
    address: Array<{ id: number; platform: string; url: string }>
  }
}

definePageMeta({
  layout: 'dashboard',
  alias: '/settings',
  requiresAuth: true,
})

// 状态管理
const isLoading = ref(false)
const isSaving = ref(false)
const activeTab = ref('general') // 使用字符串值
const tagInputVisible = ref(false)
const newTag = ref('')
const newAddressPlatform = ref('')
const newAddressUrl = ref('')
const addressInputVisible = ref(false)
const tagInputRef = ref<HTMLInputElement | null>(null)
const addressPlatformRef = ref<HTMLInputElement | null>(null)

// 主题选项
const themeItems = ref([
  { label: '深色', value: 'dark' },
  { label: '浅色', value: 'light' },
  { label: '跟随系统', value: 'system' },
])

// 平台图标映射
const platformIcons: Record<string, string> = {
  GitHub: 'i-simple-icons-github',
  X: 'i-simple-icons-x',
  Twitter: 'i-simple-icons-x',
  Instagram: 'i-simple-icons-instagram',
  Facebook: 'i-simple-icons-facebook',
  LinkedIn: 'i-simple-icons-linkedin',
  YouTube: 'i-simple-icons-youtube',
  Email: 'i-heroicons-envelope',
  Website: 'i-heroicons-globe-alt',
  Medium: 'i-simple-icons-medium',
  'Dev.to': 'i-simple-icons-devdotto',
  'Stack Overflow': 'i-simple-icons-stackoverflow',
  Discord: 'i-simple-icons-discord',
  Telegram: 'i-simple-icons-telegram',
  Reddit: 'i-simple-icons-reddit',
}

// 标签图标
const tagIcon = 'i-heroicons-tag'

// 默认设置数据
const settings = reactive<SiteSettings>({
  general: {
    siteName: 'SNAPSTORY',
    siteTheme: 'dark',
  },
  user: {
    headUrl: 'https://api.dicebear.com/7.x/notionists/svg?seed=Innei',
    tags: [
      { id: 1, text: 'PHOTOGRAPHY' },
      { id: 2, text: 'DEVELOPER' },
      { id: 3, text: 'DESIGNER' },
    ],
    address: [
      { id: 1, platform: 'GitHub', url: 'https://github.com/username' },
      { id: 2, platform: 'X', url: 'https://x.com/username' },
    ],
  },
})

// 模拟从API加载设置
const loadSettings = async () => {
  isLoading.value = true
  try {
    await new Promise((resolve) => setTimeout(resolve, 500))
    console.log('设置已加载')
  } catch (error) {
    console.error('加载设置失败:', error)
    useToast().add({
      title: '加载失败',
      description: '无法加载设置，请稍后重试',
      icon: 'i-heroicons-exclamation-circle',
      color: 'red',
    })
  } finally {
    isLoading.value = false
  }
}

// 保存设置
const saveSettings = async () => {
  isSaving.value = true
  try {
    await new Promise((resolve) => setTimeout(resolve, 800))

    useToast().add({
      title: '保存成功',
      description: '设置已成功保存',
      icon: 'i-heroicons-check-circle',
      color: 'green',
    })
  } catch (error) {
    console.error('保存设置失败:', error)
    useToast().add({
      title: '保存失败',
      description: '无法保存设置，请稍后重试',
      icon: 'i-heroicons-exclamation-circle',
      color: 'red',
    })
  } finally {
    isSaving.value = false
  }
}

// 标签相关操作
const showTagInput = () => {
  tagInputVisible.value = true
  nextTick(() => {
    tagInputRef.value?.focus()
  })
}

const addTag = () => {
  if (newTag.value.trim()) {
    const newId = Math.max(...settings.user.tags.map((t) => t.id), 0) + 1
    settings.user.tags.push({
      id: newId,
      text: newTag.value.trim(),
    })
    newTag.value = ''
  }
  tagInputVisible.value = false
}

const removeTag = (id: number) => {
  const index = settings.user.tags.findIndex((tag) => tag.id === id)
  if (index !== -1) {
    settings.user.tags.splice(index, 1)
  }
}

const handleTagKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    addTag()
  } else if (e.key === 'Escape') {
    tagInputVisible.value = false
    newTag.value = ''
  }
}

// 地址相关操作
const showAddressInput = () => {
  addressInputVisible.value = true
  nextTick(() => {
    addressPlatformRef.value?.focus()
  })
}

const addAddress = () => {
  if (newAddressPlatform.value.trim() && newAddressUrl.value.trim()) {
    const newId = Math.max(...settings.user.address.map((a) => a.id), 0) + 1
    settings.user.address.push({
      id: newId,
      platform: newAddressPlatform.value.trim(),
      url: newAddressUrl.value.trim(),
    })
    newAddressPlatform.value = ''
    newAddressUrl.value = ''
  }
  addressInputVisible.value = false
}

const removeAddress = (id: number) => {
  const index = settings.user.address.findIndex((addr) => addr.id === id)
  if (index !== -1) {
    settings.user.address.splice(index, 1)
  }
}

const handleAddressKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && e.target === addressPlatformRef.value) {
    // 如果当前焦点在平台输入框，按回车跳到URL输入框
    nextTick(() => {
      document.querySelector<HTMLInputElement>('input[name="newAddressUrl"]')?.focus()
    })
  }
}

// 获取平台图标
const getPlatformIcon = (platform: string) => {
  return platformIcons[platform] || 'i-heroicons-link'
}

// 页面加载时获取设置
onMounted(() => {
  loadSettings()
})
</script>

<template>
  <div class="p-4 md:p-6 flex gap-6 flex-col animate-fade-in">
    <!-- 页面标题区域 -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">网站设置</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">在这里可以设置你的网站信息</p>
      </div>
      <UButton
        :loading="isSaving"
        icon="i-heroicons-arrow-down-tray"
        @click="saveSettings"
        class="shrink-0"
      >
        保存所有设置
      </UButton>
    </div>

    <!-- 常规设置 -->
    <UCard class="animate-fade-in">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-cog-6-tooth" class="w-5 h-5 text-primary-600" />
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">常规设置</h2>
        </div>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">设置网站的基本信息</p>
      </template>

      <div class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <UFormField label="网站名称" required>
            <UInput
              v-model="settings.general.siteName"
              class="w-full"
              placeholder="输入网站名称"
              size="lg"
              :ui="{ base: 'focus:ring-2 focus:ring-primary-500' }"
            />
            <template #help> 这将是您网站显示的名称 </template>
          </UFormField>

          <UFormField label="默认主题" required>
            <!-- <USelect
              v-model="settings.general.siteTheme"
              :items="themeItems"
              option-attribute="label"
              value-attribute="value"
              placeholder="选择主题"
              size="lg"
            >
              <template #option="{ option }">
                <span>{{ option.label }}</span>
              </template>
            </USelect> -->
            <UTabs
              :content="false"
              :defaultValue="themeItems[0].value"
              :items="themeItems"
              class="w-full"
            />
            <template #help> 选择网站默认显示的主题 </template>
          </UFormField>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end">
          <UButton
            :loading="isSaving"
            icon="i-heroicons-check-circle"
            @click="saveSettings"
            class="px-6"
          >
            保存常规设置
          </UButton>
        </div>
      </template>
    </UCard>

    <!-- 用户信息设置 -->
    <UCard class="animate-fade-in">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-user-circle" class="w-5 h-5 text-primary-600" />
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">用户信息设置</h2>
        </div>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">设置网站用户相关的信息</p>
      </template>

      <div class="space-y-8">
        <!-- 头像设置 -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <UFormField label="头像链接" required>
            <UInput
              v-model="settings.user.headUrl"
              class="w-full"
              placeholder="https://example.com/avatar.jpg"
              size="lg"
              :ui="{ base: 'focus:ring-2 focus:ring-primary-500' }"
            />
            <template #help> 这将是您网站显示的头像 </template>
          </UFormField>

          <!-- 头像预览 -->
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">头像预览</label>
            <div class="flex items-center gap-4">
              <div
                class="w-20 h-20 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600"
              >
                <img
                  v-if="settings.user.headUrl"
                  :src="settings.user.headUrl"
                  alt="Avatar Preview"
                  class="w-full h-full object-cover"
                />
                <div v-else class="w-full h-full flex items-center justify-center">
                  <UIcon name="i-heroicons-user" class="w-10 h-10 text-gray-400" />
                </div>
              </div>
              <div class="text-sm text-gray-500 dark:text-gray-400">头像将在保存后更新</div>
            </div>
          </div>
        </div>

        <!-- 标签设置 -->
        <div>
          <UFormField label="个人标签" required>
            <div class="flex flex-wrap gap-2 mt-1">
              <!-- 现有标签 -->
              <Tag
                v-for="tag in settings.user.tags"
                :key="tag.id"
                size="lg"
                color="primary"
                variant="subtle"
                :ui="{ rounded: 'rounded-full' }"
                class="group cursor-pointer transition-all hover:scale-105"
                closable
                @close="removeTag(tag.id)"
              >
                <!-- <div class="flex items-center gap-1.5">
                  <UIcon :name="tagIcon" class="w-4 h-4" />
                  <span>{{ tag.text }}</span>
                  <UIcon
                    name="i-heroicons-x-mark"
                    class="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    @click="removeTag(tag.id)"
                  />
                </div> -->
                <span class="text-sm">{{ tag.text }}</span>
              </Tag>

              <!-- 添加新标签按钮 -->
              <UButton
                v-if="!tagInputVisible"
                icon="i-heroicons-plus"
                variant="outline"
                size="lg"
                :ui="{ rounded: 'rounded-full' }"
                @click="showTagInput"
                class="transition-all hover:scale-105 mt-2"
              >
                添加标签
              </UButton>

              <!-- 标签输入框 -->
              <div v-else class="relative">
                <UInput
                  ref="tagInputRef"
                  class="mt-2"
                  v-model="newTag"
                  placeholder="输入标签后按回车添加"
                  size="lg"
                  autofocus
                  @keydown="handleTagKeydown"
                  @blur="addTag"
                  :ui="{
                    base: 'w-48 pr-8 focus:ring-2 focus:ring-primary-500',
                    rounded: 'rounded-full',
                  }"
                />
                <UIcon
                  name="i-heroicons-check-circle"
                  class="absolute right-2 mt-1 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-500 cursor-pointer"
                  @click="addTag"
                />
              </div>
            </div>
            <template #help> 添加描述您个人或兴趣的标签 </template>
          </UFormField>
        </div>

        <!-- 联系方式设置 -->
        <div>
          <UFormField label="联系方式" required>
            <div class="space-y-3 mt-1">
              <!-- 现有联系方式 -->
              <div
                v-for="address in settings.user.address"
                :key="address.id"
                class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 group hover:border-primary-300 dark:hover:border-primary-600 transition-colors"
              >
                <div class="flex items-center gap-3">
                  <div class="p-2 bg-white dark:bg-gray-700 rounded-lg">
                    <UIcon
                      :name="getPlatformIcon(address.platform)"
                      class="w-5 h-5 text-gray-700 dark:text-gray-300"
                    />
                  </div>
                  <div>
                    <div class="font-medium text-gray-900 dark:text-white">
                      {{ address.platform }}
                    </div>
                    <div class="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                      {{ address.url }}
                    </div>
                  </div>
                </div>
                <UButton
                  icon="i-heroicons-trash"
                  variant="ghost"
                  size="sm"
                  @click="removeAddress(address.id)"
                  class="opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </div>

              <!-- 添加新联系方式 -->
              <div
                v-if="addressInputVisible"
                class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 space-y-3"
              >
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <UInput
                    ref="addressPlatformRef"
                    v-model="newAddressPlatform"
                    placeholder="平台名称 (如: GitHub)"
                    name="newAddressPlatform"
                    @keydown="handleAddressKeydown"
                    size="lg"
                  />
                  <UInput
                    v-model="newAddressUrl"
                    placeholder="链接 (如: https://github.com/username)"
                    name="newAddressUrl"
                    @keydown="
                      (e) => {
                        if (e.key === 'Enter') addAddress()
                      }
                    "
                    size="lg"
                  />
                </div>
                <div class="flex items-center gap-2">
                  <UButton icon="i-heroicons-check-circle" color="green" @click="addAddress">
                    添加
                  </UButton>
                  <UButton
                    icon="i-heroicons-x-mark"
                    variant="ghost"
                    @click="addressInputVisible = false"
                  >
                    取消
                  </UButton>
                </div>
              </div>

              <!-- 添加按钮 -->
              <UButton
                v-else
                icon="i-heroicons-plus-circle"
                variant="outline"
                class="w-full"
                @click="showAddressInput"
              >
                添加联系方式
              </UButton>
            </div>
            <template #help> 添加您的社交媒体或其他联系方式的链接 </template>
          </UFormField>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end">
          <UButton
            :loading="isSaving"
            icon="i-heroicons-user-plus"
            @click="saveSettings"
            class="px-6"
          >
            保存用户信息
          </UButton>
        </div>
      </template>
    </UCard>
  </div>
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

/* 自定义卡片样式优化 */
:deep(.u-card) {
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.2s ease;
}

:deep(.u-card:hover) {
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

:deep(.u-card-header) {
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(229, 231, 235, 0.5);
}

:deep(.u-badge) {
  transition: all 0.2s ease;
}

:deep(.u-badge:hover) {
  transform: translateY(-1px);
}

/* 头像预览样式 */
.avatar-preview {
  transition: all 0.3s ease;
}

.avatar-preview:hover {
  transform: scale(1.05);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
}

/* 标签输入框样式 */
.tag-input-container {
  transition: all 0.2s ease;
}

.tag-input-container:focus-within {
  transform: scale(1.02);
}

/* 联系方式卡片悬停效果 */
.address-card {
  transition: all 0.2s ease;
}

.address-card:hover {
  transform: translateX(4px);
  border-color: var(--color-primary-300);
}

/* 响应式调整 */
@media (max-width: 640px) {
  :deep(.u-card) {
    border-radius: 0.5rem;
  }

  .address-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
}
</style>
