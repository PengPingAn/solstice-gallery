<template>
  <div
    :class="[
      'min-h-screen flex flex-col items-center justify-center transition-colors duration-500 p-4',
      isDark ? 'bg-gray-900' : 'bg-gray-100',
    ]"
  >
    <!-- 黑暗模式切换按钮 -->

    <!-- 注册表单 -->
    <form
      @submit.prevent="handleSubmit"
      :class="[
        'w-full max-w-xl backdrop-blur-xl rounded-2xl p-8 space-y-6 shadow-lg border overflow-hidden transition-colors duration-500',
        isDark
          ? 'bg-gray-800/60 border-gray-700/50 text-gray-200'
          : 'bg-white/60 border-white/30 text-gray-800',
      ]"
    >
      <h2
        class="text-2xl font-bold mb-4 text-center transform transition-all duration-700"
        :style="{
          opacity: titleVisible ? 1 : 0,
          transform: titleVisible ? 'translateY(0)' : 'translateY(40px)',
        }"
      >
        初始化
      </h2>

      <!-- 表单项 -->
      <div
        v-for="(field, index) in fields"
        :key="field.key"
        class="transform transition-all duration-700"
        :style="{
          transitionDelay: `${index * 150}ms`,
          opacity: field.visible ? 1 : 0,
          transform: field.visible ? 'translateY(0)' : 'translateY(40px)',
        }"
      >
        <label class="block mb-1" :class="isDark ? 'text-gray-300' : 'text-gray-700'">{{
          field.label
        }}</label>
        <template v-if="field.type === 'file'">
          <UInput @change="handleAvatarChange" />
          <div v-if="avatarPreview" class="mt-2">
            <img
              :src="avatarPreview"
              alt="avatar"
              class="w-24 h-24 rounded-full object-cover border border-gray-300 dark:border-gray-600"
            />
          </div>
        </template>
        <template v-else>
          <UInput
            v-model="field.model"
            :type="field.type"
            :placeholder="field.placeholder"
            required
            class="w-full"
          />
        </template>
      </div>

      <!-- 提交按钮 -->
      <div
        class="transform transition-all duration-700 w-full"
        :style="{
          transitionDelay: `${fields.length * 150}ms`,
          opacity: buttonVisible ? 1 : 0,
          transform: buttonVisible ? 'translateY(0)' : 'translateY(40px)',
        }"
      >
        <button
          class="rounded-lg px-4 py-2 text-white w-full transition duration-500 hover:scale-105"
          :class="
            isDark
              ? 'bg-gray-700 hover:bg-gray-600'
              : 'bg-foreground -500 hover:bg-gray-700'
          "
          type="submit"
        >
          让我们进入系统吧 🎉
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, isRef } from "vue";
import confetti from "canvas-confetti";

const { $toast } = useNuxtApp();

const colorMode = useColorMode();
// 黑暗模式状态
const isDark = computed({
  get() {
    return colorMode.value === "dark";
  },
  set(_isDark) {
    colorMode.preference = _isDark ? "dark" : "light";
  },
});

// 表单项
const fields = ref<any[]>([
  {
    key: "nickname",
    label: "昵称",
    type: "text",
    placeholder: "你的昵称",
    model: ref(""),
    visible: false,
  },
  {
    key: "account",
    label: "账号",
    type: "text",
    placeholder: "登录账号",
    model: ref(""),
    visible: false,
  },
  {
    key: "password",
    label: "密码",
    type: "password",
    placeholder: "••••••",
    model: ref(""),
    visible: false,
  },
  {
    key: "confirmPassword",
    label: "确认密码",
    type: "password",
    placeholder: "••••••",
    model: ref(""),
    visible: false,
  },
  {
    key: "email",
    label: "邮箱",
    type: "email",
    placeholder: "xxx@gmail.com",
    model: ref(""),
    visible: false,
  },
  {
    key: "avatar",
    label: "头像",
    type: "text",
    placeholder: "https://",
    model: ref(""),
    visible: false,
  },
]);

const titleVisible = ref(false);
const buttonVisible = ref(false);
const avatarPreview = ref("");

// 页面加载飞入动画
onMounted(() => {
  titleVisible.value = true;
  fields.value.forEach((f, i) => setTimeout(() => (f.visible = true), i * 150));
  setTimeout(() => (buttonVisible.value = true), fields.value.length * 150);
});

// 提交表单
function handleSubmit() {
  const password = fields.value.find((f) => f.key === "password")?.model.value;
  const confirm = fields.value.find((f) => f.key === "confirmPassword")?.model.value;

  if (password !== confirm) {
    $toast?.error("两次密码不一致！");
    return;
  }

  // 彩带动画
  const end = Date.now() + 3 * 1000;
  const colors = ["#a786ff", "#fd8bbc", "#eca184", "#f8deb1"];
  function frame() {
    if (Date.now() > end) return;
    confetti({
      particleCount: 2,
      angle: 60,
      spread: 55,
      startVelocity: 60,
      origin: { x: 0, y: 0.5 },
      colors,
    });
    confetti({
      particleCount: 2,
      angle: 120,
      spread: 55,
      startVelocity: 60,
      origin: { x: 1, y: 0.5 },
      colors,
    });
    requestAnimationFrame(frame);
  }
  frame();

  // 生成表单数据
  const data: any = {};
  fields.value.forEach((f) => {
    data[f.key] = isRef(f.model) ? f.model.value : f.model;
  });
  console.log("注册数据:", data);
  $toast?.success("恭喜你，初始化账号成功！");
}
</script>
