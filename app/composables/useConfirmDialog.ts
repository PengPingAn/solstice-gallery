import { ref } from 'vue'

interface ConfirmDialogOptions {
  title?: string
  content?: string
  confirmText?: string
  cancelText?: string
  confirmColor?: 'primary' | 'error' | 'neutral' | 'info'
  onConfirm?: () => void | Promise<void>
}

const open = ref(false)
const loading = ref(false)
const options = ref<ConfirmDialogOptions>({})

export function useConfirmDialog() {
  function confirmDialog(opts: ConfirmDialogOptions) {
    options.value = {
      title: opts.title ?? '',
      content: opts.content ?? '',
      confirmText: opts.confirmText ?? '嗯',
      cancelText: opts.cancelText ?? '手滑了',
      confirmColor: opts.confirmColor ?? 'primary',
      onConfirm: opts.onConfirm,
    }
    open.value = true
  }

  async function confirm(close: () => void) {
    try {
      loading.value = true
      await options.value.onConfirm?.()
      close()
    } finally {
      loading.value = false
    }
  }

  return {
    open,
    loading,
    options,
    confirmDialog,
    confirm,
  }
}
