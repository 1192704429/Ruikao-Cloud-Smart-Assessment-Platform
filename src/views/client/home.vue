<template>
  <div class="client-page-wrap">
    <div class="page-hero">
      <div>
        <h2>你好，{{ clientName || '同学' }} 👋</h2>
        <p>在这里查看考试安排、进入考场并完成在线答题</p>
      </div>
      <el-button size="medium" class="pink-btn" icon="el-icon-document" @click="$router.push('/user/exams')">
        我的考试
      </el-button>
    </div>

    <div class="stat-grid">
      <div v-for="item in statCards" :key="item.key" class="stat-card">
        <div class="label">{{ item.label }}</div>
        <div class="value">{{ item.value }}</div>
      </div>
    </div>

    <el-card shadow="never" class="section-card">
      <div class="section-head">
        <h3>近期考试</h3>
        <el-button size="medium" type="text" @click="$router.push('/user/exams')">查看全部</el-button>
      </div>
      <el-table v-loading="loading" :data="recentExams" stripe>
        <el-table-column label="考试名称" prop="examName" min-width="160" />
        <el-table-column label="课程" prop="courseName" min-width="120" />
        <el-table-column label="开始时间" prop="startTime" width="170" />
        <el-table-column label="状态" width="100" align="center">
          <template slot-scope="scope">
            <el-tag :type="statusTagType(scope.row.studentStatus)" size="small">
              {{ statusLabel(scope.row.studentStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" align="center">
          <template slot-scope="scope">
            <el-button size="medium"
              v-if="getExamAction(scope.row).show"
              type="text"
              @click="goExam(scope.row)"
            >
              {{ getExamAction(scope.row).text }}
            </el-button>
            <span v-else class="action-hint">{{ getExamAction(scope.row).hint || '-' }}</span>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && !recentExams.length" description="暂无考试安排，请联系老师分配" />
    </el-card>
  </div>
</template>

<script>
import { clientMyExams } from '@/api/client-exam'
import {
  getExamAction,
  studentStatusLabel,
  studentStatusTagType
} from '@/utils/client-exam-helper'

export default {
  name: 'ClientHome',
  data() {
    return {
      loading: false,
      exams: []
    }
  },
  computed: {
    clientName() {
      return this.$store.getters.clientName
    },
    statCards() {
      const pending = this.exams.filter(item => item.studentStatus === 0).length
      const doing = this.exams.filter(item => item.studentStatus === 1).length
      const done = this.exams.filter(item => item.studentStatus === 2).length
      return [
        { key: 'all', label: '全部考试', value: this.exams.length },
        { key: 'pending', label: '待考试', value: pending },
        { key: 'doing', label: '进行中', value: doing },
        { key: 'done', label: '已完成', value: done }
      ]
    },
    recentExams() {
      return this.exams.slice(0, 5)
    }
  },
  created() {
    this.loadExams()
  },
  methods: {
    async loadExams() {
      this.loading = true
      try {
        const res = await clientMyExams()
        this.exams = (res && res.data) || []
      } finally {
        this.loading = false
      }
    },
    statusLabel(status) {
      return studentStatusLabel(status)
    },
    statusTagType(status) {
      return studentStatusTagType(status)
    },
    getExamAction,
    goExam(row) {
      const action = getExamAction(row)
      if (!action.show) return
      if (action.type === 'result') {
        this.$router.push(`/user/exam/${row.examId}/result`)
        return
      }
      this.$router.push(`/user/exam/${row.examId}`)
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/layout/client/client-page.scss';

.action-hint {
  color: #94a3b8;
  font-size: 13px;
}
</style>
