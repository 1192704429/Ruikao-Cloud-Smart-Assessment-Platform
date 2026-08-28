<template>
  <div class="app-container teacher-statistics-page">
    <div class="page-header">
      <div>
        <h2 class="page-title">成绩统计</h2>
        <p class="page-desc">按课程或考试维度查看学生成绩变化与考试表现</p>
      </div>
      <el-radio-group v-model="activeTab" size="medium" @change="handleTabChange">
        <el-radio-button label="course">按课程</el-radio-button>
        <el-radio-button label="exam">按考试</el-radio-button>
      </el-radio-group>
    </div>

    <!-- 按课程 -->
    <div v-show="activeTab === 'course'" class="stat-layout">
      <aside class="side-panel">
        <div class="side-panel-head">
          <span class="side-panel-icon"><i class="el-icon-reading" /></span>
          <div>
            <div class="side-panel-title">我的课程</div>
            <div class="side-panel-sub">共 {{ courseList.length }} 门</div>
          </div>
        </div>
        <div v-loading="courseLoading" class="side-list-wrap">
          <div
            v-for="item in courseList"
            :key="item.courseId"
            :class="['side-item', { active: selectedCourse && selectedCourse.courseId === item.courseId }]"
            @click="selectCourse(item)"
          >
            <div class="side-item-name" :title="item.courseName">{{ item.courseName }}</div>
            <div class="side-item-meta">
              <span>考试 {{ item.examCount || 0 }}</span>
              <span>学生 {{ item.studentCount || 0 }}</span>
            </div>
          </div>
          <el-empty v-if="!courseLoading && !courseList.length" description="暂无课程数据" :image-size="72" />
        </div>
      </aside>

      <section class="main-panel">
        <template v-if="selectedCourse">
          <div class="main-panel-head">
            <div>
              <h3>{{ selectedCourse.courseName }}</h3>
              <p>课程维度 · 各次考试平均分趋势 / 单个学生成绩变化</p>
            </div>
            <el-select
              v-model="selectedStudentId"
              placeholder="查看维度"
              size="small"
              class="student-select"
              @change="loadCourseChart"
            >
              <el-option label="全班平均分" :value="null" />
              <el-option
                v-for="stu in courseStudents"
                :key="stu.studentId"
                :label="formatStudentLabel(stu)"
                :value="stu.studentId"
              />
            </el-select>
          </div>

          <div class="summary-grid">
            <div class="summary-card"><div class="label">考试场次</div><div class="value">{{ selectedCourse.examCount || 0 }}</div></div>
            <div class="summary-card"><div class="label">完成人次</div><div class="value">{{ selectedCourse.completedCount || 0 }}</div></div>
            <div class="summary-card"><div class="label">平均分</div><div class="value">{{ formatScore(selectedCourse.avgScore) }}</div></div>
            <div class="summary-card"><div class="label">及格率</div><div class="value">{{ passRateText(selectedCourse) }}</div></div>
          </div>

          <el-card shadow="never" class="chart-card" v-loading="courseChartLoading">
            <div class="card-head">
              <h4>{{ courseChartTitle }}</h4>
              <span v-if="courseTimeline.length" class="tip">共 {{ courseTimeline.length }} 个数据点</span>
            </div>
            <div
              v-if="courseTimeline.length"
              :key="'course-chart-' + selectedCourse.courseId + '-' + (selectedStudentId || 'avg')"
              ref="courseChart"
              class="chart-box"
            />
            <el-empty v-else description="暂无已完成考试数据" :image-size="88" />
          </el-card>

          <el-card v-if="courseTimeline.length" shadow="never" class="table-card">
            <div class="card-head"><h4>明细数据</h4></div>
            <el-table :data="courseTimeline" stripe size="medium">
              <el-table-column label="考试名称" prop="name" min-width="160" />
              <el-table-column label="考试时间" prop="startTime" width="170" />
              <el-table-column v-if="!selectedStudentId" label="参考人数" prop="completedCount" width="100" align="center" />
              <el-table-column v-if="!selectedStudentId" label="平均分" width="90" align="center">
                <template slot-scope="scope">{{ formatScore(scope.row.avgScore) }}</template>
              </el-table-column>
              <el-table-column v-if="!selectedStudentId" label="最高分" width="90" align="center">
                <template slot-scope="scope">{{ formatScore(scope.row.maxScore) }}</template>
              </el-table-column>
              <el-table-column v-if="!selectedStudentId" label="最低分" width="90" align="center">
                <template slot-scope="scope">{{ formatScore(scope.row.minScore) }}</template>
              </el-table-column>
              <el-table-column v-if="selectedStudentId" label="得分" width="90" align="center">
                <template slot-scope="scope"><span class="score-highlight">{{ formatScore(scope.row.value) }}</span></template>
              </el-table-column>
              <el-table-column label="及格线" width="90" align="center">
                <template slot-scope="scope">{{ formatScore(scope.row.passScore) }}</template>
              </el-table-column>
            </el-table>
          </el-card>
        </template>
        <div v-else class="main-empty"><el-empty description="请从左侧选择课程" :image-size="96" /></div>
      </section>
    </div>

    <!-- 按考试 -->
    <div v-show="activeTab === 'exam'" class="stat-layout">
      <aside class="side-panel">
        <div class="side-panel-head">
          <span class="side-panel-icon"><i class="el-icon-date" /></span>
          <div>
            <div class="side-panel-title">我的考试</div>
            <div class="side-panel-sub">共 {{ examList.length }} 场</div>
          </div>
        </div>
        <div v-loading="examLoading" class="side-list-wrap">
          <div
            v-for="item in examList"
            :key="item.examId"
            :class="['side-item', { active: selectedExam && selectedExam.examId === item.examId }]"
            @click="selectExam(item)"
          >
            <div class="side-item-name" :title="item.examName">{{ item.examName }}</div>
            <div class="side-item-meta">
              <span>{{ item.courseName || '—' }}</span>
              <span>完成 {{ item.completedCount || 0 }}/{{ item.studentCount || 0 }}</span>
            </div>
          </div>
          <el-empty v-if="!examLoading && !examList.length" description="暂无考试数据" :image-size="72" />
        </div>
      </aside>

      <section class="main-panel">
        <template v-if="selectedExam && examSummary">
          <div class="main-panel-head">
            <div>
              <h3>{{ selectedExam.examName }}</h3>
              <p>{{ examSummary.courseName || '—' }} · 考试维度 · 学生成绩分布与明细</p>
            </div>
          </div>

          <div class="summary-grid">
            <div class="summary-card"><div class="label">应考人数</div><div class="value">{{ examSummary.assignedCount || 0 }}</div></div>
            <div class="summary-card"><div class="label">已完成</div><div class="value">{{ examSummary.completedCount || 0 }}</div></div>
            <div class="summary-card"><div class="label">平均分</div><div class="value">{{ formatScore(examSummary.avgScore) }}</div></div>
            <div class="summary-card"><div class="label">及格率</div><div class="value">{{ examPassRateText(examSummary) }}</div></div>
          </div>

          <div class="exam-charts-row">
            <el-card shadow="never" class="chart-card half" v-loading="examDetailLoading">
              <div class="card-head"><h4>成绩分布</h4></div>
              <div v-if="completedScores.length" ref="examDistChart" class="chart-box chart-box-sm" />
              <el-empty v-else description="暂无已完成成绩" :image-size="72" />
            </el-card>
            <el-card shadow="never" class="chart-card half" v-loading="examDetailLoading">
              <div class="card-head"><h4>参考状态</h4></div>
              <div v-if="examSummary.assignedCount > 0" ref="examStatusChart" class="chart-box chart-box-sm" />
              <el-empty v-else description="暂无学生" :image-size="72" />
            </el-card>
          </div>

          <el-card shadow="never" class="table-card" v-loading="examDetailLoading">
            <div class="card-head"><h4>学生成绩明细</h4></div>
            <el-table :data="examStudentScores" stripe size="medium">
              <el-table-column label="姓名" prop="studentName" min-width="120" />
              <el-table-column label="学号" prop="studentNo" width="130" />
              <el-table-column label="状态" width="100" align="center">
                <template slot-scope="scope">
                  <enum-tag :value="scope.row.status" :label-map="studentStatusMap" preset="normal" />
                </template>
              </el-table-column>
              <el-table-column label="得分" width="90" align="center">
                <template slot-scope="scope">
                  <span v-if="scope.row.status === 2" class="score-highlight">{{ formatScore(scope.row.myScore) }}</span>
                  <span v-else class="text-muted">—</span>
                </template>
              </el-table-column>
              <el-table-column label="试卷总分" width="100" align="center">
                <template slot-scope="scope">{{ formatScore(scope.row.totalScore) }}</template>
              </el-table-column>
              <el-table-column label="及格分" width="90" align="center">
                <template slot-scope="scope">{{ formatScore(scope.row.passScore) }}</template>
              </el-table-column>
              <el-table-column label="是否及格" width="100" align="center">
                <template slot-scope="scope">
                  <template v-if="scope.row.status === 2">
                    <el-tag :type="scope.row.passed ? 'success' : 'danger'" size="mini">
                      {{ scope.row.passed ? '及格' : '未及格' }}
                    </el-tag>
                  </template>
                  <span v-else class="text-muted">—</span>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </template>
        <div v-else class="main-empty"><el-empty description="请从左侧选择考试" :image-size="96" /></div>
      </section>
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import {
  teacherStatCourses,
  teacherCourseExamTimeline,
  teacherCourseStudents,
  teacherCourseStudentTimeline,
  teacherStatExams,
  teacherExamSummary,
  teacherExamStudentScores
} from '@/api/teacher-statistics'

export default {
  name: 'TeacherStatistics',
  data() {
    return {
      activeTab: 'course',
      courseLoading: false,
      courseChartLoading: false,
      examLoading: false,
      examDetailLoading: false,
      courseList: [],
      selectedCourse: null,
      courseStudents: [],
      selectedStudentId: null,
      courseTimeline: [],
      examList: [],
      selectedExam: null,
      examSummary: null,
      examStudentScores: [],
      courseChartInstance: null,
      examDistChartInstance: null,
      examStatusChartInstance: null,
      studentStatusMap: { 0: '待考试', 1: '考试中', 2: '已完成', 3: '缺考' }
    }
  },
  computed: {
    courseChartTitle() {
      if (this.selectedStudentId) {
        const stu = this.courseStudents.find(s => s.studentId === this.selectedStudentId)
        return stu ? `${this.formatStudentLabel(stu)} · 成绩变化` : '学生成绩变化'
      }
      return '各次考试平均分趋势'
    },
    completedScores() {
      return (this.examStudentScores || [])
        .filter(row => row.status === 2)
        .map(row => Number(row.myScore) || 0)
    }
  },
  created() {
    this.loadCourses()
    window.addEventListener('resize', this.handleResize)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize)
    this.disposeAllCharts()
  },
  methods: {
    formatScore(val) {
      if (val === null || val === undefined || val === '') return '—'
      return val
    },
    formatStudentLabel(stu) {
      if (!stu) return ''
      return stu.studentNo ? `${stu.studentName}（${stu.studentNo}）` : stu.studentName
    },
    passRateText(row) {
      const completed = Number(row.completedCount) || 0
      if (!completed) return '—'
      return Math.round((Number(row.passCount || 0) / completed) * 100) + '%'
    },
    examPassRateText(summary) {
      const completed = Number(summary.completedCount) || 0
      if (!completed) return '—'
      return Math.round((Number(summary.passCount || 0) / completed) * 100) + '%'
    },
    handleTabChange() {
      this.disposeAllCharts()
      if (this.activeTab === 'course' && !this.courseList.length) {
        this.loadCourses()
        return
      }
      if (this.activeTab === 'exam' && !this.examList.length) {
        this.loadExams()
        return
      }
      this.scheduleChartRender(() => {
        if (this.activeTab === 'course') {
          this.renderCourseChart()
        } else if (this.activeTab === 'exam') {
          this.renderExamDistChart()
          this.renderExamStatusChart()
        }
      })
    },
    scheduleChartRender(renderFn) {
      this.$nextTick(() => {
        this.$nextTick(() => {
          if (typeof renderFn === 'function') {
            renderFn()
          }
          this.handleResize()
        })
      })
    },
    async loadCourses() {
      this.courseLoading = true
      try {
        const res = await teacherStatCourses()
        this.courseList = (res && res.data) || []
        if (this.courseList.length && !this.selectedCourse) {
          this.selectCourse(this.courseList[0])
        }
      } finally {
        this.courseLoading = false
      }
    },
    async selectCourse(course) {
      this.selectedCourse = course
      this.selectedStudentId = null
      await this.loadCourseStudents()
      await this.loadCourseChart()
    },
    async loadCourseStudents() {
      if (!this.selectedCourse) return
      try {
        const res = await teacherCourseStudents(this.selectedCourse.courseId)
        this.courseStudents = (res && res.data) || []
      } catch (e) {
        this.courseStudents = []
      }
    },
    async loadCourseChart() {
      if (!this.selectedCourse) return
      this.courseChartLoading = true
      try {
        let res
        if (this.selectedStudentId) {
          res = await teacherCourseStudentTimeline(this.selectedCourse.courseId, this.selectedStudentId)
        } else {
          res = await teacherCourseExamTimeline(this.selectedCourse.courseId)
        }
        this.courseTimeline = (res && res.data) || []
      } catch (e) {
        this.courseTimeline = []
        this.disposeCourseChart()
      } finally {
        this.courseChartLoading = false
        this.scheduleChartRender(() => this.renderCourseChart())
      }
    },
    async loadExams() {
      this.examLoading = true
      try {
        const res = await teacherStatExams()
        this.examList = (res && res.data) || []
        if (this.examList.length && !this.selectedExam) {
          this.selectExam(this.examList[0])
        }
      } finally {
        this.examLoading = false
      }
    },
    async selectExam(exam) {
      this.selectedExam = exam
      this.examDetailLoading = true
      try {
        const [summaryRes, scoresRes] = await Promise.all([
          teacherExamSummary(exam.examId),
          teacherExamStudentScores(exam.examId)
        ])
        this.examSummary = (summaryRes && summaryRes.data) || null
        this.examStudentScores = (scoresRes && scoresRes.data) || []
      } catch (e) {
        this.examSummary = null
        this.examStudentScores = []
        this.disposeExamCharts()
      } finally {
        this.examDetailLoading = false
        this.scheduleChartRender(() => {
          this.renderExamDistChart()
          this.renderExamStatusChart()
        })
      }
    },
    renderCourseChart() {
      this.disposeCourseChart()
      const chartEl = this.$refs.courseChart
      if (!this.courseTimeline.length || !chartEl) return
      this.courseChartInstance = echarts.init(chartEl)
      const names = this.courseTimeline.map(i => i.name)
      const values = this.courseTimeline.map(i => Number(i.value != null ? i.value : i.avgScore) || 0)
      const passScores = this.courseTimeline.map(i => Number(i.passScore) || 0)
      const series = [
        {
          name: this.selectedStudentId ? '学生得分' : '平均分',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: { width: 3, color: '#409eff' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(64, 158, 255, 0.35)' },
              { offset: 1, color: 'rgba(64, 158, 255, 0.02)' }
            ])
          },
          data: values
        },
        {
          name: '及格线',
          type: 'line',
          smooth: false,
          symbol: 'none',
          lineStyle: { type: 'dashed', width: 2, color: '#e6a23c' },
          data: passScores
        }
      ]
      if (!this.selectedStudentId) {
        const maxScores = this.courseTimeline.map(i => Number(i.maxScore) || 0)
        const minScores = this.courseTimeline.map(i => Number(i.minScore) || 0)
        series.push(
          { name: '最高分', type: 'line', smooth: true, symbol: 'none', lineStyle: { width: 1.5, color: '#67c23a' }, data: maxScores },
          { name: '最低分', type: 'line', smooth: true, symbol: 'none', lineStyle: { width: 1.5, color: '#f56c6c' }, data: minScores }
        )
      }
      this.courseChartInstance.setOption({
        color: ['#409eff', '#e6a23c', '#67c23a', '#f56c6c'],
        tooltip: { trigger: 'axis' },
        legend: { bottom: 0, data: series.map(s => s.name) },
        grid: { left: 48, right: 24, top: 32, bottom: 56 },
        xAxis: {
          type: 'category',
          data: names,
          axisLabel: { interval: 0, rotate: names.length > 4 ? 25 : 0, fontSize: 11 }
        },
        yAxis: { type: 'value', name: '分数', min: 0 },
        series
      })
      this.courseChartInstance.resize()
    },
    renderExamDistChart() {
      this.disposeExamDistChart()
      if (!this.completedScores.length || !this.$refs.examDistChart) return
      const buckets = this.buildScoreBuckets(this.completedScores, Number(this.examSummary.totalScore) || 100)
      this.examDistChartInstance = echarts.init(this.$refs.examDistChart)
      this.examDistChartInstance.setOption({
        color: ['#409eff'],
        tooltip: { trigger: 'axis' },
        grid: { left: 48, right: 24, top: 24, bottom: 40 },
        xAxis: { type: 'category', data: buckets.map(b => b.label), axisLabel: { fontSize: 11 } },
        yAxis: { type: 'value', name: '人数', minInterval: 1 },
        series: [{ name: '人数', type: 'bar', barMaxWidth: 40, data: buckets.map(b => b.count),
          itemStyle: { borderRadius: [6, 6, 0, 0] } }]
      })
      this.examDistChartInstance.resize()
    },
    renderExamStatusChart() {
      this.disposeExamStatusChart()
      if (!this.examSummary || !this.$refs.examStatusChart) return
      const data = [
        { name: '待考试', value: this.examSummary.pendingCount || 0 },
        { name: '考试中', value: this.examSummary.doingCount || 0 },
        { name: '已完成', value: this.examSummary.completedCount || 0 },
        { name: '缺考', value: this.examSummary.absentCount || 0 }
      ].filter(i => i.value > 0)
      this.examStatusChartInstance = echarts.init(this.$refs.examStatusChart)
      this.examStatusChartInstance.setOption({
        color: ['#909399', '#409eff', '#67c23a', '#f56c6c'],
        tooltip: { trigger: 'item' },
        legend: { bottom: 0 },
        series: [{
          type: 'pie',
          radius: ['42%', '68%'],
          center: ['50%', '45%'],
          data,
          label: { formatter: '{b}: {c}人' }
        }]
      })
      this.examStatusChartInstance.resize()
    },
    buildScoreBuckets(scores, totalScore) {
      const step = totalScore <= 50 ? 10 : 20
      const max = Math.ceil(totalScore / step) * step
      const buckets = []
      for (let start = 0; start < max; start += step) {
        const end = start + step
        const label = end >= max ? `${start}+` : `${start}-${end}`
        const count = scores.filter(s => (end >= max ? s >= start : s >= start && s < end)).length
        buckets.push({ label, count })
      }
      return buckets.filter(b => b.count > 0).length ? buckets : [{ label: '0+', count: scores.length }]
    },
    handleResize() {
      ;[this.courseChartInstance, this.examDistChartInstance, this.examStatusChartInstance].forEach(c => c && c.resize())
    },
    disposeCourseChart() {
      if (this.courseChartInstance) { this.courseChartInstance.dispose(); this.courseChartInstance = null }
    },
    disposeExamCharts() {
      this.disposeExamDistChart()
      this.disposeExamStatusChart()
    },
    disposeExamDistChart() {
      if (this.examDistChartInstance) { this.examDistChartInstance.dispose(); this.examDistChartInstance = null }
    },
    disposeExamStatusChart() {
      if (this.examStatusChartInstance) { this.examStatusChartInstance.dispose(); this.examStatusChartInstance = null }
    },
    disposeAllCharts() {
      this.disposeCourseChart()
      this.disposeExamCharts()
    }
  }
}
</script>

<style scoped lang="scss">
$primary: #409eff;
$text-main: #303133;
$text-sub: #909399;
$border: #eef0f4;

.teacher-statistics-page {
  padding: 16px 20px 24px;
  background: #f0f2f5;
  min-height: calc(100vh - 84px);
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
  padding: 20px 24px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.06);
}

.page-title {
  margin: 0 0 6px;
  font-size: 22px;
  font-weight: 600;
  color: $text-main;
}

.page-desc {
  margin: 0;
  font-size: 14px;
  color: $text-sub;
}

.stat-layout {
  display: flex;
  gap: 16px;
  align-items: stretch;
  min-height: calc(100vh - 200px);
}

.side-panel {
  width: 280px;
  flex-shrink: 0;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.06);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.side-panel-head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 16px;
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
  color: #fff;
}

.side-panel-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.side-panel-title {
  font-size: 15px;
  font-weight: 600;
}

.side-panel-sub {
  margin-top: 2px;
  font-size: 12px;
  opacity: 0.85;
}

.side-list-wrap {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  min-height: 280px;
}

.side-item {
  padding: 12px;
  margin-bottom: 6px;
  border-radius: 10px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s;

  &:hover {
    background: #f5f9ff;
    border-color: rgba($primary, 0.15);
  }

  &.active {
    background: #ecf5ff;
    border-color: rgba($primary, 0.35);
    box-shadow: 0 2px 8px rgba($primary, 0.1);
  }
}

.side-item-name {
  font-size: 14px;
  font-weight: 600;
  color: $text-main;
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.side-item-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 12px;
  color: $text-sub;
}

.main-panel {
  flex: 1;
  min-width: 0;
}

.main-panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
  padding: 18px 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04);

  h3 {
    margin: 0 0 6px;
    font-size: 20px;
    color: $text-main;
  }

  p {
    margin: 0;
    font-size: 13px;
    color: $text-sub;
  }
}

.student-select {
  width: 220px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 16px;
}

.summary-card {
  padding: 16px 18px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid $border;
  box-shadow: 0 2px 12px rgba(15, 23, 42, 0.04);

  .label {
    font-size: 13px;
    color: $text-sub;
  }

  .value {
    margin-top: 8px;
    font-size: 24px;
    font-weight: 700;
    color: $primary;
  }
}

.chart-card, .table-card {
  margin-bottom: 16px;
  border-radius: 12px;
  border: 1px solid $border;

  ::v-deep .el-card__body {
    padding: 16px 20px 20px;
  }
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;

  h4 {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: $text-main;
  }

  .tip {
    font-size: 12px;
    color: $text-sub;
  }
}

.chart-box {
  width: 100%;
  height: 360px;
}

.chart-box-sm {
  height: 300px;
}

.exam-charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;

  .half {
    margin-bottom: 0;
  }
}

.score-highlight {
  font-weight: 700;
  color: $primary;
}

.text-muted {
  color: #c0c4cc;
}

.main-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 420px;
  background: #fff;
  border-radius: 12px;
}

@media (max-width: 1100px) {
  .stat-layout {
    flex-direction: column;
  }

  .side-panel {
    width: 100%;
  }

  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .exam-charts-row {
    grid-template-columns: 1fr;
  }
}
</style>
