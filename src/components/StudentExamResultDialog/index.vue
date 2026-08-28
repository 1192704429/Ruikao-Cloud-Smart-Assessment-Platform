<template>
  <el-drawer
    :visible.sync="visible"
    direction="rtl"
    size="720px"
    append-to-body
    :show-close="true"
    :with-header="false"
    custom-class="student-result-drawer"
    :before-close="handleClose"
  >
    <div class="drawer-shell">
      <!-- 顶部标题栏 -->
      <header class="drawer-header">
        <div class="drawer-header-main">
          <div class="student-avatar">{{ avatarText }}</div>
          <div class="drawer-header-text">
            <h3 class="drawer-title">{{ studentName || '学生' }}</h3>
            <p v-if="result" class="drawer-subtitle">{{ result.examName }}</p>
            <p v-else class="drawer-subtitle">答题详情</p>
          </div>
        </div>
        <button type="button" class="drawer-close-btn" aria-label="关闭" @click="handleClose">
          <i class="el-icon-close" />
        </button>
      </header>

      <div v-loading="loading" class="drawer-content">
        <template v-if="result">
          <!-- 成绩概览 -->
          <section class="score-hero" :class="{ passed: result.passed, pending: !showPassTag }">
            <div class="score-circle">
              <div class="score-num">{{ formatScore(result.myScore) }}</div>
              <div class="score-label">得分</div>
            </div>
            <div class="score-info">
              <div class="score-stats">
                <div class="stat-chip">
                  <span class="stat-label">试卷总分</span>
                  <span class="stat-value">{{ formatScore(result.totalScore) }}</span>
                </div>
                <div class="stat-chip">
                  <span class="stat-label">及格线</span>
                  <span class="stat-value">{{ formatScore(result.passScore) }}</span>
                </div>
                <div class="stat-chip">
                  <span class="stat-label">答题数</span>
                  <span class="stat-value">{{ answeredCount }} / {{ questionCount }}</span>
                </div>
              </div>
              <div class="score-tags">
                <el-tag v-if="showPassTag" :type="result.passed ? 'success' : 'danger'" effect="dark" size="small">
                  {{ result.passed ? '考试及格' : '未达及格线' }}
                </el-tag>
                <el-tag v-else type="info" effect="plain" size="small">考试进行中</el-tag>
                <el-tag v-if="objectiveStats.total > 0" type="warning" effect="plain" size="small">
                  客观题 {{ objectiveStats.correct }} / {{ objectiveStats.total }} 正确
                </el-tag>
              </div>
            </div>
          </section>

          <!-- 答题列表 -->
          <section class="question-section">
            <div class="section-head">
              <div class="section-head-left">
                <span class="section-icon"><i class="el-icon-document" /></span>
                <h4>答题详情</h4>
                <span class="section-count">共 {{ questionCount }} 题</span>
              </div>
            </div>

            <div class="question-list">
              <article
                v-for="(item, index) in result.items"
                :key="item.questionId"
                :class="['question-card', questionCardClass(item)]"
              >
                <div class="question-card-head">
                  <div class="question-no">
                    <span class="question-no-num">{{ index + 1 }}</span>
                    <span class="question-no-label">题</span>
                  </div>
                  <div class="question-tags">
                    <el-tag size="mini" effect="plain">{{ getQuestionTypeLabel(item.questionType) }}</el-tag>
                    <el-tag
                      v-if="!isSubjectiveQuestion(item)"
                      size="mini"
                      :type="correctTagType(item.isCorrect)"
                    >
                      {{ correctLabel(item.isCorrect) }}
                    </el-tag>
                  </div>
                  <div class="question-score">
                    <span class="question-score-got">{{ formatScore(item.score) }}</span>
                    <span class="question-score-sep">/</span>
                    <span class="question-score-full">{{ formatScore(item.questionScore) }}</span>
                  </div>
                </div>

                <div class="question-text">{{ item.questionText }}</div>

                <div class="answer-blocks">
                  <div
                    class="answer-block"
                    :class="{ 'is-wrong': !isSubjectiveQuestion(item) && item.isCorrect === 0 }"
                  >
                    <div class="answer-block-label">
                      <i class="el-icon-user" />
                      学生答案
                    </div>
                    <div class="answer-block-content">
                      {{ formatAnswerDisplay(item.questionType, item.studentAnswer, parseQuestionOptions(item.options, item.questionType)) || '未作答' }}
                    </div>
                  </div>
                  <div class="answer-block is-reference">
                    <div class="answer-block-label">
                      <i class="el-icon-circle-check" />
                      参考答案
                    </div>
                    <div class="answer-block-content">
                      {{ formatAnswerDisplay(item.questionType, item.correctAnswer, parseQuestionOptions(item.options, item.questionType)) || '—' }}
                    </div>
                  </div>
                  <div v-if="item.analysis" class="answer-block is-analysis">
                    <div class="answer-block-label">
                      <i class="el-icon-info" />
                      题目解析
                    </div>
                    <div class="answer-block-content">{{ item.analysis }}</div>
                  </div>
                </div>
              </article>
            </div>
          </section>
        </template>

        <div v-else-if="!loading" class="drawer-empty">
          <el-empty description="暂无答题数据" :image-size="96" />
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<script>
import { getExamStudentResult } from '@/api/exam_student'
import { getQuestionTypeLabel, parseQuestionOptions, formatAnswerDisplay } from '@/utils/question-helper'

export default {
  name: 'StudentExamResultDialog',
  props: {
    value: {
      type: Boolean,
      default: false
    },
    examId: {
      type: [Number, String],
      default: null
    },
    studentId: {
      type: [Number, String],
      default: null
    },
    studentName: {
      type: String,
      default: ''
    },
    studentStatus: {
      type: Number,
      default: null
    }
  },
  data() {
    return {
      loading: false,
      result: null
    }
  },
  computed: {
    visible: {
      get() {
        return this.value
      },
      set(val) {
        this.$emit('input', val)
      }
    },
    avatarText() {
      const name = (this.studentName || '学').trim()
      return name.slice(-1)
    },
    showPassTag() {
      return this.studentStatus === 2 || (this.result && this.result.studentStatus === 2)
    },
    questionCount() {
      return (this.result && this.result.items && this.result.items.length) || 0
    },
    answeredCount() {
      if (!this.result || !this.result.items) {
        return 0
      }
      return this.result.items.filter(item => {
        const ans = item.studentAnswer
        return ans !== null && ans !== undefined && String(ans).trim() !== ''
      }).length
    },
    objectiveStats() {
      const stats = { total: 0, correct: 0 }
      if (!this.result || !this.result.items) {
        return stats
      }
      this.result.items.forEach(item => {
        if (this.isSubjectiveQuestion(item)) {
          return
        }
        stats.total++
        if (item.isCorrect === 1) {
          stats.correct++
        }
      })
      return stats
    }
  },
  watch: {
    value(val) {
      if (val) {
        this.loadResult()
      } else {
        this.result = null
      }
    }
  },
  methods: {
    getQuestionTypeLabel,
    parseQuestionOptions,
    formatAnswerDisplay,
    formatScore(val) {
      if (val === null || val === undefined || val === '') {
        return '0'
      }
      return val
    },
    isSubjectiveQuestion(item) {
      const type = Number(item && item.questionType)
      return type === 4 || type === 5
    },
    correctLabel(val) {
      if (val === 1) return '正确'
      if (val === 0) return '错误'
      return '待批阅'
    },
    correctTagType(val) {
      if (val === 1) return 'success'
      if (val === 0) return 'danger'
      return 'info'
    },
    questionCardClass(item) {
      if (this.isSubjectiveQuestion(item)) {
        return 'is-subjective'
      }
      if (item.isCorrect === 1) return 'is-correct'
      if (item.isCorrect === 0) return 'is-wrong'
      return 'is-pending'
    },
    async loadResult() {
      if (!this.examId || !this.studentId) {
        return
      }
      this.loading = true
      try {
        const res = await getExamStudentResult(this.examId, this.studentId)
        this.result = (res && res.data) || null
      } catch (e) {
        this.result = null
      } finally {
        this.loading = false
      }
    },
    handleClose(done) {
      this.visible = false
      if (typeof done === 'function') {
        done()
      }
    }
  }
}
</script>

<style lang="scss">
.student-result-drawer {
  .el-drawer__body {
    padding: 0;
    overflow: hidden;
    background: #f0f2f5;
  }
}
</style>

<style scoped lang="scss">
$primary: #409eff;
$primary-light: #ecf5ff;
$text-main: #303133;
$text-sub: #909399;
$border: #e4e7ed;
$success: #67c23a;
$danger: #f56c6c;
$warning: #e6a23c;

.drawer-shell {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.drawer-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 24px;
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
  color: #fff;
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.25);
}

.drawer-header-main {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.student-avatar {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.22);
  border: 2px solid rgba(255, 255, 255, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
}

.drawer-header-text {
  min-width: 0;
}

.drawer-title {
  margin: 0 0 4px;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.3;
}

.drawer-subtitle {
  margin: 0;
  font-size: 13px;
  opacity: 0.88;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.drawer-close-btn {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
}

.drawer-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px 20px 28px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: #dcdfe6;
    border-radius: 4px;
  }
}

.score-hero {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 22px 24px;
  margin-bottom: 20px;
  border-radius: 14px;
  background: #fff;
  border: 1px solid #fde2e2;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.05);
}

.score-hero.passed {
  border-color: #d1fae5;
}

.score-hero.pending {
  border-color: #dbeafe;
}

.score-circle {
  flex-shrink: 0;
  width: 108px;
  height: 108px;
  border-radius: 50%;
  background: linear-gradient(145deg, #fff 0%, #fef2f2 100%);
  border: 3px solid #fecaca;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 20px rgba(245, 108, 108, 0.12);
}

.score-hero.passed .score-circle {
  background: linear-gradient(145deg, #fff 0%, #ecfdf5 100%);
  border-color: #86efac;
  box-shadow: 0 8px 20px rgba(103, 194, 58, 0.12);
}

.score-hero.pending .score-circle {
  background: linear-gradient(145deg, #fff 0%, #eff6ff 100%);
  border-color: #93c5fd;
  box-shadow: 0 8px 20px rgba(64, 158, 255, 0.12);
}

.score-num {
  font-size: 32px;
  font-weight: 700;
  color: $danger;
  line-height: 1;
}

.score-hero.passed .score-num {
  color: $success;
}

.score-hero.pending .score-num {
  color: $primary;
}

.score-label {
  margin-top: 6px;
  font-size: 12px;
  color: $text-sub;
}

.score-info {
  flex: 1;
  min-width: 0;
}

.score-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 14px;
}

.stat-chip {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 14px;
  border-radius: 10px;
  background: #f8fafc;
  border: 1px solid #eef0f4;
  min-width: 88px;
}

.stat-label {
  font-size: 11px;
  color: $text-sub;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: $text-main;
}

.score-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.question-section {
  background: #fff;
  border-radius: 14px;
  border: 1px solid #eef0f4;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04);
  overflow: hidden;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #eef0f4;
  background: #fafbfc;
}

.section-head-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: $primary-light;
  color: $primary;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.section-head h4 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: $text-main;
}

.section-count {
  font-size: 12px;
  color: $text-sub;
  padding: 2px 8px;
  background: #f0f2f5;
  border-radius: 10px;
}

.question-list {
  padding: 8px 16px 16px;
}

.question-card {
  margin-top: 12px;
  padding: 16px 18px;
  border-radius: 12px;
  border: 1px solid #eef0f4;
  background: #fff;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 4px 14px rgba(15, 23, 42, 0.06);
  }

  &.is-correct {
    border-left: 4px solid $success;
  }

  &.is-wrong {
    border-left: 4px solid $danger;
  }

  &.is-subjective {
    border-left: 4px solid $warning;
  }

  &.is-pending {
    border-left: 4px solid #c0c4cc;
  }
}

.question-card-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.question-no {
  flex-shrink: 0;
  display: flex;
  align-items: baseline;
  gap: 2px;
  min-width: 36px;
}

.question-no-num {
  font-size: 20px;
  font-weight: 700;
  color: $primary;
  line-height: 1;
}

.question-no-label {
  font-size: 12px;
  color: $text-sub;
}

.question-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  flex: 1;
}

.question-score {
  flex-shrink: 0;
  display: flex;
  align-items: baseline;
  gap: 2px;
  padding: 4px 10px;
  border-radius: 8px;
  background: $primary-light;
}

.question-score-got {
  font-size: 18px;
  font-weight: 700;
  color: $primary;
}

.question-score-sep {
  font-size: 13px;
  color: $text-sub;
}

.question-score-full {
  font-size: 13px;
  color: $text-sub;
}

.question-text {
  margin-bottom: 14px;
  font-size: 14px;
  line-height: 1.75;
  color: $text-main;
  white-space: pre-wrap;
}

.answer-blocks {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.answer-block {
  padding: 12px 14px;
  border-radius: 10px;
  background: #f8fafc;
  border: 1px solid #eef0f4;
}

.answer-block.is-wrong {
  background: #fef2f2;
  border-color: #fecaca;

  .answer-block-label {
    color: $danger;
  }

  .answer-block-content {
    color: #b91c1c;
  }
}

.answer-block.is-reference {
  background: #f0fdf4;
  border-color: #bbf7d0;

  .answer-block-label {
    color: $success;
  }
}

.answer-block.is-analysis {
  background: #fffbeb;
  border-color: #fde68a;

  .answer-block-label {
    color: $warning;
  }
}

.answer-block-label {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 600;
  color: $text-sub;

  i {
    font-size: 14px;
  }
}

.answer-block-content {
  font-size: 14px;
  line-height: 1.7;
  color: #606266;
  white-space: pre-wrap;
  word-break: break-word;
}

.drawer-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 320px;
  background: #fff;
  border-radius: 14px;
}
</style>
