<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useDark } from '@vueuse/core';
import { PresentationChartBarIcon } from '@heroicons/vue/24/outline';
import VueApexCharts from 'vue3-apexcharts';

const props = defineProps({
  chartType: {
    type: String as () => 'bar' | 'line' | 'donut',
    default: 'donut',
    validator: (value: string) => ['bar', 'line', 'donut'].includes(value)
  },
  metrics: {
    type: Object as () => ({
      trackers: Array<{ type: string; count: number; percentage?: number }>,
      ads: Array<{ category: string; count: number }>,
      locations: Array<{ timestamp: Date; count: number }>
    }),
    required: true,
    default: () => ({
      trackers: [],
      ads: [],
      locations: []
    })
  }
});

const isDark = useDark();
const themeKey = ref(0);
const chart = ref<typeof VueApexCharts | null>(null);

const colorPalette = {
  dark: [
    'rgba(245, 158, 11, 0.8)',
    'rgba(139, 92, 246, 0.8)',
    'rgba(20, 184, 166, 0.8)',
    'rgb(55,152,43)'
  ],
  light: [
    'rgba(245, 158, 11, 0.8)',
    'rgba(139, 92, 246, 0.6)',
    'rgba(20, 184, 166, 0.6)',
    'rgb(55,152,43)'
  ]
};

const processedSeries = computed(() => {
  if (props.chartType === 'donut') {
    return props.metrics.trackers.map(t => t.count);
  }
  return [{
    name: 'Tracker Count',
    data: props.metrics.trackers.map(t => t.count)
  }];
});

const chartOptions = computed(() => {
  const baseOptions = {
    chart: {
      toolbar: { show: false },
      fontFamily: 'Inter, sans-serif',
      foreColor: isDark.value ? '#E5E7EB' : '#374151',
      animations: {
        enabled: true,
        easing: 'easeout',
        speed: 500
      }
    },
    labels: props.chartType === 'donut'
        ? props.metrics.trackers.map(t => t.type)
        : [],
    colors: isDark.value ? colorPalette.dark : colorPalette.light,
    xaxis: {
      categories: props.chartType === 'bar'
          ? props.metrics.trackers.map(t => t.type)
          : [],
      labels: {
        style: {
          colors: isDark.value ? '#9CA3AF' : '#6B7280'
        }
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: isDark.value ? '#9CA3AF' : '#6B7280'
        },
        formatter: (value: number) => Math.round(value).toString()
      }
    },
    plotOptions: {
      bar: {
        borderRadius: 6,
        distributed: true,
        columnWidth: '60%'
      },
      pie: {
        donut: {
          size: '65%',
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: '14px',
              color: isDark.value ? '#E5E7EB' : '#374151'
            },
            total: {
              show: true,
              label: 'Total',
              color: isDark.value ? '#E5E7EB' : '#374151',
              fontSize: '14px'
            }
          }
        }
      }
    },
    tooltip: {
      theme: isDark.value ? 'dark' : 'light',
      style: {
        fontSize: '14px'
      },
      custom: ({ seriesIndex, dataPointIndex }: { seriesIndex: number, dataPointIndex: number }) => {
        if (props.chartType === 'donut') {
          const tracker = props.metrics.trackers[dataPointIndex];
          return `
            <div class="px-3 py-2 ${isDark.value ? 'bg-gray-800' : 'bg-white'}
              rounded-lg shadow-sm border ${isDark.value ? 'border-gray-700' : 'border-gray-200'}">
              <p class="text-sm font-medium ${isDark.value ? 'text-orangePrimary-dark' : 'text-orangePrimary'}">
                ${tracker.type}
              </p>
              <p class="text-xs ${isDark.value ? 'text-gray-300' : 'text-gray-600'}">
                ${tracker.count} requests • ${tracker.percentage}%
              </p>
            </div>
          `;
        }
        // Tooltip for bar chart
        const tracker = props.metrics.trackers[dataPointIndex];
        return `
          <div class="px-3 py-2 ${isDark.value ? 'bg-gray-800' : 'bg-white'}
            rounded-lg shadow-sm border ${isDark.value ? 'border-gray-700' : 'border-gray-200'}">
            <p class="text-sm font-medium ${isDark.value ? 'text-orangePrimary-dark' : 'text-orangePrimary'}">
              ${tracker.type}
            </p>
            <p class="text-xs ${isDark.value ? 'text-gray-300' : 'text-gray-600'}">
              ${tracker.count} requests
            </p>
          </div>
        `;
      }
    }
  };

  return baseOptions;
});

watch(isDark, () => {
  themeKey.value += 1;
});
</script>

<template>
  <div class="rounded-xl bg-orangePrimary/5 dark:bg-orangePrimary-dark/10 p-4 transition-all hover:scale-[1.01]">
    <div class="flex items-center justify-between mb-3">
      <h2 class="text-sm font-semibold text-gray-800 dark:text-gray-200">
        <slot name="title"></slot>
      </h2>
      <slot name="icon">
        <PresentationChartBarIcon class="w-5 h-5 text-orangePrimary dark:text-orangePrimary-dark" />
      </slot>
    </div>

    <div class="relative">
      <VueApexCharts
          ref="chart"
          :key="themeKey"
          :type="chartType"
          :options="chartOptions"
          :series="processedSeries"
          height="240"
          class="[&_svg]:-m-2"
      />

      <!-- Center label for donut chart -->
      <div v-if="chartType === 'donut'" class="absolute inset-0 flex items-center justify-center pointer-events-none"/>
    </div>
  </div>
</template>
