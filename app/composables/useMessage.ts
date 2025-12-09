import { createApp, h, reactive, watchEffect } from "vue";
import Message from "~/components/MessageContainer.vue";
import type { App } from "vue";

interface MessageOptions {
  text: string;
  messageType?: "success" | "info" | "warning" | "error" | "glass";
  duration?: number;
}

interface MessageItem {
  id: number;
  text: string;
  messageType: "success" | "info" | "warning" | "error" | "glass";
  duration?: number;
  top: number;
  visible: boolean;
  element?: HTMLDivElement;
  app?: App<Element>;
}

class MessageManager {
  private messages = reactive<MessageItem[]>([]);
  private container: HTMLDivElement | null = null;
  private idCounter = 0;
  private MESSAGE_HEIGHT = 70; // 消息高度（包括间距）

  constructor() {
    this.initContainer();
  }

  private initContainer() {
    if (process.server) return;

    if (!this.container) {
      this.container = document.createElement("div");
      this.container.id = "message-container";
      this.container.style.position = "fixed";
      this.container.style.top = "0";
      this.container.style.left = "0";
      this.container.style.right = "0";
      this.container.style.pointerEvents = "none";
      this.container.style.zIndex = "9999";
      document.body.appendChild(this.container);
    }
  }

  public show(options: string | MessageOptions) {
    if (process.server) return null;

    const props = typeof options === "string" ? { text: options } : options;
    const id = ++this.idCounter;

    // 创建消息项
    const messageItem: MessageItem = {
      id,
      text: props.text,
      messageType: props.messageType || "info",
      duration: props.duration || 3000,
      top: 32 + this.messages.length * this.MESSAGE_HEIGHT,
      visible: true,
    };

    this.messages.push(messageItem);

    // 创建消息元素
    const messageDiv = document.createElement("div");
    messageDiv.style.pointerEvents = "auto";
    messageDiv.style.transition = "top 0.3s ease";

    if (this.container) {
      this.container.appendChild(messageDiv);
    }

    messageItem.element = messageDiv;

    // 创建 Vue 应用
    const app = createApp({
      setup() {
        const onDestroy = () => {
          // 从数组中移除
          const index = manager.messages.findIndex((m) => m.id === id);
          if (index !== -1) {
            manager.messages.splice(index, 1);
          }

          // 延迟移除 DOM，确保动画完成
          setTimeout(() => {
            app.unmount();
            if (messageDiv.parentNode) {
              messageDiv.parentNode.removeChild(messageDiv);
            }
          }, 400);
        };

        return () =>
          h(Message, {
            text: messageItem.text,
            messageType: messageItem.messageType,
            duration: messageItem.duration,
            top: messageItem.top,
            onDestroy,
          });
      },
    });

    app.mount(messageDiv);
    messageItem.app = app;

    // 监听消息数组变化，更新所有消息的位置
    const manager = this;
    watchEffect(() => {
      this.updateMessagePositions();
    });

    return {
      close: () => {
        const index = this.messages.findIndex((m) => m.id === id);
        if (index !== -1) {
          this.messages.splice(index, 1);
        }
      },
    };
  }

  private updateMessagePositions() {
    // 为每个消息重新计算位置
    this.messages.forEach((msg, index) => {
      const newTop = 32 + index * this.MESSAGE_HEIGHT;

      // 更新消息的 top 值
      msg.top = newTop;

      // 如果有对应的 Vue 实例，强制更新
      if (msg.element) {
        const messageEl = msg.element.querySelector(
          ".message-item"
        ) as HTMLElement;
        if (messageEl) {
          // 使用 requestAnimationFrame 确保平滑过渡
          requestAnimationFrame(() => {
            messageEl.style.top = `${newTop}px`;
          });
        }
      }
    });
  }

  public closeAll() {
    // 从后往前关闭所有消息
    for (let i = this.messages.length - 1; i >= 0; i--) {
      this.messages[i].visible = false;
    }

    // 清空数组
    this.messages.splice(0, this.messages.length);
  }

  // 公开的方法
  public success(text: string, duration?: number) {
    return this.show({ text, messageType: "success", duration });
  }

  public info(text: string, duration?: number) {
    return this.show({ text, messageType: "info", duration });
  }

  public warning(text: string, duration?: number) {
    return this.show({ text, messageType: "warning", duration });
  }

  public error(text: string, duration?: number) {
    return this.show({ text, messageType: "error", duration });
  }

  // 新增的毛玻璃类型
  public glass(text: string, duration?: number) {
    return this.show({ text, messageType: "glass", duration });
  }
}

// 单例模式
let messageInstance: MessageManager | null = null;

export function useMessage() {
  if (!messageInstance) {
    messageInstance = new MessageManager();
  }

  return {
    success: (text: string, duration?: number) =>
      messageInstance!.success(text, duration),
    info: (text: string, duration?: number) =>
      messageInstance!.info(text, duration),
    warning: (text: string, duration?: number) =>
      messageInstance!.warning(text, duration),
    error: (text: string, duration?: number) =>
      messageInstance!.error(text, duration),
    glass: (text: string, duration?: number) =>
      messageInstance!.glass(text, duration),
    show: (options: string | MessageOptions) => messageInstance!.show(options),
    closeAll: () => messageInstance!.closeAll(),
  };
}

export const message = useMessage();
