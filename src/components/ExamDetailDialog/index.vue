<template>
  <el-dialog
    title="考试详情"
    :visible.sync="dialogVisible"
    width="920px"
    append-to-body
    @close="handleClose"
  >
    <el-tabs v-model="activeTab" v-loading="loading">
      <el-tab-pane label="考试信息" name="exam">
        <el-form v-if="examDetail" label-width="120px" size="small" class="detail-form">
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="考试名称">{{ examDetail.examName || '—' }}</el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="所属课程">{{ examDetail.courseName || '—' }}</el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="提交教师">{{ examDetail.realName || '—' }}</el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="考试状态">
                <enum-tag :value="examDetail.status" :label-map="examStatusEnumMap" preset="exam" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="开始时间">{{ examDetail.startTime || '—' }}</el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="结束时间">{{ examDetail.endTime || '—' }}</el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="考试时长">{{ examDetail.duration != null ? examDetail.duration + ' 分钟' : '—' }}</el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="及格分数">{{ examDetail.passScore != null ? examDetail.passScore : '—' }}</el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="审核备注">{{ examDetail.auditRemark || '—' }}</el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="创建时间">{{ examDetail.createTime || '—' }}</el-form-item>
            </el-col>
          </el-row>
        </el-form>
        <el-empty v-else description="暂无考试信息" />
      </el-tab-pane>

      <el-tab-pane label="关联试卷" name="paper">
        <template v-if="paperDetail">
          <el-form label-width="100px" size="small" class="detail-form paper-summary">
            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item label="试卷名称">{{ paperDetail.paperName || '—' }}</el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="试卷编号">{{ paperDetail.paperCode || '—' }}</el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="所属课程">{{ paperDetail.courseName || examDetail.courseName || '—' }}</el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="创建教师">{{ paperDetail.realName || '—' }}</el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="试卷总分">{{ paperDetail.totalScore != null ? paperDetail.totalScore : '—' }}</el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="难度星级">
                  <el-rate
                    v-if="paperDetail.difficultyLevel"
                    :value="paperDetail.difficultyLevel"
                    disabled
                    show-score
                    text-color="#ff9900"
                  />
                  <span v-else>—</span>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="试卷状态">
                  <enum-tag :value="paperDetail.status" :label-map="paperStatusEnumMap" preset="normal" />
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="试卷说明">{{ paperDetail.description || '—' }}</el-form-item>
              </el-col>
            </el-row>
          </el-form>

          <div class="section-title">试卷题目（共 {{ paperQuestionList.length }} 题）</div>
          <el-table :data="paperQuestionList" border size="small" max-height="320">
            <el-table-column label="序号" type="index" width="60" align="center" />
            <el-table-column label="题型" width="90" align="center">
              <template slot-scope="scope">
                {{ getQuestionTypeLabel(scope.row.questionType) }}
              </template>
            </el-table-column>
            <el-table-column label="题目内容" prop="questionText" min-width="240" :show-overflow-tooltip="true" />
            <el-table-column label="分值" prop="questionScore" width="80" align="center" />
            <el-table-column label="排序" prop="sortOrder" width="70" align="center" />
          </el-table>
        </template>
        <el-empty v-else description="未关联试卷" />
      </el-tab-pane>

      <el-tab-pane label="考试人员" name="students">
        <div class="section-title">共 {{ studentList.length }} 人</div>
        <el-table :data="studentList" border size="small" max-height="420">
          <el-table-column label="序号" type="index" width="60" align="center" />
          <el-table-column label="学号" prop="studentNo" min-width="120" align="center" :show-overflow-tooltip="true" />
          <el-table-column label="姓名" prop="name" min-width="120" align="center" :show-overflow-tooltip="true" />
          <el-table-column label="考试状态" prop="status" width="100" align="center">
            <template slot-scope="scope">
              <enum-tag :value="scope.row.status" :label-map="studentStatusEnumMap" preset="normal" />
            </template>
          </el-table-column>
          <el-table-column label="分配时间" prop="createTime" min-width="160" align="center" :show-overflow-tooltip="true" />
        </el-table>
        <el-empty v-if="!studentList.length" description="暂未设置考试人员" />
      </el-tab-pane>
    </el-tabs>

    <div slot="footer" class="dialog-footer">
      <el-button size="medium" @click="dialogVisible = false">关 闭</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { getExamById } from '@/api/exam'
import { getExamPaperById } from '@/api/exam_paper'
import { listPaperQuestion } from '@/api/paper_question'
import { listExamStudent } from '@/api/exam_student'

export default {
  name: 'ExamDetailDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    examId: {
      type: [Number, String],
      default: null
    }
  },
  data() {
    return {
      loading: false,
      activeTab: 'exam',
      examDetail: null,
      paperDetail: null,
      paperQuestionList: [],
      studentList: [],
      examStatusEnumMap: { 5: '草稿', 0: '待审核', 1: '已通过', 2: '已驳回', 3: '已发布', 4: '已结束' },
      paperStatusEnumMap: { 0: '草稿', 1: '已发布', 2: '已归档' },
      studentStatusEnumMap: { 0: '待考试', 1: '考试中', 2: '已完成', 3: '缺考' },
      questionTypeOptions: [
        { value: 1, label: '单选题' },
        { value: 2, label: '多选题' },
        { value: 3, label: '判断题' },
        { value: 4, label: '填空题' },
        { value: 5, label: '简答题' }
      ]
    }
  },
  computed: {
    dialogVisible: {
      get() {
        return this.visible
      },
      set(val) {
        this.$emit('update:visible', val)
      }
    }
  },
  watch: {
    visible(val) {
      if (val && this.examId) {
        this.loadDetail()
      }
    },
    examId(val) {
      if (this.visible && val) {
        this.loadDetail()
      }
    }
  },
  methods: {
    async loadDetail() {
      if (!this.examId) return
      this.loading = true
      this.activeTab = 'exam'
      this.examDetail = null
      this.paperDetail = null
      this.paperQuestionList = []
      this.studentList = []
      try {
        const [examRes, studentRes] = await Promise.all([
          getExamById(this.examId),
          listExamStudent({ examId: this.examId })
        ])
        this.examDetail = examRes.data || null
        this.studentList = studentRes.data || []

        if (this.examDetail && this.examDetail.paperId) {
          const [paperRes, questionRes] = await Promise.all([
            getExamPaperById(this.examDetail.paperId),
            listPaperQuestion({ paperId: this.examDetail.paperId })
          ])
          this.paperDetail = paperRes.data || null
          this.paperQuestionList = questionRes.data || []
        }
      } catch (e) {
        this.$message.error('加载考试详情失败')
      } finally {
        this.loading = false
      }
    },
    getQuestionTypeLabel(value) {
      const item = this.questionTypeOptions.find(option => option.value === Number(value))
      return item ? item.label : '—'
    },
    handleClose() {
      this.examDetail = null
      this.paperDetail = null
      this.paperQuestionList = []
      this.studentList = []
      this.activeTab = 'exam'
    }
  }
}
</script>

<style scoped lang="scss">
.detail-form {
  ::v-deep .el-form-item {
    margin-bottom: 10px;
  }

  ::v-deep .el-form-item__label {
    color: #909399;
  }

  ::v-deep .el-form-item__content {
    color: #303133;
  }
}

.paper-summary {
  margin-bottom: 12px;
  padding-bottom: 4px;
  border-bottom: 1px solid #ebeef5;
}

.section-title {
  margin: 0 0 10px;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}
</style>
