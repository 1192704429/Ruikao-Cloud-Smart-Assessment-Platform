<template>
  <div class="app-container exam-bank-page">
    <div class="exam-bank-layout">
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

      <!-- 右侧考试 -->
      <section class="exam-panel">
        <template v-if="selectedCourse">
          <div class="exam-panel-top">
            <div class="exam-panel-info">
              <div class="exam-course-badge">当前课程</div>
              <h2 class="exam-panel-title">{{ selectedCourse.courseName }}</h2>
              <p class="exam-panel-desc">共 <strong>{{ total }}</strong> 场考试</p>
            </div>
            <div class="exam-toolbar">
              <el-input
                v-model="queryParams.examName"
                placeholder="搜索考试名称"
                clearable
                size="small"
                class="toolbar-input"
                @keyup.enter.native="handleQuery"
              />
              <el-select
                v-model="queryParams.status"
                placeholder="考试状态"
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
              <el-button size="medium" type="primary" icon="el-icon-plus" @click="handleAdd">新建考试</el-button>
              <el-button size="medium" plain type="danger" icon="el-icon-delete" :disabled="multiple" @click="handleDeleteBatch">批量删除</el-button>
            </div>
          </div>

          <div class="table-wrapper exam-table-wrap">
            <el-table
              v-loading="loading"
              :data="examList"
              @selection-change="handleSelectionChange"
              class="modern-table"
            >
              <el-table-column type="selection" width="55" align="center" />
              <el-table-column label="考试名称" prop="examName" align="left" min-width="160" :show-overflow-tooltip="true" />
              <el-table-column label="开始时间" prop="startTime" align="center" min-width="160" :show-overflow-tooltip="true" />
              <el-table-column label="结束时间" prop="endTime" align="center" min-width="160" :show-overflow-tooltip="true" />
              <el-table-column label="考试时长(分钟)" prop="duration" align="center" width="120" />
              <el-table-column label="及格分数" prop="passScore" align="center" width="90" />
              <el-table-column label="状态" prop="status" align="center" width="100">
                <template slot-scope="scope">
                  <enum-tag :value="scope.row.status" :label-map="statusEnumMap" preset="exam" />
                </template>
              </el-table-column>
              <el-table-column label="审核备注" prop="auditRemark" align="center" min-width="120" :show-overflow-tooltip="true" />
              <el-table-column v-if="!isTeacher" label="发布教师" prop="realName" align="center" min-width="100" :show-overflow-tooltip="true" />
              <el-table-column label="创建时间" prop="createTime" align="center" min-width="160" :show-overflow-tooltip="true" />
              <el-table-column label="操作" align="center" width="340" class-name="small-padding fixed-width">
                <template slot-scope="scope">
                  <el-button size="medium" type="text" @click="handleViewDetail(scope.row)">详情</el-button>
                  <el-button size="medium"
                    v-if="canEditExam(scope.row)"
                    type="text"
                    @click="handleOpenStudentSettings(scope.row)"
                  >人员设置</el-button>
                  <el-button size="medium"
                    v-if="canSubmitAudit(scope.row)"
                    type="text"
                    @click="handleSubmitAudit(scope.row)"
                  >去审核</el-button>
                  <el-button size="medium"
                    v-if="canPublishExam(scope.row)"
                    type="text"
                    @click="handlePublishExam(scope.row)"
                  >发布</el-button>
                  <el-button size="medium"
                    v-if="canEditExam(scope.row)"
                    type="text"
                    @click="handleUpdate(scope.row)"
                  >修改</el-button>
                  <el-button size="medium"
                    v-if="canEditExam(scope.row)"
                    type="text"
                    style="color: #f56c6c;"
                    @click="handleDelete(scope.row)"
                  >删除</el-button>
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

        <div v-else class="exam-empty">
          <div class="exam-empty-inner">
            <i class="el-icon-date exam-empty-icon" />
            <p class="exam-empty-title">请选择课程</p>
            <p class="exam-empty-desc">从左侧课程列表中选择一门课程，即可查看和管理对应考试</p>
          </div>
        </div>
      </section>
    </div>

    <!-- 添加或修改对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="600px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="所属课程">
          <el-input :value="selectedCourse ? selectedCourse.courseName : ''" disabled />
        </el-form-item>
        <el-form-item label="考试名称" prop="examName">
          <el-input v-model="form.examName" placeholder="请输入考试名称" />
        </el-form-item>
        <el-form-item label="关联试卷" prop="paperId">
          <el-select
            v-model="form.paperId"
            placeholder="请选择关联试卷"
            clearable
            filterable
            style="width: 100%;"
            :loading="paperLoading"
          >
            <el-option
              v-for="item in paperOptions"
              :key="item.id"
              :label="formatPaperOptionLabel(item)"
              :value="item.id"
            />
          </el-select>
          <div v-if="!paperLoading && !paperOptions.length" class="paper-empty-tip">
            当前课程下暂无可用试卷，请先在试卷管理中创建并发布试卷
          </div>
        </el-form-item>
        <el-form-item v-if="!isTeacher" label="发布教师" prop="teacherId">
          <el-select v-model="form.teacherId" placeholder="请选择发布教师" clearable style="width: 100%;">
            <el-option
              v-for="(item, idx) in sysUserOptions"
              :key="idx"
              :label="item.realName"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="开始时间" prop="startTime">
          <el-date-picker
            v-model="form.startTime"
            type="datetime"
            value-format="yyyy-MM-dd HH:mm:ss"
            placeholder="请选择开始时间"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="结束时间" prop="endTime">
          <el-date-picker
            v-model="form.endTime"
            type="datetime"
            value-format="yyyy-MM-dd HH:mm:ss"
            placeholder="请选择结束时间"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="考试时长(分钟)" prop="duration">
          <el-input v-model.number="form.duration" type="number" placeholder="请输入考试时长(分钟)" />
        </el-form-item>
        <el-form-item label="及格分数" prop="passScore">
          <el-input v-model.number="form.passScore" type="number" placeholder="请输入及格分数" />
        </el-form-item>
        <el-alert
          v-if="form.id && form.status === 2 && form.auditRemark"
          :title="'驳回原因：' + form.auditRemark"
          type="warning"
          :closable="false"
          show-icon
          style="margin-bottom: 12px;"
        />
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button size="medium" type="primary" @click="submitForm">保 存</el-button>
        <el-button size="medium" @click="cancel">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 考试人员设置 -->
    <el-dialog
      title="考试人员设置"
      :visible.sync="studentSettingsOpen"
      width="560px"
      append-to-body
      @close="handleStudentSettingsClose"
    >
      <div v-if="currentExam" class="student-settings-tip">
        考试：{{ currentExam.examName }} · 从您管理的班级中选择参考学生
      </div>
      <div v-loading="studentTreeLoading" class="student-tree-wrap">
        <el-tree
          ref="studentTree"
          :data="studentTreeData"
          show-checkbox
          node-key="id"
          :props="studentTreeProps"
          default-expand-all
          :check-strictly="false"
        />
        <el-empty v-if="!studentTreeLoading && !studentTreeData.length" description="暂无班级或学生，请先在班级管理中关联" />
      </div>
      <div slot="footer" class="dialog-footer">
        <span class="student-selected-tip">已选 {{ selectedStudentCount }} 人</span>
        <el-button size="medium" @click="studentSettingsOpen = false">取消</el-button>
        <el-button size="medium" type="primary" :loading="studentSaving" @click="submitExamStudents">保存</el-button>
      </div>
    </el-dialog>

    <exam-detail-dialog :visible.sync="detailOpen" :exam-id="detailExamId" />
  </div>
</template>

<script>
import {
  pageExam,
  getExamById,
  saveExam,
  updateExam,
  deleteExam,
  deleteBatchExam,
  submitExamAudit,
  publishExam,
  listCourse,
  listSysUser
} from '@/api/exam'
import { listExamPaper, getExamPaperById } from '@/api/exam_paper'
import { getExamClassStudentTree, batchSaveExamStudent } from '@/api/exam_student'
import Pagination from '@/components/Pagination'
import ExamDetailDialog from '@/components/ExamDetailDialog'
import { mapGetters } from 'vuex'

export default {
  name: 'Exam',
  components: {
    Pagination,
    ExamDetailDialog
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
      examList: [],
      title: '',
      open: false,
      queryParams: {
        current: 1,
        size: 10,
        courseId: null,
        examName: null,
        status: null,
        realName: null
      },
      form: {},
      rules: {
        examName: [
          { required: true, message: '考试名称不能为空', trigger: 'blur' }
        ],
        paperId: [
          { required: true, message: '关联试卷不能为空', trigger: 'change' }
        ],
        teacherId: [
          { required: true, message: '发布教师不能为空', trigger: 'change' }
        ],
        startTime: [
          { required: true, message: '开始时间不能为空', trigger: 'blur' }
        ],
        endTime: [
          { required: true, message: '结束时间不能为空', trigger: 'blur' }
        ],
        duration: [
          { required: true, message: '考试时长(分钟)不能为空', trigger: 'blur' }
        ],
        passScore: [
          { required: true, message: '及格分数不能为空', trigger: 'blur' }
        ]
      },
      sysUserOptions: [],
      paperOptions: [],
      paperLoading: false,
      statusOptions: [
        { value: 5, label: '草稿' },
        { value: 0, label: '待审核' },
        { value: 1, label: '已通过' },
        { value: 2, label: '已驳回' },
        { value: 3, label: '已发布' },
        { value: 4, label: '已结束' }
      ],
      statusEnumMap: { 5: '草稿', 0: '待审核', 1: '已通过', 2: '已驳回', 3: '已发布', 4: '已结束' },
      examStatusDraft: 5,
      examStatusApproved: 1,
      studentSettingsOpen: false,
      studentTreeLoading: false,
      studentSaving: false,
      studentTreeData: [],
      currentExam: null,
      detailOpen: false,
      detailExamId: null,
      studentTreeProps: {
        children: 'children',
        label: 'label'
      }
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
    selectedStudentCount() {
      if (!this.$refs.studentTree) {
        return 0
      }
      return this.getCheckedStudentIds().length
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
      if (!this.queryParams.courseId) {
        this.examList = []
        this.total = 0
        this.loading = false
        return
      }
      this.loading = true
      const { current, size, ...rest } = this.queryParams
      pageExam(current, size, rest).then(response => {
        const pageData = response.data
        this.examList = pageData.records || []
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
    loadPaperOptions(selectedPaperId) {
      if (!this.selectedCourse) {
        this.paperOptions = []
        return Promise.resolve()
      }
      this.paperLoading = true
      return listExamPaper({
        courseId: this.selectedCourse.id,
        status: 1
      }).then(response => {
        this.paperOptions = response.data || []
        this.paperLoading = false
        return this.ensurePaperInOptions(selectedPaperId)
      }).catch(() => {
        this.paperOptions = []
        this.paperLoading = false
        return this.ensurePaperInOptions(selectedPaperId)
      })
    },
    ensurePaperInOptions(paperId) {
      if (!paperId || this.paperOptions.some(item => item.id === paperId)) {
        return Promise.resolve()
      }
      return getExamPaperById(paperId).then(response => {
        const paper = response.data
        if (paper) {
          this.paperOptions = [paper, ...this.paperOptions]
        }
      }).catch(() => {})
    },
    formatPaperOptionLabel(paper) {
      const name = paper.paperName || '未命名试卷'
      const score = paper.totalScore != null ? paper.totalScore + '分' : ''
      return score ? `${name}（${score}）` : name
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
      this.queryParams.examName = null
      this.queryParams.status = null
      this.handleQuery()
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
      this.form = this.isTeacher
        ? { courseId: this.selectedCourse.id, teacherId: this.id }
        : { courseId: this.selectedCourse.id }
      this.loadPaperOptions().then(() => {
        this.open = true
        this.title = '添加考试'
      })
    },
    canEditExam(row) {
      return row.status === this.examStatusDraft || row.status === 2
    },
    canSubmitAudit(row) {
      return row.status === this.examStatusDraft || row.status === 2
    },
    canPublishExam(row) {
      return this.isTeacher && row.status === this.examStatusApproved
    },
    handleViewDetail(row) {
      this.detailExamId = row.id
      this.detailOpen = true
    },
    handleUpdate(row) {
      if (!this.canEditExam(row)) {
        this.$message.warning('当前状态不允许修改')
        return
      }
      this.reset()
      const id = row.id || this.ids[0]
      getExamById(id).then(response => {
        this.form = response.data
        this.loadPaperOptions(this.form.paperId).then(() => {
          this.open = true
          this.title = '修改考试'
        })
      })
    },
    submitForm() {
      if (this.selectedCourse) {
        this.form.courseId = this.selectedCourse.id
      }
      delete this.form.status
      delete this.form.auditRemark
      this.$refs['form'].validate(valid => {
        if (valid) {
          const payload = { ...this.form }
          if (this.form.id != null) {
            updateExam(payload).then(() => {
              this.$message.success('保存成功')
              this.open = false
              this.getList()
            })
          } else {
            saveExam(payload).then(() => {
              this.$message.success('保存成功')
              this.open = false
              this.getList()
            })
          }
        }
      })
    },
    handleSubmitAudit(row) {
      this.$confirm(
        '确认提交考试「' + row.examName + '」进行审核？提交前请确保已关联试卷并设置考试人员。',
        '提交审核',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        return submitExamAudit(row.id)
      }).then(() => {
        this.$message.success('已提交审核')
        this.getList()
      }).catch(() => {})
    },
    handlePublishExam(row) {
      this.$confirm(
        '确认发布考试「' + row.examName + '」？发布后学生即可参加考试。',
        '发布考试',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        return publishExam(row.id)
      }).then(() => {
        this.$message.success('发布成功')
        this.getList()
      }).catch(() => {})
    },
    handleOpenStudentSettings(row) {
      if (!this.canEditExam(row)) {
        this.$message.warning('当前状态不允许设置考试人员')
        return
      }
      this.currentExam = row
      this.studentSettingsOpen = true
      this.loadStudentTree(row.id)
    },
    handleStudentSettingsClose() {
      this.currentExam = null
      this.studentTreeData = []
      if (this.$refs.studentTree) {
        this.$refs.studentTree.setCheckedKeys([])
      }
    },
    loadStudentTree(examId) {
      this.studentTreeLoading = true
      getExamClassStudentTree(examId).then(response => {
        const data = response.data || {}
        this.studentTreeData = data.tree || []
        const selectedIds = (data.selectedStudentIds || []).map(id => 's_' + id)
        this.studentTreeLoading = false
        this.$nextTick(() => {
          if (this.$refs.studentTree) {
            this.$refs.studentTree.setCheckedKeys(selectedIds)
          }
        })
      }).catch(() => {
        this.studentTreeLoading = false
      })
    },
    getCheckedStudentIds() {
      if (!this.$refs.studentTree) {
        return []
      }
      const checkedNodes = this.$refs.studentTree.getCheckedNodes(false, true)
      return checkedNodes
        .filter(node => node.nodeType === 'student' && node.studentId)
        .map(node => node.studentId)
    },
    submitExamStudents() {
      if (!this.currentExam) {
        return
      }
      const studentIds = this.getCheckedStudentIds()
      if (!studentIds.length) {
        this.$message.warning('请至少选择一名考试人员')
        return
      }
      this.studentSaving = true
      batchSaveExamStudent({
        examId: this.currentExam.id,
        studentIds: studentIds
      }).then(response => {
        this.$message.success(response.msg || '保存成功')
        this.studentSettingsOpen = false
        this.studentSaving = false
      }).catch(() => {
        this.studentSaving = false
      })
    },
    handleDelete(row) {
      const ids = row.id || this.ids
      this.$confirm('是否确认删除编号为"' + ids + '"的数据项？', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        return deleteExam(ids)
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
        return deleteBatchExam(ids)
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

.exam-bank-page {
  padding: 16px 20px 24px;
  background: #f0f2f5;
  min-height: calc(100vh - 84px);
}

.exam-bank-layout {
  display: flex;
  gap: 16px;
  align-items: stretch;
  min-height: calc(100vh - 120px);
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

.exam-panel {
  flex: 1;
  min-width: 0;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.06);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.exam-panel-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 24px 18px;
  border-bottom: 1px solid #eef0f4;
}

.exam-panel-info {
  min-width: 0;
}

.exam-course-badge {
  display: inline-block;
  margin-bottom: 8px;
  padding: 2px 10px;
  font-size: 12px;
  color: $primary;
  background: $primary-light;
  border-radius: 20px;
}

.exam-panel-title {
  margin: 0 0 6px;
  font-size: 20px;
  font-weight: 600;
  color: $text-main;
  line-height: 1.3;
}

.exam-panel-desc {
  margin: 0;
  font-size: 14px;
  color: $text-sub;

  strong {
    color: $primary;
  }
}

.exam-toolbar {
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

.exam-table-wrap {
  flex: 1;
  margin: 16px 24px 0;
  background: #fff !important;
  border-radius: 10px;
  border: 1px solid #eef0f4;
  overflow: hidden;
}

.exam-panel ::v-deep .pagination-container {
  margin: 12px 24px 20px;
  padding: 0;
}

.exam-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 420px;
  background: linear-gradient(180deg, #fafbfc 0%, #fff 100%);
}

.exam-empty-inner {
  text-align: center;
  padding: 40px 24px;
}

.exam-empty-icon {
  font-size: 64px;
  color: #dcdfe6;
  margin-bottom: 16px;
}

.exam-empty-title {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 600;
  color: $text-main;
}

.exam-empty-desc {
  margin: 0;
  font-size: 14px;
  color: $text-sub;
  line-height: 1.6;
}

.text-muted {
  color: #c0c4cc;
  font-size: 13px;
}

.paper-empty-tip {
  margin-top: 6px;
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
}

.student-settings-tip {
  margin-bottom: 12px;
  padding: 10px 12px;
  font-size: 13px;
  color: #606266;
  background: #f4f8ff;
  border: 1px solid #d9ecff;
  border-radius: 6px;
}

.student-tree-wrap {
  min-height: 280px;
  max-height: 420px;
  overflow-y: auto;
  padding: 8px 4px;
  border: 1px solid #eef0f4;
  border-radius: 8px;
}

.student-selected-tip {
  float: left;
  line-height: 32px;
  font-size: 13px;
  color: #606266;
}
</style>
