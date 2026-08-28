<template>
  <div v-loading="loading" class="dashboard-page app-container">
    <!-- 管理员首页 -->
    <template v-if="isAdmin">
      <section class="dashboard-hero admin">
        <div class="hero-main">
          <h2>你好，{{ userName || '管理员' }}</h2>
          <p>欢迎使用睿考云管理后台，可在此查看平台运行概况与待办事项</p>
        </div>
        <div class="hero-actions">
          <el-button type="primary" plain icon="el-icon-s-check" @click="go('/examAudit/index')">考试审核</el-button>
          <el-button plain icon="el-icon-user" @click="go('/teacherManagement/index')">教师管理</el-button>
        </div>
      </section>

      <div class="stat-grid">
        <div v-for="item in adminStatCards" :key="item.key" class="stat-card" :class="item.theme">
          <div class="stat-icon"><i :class="item.icon" /></div>
          <div class="stat-body">
            <div class="stat-label">{{ item.label }}</div>
            <div class="stat-value">{{ item.value }}</div>
          </div>
        </div>
      </div>

      <div class="dashboard-main">
        <el-card shadow="never" class="panel-card table-panel">
          <div class="panel-head">
            <div>
              <h3>待审核考试</h3>
              <p>需要尽快处理的考试申请</p>
            </div>
            <el-button type="text" @click="go('/examAudit/index')">前往审核</el-button>
          </div>
          <el-table :data="pendingAuditExams" stripe size="medium">
            <el-table-column label="考试名称" prop="examName" min-width="160" show-overflow-tooltip />
            <el-table-column label="课程" prop="courseName" min-width="120" show-overflow-tooltip />
            <el-table-column label="提交教师" prop="teacherName" width="120" show-overflow-tooltip />
            <el-table-column label="提交时间" prop="createTime" width="170" />
            <el-table-column label="操作" width="90" align="center">
              <template slot-scope="scope">
                <el-button type="text" size="small" @click="go('/examAudit/index')">审核</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="!pendingAuditExams.length" description="暂无待审核考试" :image-size="72" />
        </el-card>

        <div class="chart-grid admin-charts">
          <el-card shadow="never" class="panel-card chart-panel">
            <div class="panel-head compact"><h3>考试状态分布</h3></div>
            <div v-if="examStatusChart.length" ref="adminStatusChart" class="chart-box" />
            <el-empty v-else description="暂无数据" :image-size="72" />
          </el-card>
          <el-card shadow="never" class="panel-card chart-panel">
            <div class="panel-head compact"><h3>近12月考试发布趋势</h3></div>
            <div v-if="monthlyPublishChart.length" ref="adminTrendChart" class="chart-box" />
            <el-empty v-else description="暂无数据" :image-size="72" />
          </el-card>
          <el-card shadow="never" class="panel-card chart-panel">
            <div class="panel-head compact"><h3>班级学生人数 Top8</h3></div>
            <div v-if="classStudentChart.length" ref="adminClassChart" class="chart-box" />
            <el-empty v-else description="暂无数据" :image-size="72" />
          </el-card>
        </div>
      </div>
    </template>

    <!-- 教师首页 -->
    <template v-else-if="isTeacher">
      <section class="dashboard-hero teacher">
        <div class="hero-main">
          <h2>你好，{{ userName || '老师' }}</h2>
          <p>这里是您的工作台，可快速查看考试进度、学生完成情况与常用入口</p>
        </div>
        <div class="hero-actions">
          <el-button type="primary" plain icon="el-icon-plus" @click="go('/examManagement/index')">考试管理</el-button>
          <el-button plain icon="el-icon-data-analysis" @click="go('/teacherStatistics/index')">成绩统计</el-button>
        </div>
      </section>

      <div class="stat-grid teacher-grid">
        <div v-for="item in teacherStatCards" :key="item.key" class="stat-card" :class="item.theme">
          <div class="stat-icon"><i :class="item.icon" /></div>
          <div class="stat-body">
            <div class="stat-label">{{ item.label }}</div>
            <div class="stat-value">{{ item.value }}</div>
          </div>
        </div>
      </div>

      <div class="quick-links">
        <div v-for="link in teacherQuickLinks" :key="link.path" class="quick-link" @click="go(link.path)">
          <i :class="link.icon" />
          <span>{{ link.label }}</span>
        </div>
      </div>

      <div class="dashboard-main teacher-main">
        <el-card shadow="never" class="panel-card table-panel">
          <div class="panel-head">
            <div>
              <h3>最近考试</h3>
              <p>您最近创建或更新的考试</p>
            </div>
            <el-button type="text" @click="go('/examManagement/index')">全部考试</el-button>
          </div>
          <el-table :data="recentExams" stripe size="medium">
            <el-table-column label="考试名称" prop="examName" min-width="160" show-overflow-tooltip />
            <el-table-column label="课程" prop="courseName" min-width="120" show-overflow-tooltip />
            <el-table-column label="状态" width="110" align="center">
              <template slot-scope="scope">
                <enum-tag :value="scope.row.status" :label-map="examStatusMap" preset="exam" />
              </template>
            </el-table-column>
            <el-table-column label="开始时间" prop="startTime" width="170" />
            <el-table-column label="操作" width="120" align="center">
              <template slot-scope="scope">
                <el-button type="text" size="small" @click="go('/examDetail/index')">查看详情</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="!recentExams.length" description="暂无考试，去创建一场吧" :image-size="72" />
        </el-card>

        <div class="chart-grid teacher-charts">
          <el-card shadow="never" class="panel-card chart-panel">
            <div class="panel-head compact"><h3>我的考试状态</h3></div>
            <div v-if="examStatusChart.length" ref="teacherStatusChart" class="chart-box" />
            <el-empty v-else description="暂无数据" :image-size="72" />
          </el-card>
          <el-card shadow="never" class="panel-card chart-panel">
            <div class="panel-head compact"><h3>学生参考情况</h3></div>
            <div v-if="studentFinishChart.length" ref="teacherFinishChart" class="chart-box" />
            <el-empty v-else description="暂无数据" :image-size="72" />
          </el-card>
        </div>
      </div>
    </template>

    <el-empty v-else description="暂无工作台数据" />
  </div>
</template>

<script>
import * as echarts from 'echarts'
import { adminDashboardOverview, teacherDashboardOverview } from '@/api/dashboard'

export default {
  name: 'Dashboard',
  data() {
    return {
      loading: false,
      overview: null,
      examStatusMap: { 5: '草稿', 0: '待审核', 1: '已通过', 2: '已驳回', 3: '已发布', 4: '已结束' },
      chartInstances: []
    }
  },
  computed: {
    userName() {
      return this.$store.getters.name
    },
    role() {
      return this.$store.getters.role
    },
    isAdmin() {
      return this.role === 'admin'
    },
    isTeacher() {
      return this.role === 'teacher'
    },
    stats() {
      return (this.overview && this.overview.stats) || {}
    },
    pendingAuditExams() {
      return (this.overview && this.overview.pendingAuditExams) || []
    },
    recentExams() {
      return (this.overview && this.overview.recentExams) || []
    },
    examStatusChart() {
      return (this.overview && this.overview.examStatusChart) || []
    },
    monthlyPublishChart() {
      return (this.overview && this.overview.secondaryChart) || []
    },
    classStudentChart() {
      return (this.overview && this.overview.tertiaryChart) || []
    },
    studentFinishChart() {
      return (this.overview && this.overview.secondaryChart) || []
    },
    adminStatCards() {
      return [
        { key: 'course', label: '课程总数', value: this.num('courseCount'), icon: 'el-icon-reading', theme: 'blue' },
        { key: 'teacher', label: '教师总数', value: this.num('teacherCount'), icon: 'el-icon-user', theme: 'cyan' },
        { key: 'student', label: '学生总数', value: this.num('studentCount'), icon: 'el-icon-s-custom', theme: 'green' },
        { key: 'class', label: '班级总数', value: this.num('classCount'), icon: 'el-icon-office-building', theme: 'purple' },
        { key: 'exam', label: '考试总数', value: this.num('examCount'), icon: 'el-icon-date', theme: 'orange' },
        { key: 'audit', label: '待审核', value: this.num('pendingAuditCount'), icon: 'el-icon-s-check', theme: 'red' }
      ]
    },
    teacherStatCards() {
      return [
        { key: 'question', label: '题库题目', value: this.num('questionCount'), icon: 'el-icon-edit-outline', theme: 'blue' },
        { key: 'paper', label: '试卷数量', value: this.num('paperCount'), icon: 'el-icon-document', theme: 'cyan' },
        { key: 'exam', label: '考试总数', value: this.num('examCount'), icon: 'el-icon-date', theme: 'green' },
        { key: 'published', label: '已发布/结束', value: this.num('publishedExamCount'), icon: 'el-icon-success', theme: 'purple' },
        { key: 'pending', label: '待审核', value: this.num('pendingAuditCount'), icon: 'el-icon-time', theme: 'orange' },
        { key: 'course', label: '涉及课程', value: this.num('courseCount'), icon: 'el-icon-reading', theme: 'red' }
      ]
    },
    teacherQuickLinks() {
      return [
        { label: '题库管理', path: '/teacherQuestionList', icon: 'el-icon-edit-outline' },
        { label: '试卷管理', path: '/examPaperManagement/index', icon: 'el-icon-document' },
        { label: '考试管理', path: '/examManagement/index', icon: 'el-icon-date' },
        { label: '考试详情', path: '/examDetail/index', icon: 'el-icon-data-line' },
        { label: '成绩统计', path: '/teacherStatistics/index', icon: 'el-icon-data-analysis' }
      ]
    }
  },
  created() {
    this.loadOverview()
    window.addEventListener('resize', this.handleResize)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize)
    this.disposeCharts()
  },
  methods: {
    num(key) {
      const val = this.stats[key]
      return val === null || val === undefined ? 0 : val
    },
    go(path) {
      this.$router.push(path)
    },
    async loadOverview() {
      if (!this.isAdmin && !this.isTeacher) return
      this.loading = true
      try {
        const res = this.isAdmin
          ? await adminDashboardOverview()
          : await teacherDashboardOverview()
        this.overview = (res && res.data) || null
      } finally {
        this.loading = false
        this.scheduleRenderCharts()
      }
    },
    scheduleRenderCharts() {
      this.$nextTick(() => {
        this.$nextTick(() => {
          this.renderCharts()
        })
      })
    },
    renderCharts() {
      this.disposeCharts()
      if (this.isAdmin) {
        this.renderPie(this.$refs.adminStatusChart, this.examStatusChart, '考试状态')
        this.renderLine(this.$refs.adminTrendChart, this.monthlyPublishChart, '发布数量')
        this.renderBar(this.$refs.adminClassChart, this.classStudentChart, '学生人数')
      } else if (this.isTeacher) {
        this.renderPie(this.$refs.teacherStatusChart, this.examStatusChart, '考试状态')
        this.renderPie(this.$refs.teacherFinishChart, this.studentFinishChart, '参考情况', ['#909399', '#409eff', '#67c23a', '#f56c6c'])
      }
    },
    renderPie(el, data, seriesName, colors) {
      if (!el || !data.length) return
      const chart = echarts.init(el)
      chart.setOption({
        color: colors || ['#909399', '#e6a23c', '#67c23a', '#f56c6c', '#409eff', '#909399'],
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
        legend: { bottom: 0, type: 'scroll' },
        series: [{
          name: seriesName,
          type: 'pie',
          radius: ['42%', '68%'],
          center: ['50%', '45%'],
          data: data.map(item => ({ name: item.name, value: item.value })),
          label: { formatter: '{b}\n{c}' }
        }]
      })
      chart.resize()
      this.chartInstances.push(chart)
    },
    renderLine(el, data, seriesName) {
      if (!el || !data.length) return
      const chart = echarts.init(el)
      chart.setOption({
        color: ['#409eff'],
        tooltip: { trigger: 'axis' },
        grid: { left: 48, right: 24, top: 24, bottom: 40 },
        xAxis: { type: 'category', data: data.map(i => i.name), axisLabel: { fontSize: 11 } },
        yAxis: { type: 'value', minInterval: 1 },
        series: [{
          name: seriesName,
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 7,
          areaStyle: { color: 'rgba(64, 158, 255, 0.12)' },
          data: data.map(i => i.value)
        }]
      })
      chart.resize()
      this.chartInstances.push(chart)
    },
    renderBar(el, data, seriesName) {
      if (!el || !data.length) return
      const chart = echarts.init(el)
      chart.setOption({
        color: ['#67c23a'],
        tooltip: { trigger: 'axis' },
        grid: { left: 48, right: 24, top: 24, bottom: 56 },
        xAxis: {
          type: 'category',
          data: data.map(i => i.name),
          axisLabel: { interval: 0, rotate: data.length > 4 ? 25 : 0, fontSize: 11 }
        },
        yAxis: { type: 'value', minInterval: 1 },
        series: [{
          name: seriesName,
          type: 'bar',
          barMaxWidth: 36,
          data: data.map(i => i.value),
          itemStyle: { borderRadius: [6, 6, 0, 0] }
        }]
      })
      chart.resize()
      this.chartInstances.push(chart)
    },
    handleResize() {
      this.chartInstances.forEach(chart => chart && chart.resize())
    },
    disposeCharts() {
      this.chartInstances.forEach(chart => chart && chart.dispose())
      this.chartInstances = []
    }
  }
}
</script>

<style lang="scss" scoped>
$primary: #409eff;
$text-main: #303133;
$text-sub: #909399;

.dashboard-page {
  padding: 16px 20px 28px;
  background: #f0f2f5;
  min-height: calc(100vh - 84px);
}

.dashboard-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 24px 28px;
  margin-bottom: 18px;
  border-radius: 14px;
  color: #fff;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);

  &.admin {
    background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
  }

  &.teacher {
    background: linear-gradient(135deg, #36cfc9 0%, #5cdbd3 100%);
  }

  h2 {
    margin: 0 0 8px;
    font-size: 26px;
    font-weight: 600;
  }

  p {
    margin: 0;
    font-size: 14px;
    opacity: 0.92;
  }
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 18px;
}

.teacher-grid {
  grid-template-columns: repeat(6, minmax(0, 1fr));
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 16px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #eef0f4;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
}

.stat-icon {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.stat-card.blue .stat-icon { background: #ecf5ff; color: #409eff; }
.stat-card.cyan .stat-icon { background: #e6fffb; color: #13c2c2; }
.stat-card.green .stat-icon { background: #f6ffed; color: #52c41a; }
.stat-card.purple .stat-icon { background: #f9f0ff; color: #722ed1; }
.stat-card.orange .stat-icon { background: #fff7e6; color: #fa8c16; }
.stat-card.red .stat-icon { background: #fff1f0; color: #f5222d; }

.stat-label {
  font-size: 13px;
  color: $text-sub;
}

.stat-value {
  margin-top: 6px;
  font-size: 26px;
  font-weight: 700;
  color: $text-main;
  line-height: 1;
}

.quick-links {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}

.quick-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 12px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #eef0f4;
  cursor: pointer;
  transition: all 0.2s;
  color: $text-main;
  font-size: 14px;

  i {
    color: $primary;
    font-size: 18px;
  }

  &:hover {
    border-color: rgba($primary, 0.35);
    box-shadow: 0 4px 14px rgba(64, 158, 255, 0.12);
    transform: translateY(-1px);
  }
}

.dashboard-main {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.panel-card {
  border-radius: 12px;
  border: 1px solid #eef0f4;

  ::v-deep .el-card__body {
    padding: 18px 20px 20px;
  }
}

.panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 14px;

  h3 {
    margin: 0 0 4px;
    font-size: 17px;
    font-weight: 600;
    color: $text-main;
  }

  p {
    margin: 0;
    font-size: 13px;
    color: $text-sub;
  }

  &.compact {
    margin-bottom: 8px;
  }
}

.chart-grid {
  display: grid;
  gap: 16px;
}

.admin-charts {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.teacher-charts {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.chart-box {
  width: 100%;
  height: 300px;
}

@media (max-width: 1200px) {
  .stat-grid,
  .teacher-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .quick-links {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .admin-charts {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .dashboard-hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .stat-grid,
  .teacher-grid,
  .quick-links,
  .teacher-charts {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
