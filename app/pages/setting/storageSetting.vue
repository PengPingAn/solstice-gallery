<template>
  <div class="p-3 md:p-6 animate-fade-in">
    <div class="max-w-7xl mx-auto">
      <!-- 页面标题和操作栏 - H5适配 -->
      <div class="mb-4 md:mb-6">
        <div class="flex flex-col gap-3">
          <div>
            <h1 class="text-xl md:text-3xl font-bold text-gray-900 dark:text-white">
              图片存储配置
            </h1>
            <p class="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">
              管理多个存储配置，并选择其中一个作为当前使用存储
            </p>
          </div>

          <div class="flex flex-col justify-end sm:flex-row gap-2">
            <UButton
              @click="testCurrentConnection"
              color="primary"
              variant="soft"
              :loading="testing"
              class="whitespace-nowrap"
              size="md"
            >
              <UIcon name="i-heroicons-wifi" class="w-4 h-4 mr-1 md:mr-2" />
              <span class="text-sm md:text-base">测试当前存储</span>
            </UButton>

            <UButton @click="openAddModal" color="primary" class="whitespace-nowrap" size="md">
              <UIcon name="i-heroicons-plus" class="w-4 h-4 mr-1 md:mr-2" />
              <span class="text-sm md:text-base">添加存储配置</span>
            </UButton>
          </div>
        </div>
      </div>

      <!-- 当前使用存储卡片 - H5适配 -->
      <div v-if="currentStorageConfig" class="mb-4 md:mb-6">
        <UCard class="p-3 md:p-4">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div class="flex items-start md:items-center space-x-3 md:space-x-4">
              <div class="p-2 md:p-3 rounded-lg bg-primary-50 flex-shrink-0 flex">
                <UIcon
                  :name="getStorageTypeIcon(currentStorageConfig.type)"
                  class="w-5 h-5 md:w-6 md:h-6 text-primary-600"
                />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
                  <h3 class="font-semibold text-sm md:text-base truncate">
                    {{ currentStorageConfig.name }}
                  </h3>
                  <UBadge variant="soft" size="xs" class="self-start md:self-center">
                    <UIcon
                      name="i-heroicons-check-circle"
                      class="w-2.5 h-2.5 md:w-3 md:h-3 mr-0.5"
                    />
                    当前使用
                  </UBadge>
                </div>
                <p class="text-xs md:text-sm text-gray-500 mt-0.5 md:mt-1 line-clamp-2">
                  {{ getStorageTypeLabel(currentStorageConfig.type) }}
                  <!-- 根据类型显示不同的信息 -->
                  <template v-if="currentStorageConfig.type === 'local'">
                    <span v-if="currentStorageConfig.settings?.path" class="block md:inline">
                      - {{ currentStorageConfig.settings.path }}
                    </span>
                  </template>
                  <template v-else-if="currentStorageConfig.type === 'aliyun-oss'">
                    <span v-if="currentStorageConfig.settings?.bucket" class="block md:inline">
                      - {{ currentStorageConfig.settings.bucket }}
                    </span>
                    <span v-if="currentStorageConfig.settings?.endpoint" class="block md:inline">
                      ({{ currentStorageConfig.settings.endpoint }})
                    </span>
                  </template>
                  <template v-else-if="currentStorageConfig.type === 'qiniu'">
                    <span v-if="currentStorageConfig.settings?.bucket" class="block md:inline">
                      - {{ currentStorageConfig.settings.bucket }}
                    </span>
                  </template>
                  <template v-else-if="currentStorageConfig.type === 's3'">
                    <span v-if="currentStorageConfig.settings?.bucket" class="block md:inline">
                      - {{ currentStorageConfig.settings.bucket }}
                    </span>
                  </template>
                  <template v-else-if="currentStorageConfig.type === 'r2'">
                    <span v-if="currentStorageConfig.settings?.bucket" class="block md:inline">
                      - {{ currentStorageConfig.settings.bucket }}
                    </span>
                  </template>
                </p>
              </div>
            </div>

            <div class="mt-2 md:mt-0 text-left md:text-right">
              <div class="flex items-center text-xs md:text-sm">
                <div class="w-2 h-2 rounded-full bg-green-500 mr-1.5 md:mr-2"></div>
                <span class="text-green-600 font-medium">运行正常</span>
              </div>
              <p class="text-xs text-gray-500 mt-0.5">最后测试: {{ formatDate(new Date()) }}</p>
            </div>
          </div>
        </UCard>
      </div>

      <!-- 存储配置表格 - H5适配 -->
      <UCard class="mb-4 md:mb-8 overflow-hidden">
        <template #header>
          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <h3 class="font-semibold text-base md:text-lg">存储配置列表</h3>
            <div class="flex flex-col md:flex-row gap-2 w-full md:w-auto">
              <UInput
                v-model="searchQuery"
                placeholder="搜索配置..."
                icon="i-heroicons-magnifying-glass"
                size="sm"
                class="w-full md:w-48"
              />
              <USelect
                v-model="typeFilter"
                :items="typeFilterOptions"
                placeholder="全部类型"
                size="sm"
                class="w-full md:w-32"
              />
            </div>
          </div>
        </template>

        <UTable
          :data="filteredStorageConfigs"
          :columns="columns"
          :loading="loading"
          :empty-state="emptyState"
          class="w-full"
        >
        </UTable>

        <!-- 分页 - H5适配 -->
        <template #footer>
          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div class="text-xs md:text-sm text-gray-500 text-center md:text-left">
              共 {{ storageConfigs.length }} 个配置，{{ filteredStorageConfigs.length }} 个匹配
            </div>
            <div class="flex items-center justify-center">
              <UPagination
                v-model="page"
                :page-count="pageCount"
                :total="filteredStorageConfigs.length"
                size="sm"
              />
            </div>
          </div>
        </template>
      </UCard>

      <!-- 存储类型说明 - H5适配 -->
      <UCard>
        <template #header>
          <h3 class="font-semibold text-base md:text-lg">存储类型说明</h3>
        </template>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
          <div v-for="type in storageTypes" :key="type.id" class="space-y-2 md:space-y-3">
            <div class="flex items-center">
              <div
                class="p-1.5 md:p-2 rounded-lg mr-2 md:mr-3 flex flex-shrink-0"
                :class="type.bgColor"
              >
                <UIcon :name="type.icon" class="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
              <h4 class="font-medium text-sm md:text-base">{{ type.label }}</h4>
            </div>
            <p class="text-xs md:text-sm text-gray-600">{{ type.description }}</p>
            <div class="text-xs text-gray-500">
              <UIcon name="i-heroicons-light-bulb" class="w-3 h-3 inline mr-1" />
              {{ type.tip }}
            </div>
          </div>
        </div>
      </UCard>
    </div>

    <!-- 添加/编辑模态框 - H5适配 -->
    <UModal
      v-model:open="showModal"
      :title="isEditing ? '编辑存储配置' : '添加存储配置'"
      :ui="{
        overlay: 'flex min-h-full items-center justify-center p-3',
      }"
    >
      <template #body>
        <div class="max-h-[70vh] p-1">
          <UForm :state="currentForm" class="space-y-4 md:space-y-6" @submit="saveStorage">
            <!-- 基础信息 -->
            <div class="space-y-3 md:space-y-4">
              <UFormField label="存储类型" required>
                <USelect
                  v-model="currentForm.type"
                  :items="storageTypeOptions"
                  placeholder="选择存储类型"
                  size="md"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="配置名称" required>
                <UInput
                  v-model="currentForm.name"
                  placeholder="例如: 阿里云OSS-生产环境"
                  size="md"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="设为默认存储">
                <UToggle v-model="currentForm.is_default" size="sm" />
              </UFormField>

              <p class="text-xs md:text-sm text-gray-500">
                {{ getStorageTypeDesc(currentForm.type) }}
              </p>
            </div>

            <!-- 本地存储配置 -->
            <div
              v-if="currentForm.type === 'local'"
              class="space-y-3 md:space-y-4 pt-3 md:pt-4 border-t border-gray-200"
            >
              <UFormField label="存储路径" required>
                <UInput
                  v-model="currentForm.config.path"
                  placeholder="/var/www/uploads/images"
                  size="md"
                  class="w-full"
                />
                <template #help>
                  <span class="text-xs text-gray-500">服务器上存储图片的目录路径</span>
                </template>
              </UFormField>

              <UFormField label="访问URL">
                <UInput
                  v-model="currentForm.config.baseUrl"
                  placeholder="http://localhost:3000/uploads"
                  size="md"
                  class="w-full"
                />
                <template #help>
                  <span class="text-xs text-gray-500">图片访问的基础URL</span>
                </template>
              </UFormField>

              <div class="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
                <UFormField label="最大文件大小 (MB)">
                  <UInput
                    v-model.number="currentForm.config.maxSize"
                    type="number"
                    placeholder="10"
                    size="md"
                  />
                </UFormField>

                <UFormField label="允许的文件类型">
                  <USelect
                    v-model="currentForm.config.allowedTypes"
                    :items="fileTypeOptions"
                    multiple
                    placeholder="选择文件类型"
                    size="md"
                    class="w-full"
                  />
                </UFormField>
              </div>
            </div>

            <!-- 阿里云OSS存储配置 -->
            <div
              v-else-if="currentForm.type === 'aliyun-oss'"
              class="space-y-3 md:space-y-4 pt-3 md:pt-4 border-t border-gray-200"
            >
              <UFormField label="Bucket 名称" required>
                <UInput
                  class="w-full"
                  v-model="currentForm.config.bucket"
                  placeholder="my-image-bucket"
                  size="md"
                />
              </UFormField>

              <UFormField label="AccessKey ID" required>
                <UInput
                  v-model="currentForm.config.accessKeyId"
                  type="password"
                  placeholder="您的AccessKeyId"
                  size="md"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="AccessKey Secret" required>
                <UInput
                  v-model="currentForm.config.accessKeySecret"
                  type="password"
                  placeholder="您的AccessKeySecret"
                  size="md"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Endpoint" required>
                <UInput
                  v-model="currentForm.config.endpoint"
                  placeholder="https://oss-cn-hangzhou.aliyuncs.com"
                  size="md"
                  class="w-full"
                />
                <template #help>
                  <span class="text-xs text-gray-500"
                    >例如：https://oss-cn-hangzhou.aliyuncs.com</span
                  >
                </template>
              </UFormField>
            </div>

            <!-- 七牛云存储配置 -->
            <div
              v-else-if="currentForm.type === 'qiniu'"
              class="space-y-3 md:space-y-4 pt-3 md:pt-4 border-t border-gray-200"
            >
              <UFormField label="空间名称 (Bucket)" required>
                <UInput
                  v-model="currentForm.config.bucket"
                  placeholder="my-qiniu-bucket"
                  size="md"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Access Key" required>
                <UInput
                  v-model="currentForm.config.accessKey"
                  type="password"
                  placeholder="您的AccessKey"
                  size="md"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Secret Key" required>
                <UInput
                  v-model="currentForm.config.secretKey"
                  type="password"
                  placeholder="您的SecretKey"
                  size="md"
                  class="w-full"
                />
              </UFormField>

              <div class="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
                <UFormField label="存储区域">
                  <USelect
                    v-model="currentForm.config.zone"
                    :items="qiniuZoneOptions"
                    placeholder="选择存储区域"
                    size="md"
                    class="w-full"
                  />
                </UFormField>

                <UFormField label="外链域名" required>
                  <UInput
                    v-model="currentForm.config.domain"
                    placeholder="https://example.bkt.clouddn.com"
                    size="md"
                    class="w-full"
                  />
                </UFormField>
              </div>
            </div>

            <!-- AWS S3存储配置 -->
            <div
              v-else-if="currentForm.type === 's3'"
              class="space-y-3 md:space-y-4 pt-3 md:pt-4 border-t border-gray-200"
            >
              <div class="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
                <UFormField label="Bucket 名称" required>
                  <UInput
                    v-model="currentForm.config.bucket"
                    placeholder="my-s3-bucket"
                    size="md"
                  />
                </UFormField>

                <UFormField label="区域" required>
                  <UInput v-model="currentForm.config.region" placeholder="us-east-1" size="md" />
                  <template #help>
                    <span class="text-xs text-gray-500">例如: us-east-1, ap-northeast-1</span>
                  </template>
                </UFormField>
              </div>

              <UFormField label="Access Key ID" required>
                <UInput
                  v-model="currentForm.config.accessKeyId"
                  type="password"
                  placeholder="您的AccessKeyId"
                  size="md"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Secret Access Key" required>
                <UInput
                  v-model="currentForm.config.secretAccessKey"
                  type="password"
                  placeholder="您的SecretAccessKey"
                  size="md"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="自定义端点 (可选)">
                <UInput
                  v-model="currentForm.config.endpoint"
                  placeholder="https://s3.amazonaws.com"
                  size="md"
                  class="w-full"
                />
                <template #help>
                  <span class="text-xs text-gray-500">用于兼容S3协议的其他服务</span>
                </template>
              </UFormField>
            </div>

            <!-- Cloudflare R2存储配置 -->
            <div
              v-else-if="currentForm.type === 'r2'"
              class="space-y-3 md:space-y-4 pt-3 md:pt-4 border-t border-gray-200"
            >
              <UFormField label="Bucket 名称" required>
                <UInput
                  v-model="currentForm.config.bucket"
                  placeholder="my-r2-bucket"
                  size="md"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="账户 ID" required>
                <UInput
                  v-model="currentForm.config.accountId"
                  placeholder="您的Cloudflare账户ID"
                  size="md"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Access Key ID" required>
                <UInput
                  v-model="currentForm.config.accessKeyId"
                  type="password"
                  placeholder="您的AccessKeyId"
                  size="md"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Secret Access Key" required>
                <UInput
                  v-model="currentForm.config.secretAccessKey"
                  type="password"
                  placeholder="您的SecretAccessKey"
                  size="md"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="公开访问URL (可选)">
                <UInput
                  v-model="currentForm.config.publicUrl"
                  placeholder="https://pub.example.com"
                  size="md"
                  class="w-full"
                />
                <template #help>
                  <span class="text-xs text-gray-500">R2文件的公开访问URL</span>
                </template>
              </UFormField>
            </div>
          </UForm>
        </div>
      </template>
      <template #footer>
        <!-- 表单操作按钮 -->
        <div class="w-full flex gap-2 justify-end">
          <UButton variant="outline" @click="closeModal" :disabled="saving"> 取消 </UButton>
          <UButton type="submit" :loading="saving" @click="saveStorage">
            {{ isEditing ? '更新配置' : '添加配置' }}
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- 通知 -->
    <UNotifications />
  </div>
</template>
<script lang="ts" setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useConfirmDialog } from '~/composables/useConfirmDialog'

const { confirmDialog } = useConfirmDialog()

definePageMeta({
  layout: 'dashboard',
  alias: '/storageSetting',
  requiresAuth: true,
})

// 存储类型定义
const storageTypes = [
  {
    id: 'local',
    label: '本地存储',
    icon: 'i-heroicons-server-stack',
    description: '将图片存储在您的服务器上',
    bgColor: 'bg-blue-500',
    tip: '适合小型应用，无需额外费用',
  },
  {
    id: 'aliyun-oss',
    label: '阿里云 OSS',
    icon: 'i-heroicons-cloud',
    description: '阿里云对象存储服务',
    bgColor: 'bg-orange-500',
    tip: '适合中大型应用，提供CDN加速',
  },
  {
    id: 'qiniu',
    label: '七牛云',
    icon: 'i-heroicons-cloud-arrow-up',
    description: '七牛云对象存储',
    bgColor: 'bg-blue-400',
    tip: '专注媒体存储，提供图片处理功能',
  },
  {
    id: 's3',
    label: 'AWS S3',
    icon: 'i-simple-icons-amazons3',
    description: '亚马逊云对象存储',
    bgColor: 'bg-yellow-500',
    tip: '全球可用，功能完善',
  },
  {
    id: 'r2',
    label: 'Cloudflare R2',
    icon: 'i-simple-icons-cloudflare',
    description: 'Cloudflare对象存储',
    bgColor: 'bg-orange-400',
    tip: '零出口费用，全球网络',
  },
]

// 表格列定义
const columns = [
  {
    accessorKey: 'id',
    header: '#ID',
    cell: ({ row }) => `#${row.getValue('id')}`,
  },
  {
    accessorKey: 'name',
    header: '存储名称',
    cell: ({ row }) => `${row.getValue('name')}`,
  },
  {
    accessorKey: 'type',
    header: '存储类型',
    cell: ({ row }) => `${row.getValue('type')}`,
  },
  {
    accessorKey: 'isCurrent',
    header: '当前存储',
    cell: ({ row }) => {
      const isCurrent = row.getValue('isCurrent')
      const color = isCurrent ? 'success' : 'error'

      return h(UBadge, { class: 'capitalize', variant: 'subtle', color }, () =>
        isCurrent == true ? '使用中' : '未使用'
      )
    },
  },
  {
    accessorKey: 'actions',
    header: '操作',
    meta: {
      class: {
        th: 'w-[180px]',
        td: 'w-[180px]',
      },
    },
    cell: (cell) => {
      const data = {
        id: cell.row.getValue('id'),
        name: cell.row.getValue('name'),
        isCurrent: cell.row.getValue('isCurrent'),
        type: cell.row.getValue('type'),
        config: cell.row.getValue('settings'),
      }

      // 创建修改按钮（两种情况都会用到）
      const editButton = h(
        UButton,
        {
          size: 'sm',
          variant: 'soft',
          color: 'neutral',
          icon: 'material-symbols:edit-document-outline',
          onClick: () => {
            openEditModal(data.id)
          },
        },
        { default: () => '修改' }
      )

      // 如果是当前存储，只显示修改按钮
      if (data.isCurrent === true) {
        return h('div', { class: 'flex items-center gap-2' }, [editButton])
      }

      // 否则显示所有按钮
      return h('div', { class: 'flex items-center gap-2' }, [
        h(
          UButton,
          {
            size: 'sm',
            variant: 'soft',
            color: 'error',
            icon: 'tabler:trash',
            onClick: () => {
              confirmDialog({
                title: '确认删除',
                content: `确定要删除存储 ${data.name} 吗？`,
                confirmColor: 'error',
                onConfirm: () => onStorageDelete(data.id),
              })
            },
          },
          { default: () => '删除' }
        ),
        h(
          UButton,
          {
            size: 'sm',
            variant: 'soft',
            color: 'info',
            icon: 'lets-icons:vertical-switch-long-light',
            onClick: () => {
              confirmDialog({
                title: '切换存储',
                content: `确定要切换 ${data.name} 存储吗？`,
                confirmColor: 'info',
                onConfirm: () => editStorageDefault(data.id),
              })
            },
          },
          { default: () => '切换存储' }
        ),
        editButton,
      ])
    },
  },
]

const onStorageDelete = async (storageId: number) => {
  try {
    await $fetch(`/api/storages/${storageId}`, {
      method: 'DELETE',
    })

    await loadStorages()
    useToast().add({
      title: '存储方案已删除',
      color: 'success',
    })
  } catch (error) {
    useToast().add({
      title: '删除存储方案失败',
      description: (error as Error).message,
      color: 'error',
    })
  }
}
const editStorageDefault = async (storageId: number) => {
  try {
    await $fetch(`/api/storages/${storageId}`, {
      method: 'PUT',
      body: {
        is_default: true,
      },
    })

    await loadStorages()
    useToast().add({
      title: '存储方案已更新',
      color: 'success',
    })
  } catch (error) {
    useToast().add({
      title: '更新存储方案失败',
      description: (error as Error).message,
      color: 'error',
    })
  }
}

// 响应式数据
const loading = ref(false)
const saving = ref(false)
const testing = ref(false)

// 模态框状态
const showModal = ref(false)
const showDeleteModal = ref(false)
const isEditing = ref(false)
const configToDelete = ref(null)

// 搜索和筛选
const searchQuery = ref('')
const typeFilter = ref('all')
const page = ref(1)
const pageCount = ref(10)

// 存储配置数据
const storageConfigs = ref([])

// 当前表单数据
const currentForm = reactive({
  id: null,
  name: '',
  type: 'local',
  is_default: false,
  config: {},
})

// 七牛云区域选项
const qiniuZoneOptions = [
  { label: '华东', value: 'z0' },
  { label: '华北', value: 'z1' },
  { label: '华南', value: 'z2' },
  { label: '北美', value: 'na0' },
  { label: '东南亚', value: 'as0' },
]

// 文件类型选项
const fileTypeOptions = [
  { label: 'JPEG (.jpg, .jpeg)', value: 'jpg' },
  { label: 'PNG (.png)', value: 'png' },
  { label: 'GIF (.gif)', value: 'gif' },
  { label: 'WebP (.webp)', value: 'webp' },
  { label: 'SVG (.svg)', value: 'svg' },
]

// 类型筛选选项
const typeFilterOptions = computed(() => {
  return [
    { label: '全部类型', value: 'all' },
    ...storageTypes.map((type) => ({ label: type.label, value: type.id })),
  ]
})

// 存储类型选项（用于下拉框）
const storageTypeOptions = computed(() => {
  return storageTypes.map((type) => ({
    label: type.label,
    value: type.id,
    disabled: false,
  }))
})

// 空状态
const emptyState = {
  icon: 'i-heroicons-circle-stack',
  label: '暂无存储配置',
  description: '点击"添加存储配置"按钮创建您的第一个存储配置',
}

// 当前使用的存储配置
const currentStorageConfig = computed(() => {
  return storageConfigs.value.find((config: any) => config.isCurrent)
})

// 筛选后的存储配置
const filteredStorageConfigs = computed(() => {
  let filtered = [...storageConfigs.value]

  // 搜索筛选
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      (config: any) =>
        config.name.toLowerCase().includes(query) ||
        getStorageTypeLabel(config.type).toLowerCase().includes(query)
    )
  }

  // 类型筛选
  if (typeFilter.value !== 'all') {
    filtered = filtered.filter((config: any) => config.type === typeFilter.value)
  }
  return filtered
})

// 获取存储类型标签
const getStorageTypeLabel = (type: any) => {
  const found = storageTypes.find((t: any) => t.id === type)
  return found ? found.label : '未知类型'
}

// 获取存储类型描述
const getStorageTypeDesc = (type: any) => {
  const found = storageTypes.find((t: any) => t.id === type)
  return found ? found.description : ''
}

// 获取存储类型图标
const getStorageTypeIcon = (type: any) => {
  const found = storageTypes.find((t) => t.id === type)
  return found ? found.icon : 'i-heroicons-question-mark'
}

// 获取存储类型颜色
const getStorageTypeColor = (type: any) => {
  const found = storageTypes.find((t: any) => t.id === type)
  return found ? found.bgColor : 'bg-gray-500'
}

// 格式化日期
const formatDate = (dateString: any) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 加载存储配置
async function loadStorages() {
  loading.value = true
  try {
    const data: any = await $fetch('/api/storages/list')
    // 转换后端数据为前端格式
    storageConfigs.value = data.map((config: any) => ({
      id: config.id,
      name: config.name,
      type: config.type,
      isCurrent: config.isCurrent,
      createdAt: config.created_at,
      settings: config.config,
    }))
  } catch (error) {
    console.error('加载存储配置失败:', error)
    useToast().add({
      title: '加载失败',
      description: '无法加载存储配置，请检查网络连接',
      icon: 'i-heroicons-exclamation-triangle',
      color: 'error',
    })
  } finally {
    loading.value = false
  }
}

// 打开添加模态框
const openAddModal = () => {
  isEditing.value = false

  // 重置表单
  Object.assign(currentForm, {
    id: null,
    name: '',
    type: 'local',
    is_default: false,
    config: {},
  })

  // 根据当前存储类型数量自动命名
  const localCount = storageConfigs.value.filter((c) => c.type === 'local').length
  const ossCount = storageConfigs.value.filter((c) => c.type === 'aliyun-oss').length
  const qiniuCount = storageConfigs.value.filter((c) => c.type === 'qiniu').length

  if (currentForm.type === 'local') {
    currentForm.name = `本地存储-${localCount + 1}`
  } else if (currentForm.type === 'aliyun-oss') {
    currentForm.name = `阿里云OSS-${ossCount + 1}`
  } else if (currentForm.type === 'qiniu') {
    currentForm.name = `七牛云-${qiniuCount + 1}`
  } else if (currentForm.type === 's3') {
    currentForm.name = `AWS S3-${storageConfigs.value.filter((c) => c.type === 's3').length + 1}`
  } else if (currentForm.type === 'r2') {
    currentForm.name = `Cloudflare R2-${
      storageConfigs.value.filter((c) => c.type === 'r2').length + 1
    }`
  }

  // 初始化默认配置
  initDefaultConfig()
  showModal.value = true
}

// 初始化默认配置
function initDefaultConfig() {
  const config = currentForm.config

  switch (currentForm.type) {
    case 'local':
      Object.assign(config, {
        path: '',
        baseUrl: '',
        maxSize: 10,
        allowedTypes: ['jpg', 'png', 'gif'],
      })
      break
    case 'aliyun-oss':
      Object.assign(config, {
        bucket: '',
        accessKeyId: '',
        accessKeySecret: '',
        endpoint: '',
      })
      break
    case 'qiniu':
      Object.assign(config, {
        bucket: '',
        accessKey: '',
        secretKey: '',
        zone: 'z0',
        domain: '',
      })
      break
    case 's3':
      Object.assign(config, {
        bucket: '',
        region: '',
        accessKeyId: '',
        secretAccessKey: '',
        endpoint: '',
      })
      break
    case 'r2':
      Object.assign(config, {
        bucket: '',
        accountId: '',
        accessKeyId: '',
        secretAccessKey: '',
        publicUrl: '',
      })
      break
  }
}

// 监听类型变化，重新初始化配置
watch(
  () => currentForm.type,
  () => {
    if (!isEditing.value) {
      currentForm.config = {}
      initDefaultConfig()
    }
  }
)

// 打开编辑模态框
const openEditModal = (id) => {
  const config = filteredStorageConfigs.value.find((map) => map.id == id)
  isEditing.value = true
  // 复制配置到表单
  Object.assign(currentForm, {
    id: config.id,
    name: config.name,
    type: config.type,
    is_default: config.isCurrent,
    config: { ...config.settings },
  })

  showModal.value = true
}

// 关闭模态框
const closeModal = () => {
  showModal.value = false
}

// 保存存储配置
const saveStorage = async () => {
  saving.value = true
  try {
    const data = {
      name: currentForm.name,
      type: currentForm.type,
      is_default: currentForm.is_default,
      config: currentForm.config,
    }

    if (isEditing.value) {
      // 更新现有配置
      await $fetch(`/api/storages/${currentForm.id}`, {
        method: 'PUT',
        body: data,
      })

      // 更新本地数据
      const index = storageConfigs.value.findIndex((c) => c.id === currentForm.id)
      if (index !== -1) {
        storageConfigs.value[index] = {
          ...storageConfigs.value[index],
          name: currentForm.name,
          type: currentForm.type,
          isCurrent: currentForm.is_default,
          settings: currentForm.config,
        }
      }

      useToast().add({
        title: '更新成功',
        description: `已更新存储配置: ${currentForm.name}`,
        icon: 'i-heroicons-check-circle',
        color: 'success',
      })
    } else {
      // 添加新配置
      const result = await $fetch('/api/storages/create', {
        method: 'POST',
        body: data,
      })

      // 获取新创建的配置（重新加载所有数据）
      await loadStorages()

      useToast().add({
        title: '添加成功',
        description: `已添加新的存储配置: ${currentForm.name}`,
        icon: 'i-heroicons-check-circle',
        color: 'success',
      })
    }

    closeModal()
  } catch (error) {
    console.error('保存失败:', error)
    useToast().add({
      title: '保存失败',
      description: error.data?.message || '保存存储配置时发生错误',
      icon: 'i-heroicons-exclamation-triangle',
      color: 'error',
    })
  } finally {
    saving.value = false
  }
}

// 测试当前存储连接
const testCurrentConnection = async () => {
  if (!currentStorageConfig.value) {
    useToast().add({
      title: '测试失败',
      description: '请先设置一个当前存储配置',
      icon: 'i-heroicons-exclamation-triangle',
      color: 'error',
    })
    return
  }

  testing.value = true
  try {
    const result = await $fetch(`/api/storages/${currentStorageConfig.value.id}/test`, {
      method: 'POST',
    })

    useToast().add({
      title: result.success ? '连接成功' : '连接失败',
      description: result.message,
      icon: result.success ? 'i-heroicons-check-circle' : 'i-heroicons-exclamation-triangle',
      color: result.success ? 'green' : 'red',
    })
  } catch (error) {
    console.error('测试失败:', error)
    useToast().add({
      title: '测试失败',
      description: '无法连接到存储服务',
      icon: 'i-heroicons-exclamation-triangle',
      color: 'error',
    })
  } finally {
    testing.value = false
  }
}

// 组件挂载时加载数据
onMounted(() => {
  loadStorages()
})
</script>

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

/* 添加一些微妙的动画效果 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
