<template>
  <div class="app-container paper-bank-page">
    <div class="paper-bank-layout">
      <!-- 左侧课程 -->
      <aside class="course-panel">
        <div class="course-panel-header">
          <div class="course-panel-header-main">
            <span class="course-panel-icon"><i class="el-icon-notebook-2" /></span>
            <div>
              <div class="course-panel-title">课程列表</div>
              <div class="course-panel-subtitle">共 {{ courseList.length }} 门课程</div>
            </div>
          </div>
        </div>
        <div class="course-search-wrap">
          <el-input
            v-model="courseKeyword"
            placeholder="搜索课程名称"
            clearable
            size="small"
            prefix-icon="el-icon-search"
            class="course-search"
          />
        </div>
        <div v-loading="courseLoading" class="course-list-wrap">
          <div
            v-for="course in filteredCourseList"
            :key="course.id"
            :class="['course-item', { active: selectedCourse && selectedCourse.id === course.id }]"
            @click="selectCourse(course)"
          >
            <span class="course-item-icon"><i class="el-icon-collection" /></span>
            <span class="course-name" :title="course.courseName">{{ course.courseName }}</span>
            <i v-if="selectedCourse && selectedCourse.id === course.id" class="el-icon-check course-item-check" />
          </div>
          <el-empty v-if="!courseLoading && !filteredCourseList.length" description="暂无课程" :image-size="72" />
        </div>
      </aside>

      <!-- 右侧试卷 -->
      <section class="paper-panel">
        <template v-if="selectedCourse">
          <div class="paper-panel-top">
            <div class="paper-panel-info">
              <div class="paper-course-badge">当前课程</div>
              <h2 class="paper-panel-title">{{ selectedCourse.courseName }}</h2>
              <p class="paper-panel-desc">共 <strong>{{ total }}</strong> 份试卷</p>
            </div>
            <div class="paper-toolbar">
              <el-input
                v-model="queryParams.paperName"
                placeholder="搜索试卷名称"
                clearable
                size="small"
                class="toolbar-input"
                @keyup.enter.native="handleQuery"
              />
              <el-select
                v-model="queryParams.status"
                placeholder="试卷状态"
                clearable
                size="small"
                class="toolbar-select"
                @change="handleQuery"
              >
                <el-option
                  v-for="item in statusOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
              <el-button size="medium" plain icon="el-icon-refresh" @click="resetQuery">重置</el-button>
              <el-button size="medium" type="primary" icon="el-icon-plus" @click="handleAdd">新建试卷</el-button>
              <el-button size="medium" plain type="danger" icon="el-icon-delete" :disabled="multiple" @click="handleDeleteBatch">批量删除</el-button>
            </div>
          </div>

          <div v-loading="loading" class="paper-card-area">
            <div v-if="examPaperList.length" class="paper-card-toolbar">
              <el-checkbox
                v-model="selectAllPageChecked"
                :indeterminate="isPageIndeterminate"
                @change="handleSelectAllPage"
              >
                全选本页（已选 {{ ids.length }} 份）
              </el-checkbox>
            </div>

            <el-checkbox-group v-if="examPaperList.length" v-model="ids" class="paper-card-grid" @change="handleIdsChange">
              <div
                v-for="paper in examPaperList"
                :key="paper.id"
                :class="['paper-card', { 'is-selected': isPaperSelected(paper.id) }]"
              >
                <div class="paper-card-top">
                  <el-checkbox :label="paper.id" @click.native.stop />
                  <enum-tag :value="paper.status" :label-map="statusEnumMap" preset="paper" />
                </div>

                <div class="paper-card-body" @click="handlePaperSettings(paper)">
                  <h3 class="paper-card-title" :title="paper.paperName">{{ paper.paperName || '—' }}</h3>
                  <div class="paper-card-code">{{ paper.paperCode || '—' }}</div>

                  <div class="paper-card-meta">
                    <div class="meta-item">
                      <span class="meta-label">总分</span>
                      <span class="meta-value">{{ paper.totalScore != null ? paper.totalScore : '—' }}</span>
                    </div>
                    <div class="meta-item meta-difficulty">
                      <span class="meta-label">难度</span>
                      <el-rate
                        :value="Number(paper.difficultyLevel) || 3"
                        disabled
                        show-score
                        text-color="#ff9900"
                        score-template="{value}星"
                      />
                    </div>
                  </div>

                  <p class="paper-card-desc" :title="paper.description">{{ paper.description || '暂无试卷说明' }}</p>

                  <div class="paper-card-footer-info">
                    <span v-if="!isTeacher" class="info-item">
                      <i class="el-icon-user" /> {{ paper.realName || '—' }}
                    </span>
                    <span class="info-item">
                      <i class="el-icon-time" /> {{ paper.createTime || '—' }}
                    </span>
                  </div>
                </div>

                <div class="paper-card-actions">
                  <el-button size="medium" type="text" @click="handlePaperSettings(paper)">设置</el-button>
                  <el-button size="medium"
                    v-if="paper.status === 0"
                    type="text"
                    @click.stop="handlePublish(paper)"
                  >发布</el-button>
                  <el-button size="medium"
                    v-if="paper.status === 1"
                    type="text"
                    @click.stop="handleUnpublish(paper)"
                  >取消发布</el-button>
                  <el-button size="medium"
                    v-if="canEditPaper(paper)"
                    type="text"
                    @click.stop="handleUpdate(paper)"
                  >修改</el-button>
                  <el-button size="medium"
                    v-if="canEditPaper(paper)"
                    type="text"
                    style="color: #f56c6c;"
                    @click.stop="handleDelete(paper)"
                  >删除</el-button>
                </div>
              </div>
            </el-checkbox-group>

            <el-empty v-if="!loading && !examPaperList.length" description="暂无试卷，点击新建试卷开始创建" />
          </div>

          <pagination
            :total="total"
            :current-page.sync="queryParams.current"
            :page-size.sync="queryParams.size"
            :page-sizes="[5, 10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </template>

        <div v-else class="paper-empty">
          <div class="paper-empty-inner">
            <i class="el-icon-folder-opened paper-empty-icon" />
            <p class="paper-empty-title">请选择课程</p>
            <p class="paper-empty-desc">从左侧课程列表中选择一门课程，即可查看和管理对应试卷</p>
          </div>
        </div>
      </section>
    </div>

    <!-- 添加或修改对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="640px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="120px" class="paper-form">
        <el-form-item label="所属课程">
          <el-input :value="selectedCourse ? selectedCourse.courseName : ''" disabled />
        </el-form-item>
        <el-form-item label="试卷名称" prop="paperName">
          <el-input v-model="form.paperName" placeholder="请输入试卷名称" />
        </el-form-item>
        <el-form-item v-if="form.id != null" label="试卷编号" prop="paperCode">
          <el-input v-model="form.paperCode" disabled />
        </el-form-item>
        <el-form-item v-if="!isTeacher" label="创建教师" prop="teacherId">
          <el-select v-model="form.teacherId" placeholder="请选择创建教师" clearable style="width: 100%;">
            <el-option
              v-for="(item, idx) in sysUserOptions"
              :key="idx"
              :label="item.realName"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="总分" prop="totalScore">
          <el-input-number
            v-model="form.totalScore"
            :min="0"
            :max="1000"
            :precision="1"
            :step="1"
            controls-position="right"
            placeholder="请输入试卷总分"
            style="width: 100%;"
          />
          <div class="form-field-tip">可先设置预设总分；组装题目后按各题分值自动汇总，发布时将校验一致</div>
        </el-form-item>
        <el-form-item label="难度" prop="difficultyLevel" class="difficulty-form-item">
          <div class="rate-field-wrap">
            <el-rate v-model="form.difficultyLevel" :max="5" show-text :texts="difficultyTexts" />
          </div>
        </el-form-item>
        <el-form-item v-if="form.id != null" label="试卷状态">
          <enum-tag :value="form.status" :label-map="statusEnumMap" preset="paper" />
        </el-form-item>
        <el-form-item label="试卷说明" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="4"
            placeholder="请输入试卷说明"
          />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button size="medium" type="primary" @click="submitForm">确 定</el-button>
        <el-button size="medium" @click="cancel">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 试卷设置抽屉 -->
    <el-drawer
      :visible.sync="settingsDrawerVisible"
      direction="rtl"
      size="720px"
      :with-header="false"
      append-to-body
      custom-class="paper-settings-drawer"
      @close="handleSettingsClose"
    >
      <div v-if="currentPaper" class="settings-drawer-inner">
        <div class="settings-drawer-header">
          <div>
            <div class="settings-badge">试卷设置</div>
            <h3 class="settings-title">{{ currentPaper.paperName }}</h3>
            <p class="settings-desc">
              {{ selectedCourse ? selectedCourse.courseName : '' }}
              · 共 {{ paperQuestionList.length }} 题
              · 合计 {{ paperQuestionScoreSum }} 分
            </p>
          </div>
          <button type="button" class="settings-close-btn" @click="settingsDrawerVisible = false">
            <i class="el-icon-close" />
          </button>
        </div>

        <div class="settings-toolbar">
          <el-button size="medium"
            v-if="currentPaper.status === 0"
            type="primary"
            icon="el-icon-plus"
            @click="handleOpenAssemble"
          >组装试卷</el-button>
          <el-button size="medium"
            v-if="currentPaper.status === 0"
            type="warning"
            plain
            icon="el-icon-magic-stick"
            @click="handleOpenAiAssemble"
          >智能组卷</el-button>
          <el-button size="medium"
            v-if="currentPaper.status === 0"
            type="success"
            plain
            icon="el-icon-upload2"
            @click="handlePublish(currentPaper)"
          >发布试卷</el-button>
          <el-button size="medium"
            v-if="currentPaper.status === 1"
            type="warning"
            plain
            icon="el-icon-refresh-left"
            @click="handleUnpublish(currentPaper)"
          >取消发布</el-button>
          <el-tag v-if="currentPaper.status === 2" size="small" type="info">已归档试卷仅可查看题目</el-tag>
          <el-tag v-else-if="currentPaper.status === 1" size="small" type="success">已发布，可取消发布后编辑</el-tag>
        </div>

        <div v-loading="paperQuestionLoading" class="settings-table-wrap">
          <el-table :data="paperQuestionList" class="modern-table">
            <el-table-column label="序号" prop="sortOrder" width="70" align="center" />
            <el-table-column label="题型" width="90" align="center">
              <template slot-scope="scope">
                {{ getQuestionTypeLabel(scope.row.questionType) }}
              </template>
            </el-table-column>
            <el-table-column label="题目内容" min-width="200" show-overflow-tooltip class-name="paper-content-column">
              <template slot-scope="scope">
                <span class="paper-question-text">{{ formatQuestionTextCell(scope.row.questionText) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="分值" width="130" align="center" class-name="paper-score-column">
              <template slot-scope="scope">
                <div v-if="currentPaper && currentPaper.status === 0" class="paper-score-cell">
                  <el-input-number
                    v-model="scope.row.questionScore"
                    class="paper-score-input"
                    :min="0.5"
                    :max="100"
                    :step="0.5"
                    :precision="1"
                    controls-position="right"
                    @change="handleQuestionScoreChange(scope.row)"
                  />
                </div>
                <span v-else>{{ scope.row.questionScore }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80" align="center">
              <template slot-scope="scope">
                <el-button size="medium"
                  v-if="currentPaper && currentPaper.status === 0"
                  type="text"
                  style="color: #f56c6c;"
                  @click="handleRemovePaperQuestion(scope.row)"
                >移除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="!paperQuestionLoading && !paperQuestionList.length" description="暂无题目，请点击组装试卷添加" />
        </div>
      </div>
    </el-drawer>

    <!-- 智能组卷弹窗 -->
    <el-dialog
      title="智能组卷"
      :visible.sync="aiAssembleDialogVisible"
      width="640px"
      append-to-body
      custom-class="ai-assemble-dialog"
      @close="handleAiAssembleClose"
    >
      <div v-if="currentPaper" class="ai-assemble-info">
        <p><strong>试卷：</strong>{{ currentPaper.paperName }}</p>
        <p><strong>课程：</strong>{{ selectedCourse ? selectedCourse.courseName : '—' }}</p>
        <p><strong>总分：</strong>{{ currentPaper.totalScore || 0 }} 分</p>
        <p><strong>难度：</strong>{{ currentPaper.difficultyLevel || 3 }} 星</p>
      </div>
      <div class="ai-assemble-tip">
        AI 将从当前课程题库中自动选题并分配分值。组卷成功后将<strong>替换</strong>试卷中已有题目。
      </div>
      <el-form label-width="80px">
        <el-form-item label="组卷要求">
          <el-input
            v-model="aiAssemblePrompt"
            type="textarea"
            :rows="5"
            placeholder="例如：单选题占40%，多选题占30%，判断题占30%；难度适中，覆盖主要知识点"
          />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button size="medium" @click="aiAssembleDialogVisible = false">取消</el-button>
        <el-button size="medium" type="primary" :loading="aiAssembleLoading" @click="submitAiAssemble">开始组卷</el-button>
      </div>
    </el-dialog>

    <!-- 组装试卷弹窗 -->
    <el-dialog
      title="组装试卷"
      :visible.sync="assembleDialogVisible"
      width="860px"
      append-to-body
      custom-class="assemble-paper-dialog"
      @close="handleAssembleClose"
    >
      <div class="assemble-tip">
        从当前课程题库中选择题目加入试卷（已加入的题目不可重复选择）
      </div>
      <el-tabs v-model="assembleActiveType" class="assemble-tabs" @tab-click="handleAssembleTabChange">
        <el-tab-pane
          v-for="item in questionTypeOptions"
          :key="item.value"
          :label="item.label"
          :name="String(item.value)"
        />
      </el-tabs>

      <el-table
        ref="candidateTable"
        v-loading="candidateLoading"
        :data="candidateQuestionList"
        max-height="420"
        @selection-change="handleCandidateSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center" :selectable="isQuestionSelectable" />
        <el-table-column label="题目内容" min-width="200" show-overflow-tooltip class-name="paper-content-column">
          <template slot-scope="scope">
            <span class="paper-question-text">{{ formatQuestionTextCell(scope.row.questionText) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="分值" width="130" align="center" class-name="paper-score-column">
          <template slot-scope="scope">
            <div class="paper-score-cell">
              <el-input-number
                v-model="candidateScoreMap[scope.row.id]"
                class="paper-score-input"
                :min="0.5"
                :max="100"
                :step="0.5"
                :precision="1"
                :disabled="isQuestionInPaper(scope.row.id)"
                controls-position="right"
              />
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template slot-scope="scope">
            <el-tag v-if="isQuestionInPaper(scope.row.id)" size="mini" type="info">已加入</el-tag>
            <el-tag v-else size="mini" type="success">可选</el-tag>
          </template>
        </el-table-column>
      </el-table>

      <pagination
        :total="candidateTotal"
        :current-page.sync="candidateQuery.current"
        :page-size.sync="candidateQuery.size"
        :page-sizes="[5, 10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @size-change="handleCandidateSizeChange"
        @current-change="handleCandidateCurrentChange"
      />

      <div slot="footer" class="dialog-footer">
        <span class="assemble-selected-tip">已选 {{ candidateSelectedIds.length }} 题</span>
        <el-button size="medium" @click="assembleDialogVisible = false">取消</el-button>
        <el-button size="medium" type="primary" :loading="assembleSaving" @click="submitAssemble">确认加入</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  pageExamPaper,
  getExamPaperById,
  saveExamPaper,
  updateExamPaper,
  deleteExamPaper,
  deleteBatchExamPaper,
  publishExamPaper,
  unpublishExamPaper,
  aiAssembleExamPaper,
  listCourse,
  listSysUser
} from '@/api/exam_paper'
import { pageQuestion } from '@/api/question'
import { listPaperQuestion, batchSavePaperQuestion, deletePaperQuestion, updatePaperQuestion } from '@/api/paper_question'
import Pagination from '@/components/Pagination'
import { mapGetters } from 'vuex'

export default {
  name: 'ExamPaper',
  components: {
    Pagination
  },
  data() {
    return {
      courseLoading: false,
      courseList: [],
      courseKeyword: '',
      selectedCourse: null,
      loading: false,
      ids: [],
      single: true,
      multiple: true,
      total: 0,
      examPaperList: [],
      title: '',
      open: false,
      queryParams: {
        current: 1,
        size: 10,
        courseId: null,
        paperName: null,
        status: null,
        realName: null
      },
      form: {},
      rules: {
        paperName: [
          { required: true, message: '试卷名称不能为空', trigger: 'blur' }
        ],
        teacherId: [
          { required: true, message: '创建教师不能为空', trigger: 'change' }
        ],
        totalScore: [
          { required: true, message: '总分不能为空', trigger: 'blur' },
          {
            validator: (rule, value, callback) => {
              if (value == null || value === '' || Number(value) <= 0) {
                callback(new Error('总分必须大于0'))
              } else {
                callback()
              }
            },
            trigger: 'blur'
          }
        ],
        difficultyLevel: [
          { required: true, message: '请选择难度星级', trigger: 'change' }
        ],
        description: [
          { required: true, message: '试卷说明不能为空', trigger: 'blur' }
        ]
      },
      sysUserOptions: [],
      statusOptions: [
        { value: 0, label: '草稿' },
        { value: 1, label: '已发布' },
        { value: 2, label: '已归档' }
      ],
      statusEnumMap: { 0: '草稿', 1: '已发布', 2: '已归档' },
      difficultyTexts: ['1星', '2星', '3星', '4星', '5星'],
      settingsDrawerVisible: false,
      currentPaper: null,
      paperQuestionList: [],
      paperQuestionLoading: false,
      assembleDialogVisible: false,
      assembleSaving: false,
      aiAssembleDialogVisible: false,
      aiAssembleLoading: false,
      aiAssemblePrompt: '',
      assembleActiveType: '1',
      candidateQuestionList: [],
      candidateSelectedIds: [],
      candidateScoreMap: {},
      candidateLoading: false,
      candidateTotal: 0,
      candidateQuery: {
        current: 1,
        size: 10,
        courseId: null,
        questionType: 1,
        status: 1
      },
      questionTypeOptions: [
        { value: 1, label: '单选题' },
        { value: 2, label: '多选题' },
        { value: 3, label: '判断题' },
        { value: 4, label: '填空题' },
        { value: 5, label: '简答题' }
      ],
      selectAllPageChecked: false
    }
  },
  computed: {
    ...mapGetters(['id', 'role']),
    isTeacher() {
      return this.role === 'teacher'
    },
    filteredCourseList() {
      const keyword = (this.courseKeyword || '').trim().toLowerCase()
      if (!keyword) {
        return this.courseList
      }
      return this.courseList.filter(item => {
        return (item.courseName || '').toLowerCase().includes(keyword)
      })
    },
    paperQuestionIdSet() {
      return new Set(this.paperQuestionList.map(item => item.questionId))
    },
    paperQuestionScoreSum() {
      const sum = this.paperQuestionList.reduce((total, item) => {
        return total + Number(item.questionScore || 0)
      }, 0)
      return Number.isInteger(sum) ? sum : sum.toFixed(1)
    },
    isAllPageSelected() {
      return this.examPaperList.length > 0 && this.examPaperList.every(item => this.ids.includes(item.id))
    },
    isPageIndeterminate() {
      const selectedCount = this.examPaperList.filter(item => this.ids.includes(item.id)).length
      return selectedCount > 0 && selectedCount < this.examPaperList.length
    }
  },
  watch: {
    ids() {
      this.syncSelectAllPageChecked()
    },
    examPaperList() {
      this.syncSelectAllPageChecked()
    }
  },
  created() {
    this.loadCourseList()
    if (!this.isTeacher) {
      this.getSysUserOptions({})
    }
  },
  methods: {
    loadCourseList() {
      this.courseLoading = true
      listCourse({ status: 1 }).then(response => {
        this.courseList = response.data || []
        this.courseLoading = false
        if (this.courseList.length && !this.selectedCourse) {
          this.selectCourse(this.courseList[0])
        }
      }).catch(() => {
        this.courseLoading = false
      })
    },
    selectCourse(course) {
      this.selectedCourse = course
      this.queryParams.courseId = course.id
      this.queryParams.current = 1
      this.ids = []
      this.multiple = true
      this.getList()
    },
    getList() {
      if (!this.selectedCourse) {
        this.examPaperList = []
        this.total = 0
        return
      }
      this.loading = true
      const { current, size, ...rest } = this.queryParams
      pageExamPaper(current, size, { ...rest, courseId: this.selectedCourse.id }).then(response => {
        const pageData = response.data
        this.examPaperList = pageData.records || []
        this.total = Number(pageData.total) || 0
        this.loading = false
      }).catch(() => {
        this.loading = false
      })
    },
    getSysUserOptions(params) {
      listSysUser(params || {}).then(response => {
        this.sysUserOptions = response.data || []
      })
    },
    cancel() {
      this.open = false
      this.reset()
    },
    reset() {
      this.form = {}
      if (this.$refs.form) {
        this.$refs.form.resetFields()
      }
    },
    handleQuery() {
      this.queryParams.current = 1
      this.getList()
    },
    resetQuery() {
      this.queryParams.current = 1
      this.queryParams.size = this.queryParams.size || 10
      this.queryParams.paperName = null
      this.queryParams.status = null
      this.getList()
    },
    handleIdsChange(val) {
      this.single = val.length !== 1
      this.multiple = !val.length
    },
    syncSelectAllPageChecked() {
      this.selectAllPageChecked = this.isAllPageSelected
    },
    isPaperSelected(id) {
      return this.ids.includes(id)
    },
    handleSelectAllPage(checked) {
      if (checked) {
        const pageIds = this.examPaperList.map(item => item.id)
        this.ids = Array.from(new Set([...this.ids, ...pageIds]))
      } else {
        const pageIdSet = new Set(this.examPaperList.map(item => item.id))
        this.ids = this.ids.filter(id => !pageIdSet.has(id))
      }
      this.single = this.ids.length !== 1
      this.multiple = !this.ids.length
    },
    handleAdd() {
      if (!this.selectedCourse) {
        this.$message.warning('请先选择课程')
        return
      }
      this.reset()
      this.form = {
        courseId: this.selectedCourse.id,
        status: 0,
        totalScore: 100,
        difficultyLevel: 3,
        teacherId: this.isTeacher ? this.id : undefined
      }
      this.open = true
      this.title = '添加试卷'
    },
    canEditPaper(row) {
      return row.status === 0
    },
    handleUpdate(row) {
      if (!this.canEditPaper(row)) {
        this.$message.warning('仅草稿试卷可修改')
        return
      }
      this.reset()
      const id = row.id || this.ids[0]
      getExamPaperById(id).then(response => {
        this.form = {
          ...response.data,
          difficultyLevel: response.data.difficultyLevel != null ? response.data.difficultyLevel : 3
        }
        this.open = true
        this.title = '修改试卷'
      })
    },
    submitForm() {
      this.$refs['form'].validate(valid => {
        if (valid) {
          const payload = {
            ...this.form,
            courseId: this.selectedCourse ? this.selectedCourse.id : this.form.courseId,
            totalScore: this.form.totalScore || 0
          }
          delete payload.status
          if (payload.id != null) {
            updateExamPaper(payload).then(() => {
              this.$message.success('修改成功')
              this.open = false
              this.getList()
            })
          } else {
            saveExamPaper({ ...payload, status: 0 }).then(() => {
              this.$message.success('新增成功')
              this.open = false
              this.getList()
            })
          }
        }
      })
    },
    handlePublish(row) {
      this.$confirm(
        '确认发布试卷「' + row.paperName + '」？系统将校验题目数量、分值及总分是否一致。',
        '发布试卷',
        {
          confirmButtonText: '确认发布',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        return publishExamPaper(row.id)
      }).then(() => {
        this.$message.success('发布成功')
        this.settingsDrawerVisible = false
        this.getList()
      }).catch(() => {})
    },
    handleUnpublish(row) {
      this.$confirm(
        '确认取消发布试卷「' + row.paperName + '」？取消后将恢复为草稿，可重新编辑题目。',
        '取消发布',
        {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        return unpublishExamPaper(row.id)
      }).then(() => {
        this.$message.success('已取消发布')
        if (this.currentPaper && this.currentPaper.id === row.id) {
          getExamPaperById(row.id).then(res => {
            this.currentPaper = res.data
          })
        }
        this.getList()
      }).catch(() => {})
    },
    handleDelete(row) {
      const ids = row.id || this.ids
      this.$confirm('是否确认删除编号为"' + ids + '"的数据项？', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        return deleteExamPaper(ids)
      }).then(() => {
        this.getList()
        this.$message.success('删除成功')
      }).catch(() => {})
    },
    handleDeleteBatch() {
      const ids = this.ids
      this.$confirm('是否确认删除选中的' + ids.length + '条数据？', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        return deleteBatchExamPaper(ids)
      }).then(() => {
        this.getList()
        this.$message.success('删除成功')
      }).catch(() => {})
    },
    handleSizeChange(val) {
      this.queryParams.size = val
      this.queryParams.current = 1
      this.getList()
    },
    handleCurrentChange(val) {
      this.queryParams.current = val
      this.getList()
    },
    getQuestionTypeLabel(value) {
      const item = this.questionTypeOptions.find(option => option.value === Number(value))
      return item ? item.label : value
    },
    formatQuestionTextCell(html) {
      if (!html) {
        return '—'
      }
      const text = String(html)
        .replace(/<br\s*\/?>/gi, ' ')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
      return text || '—'
    },
    handlePaperSettings(row) {
      this.currentPaper = row
      this.settingsDrawerVisible = true
      this.loadPaperQuestions()
    },
    handleSettingsClose() {
      this.currentPaper = null
      this.paperQuestionList = []
    },
    loadPaperQuestions() {
      if (!this.currentPaper) {
        return
      }
      this.paperQuestionLoading = true
      listPaperQuestion({ paperId: this.currentPaper.id }).then(response => {
        this.paperQuestionList = response.data || []
        this.paperQuestionLoading = false
      }).catch(() => {
        this.paperQuestionLoading = false
      })
    },
    handleOpenAssemble() {
      if (!this.currentPaper || !this.selectedCourse) {
        return
      }
      this.assembleActiveType = '1'
      this.candidateQuery = {
        current: 1,
        size: 10,
        courseId: this.selectedCourse.id,
        questionType: 1,
        status: 1
      }
      this.candidateSelectedIds = []
      this.assembleDialogVisible = true
      this.loadCandidateQuestions()
    },
    handleOpenAiAssemble() {
      if (!this.currentPaper) {
        return
      }
      if (!this.currentPaper.totalScore || Number(this.currentPaper.totalScore) <= 0) {
        this.$message.warning('请先在试卷中设置大于0的总分')
        return
      }
      this.aiAssemblePrompt = ''
      this.aiAssembleDialogVisible = true
    },
    handleAiAssembleClose() {
      this.aiAssemblePrompt = ''
      this.aiAssembleLoading = false
    },
    submitAiAssemble() {
      if (!this.currentPaper) {
        return
      }
      this.$confirm(
        '智能组卷将清空当前试卷已有题目并重新生成，是否继续？',
        '确认组卷',
        {
          confirmButtonText: '开始组卷',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        this.aiAssembleLoading = true
        return aiAssembleExamPaper({
          paperId: this.currentPaper.id,
          prompt: (this.aiAssemblePrompt || '').trim()
        })
      }).then(response => {
        this.$message.success(response.msg || '智能组卷成功')
        this.aiAssembleDialogVisible = false
        this.loadPaperQuestions()
        this.getList()
        return getExamPaperById(this.currentPaper.id)
      }).then(res => {
        if (res && res.data) {
          this.currentPaper = res.data
        }
      }).catch(() => {}).finally(() => {
        this.aiAssembleLoading = false
      })
    },
    handleAssembleClose() {
      this.candidateSelectedIds = []
      this.candidateQuestionList = []
      this.candidateScoreMap = {}
    },
    handleAssembleTabChange() {
      this.candidateQuery.questionType = Number(this.assembleActiveType)
      this.candidateQuery.current = 1
      this.candidateSelectedIds = []
      this.loadCandidateQuestions()
    },
    loadCandidateQuestions() {
      if (!this.selectedCourse) {
        return
      }
      this.candidateLoading = true
      const { current, size, ...rest } = this.candidateQuery
      pageQuestion(current, size, {
        ...rest,
        courseId: this.selectedCourse.id
      }).then(response => {
        const pageData = response.data
        this.candidateQuestionList = pageData.records || []
        this.candidateTotal = Number(pageData.total) || 0
        this.candidateQuestionList.forEach(item => {
          if (this.candidateScoreMap[item.id] === undefined) {
            this.$set(this.candidateScoreMap, item.id, item.score != null ? Number(item.score) : 5)
          }
        })
        this.candidateLoading = false
        this.$nextTick(() => {
          if (this.$refs.candidateTable) {
            this.$refs.candidateTable.clearSelection()
          }
        })
      }).catch(() => {
        this.candidateLoading = false
      })
    },
    isQuestionInPaper(questionId) {
      return this.paperQuestionIdSet.has(questionId)
    },
    isQuestionSelectable(row) {
      return !this.isQuestionInPaper(row.id)
    },
    handleCandidateSelectionChange(selection) {
      this.candidateSelectedIds = selection.map(item => item.id)
    },
    handleCandidateSizeChange(val) {
      this.candidateQuery.size = val
      this.candidateQuery.current = 1
      this.loadCandidateQuestions()
    },
    handleCandidateCurrentChange(val) {
      this.candidateQuery.current = val
      this.loadCandidateQuestions()
    },
    submitAssemble() {
      if (!this.candidateSelectedIds.length) {
        this.$message.warning('请至少选择一道题目')
        return
      }
      const invalidScore = this.candidateSelectedIds.some(id => {
        const score = this.candidateScoreMap[id]
        return score == null || Number(score) <= 0
      })
      if (invalidScore) {
        this.$message.warning('请为所选题目设置大于0的分值')
        return
      }
      this.assembleSaving = true
      const questionScores = this.candidateSelectedIds.map(id => ({
        questionId: id,
        score: this.candidateScoreMap[id]
      }))
      batchSavePaperQuestion({
        paperId: this.currentPaper.id,
        questionIds: this.candidateSelectedIds,
        questionScores
      }).then(response => {
        this.assembleSaving = false
        this.$message.success(response.msg || '添加成功')
        this.assembleDialogVisible = false
        this.loadPaperQuestions()
        this.getList()
        if (this.currentPaper) {
          getExamPaperById(this.currentPaper.id).then(res => {
            this.currentPaper = res.data
          })
        }
      }).catch(() => {
        this.assembleSaving = false
      })
    },
    handleQuestionScoreChange(row) {
      if (!row || row.questionScore == null || Number(row.questionScore) <= 0) {
        this.$message.warning('分值必须大于0')
        this.loadPaperQuestions()
        return
      }
      updatePaperQuestion({
        id: row.id,
        paperId: row.paperId,
        questionId: row.questionId,
        questionScore: row.questionScore,
        sortOrder: row.sortOrder
      }).then(() => {
        this.loadPaperQuestions()
        this.getList()
        if (this.currentPaper) {
          getExamPaperById(this.currentPaper.id).then(res => {
            this.currentPaper = res.data
          })
        }
      }).catch(() => {
        this.loadPaperQuestions()
      })
    },
    handleRemovePaperQuestion(row) {
      this.$confirm('确认从试卷中移除该题目？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        return deletePaperQuestion(row.id)
      }).then(() => {
        this.$message.success('移除成功')
        this.loadPaperQuestions()
        this.getList()
        if (this.currentPaper) {
          getExamPaperById(this.currentPaper.id).then(res => {
            this.currentPaper = res.data
          })
        }
      }).catch(() => {})
    }
  }
}
</script>

<style scoped lang="scss">
$primary: #409eff;
$primary-light: #ecf5ff;
$border: #e4e7ed;
$text-main: #303133;
$text-sub: #909399;
$page-bg: #f5f7fb;

.paper-bank-page {
  padding: 16px 20px 20px;
  background: $page-bg;
  min-height: calc(100vh - 84px);
}

.paper-bank-layout {
  display: flex;
  gap: 20px;
  align-items: stretch;
  min-height: calc(100vh - 124px);
}

.course-panel {
  width: 280px;
  flex-shrink: 0;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.06);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.course-panel-header {
  padding: 20px 18px 16px;
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
  color: #fff;
}

.course-panel-header-main {
  display: flex;
  align-items: center;
  gap: 12px;
}

.course-panel-icon {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.course-panel-title {
  font-size: 16px;
  font-weight: 600;
  line-height: 1.3;
}

.course-panel-subtitle {
  margin-top: 4px;
  font-size: 12px;
  opacity: 0.85;
}

.course-search-wrap {
  padding: 14px 14px 0;
}

.course-search {
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

.course-list-wrap {
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

.course-item {
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

    .course-item-icon {
      background: $primary;
      color: #fff;
    }

    .course-name {
      color: $primary;
      font-weight: 600;
    }
  }
}

.course-item-icon {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #f0f2f5;
  color: #606266;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  transition: all 0.22s ease;
}

.course-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: $text-main;
  font-size: 14px;
  line-height: 1.4;
}

.course-item-check {
  flex-shrink: 0;
  color: $primary;
  font-size: 14px;
  font-weight: bold;
}

.paper-panel {
  flex: 1;
  min-width: 0;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.06);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.paper-panel-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 24px 18px;
  border-bottom: 1px solid #eef0f4;
}

.paper-panel-info {
  min-width: 0;
}

.paper-course-badge {
  display: inline-block;
  margin-bottom: 8px;
  padding: 2px 10px;
  font-size: 12px;
  color: $primary;
  background: $primary-light;
  border-radius: 20px;
}

.paper-panel-title {
  margin: 0 0 6px;
  font-size: 20px;
  font-weight: 600;
  color: $text-main;
  line-height: 1.3;
}

.paper-panel-desc {
  margin: 0;
  font-size: 14px;
  color: $text-sub;

  strong {
    color: $primary;
  }
}

.paper-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

.toolbar-input {
  width: 180px;
}

.toolbar-select {
  width: 130px;
}

.paper-card-area {
  flex: 1;
  margin: 16px 24px 0;
  min-height: 200px;
}

.paper-card-toolbar {
  margin-bottom: 14px;
  padding: 0 2px;
}

.paper-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  width: 100%;

  ::v-deep .el-checkbox__label {
    display: none;
  }
}

.paper-card {
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid #eef0f4;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.22s ease;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);

  &:hover {
    border-color: rgba($primary, 0.25);
    box-shadow: 0 8px 24px rgba(64, 158, 255, 0.12);
    transform: translateY(-2px);
  }

  &.is-selected {
    border-color: rgba($primary, 0.45);
    box-shadow: 0 0 0 1px rgba($primary, 0.15);
  }
}

.paper-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px 0;
}

.paper-card-body {
  flex: 1;
  padding: 10px 16px 12px;
  cursor: pointer;
}

.paper-card-title {
  margin: 0 0 6px;
  font-size: 16px;
  font-weight: 600;
  color: $text-main;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.paper-card-code {
  margin-bottom: 12px;
  font-size: 12px;
  color: $text-sub;
  font-family: Consolas, Monaco, monospace;
}

.paper-card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
  padding: 10px 12px;
  background: #f8fafc;
  border-radius: 8px;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.meta-item.meta-difficulty {
  flex: 1;
  align-items: flex-end;
}

.meta-label {
  font-size: 12px;
  color: $text-sub;
}

.meta-value {
  font-size: 18px;
  font-weight: 600;
  color: $primary;
}

.paper-card-desc {
  margin: 0 0 12px;
  min-height: 40px;
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.paper-card-footer-info {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 16px;
  font-size: 12px;
  color: $text-sub;

  .info-item {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.paper-card-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 2px 4px;
  padding: 8px 10px 10px;
  border-top: 1px solid #f0f2f5;
  background: #fafbfc;
}

.paper-card-area ::v-deep .el-rate {
  height: 20px;
  line-height: 20px;
}

.paper-card-area ::v-deep .el-rate__text {
  font-size: 12px;
}

.paper-panel ::v-deep .pagination-container {
  margin: 12px 24px 20px;
  padding: 0;
}

.paper-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 420px;
  background: linear-gradient(180deg, #fafbfc 0%, #fff 100%);
}

.paper-empty-inner {
  text-align: center;
  padding: 40px 24px;
}

.paper-empty-icon {
  font-size: 64px;
  color: #dcdfe6;
  margin-bottom: 16px;
}

.paper-empty-title {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 600;
  color: $text-main;
}

.paper-empty-desc {
  margin: 0;
  font-size: 14px;
  color: $text-sub;
  line-height: 1.6;
}

.form-field-tip {
  margin-top: 6px;
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
}

.paper-form {
  ::v-deep .difficulty-form-item {
    .el-form-item__label {
      line-height: 36px;
    }

    .el-form-item__content {
      display: flex;
      align-items: center;
      min-height: 36px;
      line-height: 36px;
    }

    .rate-field-wrap {
      display: inline-flex;
      align-items: center;
      min-height: 36px;
    }

    .el-rate {
      display: inline-flex;
      align-items: center;
      height: 36px;
      line-height: 36px;
    }

    .el-rate__text {
      line-height: 36px;
    }
  }
}

.ai-assemble-info {
  margin-bottom: 12px;
  padding: 12px 14px;
  background: #f4f8ff;
  border: 1px solid #d9ecff;
  border-radius: 8px;
  font-size: 13px;
  color: #606266;
  line-height: 1.8;

  p {
    margin: 0;
  }
}

.ai-assemble-tip {
  margin-bottom: 16px;
  padding: 10px 12px;
  font-size: 13px;
  color: #e6a23c;
  background: #fdf6ec;
  border: 1px solid #faecd8;
  border-radius: 6px;
  line-height: 1.6;
}
</style>

<style lang="scss">
.paper-settings-drawer {
  .el-drawer__body {
    padding: 0;
  }
}

.settings-drawer-inner {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f7f8fa;
}

.settings-drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 22px 24px 18px;
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
  color: #fff;
}

.settings-badge {
  display: inline-block;
  margin-bottom: 8px;
  padding: 2px 10px;
  font-size: 12px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.22);
}

.settings-title {
  margin: 0 0 6px;
  font-size: 20px;
  font-weight: 600;
}

.settings-desc {
  margin: 0;
  font-size: 13px;
  opacity: 0.92;
}

.settings-close-btn {
  border: none;
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  cursor: pointer;
}

.settings-toolbar {
  padding: 14px 20px;
  background: #fff;
  border-bottom: 1px solid #eef0f4;
  display: flex;
  gap: 10px;
  align-items: center;

  .el-button {
    border-radius: 6px;
    height: 36px;
    padding: 0 24px;
    font-size: 14px;
    font-weight: 500;
  }
}

.settings-table-wrap {
  flex: 1;
  overflow: auto;
  padding: 16px 20px 20px;

  .modern-table {
    width: 100%;

    table {
      table-layout: fixed;
      width: 100%;
    }
  }

  .paper-content-column .cell {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .paper-question-text {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .paper-score-column .cell {
    overflow: hidden;
    padding: 0 6px !important;
  }

  .paper-score-cell {
    display: flex;
    justify-content: center;
    width: 100%;
  }

  .paper-score-input.el-input-number {
    width: 110px;
  }
}

.assemble-paper-dialog {
  .paper-content-column .cell {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .paper-question-text {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .paper-score-column .cell {
    overflow: hidden;
    padding: 0 6px !important;
  }

  .paper-score-cell {
    display: flex;
    justify-content: center;
    width: 100%;
  }

  .paper-score-input.el-input-number {
    width: 110px;
  }

  .assemble-tip {
    margin-bottom: 12px;
    padding: 10px 12px;
    font-size: 13px;
    color: #606266;
    background: #f4f8ff;
    border: 1px solid #d9ecff;
    border-radius: 6px;
  }

  .assemble-tabs {
    margin-bottom: 12px;
  }

  .assemble-selected-tip {
    float: left;
    line-height: 32px;
    font-size: 13px;
    color: #606266;
  }
}
</style>
