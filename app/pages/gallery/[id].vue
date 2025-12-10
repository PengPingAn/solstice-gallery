<template>
  <div>
    <!-- <Loading></Loading> -->
    <MasonryGrid :items="photos" @image-click="openImageDetail" />

    <UModal
      :fullscreen="true"
      :dismissible="false"
      v-model:open="showDetail"
      close-icon="i-lucide-arrow-right"
    >
      <template #content>
        <PhoneView
          :images="photos"
          :initial-index="currentImageIndex"
          @closePhoneView="closeDetail"
        >
        </PhoneView>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from "vue-router";
import { ref } from "vue";

const photos = ref([
  {
    id: 1,
    url:
      "https://img1.baidu.com/it/u=751977264,75170209&fm=253&app=138&f=JPEG?w=800&h=1200",
    title: "Mountain Landscape",
    meta: "SONY A7III",
    date: "2025-11-29",
    address: "景德镇",
  },
  {
    id: 2,
    url:
      "https://img1.baidu.com/it/u=1499119047,3111422144&fm=253&app=138&f=JPEG?w=800&h=1200",
    title: "Forest Mist",
    meta: "CANON R5",
    date: "2025-11-28",
    address: "景德镇",
  },
  {
    id: 3,
    url:
      "https://img0.baidu.com/it/u=2698750763,1289567045&fm=253&app=138&f=JPEG?w=1200&h=800",
    title: "Wilderness",
    meta: "NIKON Z7",
    date: "2025-11-27",
    address: "景德镇",
  },
  {
    id: 4,
    url:
      "https://img0.baidu.com/it/u=351736222,310787395&fm=253&app=138&f=JPEG?w=800&h=1200",
    title: "Lake View",
    meta: "FUJI X-T4",
    date: "2025-11-18",
    address: "景德镇",
  },
  {
    id: 5,
    url:
      "https://img0.baidu.com/it/u=3393310132,2238488835&fm=253&fmt=auto&app=138&f=JPEG?w=800&h=1200",
    title: "Waterfall",
    meta: "SONY A7R4",
    date: "2025-11-15",
    address: "张家界",
  },
  {
    id: 6,
    url:
      "https://img2.baidu.com/it/u=1369224517,1436939235&fm=253&app=138&f=JPEG?w=800&h=1202",
    title: "Mountain Range",
    meta: "CANON R6",
    date: "2025-11-15",
    address: "张家界",
  },
  {
    id: 7,
    url:
      "https://img2.baidu.com/it/u=562706073,4054859486&fm=253&app=138&f=JPEG?w=800&h=1202",
    title: "Green Forest",
    meta: "LEICA Q2",
    date: "2025-11-15",
    address: "张家界",
  },
  {
    id: 8,
    url:
      "https://img0.baidu.com/it/u=1242780930,810729623&fm=253&app=138&f=JPEG?w=800&h=1422",
    title: "Misty Woods",
    meta: "SONY A7C",
    date: "2025-11-15",
    address: "张家界",
  },
  {
    id: 9,
    url:
      "https://img0.baidu.com/it/u=2505658297,2628137465&fm=253&app=138&f=JPEG?w=800&h=1067",
    title: "Snow Mountain",
    meta: "NIKON D850",
    date: "2025-11-15",
    address: "张家界",
  },
  {
    id: 10,
    url:
      "https://img2.baidu.com/it/u=3563985946,2956215823&fm=253&app=138&f=JPEG?w=800&h=1422",
    title: "Music Vibes",
    meta: "IPHONE 15 PRO",
    date: "2025-11-15",
    address: "张家界",
  },
  {
    id: 11,
    url:
      "https://img0.baidu.com/it/u=1282131767,29808101&fm=253&app=138&f=JPEG?w=800&h=1423",
    title: "City Skyline",
    meta: "SONY A7III",
    date: "2025-10-15",
    address: "长沙",
  },
  {
    id: 12,
    url:
      "https://qcloud.dpfile.com/pc/cGvMThX_bX1w95FNhgg5DJ5yMzi_vhHvqsMN2cAdj9u86DRaYKVlOfP__9y-SpoC.jpg",
    title: "Ocean Beach",
    meta: "CANON R5",
    date: "2025-10-15",
    address: "长沙",
  },
  {
    id: 13,
    url: "https://i0.hdslb.com/bfs/archive/252a8ffba465ba681e2b97d72d65a77752e3ae97.jpg",
    title: "Mountain Peak",
    meta: "FUJI X-T5",
    date: "2025-10-15",
    address: "长沙",
  },
  {
    id: 15,
    url:
      "https://img2.baidu.com/it/u=746772355,496048024&fm=253&app=138&f=JPEG?w=800&h=1200",
    title: "Alpine Lake",
    meta: "NIKON Z9",
    date: "2025-10-15",
    address: "长沙",
  },
  {
    id: 16,
    url:
      "https://img2.baidu.com/it/u=1844470629,2107270501&fm=253&app=138&f=JPEG?w=800&h=1200",
    title: "Urban Park",
    meta: "CANON R6",
    date: "2025-10-15",
    address: "长沙",
  },
  {
    id: 17,
    url:
      "https://img0.baidu.com/it/u=3924801681,3340233177&fm=253&app=138&f=JPEG?w=1200&h=800",
    title: "Autumn Forest",
    meta: "LEICA M11",
    date: "2025-09-26",
    address: "广州",
  },
  {
    id: 18,
    url:
      "https://img0.baidu.com/it/u=2983110990,1386013061&fm=253&app=138&f=JPEG?w=800&h=1267",
    title: "Wild Meadow",
    meta: "SONY A7IV",
    date: "2025-09-26",
    address: "广州",
  },
  {
    id: 19,
    url:
      "https://img2.baidu.com/it/u=1347536674,3235777156&fm=253&app=138&f=JPEG?w=1136&h=800",
    title: "Lonely Tree",
    meta: "FUJI GFX100",
    date: "2025-09-26",
    address: "广州",
  },
  {
    id: 20,
    url:
      "https://img1.baidu.com/it/u=389697753,2271049959&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=667",
    title: "Country Road",
    meta: "CANON R3",
    date: "2025-09-26",
    address: "广州",
  },
  {
    id: 21,
    url:
      "https://img2.baidu.com/it/u=1985997013,712464375&fm=253&fmt=auto&app=138&f=JPEG?w=800&h=1200",
    title: "Golden Sunset",
    meta: "SONY A7SIII",
    date: "2025-09-26",
    address: "广州",
  },
  {
    id: 22,
    url:
      "https://img1.baidu.com/it/u=3636071693,928953107&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=624",
    title: "Guitar Session",
    meta: "IPHONE 14 PRO",
    date: "2025-09-26",
    address: "广州",
  },
  {
    id: 23,
    url:
      "https://img2.baidu.com/it/u=2639313291,2926359858&fm=253&app=138&f=JPEG?w=800&h=1422",
    title: "Valley View",
    meta: "NIKON Z8",
    date: "2025-09-24",
    address: "深圳",
  },
  {
    id: 24,
    url:
      "https://img0.baidu.com/it/u=206288580,793938944&fm=253&app=138&f=JPEG?w=800&h=1422",
    title: "Enchanted Forest",
    meta: "CANON R5",
    date: "2025-09-23",
    address: "广州",
  },
  {
    id: 25,
    url:
      "https://img0.baidu.com/it/u=3700835713,640946543&fm=253&app=138&f=JPEG?w=800&h=1243",
    title: "Coastal Path",
    meta: "SONY A7R5",
    date: "2025-09-23",
    address: "广州",
  },
  {
    id: 26,
    url:
      "https://img2.baidu.com/it/u=298221463,1387608445&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=625",
    title: "Serene Lake",
    meta: "FUJI X-H2",
    date: "2025-09-23",
    address: "广州",
  },
  {
    id: 27,
    url: "https://i2.hdslb.com/bfs/archive/1fc261ef12dfdeab9c850b1ad1d9d525aa87fd78.jpg",
    title: "Sunbeam Forest",
    meta: "LEICA SL2",
    date: "2025-07-06",
    address: "大理",
  },
  {
    id: 28,
    url:
      "https://img0.baidu.com/it/u=3479684585,3185783712&fm=253&app=138&f=JPEG?w=800&h=1422",
    title: "Rocky Peaks",
    meta: "CANON R7",
    date: "2025-07-06",
    address: "大理",
  },
  {
    id: 29,
    url:
      "https://img0.baidu.com/it/u=3217104118,1144891105&fm=253&app=138&f=JPEG?w=800&h=1422",
    title: "Mountain Glory",
    meta: "SONY A9III",
    date: "2025-07-06",
    address: "大理",
  },
  {
    id: 30,
    url:
      "https://img1.baidu.com/it/u=3355423080,66052318&fm=253&app=138&f=JPEG?w=800&h=1067",
    title: "Deep Woods",
    meta: "NIKON Zf",
    date: "2025-07-06",
    address: "大理",
  },
  {
    id: 31,
    url:
      "https://img2.baidu.com/it/u=743686499,3293007268&fm=253&fmt=auto&app=138&f=JPEG?w=800&h=1200",
    title: "Deep Woods",
    meta: "NIKON Zf",
    date: "2025-05-06",
    address: "成都",
  },
  {
    id: 32,
    url:
      "https://qcloud.dpfile.com/pc/fG_VKpNctFmvXuhuy73SbWBd9x6ZVEzs1Woaxwz58nMhOLcGgiPlxc9FC8mAyrgC.jpg",
    title: "Deep Woods",
    meta: "NIKON Zf",
    date: "2024-05-06",
    address: "成都",
  },
  {
    id: 33,
    url:
      "https://gips2.baidu.com/it/u=122933000,2407412500&fm=3074&app=3074&f=JPEG?w=1920&h=2530&type=normal&func=",
    title: "Superman",
    meta: "NIKON Zf",
    date: "2024-01-06",
    address: "美国",
  },
  {
    id: 34,
    url:
      "https://img0.baidu.com/it/u=935685983,2247357282&fm=253&app=138&f=JPEG?w=800&h=1200",
    title: "Superman",
    meta: "NIKON Zf",
    date: "2024-01-06",
    address: "美国",
  },
  {
    id: 35,
    url:
      "https://img1.baidu.com/it/u=3873824728,11066418&fm=253&app=138&f=JPEG?w=800&h=1067",
    title: "Superman",
    meta: "NIKON Zf",
    date: "2024-01-06",
    address: "美国",
  },
]);
// 获取路由参数
const route = useRoute();
const id = route.params.id; // 获取动态参数

const currentImageIndex = ref<number>(0);
// 详情组件相关
const showDetail = ref(false);

// 打开详情
const openImageDetail = (index: number) => {
  console.log("------------", index);
  currentImageIndex.value = index;
  showDetail.value = true;
};

// 关闭详情
const closeDetail = () => {
  showDetail.value = false;
};
</script>
