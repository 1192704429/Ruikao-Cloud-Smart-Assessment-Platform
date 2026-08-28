<template>
  <div class="client-page-wrap statistics-page">
    <div class="page-hero">
      <div>
        <h2>课程统计</h2>
        <p>查看你参加过的各门课程，以及该课程下考试成绩的变化趋势</p>
      </div>
    </div>

    <div class="statistics-layout">
      <!-- 左侧课程列表 -->
      <aside class="course-panel">
        <div class="course-panel-head">
          <span class="course-panel-icon"><i class="el-icon-reading" /></span>
          <div>
            <div class="course-panel-title">我的课程</div>
            <div class="course-panel-sub">共 {{ courseList.length }} 门</div>
          </div>
        </div>
        <div v-loading="courseLoading" class="course-list-wrap">
          <div
            v-for="course in courseList"
            :key="course.courseId"
            :class="['course-item', { active: selectedCourse && selectedCourse.courseId === course.courseId }]"
            @click="selectCourse(course)"
          >
            <div class="course-item-name" :title="course.courseName">{{ course.courseName }}</div>
            <div class="course-item-meta">
              <span>考试 {{ course.examCount || 0 }} 场</span>
              <span>已完成 {{ course.completedCount || 0 }} 场</span>
            </div>
            <div v-if="course.completedCount > 0" class="course-item-score">
              均分 <strong>{{ formatScore(course.avgScore) }}</strong>
            </div>
          </div>
          <el-empty v-if="!courseLoading && !courseList.length" description="暂无课程数据" :image-size="72" />
        </div>
      </aside>

      <!-- 右侧统计 -->
      <section class="chart-panel">
        <template v-if="selectedCourse">
          <div class="chart-panel-head">
            <div>
              <h3>{{ selectedCourse.courseName }}</h3>
              <p>考试成绩变化趋势（按考试时间排序）</p>
            </div>
          </div>

          <div class="summary-grid">
            <div class="summary-card">
              <div class="summary-label">安排考试</div>
              <div class="summary-value">{{ selectedCourse.examCount || 0 }}</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">已完成</div>
              <div class="summary-value">{{ selectedCourse.completedCount || 0 }}</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">平均分</div>
              <div class="summary-value">{{ formatScore(selectedCourse.avgScore) }}</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">及格率</div>
              <div class="summary-value">{{ passRateText(selectedCourse) }}</div>
            </div>
          </div>

          <el-card shadow="never" class="section-card chart-card" v-loading="timelineLoading">
            <div class="section-head">
              <h3>成绩折线图</h3>
              <span v-if="timeline.length" class="chart-tip">共 {{ timeline.length }} 次已完成考试</span>
            </div>
            <div v-if="timeline.length" ref="scoreChart" class="score-chart" />
            <el-empty v-else description="该课程暂无已完成考试，完成考试后可查看趋势" :image-size="88" />
          </el-card>

          <el-card v-if="timeline.length" shadow="never" class="section-card record-card">
            <div class="section-head">
              <h3>考试明细</h3>
            </div>
            <el-table :data="timeline" stripe size="medium">
              <el-table-column label="考试名称" prop="name" min-width="160" />
              <el-table-column label="考试时间" prop="startTime" width="170" />
              <el-table-column label="得分" width="90" align="center">
                <template slot-scope="scope">
                  <span class="score-highlight">{{ formatScore(scope.row.value) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="试卷总分" width="100" align="center">
                <template slot-scope="scope">{{ formatScore(scope.row.totalScore) }}</template>
              </el-table-column>
              <el-table-column label="及格分" width="90" align="center">
                <template slot-scope="scope">{{ formatScore(scope.row.passScore) }}</template>
              </el-table-column>
              <el-table-column label="结果" width="90" align="center">
                <template slot-scope="scope">
                  <el-tag :type="isPassed(scope.row) ? 'success' : 'danger'" size="mini">
                    {{ isPassed(scope.row) ? '及格' : '未及格' }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </template>

        <div v-else class="chart-empty">
          <el-empty description="请从左侧选择一门课程" :image-size="96" />
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import { clientMyCourses, clientCourseScoreTimeline } from '@/api/client-statistics'

export default {
  name: 'ClientStatistics',
  data() {
    return {
      courseLoading: false,
      timelineLoading: false,
      courseList: [],
      selectedCourse: null,
      timeline: [],
      chartInstance: null
    }
  },
  created() {
    this.loadCourses()
    window.addEventListener('resize', this.handleResize)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize)
    this.disposeChart()
  },
  methods: {
    formatScore(val) {
      if (val === null || val === undefined || val === '') {
        return '—'
      }
      return val
    },
    passRateText(course) {
      const completed = Number(course.completedCount) || 0
      if (completed === 0) {
        return '—'
      }
      const passCount = Number(course.passCount) || 0
      return Math.round((passCount / completed) * 100) + '%'
    },
    isPassed(row) {
      if (row.passScore === null || row.passScore === undefined || row.passScore === '') {
        return false
      }
      const score = Number(row.value) || 0
      const passScore = Number(row.passScore) || 0
      return score >= passScore
    },
    async loadCourses() {
      this.courseLoading = true
      try {
        const res = await clientMyCourses()
        this.courseList = (res && res.data) || []
        if (this.courseList.length && !this.selectedCourse) {
          this.selectCourse(this.courseList[0])
        } else if (this.selectedCourse) {
          const current = this.courseList.find(item => item.courseId === this.selectedCourse.courseId)
          this.selectedCourse = current || null
          if (this.selectedCourse) {
            this.loadTimeline()
          } else {
            this.timeline = []
            this.disposeChart()
          }
        }
      } finally {
        this.courseLoading = false
      }
    },
    selectCourse(course) {
      this.selectedCourse = course
      this.loadTimeline()
    },
    async loadTimeline() {
      if (!this.selectedCourse) {
        return
      }
      this.timelineLoading = true
      try {
        const res = await clientCourseScoreTimeline(this.selectedCourse.courseId)
        this.timeline = (res && res.data) || []
      } catch (e) {
        this.timeline = []
        this.disposeChart()
      } finally {
        this.timelineLoading = false
        this.$nextTick(() => {
          this.$nextTick(() => {
            this.renderChart()
          })
        })
      }
    },
    renderChart() {
      this.disposeChart()
      const chartEl = this.$refs.scoreChart
      if (!this.timeline.length || !chartEl) {
        return
      }
      this.chartInstance = echarts.init(chartEl)
      const names = this.timeline.map(item => item.name)
      const scores = this.timeline.map(item => Number(item.value) || 0)
      const passScores = this.timeline.map(item => Number(item.passScore) || 0)
      this.chartInstance.setOption({
        color: ['#38bdf8', '#fbbf24'],
        tooltip: {
          trigger: 'axis',
          formatter: (params) => {
            const idx = params[0] && params[0].dataIndex
            const row = this.timeline[idx] || {}
            const lines = [
              row.name || '',
              `得分：${this.formatScore(row.value)}`,
              `试卷总分：${this.formatScore(row.totalScore)}`,
              `及格线：${this.formatScore(row.passScore)}`,
              row.startTime ? `时间：${row.startTime}` : ''
            ]
            return lines.filter(Boolean).join('<br/>')
          }
        },
        legend: {
          data: ['我的得分', '及格线'],
          bottom: 0
        },
        grid: {
          left: 48,
          right: 24,
          top: 32,
          bottom: 56
        },
        xAxis: {
          type: 'category',
          data: names,
          axisLabel: {
            interval: 0,
            rotate: names.length > 4 ? 30 : 0,
            fontSize: 11,
            color: '#64748b'
          },
          axisLine: { lineStyle: { color: '#e2e8f0' } }
        },
        yAxis: {
          type: 'value',
          name: '分数',
          min: 0,
          axisLabel: { color: '#64748b' },
          splitLine: { lineStyle: { color: '#f1f5f9' } }
        },
        series: [
          {
            name: '我的得分',
            type: 'line',
            smooth: true,
            symbol: 'circle',
            symbolSize: 8,
            lineStyle: { width: 3 },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(56, 189, 248, 0.35)' },
                { offset: 1, color: 'rgba(56, 189, 248, 0.02)' }
              ])
            },
            data: scores
          },
          {
            name: '及格线',
            type: 'line',
            smooth: false,
            symbol: 'none',
            lineStyle: { type: 'dashed', width: 2 },
            data: passScores
          }
        ]
      })
      this.chartInstance.resize()
    },
    handleResize() {
      if (this.chartInstance) {
        this.chartInstance.resize()
      }
    },
    disposeChart() {
      if (this.chartInstance) {
        this.chartInstance.dispose()
        this.chartInstance = null
      }
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/layout/client/client-page.scss';
@import '@/layout/client/client-theme.scss';

.statistics-layout {
  display: flex;
  gap: 20px;
  align-items: stretch;
  min-height: 520px;
}

.course-panel {
  width: 280px;
  flex-shrink: 0;
  background: $client-color-surface;
  border-radius: 16px;
  border: 1px solid rgba(186, 230, 253, 0.6);
  box-shadow: 0 8px 24px rgba(56, 189, 248, 0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.course-panel-head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 18px;
  background: linear-gradient(135deg, #e0f2fe 0%, #f0fdfa 100%);
  border-bottom: 1px solid rgba(186, 230, 253, 0.5);
}

.course-panel-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: rgba(56, 189, 248, 0.15);
  color: $client-color-primary-dark;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.course-panel-title {
  font-size: 16px;
  font-weight: 600;
  color: $client-color-text-main;
}

.course-panel-sub {
  margin-top: 4px;
  font-size: 12px;
  color: $client-color-text-secondary;
}

.course-list-wrap {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  min-height: 240px;
}

.course-item {
  padding: 14px 14px 12px;
  margin-bottom: 8px;
  border-radius: 12px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #fafbfc;

  &:hover {
    border-color: rgba(56, 189, 248, 0.25);
    background: #f0f9ff;
  }

  &.active {
    border-color: rgba(56, 189, 248, 0.45);
    background: linear-gradient(135deg, rgba(224, 242, 254, 0.8), rgba(240, 253, 250, 0.9));
    box-shadow: 0 4px 12px rgba(56, 189, 248, 0.12);
  }
}

.course-item-name {
  font-size: 14px;
  font-weight: 600;
  color: $client-color-text-main;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.course-item-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: $client-color-text-secondary;
}

.course-item-score {
  margin-top: 8px;
  font-size: 12px;
  color: $client-color-text-secondary;

  strong {
    color: $client-color-primary-dark;
    font-size: 14px;
  }
}

.chart-panel {
  flex: 1;
  min-width: 0;
}

.chart-panel-head {
  margin-bottom: 16px;

  h3 {
    margin: 0 0 6px;
    font-size: 22px;
    color: $client-color-text-main;
  }

  p {
    margin: 0;
    font-size: 14px;
    color: $client-color-text-secondary;
  }
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 18px;
}

.summary-card {
  padding: 16px 18px;
  border-radius: 14px;
  background: $client-color-surface;
  border: 1px solid $client-color-border;
  box-shadow: 0 4px 14px rgba(56, 189, 248, 0.05);
}

.summary-label {
  font-size: 13px;
  color: $client-color-text-secondary;
}

.summary-value {
  margin-top: 8px;
  font-size: 24px;
  font-weight: 700;
  color: $client-color-primary-dark;
}

.chart-card {
  margin-bottom: 18px;
}

.chart-tip {
  font-size: 13px;
  color: $client-color-text-secondary;
}

.score-chart {
  width: 100%;
  height: 360px;
}

.record-card {
  margin-bottom: 0;
}

.score-highlight {
  font-weight: 700;
  color: $client-color-primary-dark;
}

.chart-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 420px;
  background: $client-color-surface;
  border-radius: 16px;
  border: 1px dashed rgba(186, 230, 253, 0.8);
}

@media (max-width: 960px) {
  .statistics-layout {
    flex-direction: column;
  }

  .course-panel {
    width: 100%;
  }

  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
