<template>
  <div v-loading="loading" class="exam-take-page">
    <template v-if="examData">
      <div class="exam-top-bar">
        <div class="exam-title-wrap">
          <h2>{{ examData.examName }}</h2>
          <p>共 {{ questions.length }} 题，请认真作答</p>
        </div>
        <div class="timer-box" :class="{ danger: remainSeconds <= 300 }">
          <i class="el-icon-time" />
          <span>剩余 {{ formatRemain(remainSeconds) }}</span>
        </div>
        <div class="top-actions">
          <el-button size="medium" :loading="saving" @click="handleSave(false)">保存答案</el-button>
          <el-button type="primary" size="medium" :loading="submitting" @click="handleSubmit">提交完成</el-button>
        </div>
      </div>

      <div class="exam-body">
        <aside class="question-nav">
          <div class="nav-title">答题卡</div>
          <div class="nav-grid">
            <button
              v-for="(q, index) in questions"
              :key="q.questionId"
              type="button"
              class="nav-item"
              :class="{ active: currentIndex === index, answered: isAnswered(q) }"
              @click="currentIndex = index"
            >
              {{ index + 1 }}
            </button>
          </div>
        </aside>

        <main class="question-panel">
          <div v-if="currentQuestion" class="question-card">
            <div class="question-head">
              <span class="q-index">第 {{ currentIndex + 1 }} 题</span>
              <el-tag size="mini">{{ getQuestionTypeLabel(currentQuestion.questionType) }}</el-tag>
              <span class="q-score">{{ currentQuestion.questionScore || 0 }} 分</span>
            </div>
            <div class="question-text">{{ currentQuestion.questionText }}</div>

            <!-- 单选 -->
            <el-radio-group
              v-if="Number(currentQuestion.questionType) === 1"
              v-model="answerMap[currentQuestion.questionId]"
              class="option-group"
            >
              <el-radio
                v-for="opt in parseQuestionOptions(currentQuestion.options, currentQuestion.questionType)"
                :key="opt.label"
                :label="opt.label"
                class="option-item"
              >
                <span class="opt-label">{{ opt.label }}.</span> {{ opt.content }}
              </el-radio>
            </el-radio-group>

            <!-- 多选 -->
            <el-checkbox-group
              v-else-if="Number(currentQuestion.questionType) === 2"
              v-model="multiAnswerMap[currentQuestion.questionId]"
              class="option-group"
            >
              <el-checkbox
                v-for="opt in parseQuestionOptions(currentQuestion.options, currentQuestion.questionType)"
                :key="opt.label"
                :label="opt.label"
                class="option-item"
              >
                <span class="opt-label">{{ opt.label }}.</span> {{ opt.content }}
              </el-checkbox>
            </el-checkbox-group>

            <!-- 判断 -->
            <el-radio-group
              v-else-if="Number(currentQuestion.questionType) === 3"
              v-model="answerMap[currentQuestion.questionId]"
              class="option-group"
            >
              <el-radio label="A" class="option-item">正确</el-radio>
              <el-radio label="B" class="option-item">错误</el-radio>
            </el-radio-group>

            <!-- 填空 / 简答 -->
            <el-input
              v-else
              v-model="answerMap[currentQuestion.questionId]"
              :type="Number(currentQuestion.questionType) === 5 ? 'textarea' : 'text'"
              :rows="Number(currentQuestion.questionType) === 5 ? 6 : 1"
              :placeholder="Number(currentQuestion.questionType) === 5 ? '请输入你的答案' : '请填写答案'"
            />
          </div>

          <div class="question-footer">
            <el-button size="medium" :disabled="currentIndex <= 0" @click="currentIndex -= 1">上一题</el-button>
            <el-button size="medium" type="primary" :disabled="currentIndex >= questions.length - 1" @click="currentIndex += 1">下一题</el-button>
          </div>
        </main>
      </div>
    </template>
  </div>
</template>

<script>
import { clientStartExam, clientSaveExamAnswers, clientSubmitExam } from '@/api/client-exam'
import { getQuestionTypeLabel, parseQuestionOptions, normalizeMultipleAnswer } from '@/utils/question-helper'

export default {
  name: 'ClientExamTake',
  data() {
    return {
      loading: false,
      saving: false,
      submitting: false,
      examData: null,
      questions: [],
      answerMap: {},
      multiAnswerMap: {},
      currentIndex: 0,
      remainSeconds: 0,
      timer: null,
      autoSaveTimer: null
    }
  },
  computed: {
    examId() {
      return this.$route.params.examId
    },
    currentQuestion() {
      return this.questions[this.currentIndex] || null
    }
  },
  watch: {
    multiAnswerMap: {
      deep: true,
      handler(val) {
        Object.keys(val).forEach(key => {
          this.$set(this.answerMap, key, normalizeMultipleAnswer(val[key]))
        })
      }
    }
  },
  created() {
    this.initExam()
  },
  beforeDestroy() {
    this.clearTimers()
  },
  methods: {
    getQuestionTypeLabel,
    parseQuestionOptions,
    async initExam() {
      this.loading = true
      try {
        let res
        try {
          res = await clientStartExam(this.examId)
        } catch (e) {
          const msg = (e && e.message) || '无法进入考试'
          if (msg.includes('已完成') || msg.includes('已提交')) {
            this.$router.replace(`/user/exam/${this.examId}/result`)
            return
          }
          this.$message.error(msg)
          this.$router.replace('/user/exams')
          return
        }
        this.examData = (res && res.data) || null
        this.questions = (this.examData && this.examData.questions) || []
        this.initAnswers()
        this.startCountdown()
        this.autoSaveTimer = setInterval(() => {
          this.handleSave(true)
        }, 30000)
      } finally {
        this.loading = false
      }
    },
    initAnswers() {
      const answerMap = {}
      const multiAnswerMap = {}
      this.questions.forEach(q => {
        const val = q.studentAnswer || ''
        answerMap[q.questionId] = val
        if (Number(q.questionType) === 2) {
          multiAnswerMap[q.questionId] = val ? val.split(',').filter(Boolean) : []
        }
      })
      this.answerMap = answerMap
      this.multiAnswerMap = multiAnswerMap
    },
    startCountdown() {
      if (!this.examData || !this.examData.deadlineTime) return
      const deadline = new Date(String(this.examData.deadlineTime).replace(/-/g, '/')).getTime()
      const tick = () => {
        const now = Date.now()
        this.remainSeconds = Math.max(0, Math.floor((deadline - now) / 1000))
        if (this.remainSeconds <= 0) {
          this.clearTimers()
          this.$message.warning('考试时间到，系统将自动交卷')
          this.handleSubmit(true)
        }
      }
      tick()
      this.timer = setInterval(tick, 1000)
    },
    clearTimers() {
      if (this.timer) clearInterval(this.timer)
      if (this.autoSaveTimer) clearInterval(this.autoSaveTimer)
      this.timer = null
      this.autoSaveTimer = null
    },
    formatRemain(seconds) {
      const h = Math.floor(seconds / 3600)
      const m = Math.floor((seconds % 3600) / 60)
      const s = seconds % 60
      const pad = n => String(n).padStart(2, '0')
      return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
    },
    isAnswered(q) {
      const val = this.answerMap[q.questionId]
      return val !== undefined && val !== null && String(val).trim() !== ''
    },
    getUnansweredQuestions() {
      return this.questions
        .map((q, index) => ({ q, index }))
        .filter(({ q }) => !this.isAnswered(q))
    },
    formatUnansweredNums(unanswered) {
      const nums = unanswered.map(({ index }) => index + 1)
      if (nums.length <= 10) {
        return nums.join('、')
      }
      return `${nums.slice(0, 8).join('、')} 等 ${nums.length} 题`
    },
    buildUnansweredConfirmOptions(unanswered, action) {
      const isSubmit = action === 'submit'
      const actionText = isSubmit ? '提交完成' : '保存答案'
      if (!unanswered.length) {
        return {
          title: isSubmit ? '提交确认' : '保存确认',
          message: isSubmit
            ? '确定要提交完成吗？提交后将无法修改答案。'
            : '确定要保存当前答案吗？',
          confirmButtonText: isSubmit ? '确定提交' : '确定保存',
          cancelButtonText: '继续答题'
        }
      }
      const nums = this.formatUnansweredNums(unanswered)
      return {
        title: '未完成作答',
        message: `您还有 ${unanswered.length} 题未作答（第 ${nums} 题），确定仍要${actionText}吗？${isSubmit ? '提交后将无法修改答案。' : ''}`,
        confirmButtonText: isSubmit ? '仍要提交' : '仍要保存',
        cancelButtonText: '继续答题'
      }
    },
    confirmUnansweredAction(action) {
      const unanswered = this.getUnansweredQuestions()
      if (!unanswered.length && action === 'save') {
        return Promise.resolve()
      }
      const { title, message, confirmButtonText, cancelButtonText } = this.buildUnansweredConfirmOptions(unanswered, action)
      return this.$confirm(message, title, {
        type: 'warning',
        confirmButtonText,
        cancelButtonText
      })
    },
    buildPayload() {
      return {
        answers: this.questions.map(q => ({
          questionId: q.questionId,
          studentAnswer: this.answerMap[q.questionId] || ''
        }))
      }
    },
    async handleSave(silent) {
      if (!this.examData) return
      if (silent) {
        await this.doSave(true)
        return
      }
      try {
        await this.confirmUnansweredAction('save')
        await this.doSave(false)
      } catch (e) {
        // 用户取消
      }
    },
    async doSave(silent) {
      this.saving = true
      try {
        await clientSaveExamAnswers(this.examId, this.buildPayload())
        if (!silent) this.$message.success('答案已保存')
      } finally {
        this.saving = false
      }
    },
    handleSubmit(auto) {
      const run = async () => {
        this.submitting = true
        try {
          await clientSubmitExam(this.examId, this.buildPayload())
          this.clearTimers()
          this.$message.success(auto ? '已自动提交' : '提交成功')
          this.$router.replace(`/user/exam/${this.examId}/result`)
        } finally {
          this.submitting = false
        }
      }
      if (auto) {
        run()
        return
      }
      this.confirmUnansweredAction('submit').then(run).catch(() => {})
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/layout/client/client-theme.scss';

.exam-take-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  min-height: calc(100vh - 120px);
}

.exam-top-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  border-radius: 14px;
  background: linear-gradient(120deg, rgba(224, 242, 254, 0.75), rgba(204, 251, 241, 0.45));
  border: 1px solid rgba(186, 230, 253, 0.6);
  margin-bottom: 16px;
}

.exam-title-wrap {
  flex: 1;
  min-width: 0;
}

.exam-title-wrap h2 {
  margin: 0 0 4px;
  font-size: 20px;
  color: $client-color-text-main;
}

.exam-title-wrap p {
  margin: 0;
  font-size: 13px;
  color: $client-color-text-secondary;
}

.timer-box {
  padding: 8px 14px;
  border-radius: 999px;
  background: #fff;
  color: $client-color-primary;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(56, 189, 248, 0.12);
}

.timer-box.danger {
  color: #f56c6c;
}

.exam-body {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 16px;
}

.question-nav {
  border-radius: 14px;
  padding: 16px;
  background: #fff;
  border: 1px solid $client-color-border;
  height: fit-content;
  position: sticky;
  top: 76px;
}

.nav-title {
  font-weight: 600;
  margin-bottom: 12px;
  color: $client-color-text-main;
}

.nav-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.nav-item {
  border: 1px solid $client-color-border;
  background: #fff;
  border-radius: 8px;
  height: 36px;
  cursor: pointer;
  color: $client-color-text-secondary;
  transition: all 0.2s ease;
}

.nav-item.answered {
  background: rgba(56, 189, 248, 0.1);
  border-color: rgba(56, 189, 248, 0.35);
  color: $client-color-primary-dark;
}

.nav-item.active {
  background: $client-btn-bg;
  border-color: transparent;
  color: #fff;
}

.question-panel {
  border-radius: 14px;
  background: #fff;
  border: 1px solid $client-color-border;
  padding: 22px;
}

.question-card {
  min-height: 360px;
}

.question-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.q-index {
  font-weight: 700;
  color: $client-color-text-main;
}

.q-score {
  margin-left: auto;
  color: $client-color-primary;
  font-weight: 600;
}

.question-text {
  font-size: 16px;
  line-height: 1.8;
  color: #333;
  margin-bottom: 20px;
  white-space: pre-wrap;
}

.option-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option-item {
  display: flex;
  align-items: flex-start;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  margin-right: 0;
  white-space: normal;
}

.opt-label {
  font-weight: 600;
  margin-right: 6px;
}

.question-footer {
  margin-top: 24px;
  display: flex;
  justify-content: space-between;
}

@media (max-width: 900px) {
  .exam-body {
    grid-template-columns: 1fr;
  }

  .question-nav {
    position: static;
  }

  .exam-top-bar {
    flex-wrap: wrap;
  }
}
</style>
