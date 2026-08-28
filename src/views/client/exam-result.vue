<template>
  <div v-loading="loading" class="result-page client-page-wrap">
    <template v-if="result">
      <div class="score-hero" :class="{ passed: result.passed }">
        <div class="score-circle">
          <div class="score-num">{{ result.myScore }}</div>
          <div class="score-label">我的得分</div>
        </div>
        <div class="score-info">
          <h2>{{ result.examName }}</h2>
          <p>试卷总分 {{ result.totalScore }} 分 · 及格线 {{ result.passScore }} 分</p>
          <el-tag :type="result.passed ? 'success' : 'danger'" effect="dark" size="medium">
            {{ result.passed ? '恭喜，考试通过！' : '未达及格线，继续加油' }}
          </el-tag>
          <div class="hero-actions">
            <el-button size="medium" class="pink-btn" @click="$router.push('/user/exams')">返回考试列表</el-button>
          </div>
        </div>
      </div>

      <el-card shadow="never" class="section-card">
        <div class="section-head">
          <h3>答题详情</h3>
        </div>
        <div v-for="(item, index) in result.items" :key="item.questionId" class="result-item">
          <div class="item-head">
            <span class="item-index">第 {{ index + 1 }} 题</span>
            <el-tag size="mini">{{ getQuestionTypeLabel(item.questionType) }}</el-tag>
            <el-tag
              v-if="!isSubjectiveQuestion(item)"
              size="mini"
              :type="correctTagType(item.isCorrect)"
            >
              {{ correctLabel(item.isCorrect) }}
            </el-tag>
            <span class="item-score">得 {{ item.score || 0 }} / {{ item.questionScore || 0 }} 分</span>
          </div>
          <div class="item-text">{{ item.questionText }}</div>
          <div class="item-answer">
            <p :class="{ 'answer-wrong': !isSubjectiveQuestion(item) && item.isCorrect === 0 }">
              <strong>你的答案：</strong>{{ formatAnswerDisplay(item.questionType, item.studentAnswer, parseQuestionOptions(item.options, item.questionType)) }}
            </p>
            <p><strong>参考答案：</strong>{{ formatAnswerDisplay(item.questionType, item.correctAnswer, parseQuestionOptions(item.options, item.questionType)) }}</p>
            <p v-if="item.analysis"><strong>解析：</strong>{{ item.analysis }}</p>
          </div>
        </div>
      </el-card>
    </template>
  </div>
</template>

<script>
import { clientGetExamResult } from '@/api/client-exam'
import { getQuestionTypeLabel, parseQuestionOptions, formatAnswerDisplay } from '@/utils/question-helper'

export default {
  name: 'ClientExamResult',
  data() {
    return {
      loading: false,
      result: null
    }
  },
  computed: {
    examId() {
      return this.$route.params.examId
    }
  },
  created() {
    this.loadResult()
  },
  methods: {
    getQuestionTypeLabel,
    parseQuestionOptions,
    formatAnswerDisplay,
    isSubjectiveQuestion(item) {
      const type = Number(item && item.questionType)
      return type === 4 || type === 5
    },
    async loadResult() {
      this.loading = true
      try {
        const res = await clientGetExamResult(this.examId)
        this.result = (res && res.data) || null
      } finally {
        this.loading = false
      }
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
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/layout/client/client-page.scss';
@import '@/layout/client/client-theme.scss';

.score-hero {
  display: flex;
  align-items: center;
  gap: 28px;
  padding: 28px 32px;
  border-radius: 18px;
  margin-bottom: 24px;
  background: linear-gradient(120deg, rgba(224, 242, 254, 0.85), rgba(204, 251, 241, 0.5));
  border: 1px solid rgba(186, 230, 253, 0.6);
}

.score-hero.passed {
  background: linear-gradient(120deg, rgba(204, 251, 241, 0.7), rgba(224, 242, 254, 0.55));
}

.score-circle {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 24px rgba(56, 189, 248, 0.12);
}

.score-num {
  font-size: 36px;
  font-weight: 700;
  color: $client-color-primary;
  line-height: 1;
}

.score-label {
  margin-top: 6px;
  font-size: 12px;
  color: $client-color-text-secondary;
}

.score-info h2 {
  margin: 0 0 8px;
  color: $client-color-text-main;
}

.score-info p {
  margin: 0 0 12px;
  color: $client-color-text-secondary;
}

.hero-actions {
  margin-top: 16px;
}

.result-item {
  padding: 18px 0;
  border-bottom: 1px dashed $client-color-border;
}

.result-item:last-child {
  border-bottom: none;
}

.item-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.item-index {
  font-weight: 700;
  color: $client-color-text-main;
}

.item-score {
  margin-left: auto;
  color: $client-color-primary;
  font-weight: 600;
}

.item-text {
  line-height: 1.8;
  margin-bottom: 10px;
  white-space: pre-wrap;
}

.item-answer {
  padding: 12px 14px;
  border-radius: 10px;
  background: #f8fafc;
  font-size: 14px;
  line-height: 1.8;
  color: #555;
}

.item-answer p {
  margin: 0 0 6px;
}

.answer-wrong {
  color: #f56c6c;
  font-weight: 500;
}

@media (max-width: 768px) {
  .score-hero {
    flex-direction: column;
    text-align: center;
  }
}
</style>
