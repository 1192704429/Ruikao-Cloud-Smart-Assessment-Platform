<template>
  <div class="app-container question-bank-page">
    <div class="question-bank-layout">
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

      <!-- 右侧题库 -->
      <section class="question-panel">
        <template v-if="selectedCourse">
          <div class="question-panel-top">
            <div class="question-panel-info">
              <div class="question-course-badge">当前课程</div>
              <h2 class="question-panel-title">{{ selectedCourse.courseName }}</h2>
              <p class="question-panel-desc">
                正在查看 <strong>{{ currentTypeLabel }}</strong>，共 <strong>{{ total }}</strong> 道题目
              </p>
            </div>
            <div class="question-toolbar">
              <el-select
                v-model="queryParams.status"
                placeholder="题目状态"
                clearable
                size="small"
                class="toolbar-select"
                @change="handleQuery"
              >
                <el-option :key="1" label="启用" :value="1" />
                <el-option :key="0" label="停用" :value="0" />
              </el-select>
              <el-button size="medium" plain icon="el-icon-refresh" @click="resetQuery">重置</el-button>
              <el-button size="medium" type="primary" icon="el-icon-plus" @click="handleAdd">新建题目</el-button>
              <el-button size="medium" type="warning" plain icon="el-icon-magic-stick" @click="handleOpenAiGenerate">AI 出题</el-button>
              <el-button size="medium" plain type="danger" icon="el-icon-delete" :disabled="multiple" @click="handleDeleteBatch">批量删除</el-button>
            </div>
          </div>

          <div class="question-tabs-wrap">
            <el-tabs v-model="activeQuestionType" class="question-type-tabs" @tab-click="handleTabChange">
              <el-tab-pane
                v-for="item in questionTypeOptions"
                :key="item.value"
                :label="item.label"
                :name="String(item.value)"
              />
            </el-tabs>
          </div>

          <div class="table-wrapper question-table-wrap">
            <el-table
              v-loading="loading"
              :data="questionList"
              @selection-change="handleSelectionChange"
              class="modern-table question-list-table"
            >
              <el-table-column type="selection" width="55" align="center" />
              <el-table-column label="题目内容" align="left" min-width="200" :show-overflow-tooltip="true">
                <template slot-scope="scope">
                  <span class="question-text-cell">{{ formatQuestionTextCell(scope.row.questionText) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="正确答案" align="center" min-width="100" :show-overflow-tooltip="true">
                <template slot-scope="scope">
                  <span>{{ formatAnswerDisplay(scope.row) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="分值" prop="score" align="center" width="80" />
              <el-table-column label="难度" align="center" width="120">
                <template slot-scope="scope">
                  <el-rate
                    :value="Number(scope.row.difficultyLevel) || 3"
                    disabled
                    :max="5"
                    :colors="['#99A9BF', '#F7BA2A', '#FF9900']"
                  />
                </template>
              </el-table-column>
              <el-table-column label="排序" prop="sortOrder" align="center" width="80" />
              <el-table-column label="状态" prop="status" align="center" width="90">
                <template slot-scope="scope">
                  <enum-tag :value="scope.row.status" :label-map="statusEnumMap" preset="enable" />
                </template>
              </el-table-column>
              <el-table-column label="创建时间" prop="createTime" align="center" min-width="160" :show-overflow-tooltip="true" />
              <el-table-column label="操作" align="center" width="200" class-name="small-padding fixed-width">
                <template slot-scope="scope">
                  <el-button size="medium" type="text" @click="handleShowDetail(scope.row)">详情</el-button>
                  <el-button size="medium" type="text" @click="handleUpdate(scope.row)">修改</el-button>
                  <el-button size="medium" type="text" style="color: #f56c6c;" @click="handleDelete(scope.row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
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

        <div v-else class="question-empty">
          <div class="question-empty-inner">
            <i class="el-icon-folder-opened question-empty-icon" />
            <p class="question-empty-title">请选择课程</p>
            <p class="question-empty-desc">从左侧课程列表中选择一门课程，即可查看和管理对应题库</p>
          </div>
        </div>
      </section>
    </div>

    <!-- 添加或修改对话框 -->
    <el-dialog
      :title="title"
      :visible.sync="open"
      width="720px"
      append-to-body
      destroy-on-close
      custom-class="question-form-dialog"
      @close="handleDialogClose"
    >
      <div class="question-form-top">
        <div class="question-form-tags">
          <span class="form-tag form-tag-course">
            <i class="el-icon-notebook-2" />
            {{ selectedCourse ? selectedCourse.courseName : '—' }}
          </span>
          <span class="form-tag form-tag-type">{{ getQuestionTypeLabel(formQuestionType) }}</span>
        </div>
      </div>

      <el-form ref="form" :model="form" :rules="rules" label-width="0" class="question-form">
        <el-collapse v-model="formCollapseActive" class="question-form-collapse">
          <el-collapse-item name="content">
            <template slot="title">
              <div class="collapse-title">
                <span class="collapse-title-left">
                  <i class="el-icon-edit-outline" />
                  <span>题目内容</span>
                </span>
                <span v-if="questionPreview && !formCollapseActive.includes('content')" class="collapse-summary">{{ questionPreview }}</span>
              </div>
            </template>
            <el-form-item prop="questionText" class="collapse-form-item">
              <el-input
                v-model="form.questionText"
                type="textarea"
                :rows="4"
                placeholder="请输入题目内容"
                maxlength="2000"
                show-word-limit
                resize="none"
              />
            </el-form-item>
          </el-collapse-item>

          <el-collapse-item v-if="isChoiceType" name="options">
            <template slot="title">
              <div class="collapse-title">
                <span class="collapse-title-left">
                  <i class="el-icon-menu" />
                  <span>选项设置</span>
                </span>
                <span v-if="!formCollapseActive.includes('options')" class="collapse-summary">
                  {{ filledOptionList.length ? `已填 ${filledOptionList.length} 项` : '请添加选项' }}
                </span>
              </div>
            </template>
            <div class="option-list">
              <div v-for="(opt, index) in optionList" :key="index" class="option-row">
                <span class="option-label">{{ opt.label }}</span>
                <el-input v-model="opt.content" placeholder="请输入选项内容" size="small" />
                <el-button size="medium"
                  v-if="optionList.length > 2"
                  type="text"
                  icon="el-icon-close"
                  class="option-remove-btn"
                  @click="removeOption(index)"
                />
              </div>
              <el-button size="medium"
                v-if="optionList.length < 8"
                type="text"
                icon="el-icon-plus"
                class="option-add-btn"
                @click="addOption"
              >添加选项</el-button>
            </div>
          </el-collapse-item>

          <el-collapse-item name="answer">
            <template slot="title">
              <div class="collapse-title">
                <span class="collapse-title-left">
                  <i class="el-icon-circle-check" />
                  <span>答案设置</span>
                </span>
                <span v-if="formAnswerPreview && !formCollapseActive.includes('answer')" class="collapse-summary">{{ formAnswerPreview }}</span>
              </div>
            </template>

            <el-form-item v-if="isJudgeType" prop="answer" class="collapse-form-item">
              <div class="answer-judge-list">
                <div
                  :class="['answer-judge-card', { 'is-active': form.answer === 'A' }]"
                  @click="form.answer = 'A'"
                >
                  <span class="judge-icon success"><i class="el-icon-check" /></span>
                  <span class="judge-text">正确</span>
                </div>
                <div
                  :class="['answer-judge-card', { 'is-active': form.answer === 'B' }]"
                  @click="form.answer = 'B'"
                >
                  <span class="judge-icon error"><i class="el-icon-close" /></span>
                  <span class="judge-text">错误</span>
                </div>
              </div>
            </el-form-item>

            <el-form-item v-else-if="formQuestionType === 1" prop="answer" class="collapse-form-item">
              <div v-if="filledOptionList.length" class="answer-select-list">
                <div
                  v-for="opt in filledOptionList"
                  :key="opt.label"
                  :class="['answer-select-card', { 'is-active': form.answer === opt.label }]"
                  @click="form.answer = opt.label"
                >
                  <span class="answer-letter">{{ opt.label }}</span>
                  <span class="answer-text">{{ opt.content }}</span>
                  <i v-if="form.answer === opt.label" class="el-icon-check answer-check-icon" />
                </div>
              </div>
              <span v-else class="form-empty-tip">请先填写选项内容</span>
            </el-form-item>

            <el-form-item v-else-if="formQuestionType === 2" prop="answer" class="collapse-form-item">
              <div v-if="filledOptionList.length" class="answer-select-list">
                <div
                  v-for="opt in filledOptionList"
                  :key="opt.label"
                  :class="['answer-select-card', 'is-multi', { 'is-active': multipleAnswerList.includes(opt.label) }]"
                  @click="toggleMultipleAnswer(opt.label)"
                >
                  <span class="answer-letter">{{ opt.label }}</span>
                  <span class="answer-text">{{ opt.content }}</span>
                  <span v-if="multipleAnswerList.includes(opt.label)" class="answer-check-box">
                    <i class="el-icon-check" />
                  </span>
                </div>
              </div>
              <span v-else class="form-empty-tip">请先填写选项内容</span>
            </el-form-item>

            <el-form-item v-else-if="isTextAnswerType" prop="answer" class="collapse-form-item">
              <el-input
                v-model="form.answer"
                type="textarea"
                :rows="formQuestionType === 5 ? 3 : 2"
                :placeholder="formQuestionType === 4 ? '请输入填空题参考答案' : '请输入简答题参考答案'"
                resize="none"
              />
            </el-form-item>
          </el-collapse-item>

          <el-collapse-item name="extra">
            <template slot="title">
              <div class="collapse-title">
                <span class="collapse-title-left">
                  <i class="el-icon-setting" />
                  <span>其他设置</span>
                </span>
                <span v-if="!formCollapseActive.includes('extra')" class="collapse-summary">
                  {{ form.score }} 分 · {{ form.difficultyLevel || 3 }} 星 · 排序 {{ form.sortOrder }} · {{ form.status === 1 ? '启用' : '停用' }}
                </span>
              </div>
            </template>

            <div class="extra-settings">
              <el-form-item v-if="!isTeacher" label="创建教师" prop="teacherId" label-width="96px" class="extra-form-item">
                <el-select v-model="form.teacherId" placeholder="请选择创建教师" clearable style="width: 100%;">
                  <el-option
                    v-for="(item, idx) in sysUserOptions"
                    :key="idx"
                    :label="item.realName"
                    :value="item.id"
                  />
                </el-select>
              </el-form-item>

              <div class="extra-row">
                <el-form-item label="分值" prop="score" label-width="96px" class="extra-form-item extra-col">
                  <el-input-number v-model="form.score" :min="0" :max="100" controls-position="right" />
                </el-form-item>
                <el-form-item label="难度" prop="difficultyLevel" label-width="96px" class="extra-form-item extra-col">
                  <el-rate v-model="form.difficultyLevel" :max="5" show-text :texts="difficultyTexts" />
                </el-form-item>
              </div>

              <div class="extra-row">
                <el-form-item label="排序" prop="sortOrder" label-width="96px" class="extra-form-item extra-col">
                  <el-input-number v-model="form.sortOrder" :min="0" :max="9999" controls-position="right" />
                </el-form-item>
              </div>

              <el-form-item label="状态" prop="status" label-width="96px" class="extra-form-item">
                <el-radio-group v-model="form.status">
                  <el-radio
                    v-for="(item, index) in statusOptions"
                    :key="index"
                    :label="item.value"
                  >{{ item.label }}</el-radio>
                </el-radio-group>
              </el-form-item>

              <el-form-item label="答案解析" prop="analysis" label-width="96px" class="extra-form-item extra-form-item-last">
                <el-input
                  v-model="form.analysis"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入答案解析"
                  resize="none"
                />
              </el-form-item>
            </div>
          </el-collapse-item>
        </el-collapse>
      </el-form>

      <div slot="footer" class="question-dialog-footer">
        <el-button size="medium" @click="cancel">取消</el-button>
        <el-button size="medium" type="primary" @click="submitForm">保存</el-button>
      </div>
    </el-dialog>

    <!-- 题目详情抽屉 -->
    <el-drawer
      :visible.sync="detailDrawerVisible"
      direction="rtl"
      size="520px"
      :with-header="false"
      append-to-body
      custom-class="question-detail-drawer"
      @close="handleCloseDetail"
    >
      <div v-if="detailRow" class="drawer-inner">
        <div class="drawer-header">
          <div class="drawer-header-left">
            <span class="drawer-type-badge">{{ getQuestionTypeLabel(detailRow.questionType) }}</span>
            <h3 class="drawer-title">题目详情</h3>
            <p class="drawer-subtitle">{{ selectedCourse ? selectedCourse.courseName : '' }}</p>
          </div>
          <button type="button" class="drawer-close-btn" @click="detailDrawerVisible = false">
            <i class="el-icon-close" />
          </button>
        </div>

        <div class="drawer-meta">
          <div class="meta-item">
            <span class="meta-label">分值</span>
            <span class="meta-value">{{ detailRow.score }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">难度</span>
            <el-rate
              :value="Number(detailRow.difficultyLevel) || 3"
              disabled
              :max="5"
              :colors="['#99A9BF', '#F7BA2A', '#FF9900']"
            />
          </div>
          <div class="meta-item">
            <span class="meta-label">排序</span>
            <span class="meta-value">{{ detailRow.sortOrder }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">状态</span>
            <enum-tag :value="detailRow.status" :label-map="statusEnumMap" preset="enable" />
          </div>
          <div class="meta-item meta-item-wide">
            <span class="meta-label">创建时间</span>
            <span class="meta-value">{{ detailRow.createTime || '—' }}</span>
          </div>
        </div>

        <div class="drawer-body">
          <section class="drawer-section">
            <div class="section-head">
              <i class="el-icon-document" />
              <span>题目内容</span>
            </div>
            <div class="section-box question-content-box">
              {{ formatQuestionTextDisplay(detailRow.questionText) }}
            </div>
          </section>

          <section v-if="hasRowOptions(detailRow)" class="drawer-section">
            <div class="section-head">
              <i class="el-icon-menu" />
              <span>选项</span>
            </div>
            <ul class="drawer-options">
              <li
                v-for="opt in getRowOptionList(detailRow)"
                :key="opt.label"
                :class="['drawer-option-item', { 'is-correct': isAnswerOption(detailRow, opt) }]"
              >
                <span class="option-tag">{{ opt.label }}</span>
                <span class="option-text">{{ opt.content }}</span>
                <i v-if="isAnswerOption(detailRow, opt)" class="el-icon-check option-check-icon" />
              </li>
            </ul>
          </section>

          <section class="drawer-section">
            <div class="section-head">
              <i class="el-icon-circle-check" />
              <span>正确答案</span>
            </div>
            <div class="section-box answer-highlight">
              {{ formatAnswerDisplay(detailRow) }}
            </div>
          </section>

          <section class="drawer-section">
            <div class="section-head">
              <i class="el-icon-info" />
              <span>答案解析</span>
            </div>
            <div class="section-box analysis-box">
              {{ detailRow.analysis || '暂无解析' }}
            </div>
          </section>
        </div>

        <div class="drawer-footer">
          <el-button size="medium" @click="detailDrawerVisible = false">关 闭</el-button>
          <el-button size="medium" type="primary" icon="el-icon-edit" @click="handleUpdateFromDetail">编辑题目</el-button>
        </div>
      </div>
    </el-drawer>

    <!-- AI 出题弹窗 -->
    <el-dialog
      title="AI 出题"
      :visible.sync="aiGenerateDialogVisible"
      width="720px"
      append-to-body
      custom-class="ai-generate-dialog"
      @close="handleAiGenerateClose"
    >
      <div v-if="selectedCourse" class="ai-generate-info">
        <p><strong>目标课程：</strong>{{ selectedCourse.courseName }}</p>
        <p><strong>合计出题：</strong>{{ aiGenerateTotalCount }} 道</p>
      </div>
      <div class="ai-generate-tip">
        从知识库中选择已上线文档（按分类展开勾选），AI 将根据文档内容自动生成题目并写入当前课程题库。
        文本超过 2 万字时将自动分片出题。
      </div>
      <el-form ref="aiGenerateForm" :model="aiGenerateForm" label-width="100px" class="ai-generate-form">
        <el-form-item label="知识库文档" required>
          <div v-loading="knowledgeLoading" class="knowledge-tree-wrap">
            <el-tree
              ref="knowledgeTree"
              :data="knowledgeTreeData"
              show-checkbox
              node-key="id"
              default-expand-all
              :props="knowledgeTreeProps"
              @check="handleKnowledgeTreeCheck"
            >
              <span slot-scope="{ node, data }" class="knowledge-tree-node">
                <i :class="data.type === 'category' ? 'el-icon-folder-opened' : 'el-icon-document'" />
                <span class="knowledge-tree-label" :title="node.label">{{ node.label }}</span>
                <span v-if="data.statusLabel" class="knowledge-tree-status">{{ data.statusLabel }}</span>
              </span>
            </el-tree>
            <el-empty
              v-if="!knowledgeLoading && !knowledgeTreeData.length"
              description="暂无知识库分类或文档"
              :image-size="64"
            />
          </div>
          <div v-if="aiGenerateForm.knowledgeIds.length" class="knowledge-selected-tip">
            已选 {{ aiGenerateForm.knowledgeIds.length }} 个文档
          </div>
        </el-form-item>
        <el-form-item label="题型数量" required>
          <div class="ai-type-count-grid">
            <div v-for="item in questionTypeOptions" :key="item.value" class="ai-type-count-item">
              <span class="ai-type-label">{{ item.label }}</span>
              <el-input-number
                v-model="aiGenerateForm.typeCounts[item.value]"
                :min="0"
                :max="50"
                size="small"
                controls-position="right"
              />
            </div>
          </div>
        </el-form-item>
        <el-form-item label="默认分值">
          <el-input-number v-model="aiGenerateForm.score" :min="0.5" :max="100" :step="0.5" :precision="1" />
        </el-form-item>
        <el-form-item label="默认难度">
          <el-rate v-model="aiGenerateForm.difficultyLevel" :max="5" show-text :texts="difficultyTexts" />
        </el-form-item>
        <el-form-item label="出题要求">
          <el-input
            v-model="aiGenerateForm.requirement"
            type="textarea"
            :rows="4"
            placeholder="例如：重点考察基础概念；题目表述简洁；避免过于偏门的细节"
          />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button size="medium" @click="aiGenerateDialogVisible = false">取消</el-button>
        <el-button size="medium" type="primary" @click="submitAiGenerate">开始出题</el-button>
      </div>
    </el-dialog>

    <!-- AI 出题进度弹窗 -->
    <el-dialog
      :visible.sync="aiGenerateProgressVisible"
      width="420px"
      append-to-body
      custom-class="ai-generate-progress-dialog"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
    >
      <div class="ai-generate-progress">
        <i class="el-icon-loading ai-generate-progress-icon" />
        <p class="ai-generate-progress-title">AI 出题中，请稍后...</p>
        <p class="ai-generate-progress-desc">正在根据知识库内容生成题目，文档较大时可能需要较长时间</p>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  pageQuestion,
  getQuestionById,
  saveQuestion,
  updateQuestion,
  deleteQuestion,
  deleteBatchQuestion,
  listCourse,
  listSysUser,
  aiGenerateQuestion
} from '@/api/question'
import { listKnowledge } from '@/views/views/knowledgeManagement/api/knowledge'
import { listKnowledgeType } from '@/views/views/knowledgeManagement/api/knowledge_type'
import Pagination from '@/components/Pagination'
import { mapGetters } from 'vuex'

export default {
  name: 'Question',
  components: {
    Pagination
  },
  data() {
    return {
      courseLoading: false,
      courseList: [],
      courseKeyword: '',
      selectedCourse: null,
      activeQuestionType: '1',
      loading: false,
      ids: [],
      single: true,
      multiple: true,
      total: 0,
      questionList: [],
      title: '',
      open: false,
      formCollapseActive: ['content', 'options', 'answer', 'extra'],
      detailDrawerVisible: false,
      detailRow: null,
      queryParams: {
        current: 1,
        size: 10,
        courseId: null,
        questionType: 1,
        status: null
      },
      form: {},
      optionList: [],
      multipleAnswerList: [],
      rules: {
        teacherId: [
          { required: true, message: '创建教师不能为空', trigger: 'change' }
        ],
        answer: [
          { required: true, message: '正确答案不能为空', trigger: 'blur' }
        ],
        score: [
          { required: true, message: '分值不能为空', trigger: 'blur' }
        ],
        sortOrder: [
          { required: true, message: '排序不能为空', trigger: 'blur' }
        ],
        difficultyLevel: [
          { required: true, message: '请选择难度星级', trigger: 'change' }
        ],
        status: [
          { required: true, message: '状态不能为空', trigger: 'change' }
        ],
        questionText: [
          { required: true, message: '题目内容不能为空', trigger: 'blur' }
        ],
        analysis: [
          { required: true, message: '答案解析不能为空', trigger: 'blur' }
        ]
      },
      sysUserOptions: [],
      questionTypeOptions: [
        { value: 1, label: '单选题' },
        { value: 2, label: '多选题' },
        { value: 3, label: '判断题' },
        { value: 4, label: '填空题' },
        { value: 5, label: '简答题' }
      ],
      statusOptions: [{ value: 1, label: '启用' }, { value: 0, label: '停用' }],
      statusEnumMap: { 1: '启用', 0: '停用' },
      difficultyTexts: ['1星', '2星', '3星', '4星', '5星'],
      aiGenerateDialogVisible: false,
      aiGenerateProgressVisible: false,
      knowledgeLoading: false,
      knowledgeTreeData: [],
      knowledgeTreeProps: {
        label: 'label',
        children: 'children',
        disabled: 'disabled'
      },
      aiGenerateForm: {
        knowledgeIds: [],
        typeCounts: { 1: 5, 2: 3, 3: 2, 4: 0, 5: 0 },
        score: 5,
        difficultyLevel: 3,
        requirement: ''
      }
    }
  },
  computed: {
    ...mapGetters(['id', 'role']),
    aiGenerateTotalCount() {
      const counts = this.aiGenerateForm.typeCounts || {}
      return Object.values(counts).reduce((sum, n) => sum + (Number(n) || 0), 0)
    },
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
    currentTypeLabel() {
      return this.getQuestionTypeLabel(Number(this.activeQuestionType))
    },
    formQuestionType() {
      return Number(this.form.questionType || this.activeQuestionType)
    },
    isChoiceType() {
      return this.formQuestionType === 1 || this.formQuestionType === 2
    },
    isJudgeType() {
      return this.formQuestionType === 3
    },
    isTextAnswerType() {
      return this.formQuestionType === 4 || this.formQuestionType === 5
    },
    filledOptionList() {
      return this.optionList.filter(item => (item.content || '').trim())
    },
    questionPreview() {
      const text = String(this.form.questionText || '').trim()
      if (!text) {
        return ''
      }
      return text.length > 28 ? `${text.slice(0, 28)}...` : text
    },
    formAnswerPreview() {
      const type = this.formQuestionType
      if (type === 3) {
        if (this.form.answer === 'A') return '正确'
        if (this.form.answer === 'B') return '错误'
        return ''
      }
      if (type === 1) {
        return this.form.answer || ''
      }
      if (type === 2) {
        return this.multipleAnswerList.length ? this.multipleAnswerList.join('、') : ''
      }
      if (type === 4 || type === 5) {
        const text = String(this.form.answer || '').trim()
        if (!text) return ''
        return text.length > 20 ? `${text.slice(0, 20)}...` : text
      }
      return ''
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
      this.getList()
    },
    handleTabChange() {
      this.queryParams.questionType = Number(this.activeQuestionType)
      this.queryParams.current = 1
      this.ids = []
      this.multiple = true
      this.getList()
    },
    getList() {
      if (!this.selectedCourse) {
        this.questionList = []
        this.total = 0
        return
      }
      this.loading = true
      const { current, size, ...rest } = this.queryParams
      pageQuestion(current, size, { ...rest, courseId: this.selectedCourse.id }).then(response => {
        const pageData = response.data
        this.questionList = pageData.records || []
        this.total = Number(pageData.total) || 0
        this.loading = false
      }).catch(() => {
        this.loading = false
      })
    },
    getQuestionTypeLabel(value) {
      const item = this.questionTypeOptions.find(option => option.value === value)
      return item ? item.label : value
    },
    getSysUserOptions(params) {
      listSysUser(params || {}).then(response => {
        this.sysUserOptions = response.data || []
      })
    },
    handleShowDetail(row) {
      this.detailRow = row
      this.detailDrawerVisible = true
    },
    handleCloseDetail() {
      this.detailRow = null
    },
    handleUpdateFromDetail() {
      const row = this.detailRow
      this.detailDrawerVisible = false
      if (row) {
        this.handleUpdate(row)
      }
    },
    isAnswerOption(row, opt) {
      const type = Number(row.questionType)
      const answer = row.answer
      if (type === 3) {
        return opt.label === this.normalizeJudgeAnswer(answer)
      }
      if (type === 1 || type === 2) {
        return String(answer || '')
          .split(',')
          .map(item => item.trim())
          .includes(opt.label)
      }
      return false
    },
    hasRowOptions(row) {
      const type = Number(row.questionType)
      return type >= 1 && type <= 3
    },
    getRowOptionList(row) {
      const type = Number(row.questionType)
      return this.parseOptionsToList(row.options, type)
        .filter(item => (item.content || '').trim())
    },
    formatQuestionTextDisplay(html) {
      if (!html) {
        return '—'
      }
      const text = String(html)
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
      return text || '—'
    },
    normalizeQuestionTextForEdit(html) {
      if (!html) {
        return ''
      }
      const text = this.formatQuestionTextDisplay(html)
      return text === '—' ? '' : text
    },
    formatQuestionTextCell(html) {
      const text = this.formatQuestionTextDisplay(html)
      return text === '—' ? text : text.replace(/\s+/g, ' ')
    },
    formatAnswerDisplay(row) {
      const type = Number(row.questionType)
      const answer = row.answer
      if (!answer && answer !== 0) {
        return '—'
      }
      if (type === 3) {
        if (answer === 'A') return 'A（正确）'
        if (answer === 'B') return 'B（错误）'
        return this.normalizeJudgeAnswer(answer) === 'A' ? 'A（正确）' : 'B（错误）'
      }
      if (type === 1 || type === 2) {
        const list = this.getRowOptionList(row)
        const labels = String(answer).split(',').map(item => item.trim()).filter(Boolean)
        if (!list.length) {
          return labels.join('、')
        }
        const texts = labels.map(label => {
          const opt = list.find(item => item.label === label)
          return opt ? `${label}. ${opt.content}` : label
        })
        return texts.length ? texts.join('；') : answer
      }
      return answer
    },
    cancel() {
      this.open = false
      this.reset()
    },
    handleDialogClose() {
      this.optionList = []
      this.multipleAnswerList = []
      this.formCollapseActive = ['content', 'answer', 'extra']
    },
    resetFormCollapse() {
      const active = ['content', 'answer', 'extra']
      if (this.isChoiceType) {
        active.splice(1, 0, 'options')
      }
      this.formCollapseActive = active
    },
    reset() {
      this.form = {}
      this.optionList = []
      this.multipleAnswerList = []
      if (this.$refs.form) {
        this.$refs.form.resetFields()
      }
    },
    getOptionLabel(index) {
      return String.fromCharCode(65 + index)
    },
    normalizeJudgeAnswer(answer) {
      if (answer === 'A' || answer === 'B') {
        return answer
      }
      if (answer === '正确' || answer === true || answer === 'true' || answer === '1') {
        return 'A'
      }
      if (answer === '错误' || answer === false || answer === 'false' || answer === '0') {
        return 'B'
      }
      return 'A'
    },
    normalizeSingleChoiceAnswer(answer, optionList) {
      const list = optionList || this.optionList || []
      const raw = String(answer || '').trim()
      if (!raw) {
        return ''
      }
      if (/^[A-H]$/i.test(raw)) {
        return raw.toUpperCase()
      }
      const prefixMatch = raw.match(/^([A-H])\s*[\.、:：]/i)
      if (prefixMatch) {
        return prefixMatch[1].toUpperCase()
      }
      const byLabel = list.find(opt => String(opt.label).toUpperCase() === raw.toUpperCase())
      if (byLabel) {
        return byLabel.label
      }
      const byContent = list.find(opt => String(opt.content || '').trim() === raw)
      if (byContent) {
        return byContent.label
      }
      return raw.toUpperCase()
    },
    normalizeMultipleChoiceAnswer(answer, optionList) {
      const list = optionList || this.optionList || []
      const labels = String(answer || '')
        .split(/[,，]/)
        .map(item => item.trim())
        .filter(Boolean)
        .map(item => this.normalizeSingleChoiceAnswer(item, list))
        .filter(Boolean)
      return [...new Set(labels)].sort().join(',')
    },
    serializeAnswerForSave() {
      const type = this.formQuestionType
      const answer = this.form.answer
      if (type === 1) {
        return this.normalizeSingleChoiceAnswer(answer)
      }
      if (type === 2) {
        return this.normalizeMultipleChoiceAnswer(this.multipleAnswerList.join(','))
      }
      if (type === 3) {
        return this.normalizeJudgeAnswer(answer)
      }
      if (type === 4 || type === 5) {
        return String(answer || '').trim()
      }
      return answer
    },
    syncAnswerFromDb() {
      const questionType = this.formQuestionType
      if (questionType === 1) {
        this.$set(this.form, 'answer', this.normalizeSingleChoiceAnswer(this.form.answer, this.optionList))
      } else if (questionType === 2) {
        const normalized = this.normalizeMultipleChoiceAnswer(this.form.answer, this.optionList)
        this.multipleAnswerList = normalized ? normalized.split(',') : []
        this.$set(this.form, 'answer', normalized)
      } else if (questionType === 3) {
        this.$set(this.form, 'answer', this.normalizeJudgeAnswer(this.form.answer))
      } else if (questionType === 4 || questionType === 5) {
        this.$set(this.form, 'answer', String(this.form.answer || '').trim())
      }
    },
    createDefaultOptionList(count = 4) {
      return Array.from({ length: count }, (_, index) => ({
        label: this.getOptionLabel(index),
        content: ''
      }))
    },
    initOptionListForType(questionType) {
      if (questionType === 1 || questionType === 2) {
        this.optionList = this.createDefaultOptionList(4)
      } else if (questionType === 3) {
        this.optionList = [
          { label: 'A', content: '正确' },
          { label: 'B', content: '错误' }
        ]
      } else {
        this.optionList = []
      }
      this.multipleAnswerList = []
      if (questionType === 3) {
        this.$set(this.form, 'answer', this.normalizeJudgeAnswer(this.form.answer))
      }
    },
    syncOptionListFromForm() {
      const questionType = this.formQuestionType
      this.optionList = this.parseOptionsToList(this.form.options, questionType)
      this.syncAnswerFromDb()
    },
    parseOptionsToList(optionsStr, questionType) {
      if (questionType === 4 || questionType === 5) {
        return []
      }
      if (!optionsStr) {
        return questionType === 3
          ? [{ label: 'A', content: '正确' }, { label: 'B', content: '错误' }]
          : this.createDefaultOptionList(4)
      }
      try {
        const parsed = JSON.parse(optionsStr)
        if (Array.isArray(parsed) && parsed.length) {
          return parsed.map((item, index) => {
            if (typeof item === 'string') {
              return { label: this.getOptionLabel(index), content: item }
            }
            return {
              label: item.label || this.getOptionLabel(index),
              content: item.content || item.text || item.value || ''
            }
          })
        }
      } catch (e) {
        // 兼容旧数据：逗号分隔
        const parts = String(optionsStr).split(',').map(item => item.trim()).filter(Boolean)
        if (parts.length) {
          return parts.map((content, index) => ({
            label: this.getOptionLabel(index),
            content
          }))
        }
      }
      return questionType === 3
        ? [{ label: 'A', content: '正确' }, { label: 'B', content: '错误' }]
        : this.createDefaultOptionList(4)
    },
    serializeOptions() {
      if (this.isTextAnswerType) {
        return '[]'
      }
      const list = this.isJudgeType
        ? this.optionList
        : this.filledOptionList
      return JSON.stringify(list.map(item => ({
        label: item.label,
        content: item.content.trim()
      })))
    },
    addOption() {
      if (this.optionList.length >= 8) return
      this.optionList.push({
        label: this.getOptionLabel(this.optionList.length),
        content: ''
      })
      this.relabelOptions()
    },
    removeOption(index) {
      if (this.optionList.length <= 2) return
      this.optionList.splice(index, 1)
      this.relabelOptions()
      this.syncAnswerAfterOptionChange()
    },
    toggleMultipleAnswer(label) {
      const idx = this.multipleAnswerList.indexOf(label)
      if (idx >= 0) {
        this.multipleAnswerList.splice(idx, 1)
      } else {
        this.multipleAnswerList.push(label)
      }
      this.form.answer = this.normalizeMultipleChoiceAnswer(this.multipleAnswerList.join(','))
    },
    relabelOptions() {
      this.optionList.forEach((item, index) => {
        item.label = this.getOptionLabel(index)
      })
    },
    syncAnswerAfterOptionChange() {
      const labels = this.filledOptionList.map(item => item.label)
      if (this.formQuestionType === 1) {
        if (!labels.includes(this.form.answer)) {
          this.form.answer = labels[0] || ''
        }
      } else if (this.formQuestionType === 2) {
        this.multipleAnswerList = this.multipleAnswerList.filter(label => labels.includes(label))
        this.form.answer = this.multipleAnswerList.join(',')
      }
    },
    validateOptionsAndAnswer() {
      const type = this.formQuestionType
      if (type === 1 || type === 2) {
        if (this.filledOptionList.length < 2) {
          this.$message.warning('请至少填写两个选项')
          return false
        }
        if (!this.form.answer) {
          this.$message.warning('请选择正确答案')
          return false
        }
      }
      if (type === 2 && !this.multipleAnswerList.length) {
        this.$message.warning('请至少选择一个正确答案')
        return false
      }
      if (type === 3 && !['A', 'B'].includes(this.normalizeJudgeAnswer(this.form.answer))) {
        this.$message.warning('请选择正确答案')
        return false
      }
      if ((type === 4 || type === 5) && !(this.form.answer || '').trim()) {
        this.$message.warning('请输入参考答案')
        return false
      }
      return true
    },
    handleQuery() {
      this.queryParams.current = 1
      this.getList()
    },
    resetQuery() {
      this.queryParams.current = 1
      this.queryParams.size = this.queryParams.size || 10
      this.queryParams.status = null
      this.getList()
    },
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },
    handleAdd() {
      if (!this.selectedCourse) {
        this.$message.warning('请先选择课程')
        return
      }
      this.reset()
      const questionType = Number(this.activeQuestionType)
      this.form = {
        courseId: this.selectedCourse.id,
        questionType,
        status: 1,
        questionText: '',
        answer: questionType === 3 ? 'A' : '',
        teacherId: this.isTeacher ? this.id : undefined,
        score: 5,
        sortOrder: 0,
        difficultyLevel: 3
      }
      this.initOptionListForType(this.form.questionType)
      this.resetFormCollapse()
      this.open = true
      this.title = '添加题目'
    },
    handleUpdate(row) {
      this.reset()
      const id = row.id || this.ids[0]
      getQuestionById(id).then(response => {
        this.form = {
          ...response.data,
          questionText: this.normalizeQuestionTextForEdit(response.data.questionText),
          difficultyLevel: response.data.difficultyLevel != null ? response.data.difficultyLevel : 3
        }
        this.syncOptionListFromForm()
        this.resetFormCollapse()
        this.open = true
        this.title = '修改题目'
      })
    },
    submitForm() {
      if (this.formQuestionType === 2) {
        this.form.answer = this.normalizeMultipleChoiceAnswer(this.multipleAnswerList.join(','))
        this.multipleAnswerList = this.form.answer ? this.form.answer.split(',') : []
      }
      if (!this.validateOptionsAndAnswer()) {
        return
      }
      this.form.answer = this.serializeAnswerForSave()
      this.form.questionText = String(this.form.questionText || '').trim()
      this.form.options = this.serializeOptions()
      this.$refs['form'].validate(valid => {
        if (valid) {
          const payload = {
            ...this.form,
            courseId: this.selectedCourse ? this.selectedCourse.id : this.form.courseId,
            questionType: this.form.questionType || Number(this.activeQuestionType)
          }
          if (payload.id != null) {
            updateQuestion(payload).then(() => {
              this.$message.success('修改成功')
              this.open = false
              this.getList()
            })
          } else {
            saveQuestion(payload).then(() => {
              this.$message.success('新增成功')
              this.open = false
              this.getList()
            })
          }
        }
      })
    },
    handleDelete(row) {
      const ids = row.id || this.ids
      this.$confirm('是否确认删除编号为"' + ids + '"的数据项？', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        return deleteQuestion(ids)
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
        return deleteBatchQuestion(ids)
      }).then(() => {
        this.getList()
        this.$message.success('删除成功')
      }).catch(() => {})
    },
    handleOpenAiGenerate() {
      if (!this.selectedCourse) {
        this.$message.warning('请先选择课程')
        return
      }
      this.resetAiGenerateForm()
      this.aiGenerateDialogVisible = true
      this.loadKnowledgeTree()
    },
    handleAiGenerateClose() {
      this.clearKnowledgeTreeChecked()
    },
    resetAiGenerateForm() {
      this.aiGenerateForm = {
        knowledgeIds: [],
        typeCounts: { 1: 5, 2: 3, 3: 2, 4: 0, 5: 0 },
        score: 5,
        difficultyLevel: 3,
        requirement: ''
      }
      this.knowledgeTreeData = []
      this.clearKnowledgeTreeChecked()
    },
    clearKnowledgeTreeChecked() {
      this.$nextTick(() => {
        if (this.$refs.knowledgeTree) {
          this.$refs.knowledgeTree.setCheckedKeys([])
        }
      })
    },
    buildKnowledgeFileNode(item) {
      const selectable = item.status === 1 && item.online === true
      let statusLabel = ''
      if (item.status !== 1) {
        statusLabel = item.status === 0 ? '解析中' : '未解析'
      } else if (!item.online) {
        statusLabel = '未上线'
      }
      return {
        id: `file-${item.id}`,
        label: item.name,
        type: 'file',
        knowledgeId: item.id,
        disabled: !selectable,
        statusLabel
      }
    },
    buildKnowledgeCategoryNode(typeId, label, files) {
      const children = (files || []).map(item => this.buildKnowledgeFileNode(item))
      return {
        id: `type-${typeId}`,
        label: children.length ? `${label}（${children.length}）` : label,
        type: 'category',
        disabled: !children.some(child => !child.disabled),
        children
      }
    },
    loadKnowledgeTree() {
      this.knowledgeLoading = true
      Promise.all([
        listKnowledgeType({}),
        listKnowledge({})
      ]).then(([typeRes, knowledgeRes]) => {
        const types = typeRes.data || []
        const knowledgeList = knowledgeRes.data || []
        const grouped = {}
        const uncategorized = []
        knowledgeList.forEach(item => {
          const typeId = item.knowledgeTypeId
          if (typeId === null || typeId === undefined || typeId === '') {
            uncategorized.push(item)
            return
          }
          const key = String(typeId)
          if (!grouped[key]) {
            grouped[key] = []
          }
          grouped[key].push(item)
        })
        const treeData = types.map(type => this.buildKnowledgeCategoryNode(
          type.id,
          type.typeName,
          grouped[String(type.id)] || []
        ))
        if (uncategorized.length) {
          treeData.push(this.buildKnowledgeCategoryNode('uncategorized', '未分类', uncategorized))
        }
        this.knowledgeTreeData = treeData
        this.knowledgeLoading = false
        this.clearKnowledgeTreeChecked()
      }).catch(() => {
        this.knowledgeLoading = false
        this.$message.error('加载知识库失败，请稍后重试')
      })
    },
    handleKnowledgeTreeCheck() {
      const checkedNodes = this.$refs.knowledgeTree
        ? this.$refs.knowledgeTree.getCheckedNodes(true)
        : []
      this.aiGenerateForm.knowledgeIds = checkedNodes
        .filter(node => node.type === 'file' && node.knowledgeId)
        .map(node => node.knowledgeId)
    },
    buildTypeCountsPayload() {
      const payload = {}
      Object.keys(this.aiGenerateForm.typeCounts || {}).forEach(key => {
        const count = Number(this.aiGenerateForm.typeCounts[key]) || 0
        if (count > 0) {
          payload[key] = count
        }
      })
      return payload
    },
    submitAiGenerate() {
      if (!this.selectedCourse) {
        this.$message.warning('请先选择课程')
        return
      }
      this.handleKnowledgeTreeCheck()
      if (!this.aiGenerateForm.knowledgeIds.length) {
        this.$message.warning('请选择知识库文档')
        return
      }
      const typeCounts = this.buildTypeCountsPayload()
      if (!Object.keys(typeCounts).length) {
        this.$message.warning('请至少设置一种题型的出题数量')
        return
      }
      const payload = {
        courseId: this.selectedCourse.id,
        knowledgeIds: [...this.aiGenerateForm.knowledgeIds],
        typeCounts,
        score: this.aiGenerateForm.score,
        difficultyLevel: this.aiGenerateForm.difficultyLevel,
        requirement: (this.aiGenerateForm.requirement || '').trim()
      }
      this.aiGenerateDialogVisible = false
      this.aiGenerateProgressVisible = true
      aiGenerateQuestion(payload).then(response => {
        this.$message.success(response.msg || 'AI 出题成功')
        this.getList()
      }).catch(() => {
        // 错误提示由 request 拦截器统一处理
      }).finally(() => {
        this.aiGenerateProgressVisible = false
      })
    },
    handleSizeChange(val) {
      this.queryParams.size = val
      this.queryParams.current = 1
      this.getList()
    },
    handleCurrentChange(val) {
      this.queryParams.current = val
      this.getList()
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

.question-bank-page {
  padding: 16px 20px 20px;
  background: $page-bg;
  min-height: calc(100vh - 84px);
}

.question-bank-layout {
  display: flex;
  gap: 20px;
  align-items: stretch;
  min-height: calc(100vh - 124px);
}

// ---------- 左侧课程 ----------
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

// ---------- 右侧题库 ----------
.question-panel {
  flex: 1;
  min-width: 0;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.06);
  padding: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.question-panel-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  padding: 22px 24px 18px;
  border-bottom: 1px solid #f0f2f5;
}

.question-panel-info {
  min-width: 0;
}

.question-course-badge {
  display: inline-block;
  padding: 2px 10px;
  margin-bottom: 8px;
  font-size: 12px;
  color: $primary;
  background: $primary-light;
  border-radius: 20px;
}

.question-panel-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: $text-main;
  line-height: 1.35;
}

.question-panel-desc {
  margin: 8px 0 0;
  font-size: 13px;
  color: $text-sub;
  line-height: 1.5;

  strong {
    color: $primary;
    font-weight: 600;
  }
}

.question-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.toolbar-select {
  width: 130px;
}

.question-tabs-wrap {
  padding: 0 24px;
  background: #fafbfc;
  border-bottom: 1px solid #f0f2f5;
}

.question-type-tabs {
  ::v-deep .el-tabs__header {
    margin-bottom: 0;
  }

  ::v-deep .el-tabs__nav-wrap::after {
    display: none;
  }

  ::v-deep .el-tabs__item {
    height: 46px;
    line-height: 46px;
    padding: 0 18px;
    font-size: 14px;
    color: #606266;
    transition: color 0.2s;

    &:hover {
      color: $primary;
    }

    &.is-active {
      color: $primary;
      font-weight: 600;
    }
  }

  ::v-deep .el-tabs__active-bar {
    height: 3px;
    border-radius: 3px 3px 0 0;
    background: $primary;
  }
}

.question-table-wrap {
  flex: 1;
  margin: 16px 24px 0;
  background: #fff !important;
  border-radius: 10px;
  border: 1px solid #eef0f4;
  box-shadow: none !important;
  overflow: hidden;
}

.question-text-cell {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: $text-main;
  text-align: left;
}

.option-tag {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  line-height: 24px;
  text-align: center;
  border-radius: 50%;
  background: $primary-light;
  color: $primary;
  font-size: 12px;
  font-weight: 600;
}

.question-panel ::v-deep .pagination-container {
  margin: 12px 24px 20px;
  padding: 0;
}

.question-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 420px;
  background: linear-gradient(180deg, #fafbfc 0%, #fff 100%);
}

.question-empty-inner {
  text-align: center;
  padding: 40px 24px;
}

.question-empty-icon {
  font-size: 64px;
  color: #dcdfe6;
  margin-bottom: 16px;
}

.question-empty-title {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 600;
  color: $text-main;
}

.question-empty-desc {
  margin: 0;
  font-size: 14px;
  color: $text-sub;
  line-height: 1.6;
}

.option-list {
  width: 100%;
}

.option-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
  padding: 10px 12px;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 10px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    border-color: #c6e2ff;
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.08);
  }
}

.option-label {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  line-height: 32px;
  font-size: 14px;
  font-weight: 600;
  color: #409eff;
  text-align: center;
  background: linear-gradient(135deg, #ecf5ff 0%, #e0f2fe 100%);
  border-radius: 8px;
}

.option-row .el-input {
  flex: 1;
}

.option-remove-btn {
  flex-shrink: 0;
  color: #c0c4cc;
  padding: 4px;

  &:hover {
    color: #f56c6c;
  }
}

.option-add-btn {
  padding-left: 0;
  color: #409eff;
}
</style>

<style lang="scss">
.question-form-dialog {
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 12px 40px rgba(15, 23, 42, 0.12);

  .el-dialog__header {
    padding: 18px 24px 14px;
    background: #fff;
    border-bottom: 1px solid #ebeef5;

    .el-dialog__title {
      font-size: 17px;
      font-weight: 600;
      color: #303133;
    }
  }

  .el-dialog__body {
    padding: 16px 20px 12px;
    background: #f7f8fa;
  }

  .el-dialog__footer {
    padding: 12px 24px 16px;
    background: #fff;
    border-top: 1px solid #ebeef5;
  }
}

.question-form-top {
  margin-bottom: 14px;
}

.question-form-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.form-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  font-size: 13px;
  border-radius: 6px;
  line-height: 1.4;

  i {
    font-size: 14px;
  }
}

.form-tag-course {
  color: #606266;
  background: #fff;
  border: 1px solid #e4e7ed;
}

.form-tag-type {
  color: #409eff;
  background: #ecf5ff;
  border: 1px solid #d9ecff;
  font-weight: 500;
}

.question-form-collapse {
  border: none;

  .el-collapse-item {
    margin-bottom: 12px;
    background: #fff;
    border: 1px solid #e4e7ed;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 1px 4px rgba(15, 23, 42, 0.04);

    &:last-child {
      margin-bottom: 0;
    }
  }

  .el-collapse-item__header {
    height: 50px;
    line-height: 50px;
    padding: 0 16px;
    font-size: 14px;
    color: #303133;
    background: #fff;
    border-bottom: none;
    transition: background 0.2s;

    &:hover {
      background: #f5faff;
    }

    &.is-active {
      border-bottom: 1px solid #ebeef5;
      background: linear-gradient(90deg, #f5faff 0%, #fff 100%);
    }
  }

  .el-collapse-item__wrap {
    border-bottom: none;
  }

  .el-collapse-item__content {
    padding: 14px 16px 16px;
  }

  .el-collapse-item__arrow {
    color: #909399;
    font-weight: 600;
  }
}

.collapse-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: calc(100% - 24px);
  padding-right: 8px;
}

.collapse-title-left {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #303133;

  i {
    color: #409eff;
    font-size: 16px;
  }
}

.collapse-summary {
  flex: 1;
  min-width: 0;
  margin-left: 16px;
  font-size: 12px;
  font-weight: normal;
  color: #909399;
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.collapse-form-item {
  margin-bottom: 0 !important;

  .el-form-item__content {
    margin-left: 0 !important;
    line-height: normal;
  }
}

.extra-settings {
  .extra-form-item {
    margin-bottom: 16px;

    .el-form-item__label {
      color: #606266;
      font-weight: normal;
      white-space: nowrap;
    }
  }

  .extra-form-item-last {
    margin-bottom: 0;
  }
}

.extra-row {
  display: flex;
  gap: 16px;

  .extra-col {
    flex: 1;
    margin-bottom: 16px !important;

    .el-input-number {
      width: 100%;
    }
  }
}

.answer-judge-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.answer-judge-card {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px;
  background: #fff;
  border: 2px solid #e4e7ed;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #b3d8ff;
    background: #f5faff;
  }

  &.is-active {
    border-color: #409eff;
    background: linear-gradient(135deg, #ecf5ff 0%, #f0f9ff 100%);
    box-shadow: 0 4px 14px rgba(64, 158, 255, 0.15);
  }
}

.judge-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 700;

  &.success {
    color: #67c23a;
    background: #f0f9eb;
  }

  &.error {
    color: #f56c6c;
    background: #fef0f0;
  }
}

.answer-judge-card.is-active .judge-icon.success {
  color: #fff;
  background: #67c23a;
}

.answer-judge-card.is-active .judge-icon.error {
  color: #fff;
  background: #f56c6c;
}

.judge-text {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.answer-select-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.answer-select-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: #fff;
  border: 2px solid #e4e7ed;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;

  &:hover {
    border-color: #b3d8ff;
    background: #f5faff;
    transform: translateX(2px);
  }

  &.is-active {
    border-color: #409eff;
    background: linear-gradient(135deg, #ecf5ff 0%, #f0f9ff 100%);
    box-shadow: 0 4px 14px rgba(64, 158, 255, 0.12);
  }
}

.answer-letter {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  line-height: 32px;
  text-align: center;
  font-size: 14px;
  font-weight: 700;
  color: #409eff;
  background: #ecf5ff;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.answer-select-card.is-active .answer-letter {
  color: #fff;
  background: #409eff;
}

.answer-text {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  line-height: 1.6;
  color: #303133;
}

.answer-check-icon {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  line-height: 22px;
  text-align: center;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  background: #409eff;
  border-radius: 50%;
}

.answer-check-box {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  background: #409eff;
  border-radius: 6px;
}

.form-empty-tip {
  display: block;
  padding: 20px;
  font-size: 13px;
  color: #909399;
  text-align: center;
  background: #fff;
  border: 1px dashed #dcdfe6;
  border-radius: 12px;
}

.question-dialog-footer {
  text-align: right;
}

.question-detail-drawer {
  .el-drawer__body {
    padding: 0;
    overflow: hidden;
  }
}

.drawer-inner {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f5f7fb;
}

.drawer-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 24px 24px 20px;
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
  color: #fff;
}

.drawer-header-left {
  flex: 1;
  min-width: 0;
}

.drawer-type-badge {
  display: inline-block;
  padding: 2px 10px;
  margin-bottom: 10px;
  font-size: 12px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.22);
  border: 1px solid rgba(255, 255, 255, 0.35);
}

.drawer-title {
  margin: 0 0 6px;
  font-size: 20px;
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
  width: 32px;
  height: 32px;
  margin-left: 12px;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  i {
    font-size: 16px;
  }
}

.drawer-meta {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  padding: 16px 20px;
  background: #fff;
  border-bottom: 1px solid #eef0f4;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  background: #f8fafc;
  border-radius: 10px;
  border: 1px solid #eef0f4;
}

.meta-item-wide {
  grid-column: 1 / -1;
}

.meta-label {
  font-size: 12px;
  color: #909399;
}

.meta-value {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px 20px;

  &::-webkit-scrollbar {
    width: 5px;
  }

  &::-webkit-scrollbar-thumb {
    background: #dcdfe6;
    border-radius: 4px;
  }
}

.drawer-section {
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }
}

.section-head {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: 600;
  color: #303133;

  i {
    color: #409eff;
    font-size: 15px;
  }
}

.section-box {
  padding: 14px 16px;
  background: #fff;
  border: 1px solid #eef0f4;
  border-radius: 10px;
  font-size: 14px;
  color: #303133;
  line-height: 1.75;
  word-break: break-word;
}

.question-content-box {
  white-space: pre-wrap;
}

.answer-highlight {
  color: #409eff;
  font-weight: 600;
  background: #ecf5ff;
  border-color: rgba(64, 158, 255, 0.25);
}

.analysis-box {
  color: #606266;
}

.drawer-options {
  margin: 0;
  padding: 0;
  list-style: none;
}

.drawer-option-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  margin-bottom: 8px;
  background: #fff;
  border: 1px solid #eef0f4;
  border-radius: 10px;
  transition: all 0.2s;

  &:last-child {
    margin-bottom: 0;
  }

  &.is-correct {
    background: #ecf5ff;
    border-color: rgba(64, 158, 255, 0.35);
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.08);

    .option-tag {
      background: #409eff;
      color: #fff;
    }

    .option-text {
      color: #409eff;
      font-weight: 600;
    }
  }
}

.drawer-option-item .option-tag {
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  line-height: 26px;
  text-align: center;
  border-radius: 50%;
  background: #ecf5ff;
  color: #409eff;
  font-size: 12px;
  font-weight: 600;
}

.option-text {
  flex: 1;
  font-size: 14px;
  color: #303133;
  line-height: 1.6;
}

.option-check-icon {
  flex-shrink: 0;
  color: #409eff;
  font-size: 16px;
  font-weight: bold;
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 20px 18px;
  background: #fff;
  border-top: 1px solid #eef0f4;
  box-shadow: 0 -4px 12px rgba(15, 23, 42, 0.04);
}

.ai-generate-info {
  margin-bottom: 12px;
  padding: 12px 14px;
  background: #f5f7fa;
  border-radius: 8px;
  font-size: 14px;
  color: #606266;
  line-height: 1.8;

  p {
    margin: 0;
  }
}

.ai-generate-tip {
  margin-bottom: 16px;
  padding: 10px 12px;
  background: #fdf6ec;
  border: 1px solid #faecd8;
  border-radius: 8px;
  font-size: 13px;
  color: #e6a23c;
  line-height: 1.6;
}

.ai-type-count-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px 24px;
}

.ai-type-count-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.ai-type-label {
  font-size: 14px;
  color: #606266;
  white-space: nowrap;
}

.knowledge-tree-wrap {
  width: 100%;
  min-height: 180px;
  max-height: 280px;
  overflow: auto;
  padding: 10px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  background: #fafafa;
}

.knowledge-tree-node {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: calc(100% - 24px);
  font-size: 14px;

  i {
    color: #909399;
    flex-shrink: 0;
  }
}

.knowledge-tree-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.knowledge-tree-status {
  flex-shrink: 0;
  font-size: 12px;
  color: #f56c6c;
}

.knowledge-selected-tip {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}

::v-deep .ai-generate-progress-dialog {
  .el-dialog__header {
    display: none;
  }

  .el-dialog__body {
    padding: 36px 32px 40px;
  }
}

.ai-generate-progress {
  text-align: center;
}

.ai-generate-progress-icon {
  font-size: 42px;
  color: #409eff;
}

.ai-generate-progress-title {
  margin: 18px 0 8px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.ai-generate-progress-desc {
  margin: 0;
  font-size: 13px;
  color: #909399;
  line-height: 1.6;
}
</style>
