<template>
  <div>
    <MasonryGrid :items="photos" />
  </div>
</template>

<script setup>
import { useRoute } from "vue-router";
import { ref } from "vue";

const photos = ref([
  {
    id: 1,
    url:
      "https://images.unsplash.com/photo-1501854140801-50d01698950b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8bmF0dXJlfGVufDB8fDB8fHww&w=1000&q=80",
    title: "Mountain Landscape",
    meta: "SONY A7III",
  },
  {
    id: 2,
    url:
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8bmF0dXJlfGVufDB8fDB8fHww&w=1000&q=80",
    title: "Forest Mist",
    meta: "CANON R5",
  },
  {
    id: 3,
    url:
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8d2lsZGVybmVzc3xlbnwwfHwwfHx8MA%3D%3D&w=1000&q=80",
    title: "Wilderness",
    meta: "NIKON Z7",
  },
  {
    id: 4,
    url:
      "https://images.unsplash.com/photo-1505144808419-1957a94ca61e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8bGFrZXxlbnwwfHwwfHx8MA%3D%3D&w=1000&q=80",
    title: "Lake View",
    meta: "FUJI X-T4",
  },
  {
    id: 5,
    url:
      "https://images.unsplash.com/photo-1433086966358-54859d0ed716?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8d2F0ZXJmYWxsfGVufDB8fDB8fHww&w=1000&q=80",
    title: "Waterfall",
    meta: "SONY A7R4",
  },
  {
    id: 6,
    url:
      "https://images.unsplash.com/photo-1476820865390-c52aeebb9891?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8bW91bnRhaW4lMjByYW5nZXxlbnwwfHwwfHx8MA%3D%3D&w=1000&q=80",
    title: "Mountain Range",
    meta: "CANON R6",
  },
  {
    id: 7,
    url:
      "https://images.unsplash.com/photo-1418065460487-3e41a6c84dc5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8Zm9yZXN0fGVufDB8fDB8fHww&w=1000&q=80",
    title: "Green Forest",
    meta: "LEICA Q2",
  },
  {
    id: 8,
    url:
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8Zm9yZXN0fGVufDB8fDB8fHww&w=1000&q=80",
    title: "Misty Woods",
    meta: "SONY A7C",
  },
  {
    id: 9,
    url:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8c25vdyUyMG1vdW50YWlufGVufDB8fDB8fHww&w=1000&q=80",
    title: "Snow Mountain",
    meta: "NIKON D850",
  },
  {
    id: 10,
    url:
      "https://images.unsplash.com/photo-1518837695005-2083093ee35b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8bXVzaWN8ZW58MHx8MHx8fDA%3D&w=1000&q=80",
    title: "Music Vibes",
    meta: "IPHONE 15 PRO",
  },
  {
    id: 11,
    url:
      "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8c2t5bGluZXxlbnwwfHwwfHx8MA%3D%3D&w=1000&q=80",
    title: "City Skyline",
    meta: "SONY A7III",
  },
  {
    id: 12,
    url:
      "https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8YmVhY2h8ZW58MHx8MHx8fDA%3D&w=1000&q=80",
    title: "Ocean Beach",
    meta: "CANON R5",
  },
  {
    id: 13,
    url:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8bW91bnRhaW4lMjBwZWFrfGVufDB8fDB8fHww&w=1000&q=80",
    title: "Mountain Peak",
    meta: "FUJI X-T5",
  },
  {
    id: 15,
    url:
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8bW91bnRhaW4lMjBsYWtlfGVufDB8fDB8fHww&w=1000&q=80",
    title: "Alpine Lake",
    meta: "NIKON Z9",
  },
  {
    id: 16,
    url:
      "https://images.unsplash.com/photo-1506260408121-e353d10b87c7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cGFya3N8ZW58MHx8MHx8fDA%3D&w=1000&q=80",
    title: "Urban Park",
    meta: "CANON R6",
  },
  {
    id: 17,
    url:
      "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8Zm9yZXN0JTIwYXV0dW1ufGVufDB8fDB8fHww&w=1000&q=80",
    title: "Autumn Forest",
    meta: "LEICA M11",
  },
  {
    id: 18,
    url:
      "https://images.unsplash.com/photo-1426604966848-d7adac402bff?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8bmF0dXJlfGVufDB8fDB8fHww&w=1000&q=80",
    title: "Wild Meadow",
    meta: "SONY A7IV",
  },
  {
    id: 19,
    url:
      "https://images.unsplash.com/photo-1502082553048-f009c37129b9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8dHJlZXN8ZW58MHx8MHx8fDA%3D&w=1000&q=80",
    title: "Lonely Tree",
    meta: "FUJI GFX100",
  },
  {
    id: 20,
    url:
      "https://images.unsplash.com/photo-1511497584788-876760111969?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8cm9hZHxlbnwwfHwwfHx8MA%3D%3D&w=1000&q=80",
    title: "Country Road",
    meta: "CANON R3",
  },
  {
    id: 21,
    url:
      "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8c3Vuc2V0fGVufDB8fDB8fHww&w=1000&q=80",
    title: "Golden Sunset",
    meta: "SONY A7SIII",
  },
  {
    id: 22,
    url:
      "https://images.unsplash.com/photo-1518837695005-2083093ee35b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8bXVzaWN8ZW58MHx8MHx8fDA%3D&w=1000&q=80",
    title: "Guitar Session",
    meta: "IPHONE 14 PRO",
  },
  {
    id: 23,
    url:
      "https://images.unsplash.com/photo-1501854140801-50d01698950b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8bGFuZHNjYXBlfGVufDB8fDB8fHww&w=1000&q=80",
    title: "Valley View",
    meta: "NIKON Z8",
  },
  {
    id: 24,
    url:
      "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8Zm9yZXN0fGVufDB8fDB8fHww&w=1000&q=80",
    title: "Enchanted Forest",
    meta: "CANON R5",
  },
  {
    id: 25,
    url:
      "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8bmF0dXJlfGVufDB8fDB8fHww&w=1000&q=80",
    title: "Coastal Path",
    meta: "SONY A7R5",
  },
  {
    id: 26,
    url:
      "https://images.unsplash.com/photo-1439066615861-d1af74d74000?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8bGFrZXxlbnwwfHwwfHx8MA%3D%3D&w=1000&q=80",
    title: "Serene Lake",
    meta: "FUJI X-H2",
  },
  {
    id: 27,
    url:
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8Zm9yZXN0fGVufDB8fDB8fHww&w=1000&q=80",
    title: "Sunbeam Forest",
    meta: "LEICA SL2",
  },
  {
    id: 28,
    url:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8bW91bnRhaW4lMjByYW5nZXxlbnwwfHwwfHx8MA%3D%3D&w=1000&q=80",
    title: "Rocky Peaks",
    meta: "CANON R7",
  },
  {
    id: 29,
    url:
      "https://images.unsplash.com/photo-1476820865390-c52aeebb9891?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8bW91bnRhaW4lMjBzY2VuZXxlbnwwfHwwfHx8MA%3D%3D&w=1000&q=80",
    title: "Mountain Glory",
    meta: "SONY A9III",
  },
  {
    id: 30,
    url:
      "https://images.unsplash.com/photo-1418065460487-3e41a6c84dc5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGZvcmVzdHxlbnwwfHwwfHx8MA%3D%3D&w=1000&q=80",
    title: "Deep Woods",
    meta: "NIKON Zf",
  },
]);
// 获取路由参数
const route = useRoute();
const id = route.params.id; // 获取动态参数
</script>
