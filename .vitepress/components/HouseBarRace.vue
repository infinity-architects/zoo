<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'
import rawData from '../../data/Fang-Yuan-Shu-Ju.json'

const chartRef = ref(null)
const errorMsg = ref('')

let chart = null
let timer = null
let frames = []
let currentIndex = 0

const PLAY_INTERVAL = 2200

const selectedCities = [
  '上海', '北京', '深圳', '广州', '杭州', '南京',
  '苏州', '武汉', '成都', '重庆', '郑州', '西安'
]

const cityColorMap = {
  上海: '#5B6C8F',
  北京: '#6F8F84',
  深圳: '#C2A878',
  广州: '#B97A6A',
  杭州: '#7FA7B8',
  南京: '#7E8C6A',
  苏州: '#B08B73',
  武汉: '#8D7BAF',
  成都: '#A67C8B',
  重庆: '#5F6B74',
  郑州: '#8B8F99',
  西安: '#A06A6A'
}

function isMobileScreen() {
  return window.innerWidth < 768
}

function formatShortNumber(value) {
  const num = Number(value)
  if (num >= 1000) return `${Math.round(num / 1000)}k`
  return `${num}`
}

function formatFullNumber(value) {
  return Number(value).toLocaleString()
}

function buildMonthlyFrames(source) {
  const [header, ...rows] = source
  const cityIndex = header.indexOf('Country')
  const dateIndex = header.indexOf('Date')
  const valueIndex = header.indexOf('Population')

  if (cityIndex === -1 || dateIndex === -1 || valueIndex === -1) {
    throw new Error('JSON 字段名不符合预期，缺少 Country / Date / Population')
  }

  const monthlyMap = new Map()

  for (const row of rows) {
    const city = row[cityIndex]
    const date = row[dateIndex]
    const value = Number(row[valueIndex])

    if (!selectedCities.includes(city)) continue
    if (!date || Number.isNaN(value)) continue

    const month = String(date).slice(0, 7)

    if (!monthlyMap.has(month)) {
      monthlyMap.set(month, {})
    }

    monthlyMap.get(month)[city] = value
  }

  return [...monthlyMap.keys()]
    .sort()
    .map(month => {
      const monthData = monthlyMap.get(month)

      return {
        month,
        data: selectedCities.map(city => ({
          name: city,
          value: monthData[city] ?? 0
        }))
      }
    })
}

function getSortedData(frame) {
  return [...frame.data]
    .sort((a, b) => a.value - b.value)
    .map(item => ({
      name: item.name,
      value: item.value,
      itemStyle: {
        color: cityColorMap[item.name] || '#5B6C8F',
        borderRadius: [0, 8, 8, 0]
      }
    }))
}

function buildBaseOption(frame) {
  const mobile = isMobileScreen()
  const sorted = getSortedData(frame)

  return {
    animationDuration: 0,
    animationDurationUpdate: PLAY_INTERVAL,
    animationEasing: 'linear',
    animationEasingUpdate: 'linear',
    title: {
      text: '城市在售房源竞赛',
      subtext: frame.month,
      left: 'center',
      top: mobile ? 10 : 12,
      textStyle: {
        fontSize: mobile ? 18 : 24,
        fontWeight: 700,
        color: '#2b2f36'
      },
      subtextStyle: {
        fontSize: mobile ? 12 : 14,
        color: '#6b7280'
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: ({ name, value }) =>
        `${name}<br/>在售房源：${formatFullNumber(value)}`
    },
    grid: mobile
      ? {
          left: 24,
          right: 44,
          top: 76,
          bottom: 26,
          containLabel: false
        }
      : {
          left: 28,
          right: 64,
          top: 92,
          bottom: 34,
          containLabel: false
        },
    xAxis: {
      type: 'value',
      max: 'dataMax',
      splitNumber: mobile ? 3 : 5,
      axisLine: {
        show: false
      },
      axisTick: {
        show: false
      },
      axisLabel: {
        color: '#6b7280',
        fontSize: mobile ? 10 : 12,
        margin: mobile ? 8 : 10,
        hideOverlap: true,
        formatter: value => formatShortNumber(value)
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: '#e5e7eb'
        }
      }
    },
    yAxis: {
      type: 'category',
      inverse: true,
      max: selectedCities.length - 1,
      animationDuration: 300,
      animationDurationUpdate: 300,
      axisLine: {
        show: false
      },
      axisTick: {
        show: false
      },
      axisLabel: {
        show: true,
        color: '#374151',
        fontSize: mobile ? 10 : 12,
        fontWeight: 600,
        align: 'right',
        width: mobile ? 34 : 44,
        overflow: 'truncate',
        margin: mobile ? 2 : 4
      },
      data: sorted.map(item => item.name)
    },
    series: [
      {
        id: 'house-series',
        type: 'bar',
        name: '在售房源',
        realtimeSort: true,
        barWidth: mobile ? 18 : 24,
        data: sorted,
        labelLayout: {
          hideOverlap: false
        },
        label: {
          show: true,
          position: 'right',
          distance: mobile ? 6 : 8,
          color: '#2b2f36',
          fontSize: mobile ? 10 : 12,
          fontWeight: 700,
          formatter: ({ value }) => formatShortNumber(value),
          valueAnimation: true
        },
        emphasis: {
          disabled: true
        }
      }
    ]
  }
}

function initChart(frame) {
  if (!chart) return
  chart.setOption(buildBaseOption(frame), { notMerge: false, lazyUpdate: false })
}

function updateFrame(frame) {
  if (!chart) return

  const sorted = getSortedData(frame)

  chart.setOption(
    {
      title: {
        subtext: frame.month
      },
      yAxis: {
        data: sorted.map(item => item.name)
      },
      series: [
        {
          id: 'house-series',
          data: sorted
        }
      ]
    },
    {
      notMerge: false,
      lazyUpdate: false
    }
  )
}

function restartAutoPlay() {
  if (timer) clearInterval(timer)

  timer = setInterval(() => {
    currentIndex = (currentIndex + 1) % frames.length
    updateFrame(frames[currentIndex])
  }, PLAY_INTERVAL)
}

function handleResize() {
  if (!chart || !frames.length) return
  chart.resize()
  initChart(frames[currentIndex])
}

onMounted(async () => {
  try {
    await nextTick()

    if (!chartRef.value) {
      throw new Error('图表容器不存在')
    }

    frames = buildMonthlyFrames(rawData)

    if (!frames.length) {
      throw new Error('JSON 已导入，但没有生成有效月份数据')
    }

    chart = echarts.init(chartRef.value)
    initChart(frames[0])
    restartAutoPlay()

    window.addEventListener('resize', handleResize)
  } catch (err) {
    errorMsg.value = err instanceof Error ? err.message : '图表初始化失败'
  }
})

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
  window.removeEventListener('resize', handleResize)

  if (chart) {
    chart.dispose()
    chart = null
  }
})
</script>

<template>
  <div class="house-bar-race-wrap">
    <div v-if="errorMsg" class="house-bar-race-error">
      {{ errorMsg }}
    </div>
    <div v-else ref="chartRef" class="house-bar-race-chart"></div>
  </div>
</template>

<style scoped>
.house-bar-race-wrap {
  width: 100%;
}

.house-bar-race-chart {
  width: 100%;
  height: 62vh;
  min-height: 540px;
  max-height: 760px;
}

@media (max-width: 767px) {
  .house-bar-race-chart {
    height: 68vh;
    min-height: 620px;
    max-height: 760px;
  }
}

.house-bar-race-error {
  padding: 16px;
  color: #c62828;
  background: #fff3f3;
  border: 1px solid #f1b5b5;
  border-radius: 8px;
}
</style>