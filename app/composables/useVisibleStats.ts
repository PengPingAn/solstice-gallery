// composables/useVisibleStats.ts
import { ref, onMounted, onBeforeUnmount } from "vue";

interface VisibleComponent {
  date?: string;
  address?: string;
  element: HTMLElement;
}

interface StatsResult {
  dateRange: string;
  addresses: string;
  count: number;
}

export function useVisibleStats() {
  const components = ref<VisibleComponent[]>([]);
  const stats = ref<StatsResult>({
    dateRange: "",
    addresses: "",
    count: 0,
  });

  let observer: IntersectionObserver | null = null;
  let computeTimeout: NodeJS.Timeout | null = null;

  // 注册组件用于统计
  const registerComponent = (
    component: Omit<VisibleComponent, "element">,
    element: HTMLElement
  ) => {
    components.value.push({
      ...component,
      element,
    });
  };

  // 注销组件
  const unregisterComponent = (element: HTMLElement) => {
    const index = components.value.findIndex(
      (comp) => comp.element === element
    );
    if (index > -1) {
      components.value.splice(index, 1);
    }
  };

  // 计算可见组件的统计信息
  const computeStats = () => {
    if (computeTimeout) {
      clearTimeout(computeTimeout);
    }

    computeTimeout = setTimeout(() => {
      // 获取当前可见的组件
      const visibleComponents = components.value.filter((component) => {
        const rect = component.element.getBoundingClientRect();
        return (
          rect.top < window.innerHeight &&
          rect.bottom > 0 &&
          rect.left < window.innerWidth &&
          rect.right > 0
        );
      });

      if (visibleComponents.length === 0) {
        stats.value = {
          dateRange: "",
          addresses: "",
          count: 0,
        };
        return;
      }

      // 收集所有日期和地址
      const dates: string[] = [];
      const addresses: Set<string> = new Set();

      visibleComponents.forEach((component) => {
        if (component.date) {
          dates.push(component.date);
        }
        if (component.address) {
          addresses.add(component.address);
        }
      });

      // 计算日期范围（使用字符串比较）
      let dateRange = "";
      if (dates.length > 0) {
        // 对日期字符串进行排序（格式：YYYY-MM-DD）
        const sortedDates = dates.sort();
        const minDate = sortedDates[0];
        const maxDate = sortedDates[sortedDates.length - 1];

        // 解析年月
        const [minYear, minMonth] = minDate.split("-").map(Number);
        const [maxYear, maxMonth] = maxDate.split("-").map(Number);

        if (minYear === maxYear) {
          if (minMonth === maxMonth) {
            dateRange = `${minMonth}月 ${minYear}`;
          } else {
            dateRange = `${minMonth}月-${maxMonth}月 ${minYear}`;
          }
        } else {
          dateRange = `${minMonth}月 ${minYear}-${maxMonth}月 ${maxYear}`;
        }
      }

      // 处理地址
      const addressText = Array.from(addresses).join(" ");

      stats.value = {
        dateRange,
        addresses: addressText,
        count: visibleComponents.length,
      };
    }, 100);
  };

  // 初始化 Intersection Observer 来监听滚动
  const initObserver = () => {
    observer = new IntersectionObserver(
      (entries) => {
        computeStats();
      },
      {
        threshold: 0.1,
        rootMargin: "50px",
      }
    );

    // 观察所有已注册的组件
    components.value.forEach((component) => {
      observer?.observe(component.element);
    });
  };

  // 添加滚动事件监听
  const initScrollListener = () => {
    window.addEventListener("scroll", computeStats, { passive: true });
  };

  onMounted(() => {
    // 延迟初始化，确保所有组件都已注册
    setTimeout(() => {
      initObserver();
      initScrollListener();
      // 初始计算一次
      computeStats();
    }, 100);
  });

  onBeforeUnmount(() => {
    observer?.disconnect();
    window.removeEventListener("scroll", computeStats);
    if (computeTimeout) {
      clearTimeout(computeTimeout);
    }
  });

  return {
    registerComponent,
    unregisterComponent,
    computeStats,
    stats,
  };
}
