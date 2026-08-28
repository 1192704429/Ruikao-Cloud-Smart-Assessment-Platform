<template>
  <div class="app-container exam-detail-page">
    <div class="exam-detail-layout">
      <!-- 左侧：我的考试 -->
      <aside class="exam-list-panel">
        <div class="exam-list-panel-header">
          <div class="exam-list-panel-header-main">
            <span class="exam-list-panel-icon"><i class="el-icon-date" /></span>
            <div>
              <div class="exam-list-panel-title">我的考试</div>
              <div class="exam-list-panel-subtitle">共 {{ examTotal }} 场考试</div>
            </div>
          </div>
        </div>
        <div class="exam-search-wrap">
          <el-input
            v-model="examKeyword"
            placeholder="搜索考试名称"
            clearable
            size="small"
            prefix-icon="el-icon-search"
            class="exam-search"
            @keyup.enter.native="loadExamList"
            @clear="loadExamList"
          />
        </div>
        <div v-loading="examListLoading" class="exam-list-wrap">
          <div
            v-for="exam in filteredExamList"
            :key="exam.id"
            :class="['exam-item', { active: selectedExam && selectedExam.id === exam.id }]"
            @click="selectExam(exam)"
          >
            <div class="exam-item-main">
              <div class="exam-item-name" :title="exam.examName">{{ exam.examName }}</div>
              <div class="exam-item-meta">
                <enum-tag :value="exam.status" :label-map="examStatusEnumMap" preset="exam" />
                <span class="exam-item-course">{{ exam.courseName || '—' }}</span>
              </div>
            </div>
            <i v-if="selectedExam && selectedExam.id === exam.id" class="el-icon-check exam-item-check" />
          </div>
          <el-empty v-if="!examListLoading && !filteredExamList.length" description="暂无考试" :image-size="72" />
        </div>
      </aside>

      <!-- 右侧：考试记录 -->
      <section class="record-panel">
        <template v-if="selectedExam">
          <div class="record-panel-top">
            <div class="record-panel-info">
              <div class="record-badge">考试记录</div>
              <h2 class="record-panel-title">{{ selectedExam.examName }}</h2>
              <p class="record-panel-desc">
                {{ selectedExam.courseName || '—' }}
                · 共 <strong>{{ recordTotal }}</strong> 条记录
              </p>
            </div>
            <div class="record-toolbar">
              <el-input
                v-model="recordQuery.name"
                placeholder="搜索学生姓名"
                clearable
                size="small"
                class="toolbar-input"
                @keyup.enter.native="handleRecordQuery"
              />
              <el-select
                v-model="recordQuery.status"
                placeholder="考试状态"
                clearable
                size="small"
                class="toolbar-select"
                @change="handleRecordQuery"
              >
                <el-option
                  v-for="item in recordStatusOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
              <el-button size="medium" plain icon="el-icon-refresh" @click="resetRecordQuery">重置</el-button>
            </div>
          </div>

          <div class="table-wrapper record-table-wrap">
            <el-table v-loading="recordLoading" :data="recordList" class="modern-table">
              <el-table-column label="学生姓名" prop="name" align="left" min-width="120" :show-overflow-tooltip="true" />
              <el-table-column label="学号" prop="studentNo" align="center" min-width="120" :show-overflow-tooltip="true" />
              <el-table-column label="考试状态" prop="status" align="center" width="110">
                <template slot-scope="scope">
                  <enum-tag :value="scope.row.status" :label-map="recordStatusEnumMap" preset="normal" />
                </template>
              </el-table-column>
              <el-table-column label="得分" prop="myScore" align="center" width="90">
                <template slot-scope="scope">
                  <span v-if="scope.row.status === 2" class="score-text">{{ formatScore(scope.row.myScore) }}</span>
                  <span v-else class="score-placeholder">—</span>
                </template>
              </el-table-column>
              <el-table-column label="试卷总分" prop="totalScore" align="center" width="100">
                <template slot-scope="scope">
                  {{ formatScore(scope.row.totalScore) }}
                </template>
              </el-table-column>
              <el-table-column label="及格分" prop="passScore" align="center" width="90">
                <template slot-scope="scope">
                  {{ formatScore(scope.row.passScore) }}
                </template>
              </el-table-column>
              <el-table-column label="是否及格" align="center" width="100">
                <template slot-scope="scope">
                  <template v-if="scope.row.status === 2">
                    <el-tag :type="scope.row.passed ? 'success' : 'danger'" size="mini">
                      {{ scope.row.passed ? '及格' : '未及格' }}
                    </el-tag>
                  </template>
                  <span v-else class="score-placeholder">—</span>
                </template>
              </el-table-column>
              <el-table-column label="加入时间" prop="createTime" align="center" min-width="160" :show-overflow-tooltip="true" />
              <el-table-column label="操作" align="center" width="110" fixed="right">
                <template slot-scope="scope">
                  <el-button
                    type="text"
                    size="small"
                    :disabled="!canViewDetail(scope.row)"
                    @click="openResultDialog(scope.row)"
                  >
                    查看详情
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <student-exam-result-dialog
            v-model="resultDialogVisible"
            :exam-id="resultDialogExamId"
            :student-id="resultDialogStudentId"
            :student-name="resultDialogStudentName"
            :student-status="resultDialogStudentStatus"
          />

          <pagination
            :total="recordTotal"
            :current-page.sync="recordQuery.current"
            :page-size.sync="recordQuery.size"
            :page-sizes="[5, 10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleRecordSizeChange"
            @current-change="handleRecordCurrentChange"
          />
        </template>

        <div v-else class="record-empty">
          <div class="record-empty-inner">
            <i class="el-icon-document record-empty-icon" />
            <p class="record-empty-title">请选择考试</p>
            <p class="record-empty-desc">从左侧选择一场考试，即可查看对应学生的考试记录</p>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import { listExam } from '@/api/exam'
import { pageExamStudent } from '@/api/exam_student'
import Pagination from '@/components/Pagination'
import StudentExamResultDialog from '@/components/StudentExamResultDialog'

export default {
  name: 'ExamDetail',
  components: {
    Pagination,
    StudentExamResultDialog
  },
  data() {
    return {
      examListLoading: false,
      examList: [],
      examKeyword: '',
      selectedExam: null,
      examStatusDraft: 5,
      examStatusEnumMap: { 5: '草稿', 0: '待审核', 1: '已通过', 2: '已驳回', 3: '已发布', 4: '已结束' },
      recordLoading: false,
      recordList: [],
      recordTotal: 0,
      recordQuery: {
        current: 1,
        size: 10,
        examId: null,
        name: null,
        status: null
      },
      recordStatusOptions: [
        { value: 0, label: '待考试' },
        { value: 1, label: '考试中' },
        { value: 2, label: '已完成' },
        { value: 3, label: '缺考' }
      ],
      recordStatusEnumMap: { 0: '待考试', 1: '考试中', 2: '已完成', 3: '缺考' },
      resultDialogVisible: false,
      resultDialogExamId: null,
      resultDialogStudentId: null,
      resultDialogStudentName: '',
      resultDialogStudentStatus: null
    }
  },
  computed: {
    visibleExamList() {
      return this.examList.filter(item => item.status !== this.examStatusDraft)
    },
    examTotal() {
      return this.visibleExamList.length
    },
    filteredExamList() {
      const keyword = (this.examKeyword || '').trim().toLowerCase()
      if (!keyword) {
        return this.visibleExamList
      }
      return this.visibleExamList.filter(item => {
        return (item.examName || '').toLowerCase().includes(keyword)
      })
    }
  },
  created() {
    this.loadExamList()
  },
  methods: {
    formatScore(val) {
      if (val === null || val === undefined || val === '') {
        return '0'
      }
      return val
    },
    canViewDetail(row) {
      return row && (row.status === 1 || row.status === 2)
    },
    openResultDialog(row) {
      if (!this.canViewDetail(row)) {
        return
      }
      this.resultDialogExamId = row.examId
      this.resultDialogStudentId = row.studentId
      this.resultDialogStudentName = row.name || ''
      this.resultDialogStudentStatus = row.status
      this.resultDialogVisible = true
    },
    loadExamList() {
      this.examListLoading = true
      listExam({}).then(response => {
        this.examList = response.data || []
        this.examListLoading = false
        if (this.filteredExamList.length && !this.selectedExam) {
          this.selectExam(this.filteredExamList[0])
        } else if (this.selectedExam) {
          const current = this.filteredExamList.find(item => item.id === this.selectedExam.id)
          this.selectedExam = current || null
          if (!this.selectedExam) {
            this.recordList = []
            this.recordTotal = 0
          } else {
            this.loadRecordList()
          }
        }
      }).catch(() => {
        this.examListLoading = false
      })
    },
    selectExam(exam) {
      this.selectedExam = exam
      this.recordQuery.examId = exam.id
      this.recordQuery.current = 1
      this.recordQuery.name = null
      this.recordQuery.status = null
      this.loadRecordList()
    },
    loadRecordList() {
      if (!this.recordQuery.examId) {
        this.recordList = []
        this.recordTotal = 0
        return
      }
      this.recordLoading = true
      const { current, size, ...rest } = this.recordQuery
      pageExamStudent(current, size, rest).then(response => {
        const pageData = response.data
        this.recordList = pageData.records || []
        this.recordTotal = Number(pageData.total) || 0
        this.recordLoading = false
      }).catch(() => {
        this.recordLoading = false
      })
    },
    handleRecordQuery() {
      this.recordQuery.current = 1
      this.loadRecordList()
    },
    resetRecordQuery() {
      this.recordQuery.current = 1
      this.recordQuery.name = null
      this.recordQuery.status = null
      this.loadRecordList()
    },
    handleRecordSizeChange(val) {
      this.recordQuery.size = val
      this.recordQuery.current = 1
      this.loadRecordList()
    },
    handleRecordCurrentChange(val) {
      this.recordQuery.current = val
      this.loadRecordList()
    }
  }
}
</script>

<style scoped lang="scss">
$primary: #409eff;
$primary-light: #ecf5ff;
$text-main: #303133;
$text-sub: #909399;
$border: #e4e7ed;

.exam-detail-page {
  padding: 16px 20px 24px;
  background: #f0f2f5;
  min-height: calc(100vh - 84px);
}

.exam-detail-layout {
  display: flex;
  gap: 16px;
  align-items: stretch;
  min-height: calc(100vh - 120px);
}

.exam-list-panel {
  width: 300px;
  flex-shrink: 0;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.06);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.exam-list-panel-header {
  padding: 20px 18px 16px;
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
  color: #fff;
}

.exam-list-panel-header-main {
  display: flex;
  align-items: center;
  gap: 12px;
}

.exam-list-panel-icon {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.exam-list-panel-title {
  font-size: 16px;
  font-weight: 600;
  line-height: 1.3;
}

.exam-list-panel-subtitle {
  margin-top: 4px;
  font-size: 12px;
  opacity: 0.85;
}

.exam-search-wrap {
  padding: 14px 14px 0;
}

.exam-search {
  ::v-deep .el-input__inner {
    border-radius: 8px;
    border-color: $border;
    background: #fafbfc;

    &:focus {
      border-color: $primary;
      background: #fff;
    }
  }
}

.exam-list-wrap {
  flex: 1;
  overflow-y: auto;
  padding: 10px 10px 14px;
  min-height: 240px;

  &::-webkit-scrollbar {
    width: 5px;
  }

  &::-webkit-scrollbar-thumb {
    background: #dcdfe6;
    border-radius: 4px;
  }
}

.exam-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
  padding: 11px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.22s ease;
  border: 1px solid transparent;

  &:hover {
    background: #f5f9ff;
    border-color: rgba($primary, 0.15);
  }

  &.active {
    background: $primary-light;
    border-color: rgba($primary, 0.35);
    box-shadow: 0 2px 8px rgba($primary, 0.12);

    .exam-item-name {
      color: $primary;
      font-weight: 600;
    }
  }
}

.exam-item-main {
  flex: 1;
  min-width: 0;
}

.exam-item-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  color: $text-main;
  line-height: 1.4;
  margin-bottom: 6px;
}

.exam-item-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.exam-item-course {
  font-size: 12px;
  color: $text-sub;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.exam-item-check {
  flex-shrink: 0;
  color: $primary;
  font-size: 14px;
  font-weight: bold;
}

.record-panel {
  flex: 1;
  min-width: 0;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.06);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.record-panel-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 24px 18px;
  border-bottom: 1px solid #eef0f4;
}

.record-panel-info {
  min-width: 0;
}

.record-badge {
  display: inline-block;
  margin-bottom: 8px;
  padding: 2px 10px;
  font-size: 12px;
  color: $primary;
  background: $primary-light;
  border-radius: 20px;
}

.record-panel-title {
  margin: 0 0 6px;
  font-size: 20px;
  font-weight: 600;
  color: $text-main;
  line-height: 1.3;
}

.record-panel-desc {
  margin: 0;
  font-size: 14px;
  color: $text-sub;

  strong {
    color: $primary;
  }
}

.record-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

.toolbar-input {
  width: 160px;
}

.toolbar-select {
  width: 120px;
}

.record-table-wrap {
  flex: 1;
  margin: 16px 24px 0;
  background: #fff !important;
  border-radius: 10px;
  border: 1px solid #eef0f4;
  overflow: hidden;
}

.record-panel ::v-deep .pagination-container {
  margin: 12px 24px 20px;
  padding: 0;
}

.record-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 420px;
  background: linear-gradient(180deg, #fafbfc 0%, #fff 100%);
}

.record-empty-inner {
  text-align: center;
  padding: 40px 24px;
}

.record-empty-icon {
  font-size: 64px;
  color: #dcdfe6;
  margin-bottom: 16px;
}

.record-empty-title {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 600;
  color: $text-main;
}

.record-empty-desc {
  margin: 0;
  font-size: 14px;
  color: $text-sub;
  line-height: 1.6;
}

.score-text {
  font-weight: 600;
  color: $primary;
}

.score-placeholder {
  color: #c0c4cc;
}
</style>
