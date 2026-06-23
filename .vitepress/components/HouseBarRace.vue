<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'
import rawData from '../../data/Fang-Yuan-Shu-Ju.json'

const chartRef = ref(null)
const errorMsg = ref('')

let chart = null
let timer = null

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

      const data = selectedCities.map(city => ({
        name: city,
        value: monthData[city] ?? 0
      }))

      return {
        month,
        data
      }
    })
}

function renderFrame(frame) {
  if (!chart) return

  const sorted = [...frame.data]
    .sort((a, b) => a.value - b.value)
    .map(item => ({
      name: item.name,
      value: item.value,
      itemStyle: {
        color: cityColorMap[item.name] || '#5470C6',
        borderRadius: [0, 6, 6, 0]
      }
    }))

  chart.setOption({
    title: {
      text: '城市在售房源竞赛',
      subtext: frame.month,
      left: 'center'
    },
    tooltip: {
      trigger: 'item',
      formatter: ({ name, value }) =>
        `${name}<br/>在售房源：${Number(value).toLocaleString()}`
    },
    grid: {
      left: 90,
      right: 110,
      top: 80,
      bottom: 30
    },
    xAxis: {
      type: 'value',
      max: 'dataMax',
      axisLabel: {
        formatter: value => Number(value).toLocaleString()
      }
    },
    yAxis: {
      type: 'category',
      inverse: true,
      max: selectedCities.length - 1,
      animationDuration: 300,
      animationDurationUpdate: 300,
      data: sorted.map(item => item.name)
    },
    series: [
      {
        type: 'bar',
        name: '在售房源',
        realtimeSort: true,
        data: sorted,
        label: {
          show: true,
          position: 'right',
          valueAnimation: true,
          formatter: ({ value }) => Number(value).toLocaleString()
        }
      }
    ],
    animationDuration: 0,
    animationDurationUpdate: 1500,
    animationEasing: 'linear',
    animationEasingUpdate: 'linear'
  })
}

function handleResize() {
  if (chart) chart.resize()
}

onMounted(async () => {
  try {
    await nextTick()

    if (!chartRef.value) {
      throw new Error('图表容器不存在')
    }

    const frames = buildMonthlyFrames(rawData)

    if (!frames.length) {
      throw new Error('JSON 已导入，但没有生成有效月份数据')
    }

    chart = echarts.init(chartRef.value)
    renderFrame(frames[0])

    let currentIndex = 0
    timer = setInterval(() => {
      currentIndex = (currentIndex + 1) % frames.length
      renderFrame(frames[currentIndex])
    }, 1800)

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
  height: 560px;
}

.house-bar-race-error {
  padding: 16px;
  color: #c62828;
  background: #fff3f3;
  border: 1px solid #f1b5b5;
  border-radius: 8px;
}
</style>