<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent, AuthFormField } from "@nuxt/ui";
import { navigateTo } from "#app";

const userStore = useUserStore();
const toast = useToast();
const router = useRouter();
const sumbitLoading = ref(false);

const fields: AuthFormField[] = [
  {
    name: "email",
    type: "email",
    label: "Email",
    placeholder: "你的邮箱",
    required: true,
    defaultValue: "demo@example.com",
  },
  {
    name: "password",
    label: "Password",
    type: "password",
    placeholder: "密码",
    required: true,
    defaultValue: "123456",
  },
  {
    name: "remember",
    label: "记住我",
    type: "checkbox",
  },
];

const providers = [
  {
    label: "Google",
    icon: "i-simple-icons-google",
    onClick: () => {
      toast.add({ title: "Google", description: "Login with Google" });
    },
  },
  {
    label: "GitHub",
    icon: "i-simple-icons-github",
    onClick: () => {
      toast.add({ title: "GitHub", description: "Login with GitHub" });
    },
  },
];

const schema = z.object({
  email: z.email("无效的Email"),
  password: z.string("无效的密码"),
});

type Schema = z.output<typeof schema>;

function onSubmit(payload: FormSubmitEvent<Schema>) {
  sumbitLoading.value = true;

  setTimeout(() => {
    sumbitLoading.value = false;
    userStore.setToken("token");
    navigateTo("/dashboard");
  }, 1000);
}

const jumpHome = () => {
  router.push("/");
};
</script>

<template>
  <div
    class="flex flex-col items-center justify-center gap-4 p-4 flex items-center justify-center h-screen"
  >
    <UPageCard class="w-full max-w-md">
      <div
        @click="jumpHome"
        class="inline-flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-gray-300 transition-colors duration-200"
      >
        <span class="cursor-pointer inline-flex items-center gap-1 hover:text-zinc-400"
          ><UIcon name="material-symbols:arrow-left-alt"> </UIcon> 返回主页</span
        >
      </div>

      <div class="flex justify-center">
        <div class="rounded-xl w-16 p-2 bg-gray-100 dark:bg-gray-500">
          <img
            src="/logo.png"
            class="drop-shadow-[0_0_6px_rgba(0,0,0,0.15)] dark:drop-shadow-[0_0_6px_rgba(255,255,255,0.75)]"
          />
        </div>
      </div>

      <UAuthForm
        :schema="schema"
        title="LOGIN"
        description="登录到 SOLSTICE-GALLERY"
        :fields="fields"
        :providers="providers"
        @submit="onSubmit"
        :submit="{ label: 'LOGIN', color: 'neutral' }"
        :loading="sumbitLoading"
      />
    </UPageCard>
  </div>
</template>
