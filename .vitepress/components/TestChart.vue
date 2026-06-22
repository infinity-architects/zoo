<template>
  <div ref="el" style="width: 100%; height: 400px;"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'

const el = ref(null)
let chart = null

function resizeChart() {
  chart?.resize()
}

onMounted(() => {
  chart = echarts.init(el.value)

  chart.setOption({
    title: {
      text: '房地产现状'
    },
    tooltip: {},
    xAxis: {
      type: 'category',
      data: ['A', 'B', 'C', 'D']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        type: 'bar',
        data: [12, 20, 15, 8]
      }
    ]
  })

  window.addEventListener('resize', resizeChart)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeChart)
  chart?.dispose()
})
</script>