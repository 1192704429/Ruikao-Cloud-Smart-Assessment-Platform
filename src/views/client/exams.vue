<template>
  <div class="client-page-wrap">
    <div class="page-hero compact">
      <div>
        <h2>我的考试</h2>
        <p>查看所有已分配的考试，进入考场或查看成绩</p>
      </div>
    </div>

    <el-card shadow="never" class="section-card">
      <el-form :inline="true" size="small" class="filter-form">
        <el-form-item label="考试名称">
          <el-input v-model="keyword" placeholder="搜索考试名称" clearable @keyup.enter.native="applyFilter" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="statusFilter" placeholder="全部" clearable style="width: 130px">
            <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button size="medium" type="primary" icon="el-icon-search" @click="applyFilter">查询</el-button>
        </el-form-item>
      </el-form>

      <el-table v-loading="loading" :data="filteredExams" stripe>
        <el-table-column label="考试名称" prop="examName" min-width="160" />
        <el-table-column label="课程" prop="courseName" min-width="120" />
        <el-table-column label="时长(分钟)" prop="duration" width="100" align="center" />
        <el-table-column label="及格分" prop="passScore" width="90" align="center" />
        <el-table-column label="开始时间" prop="startTime" width="170" />
        <el-table-column label="结束时间" prop="endTime" width="170" />
        <el-table-column label="我的状态" width="100" align="center">
          <template slot-scope="scope">
            <el-tag :type="statusTagType(scope.row.studentStatus)" size="small">
              {{ statusLabel(scope.row.studentStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="得分" width="90" align="center">
          <template slot-scope="scope">
            <span v-if="scope.row.studentStatus === 2">{{ scope.row.myScore }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" align="center" fixed="right">
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
      <el-empty v-if="!loading && !filteredExams.length" description="暂无考试" />
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
  name: 'ClientExams',
  data() {
    return {
      loading: false,
      exams: [],
      keyword: '',
      statusFilter: null,
      statusOptions: [
        { label: '待考试', value: 0 },
        { label: '考试中', value: 1 },
        { label: '已完成', value: 2 },
        { label: '缺考', value: 3 }
      ]
    }
  },
  computed: {
    filteredExams() {
      return this.exams.filter(item => {
        const matchName = !this.keyword || (item.examName || '').includes(this.keyword.trim())
        const matchStatus = this.statusFilter === null || this.statusFilter === '' || item.studentStatus === this.statusFilter
        return matchName && matchStatus
      })
    }
  },
  created() {
    this.loadExams()
  },
  methods: {
    applyFilter() {
      // computed handles filter
    },
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

.page-hero.compact {
  padding: 22px 28px;
}

.filter-form {
  margin-bottom: 12px;
}

.action-hint {
  color: #94a3b8;
  font-size: 13px;
}
</style>
