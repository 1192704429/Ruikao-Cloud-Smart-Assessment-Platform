<template>
  <div class="app-container">
    <!-- 搜索表单 -->
    <div class="search-wrapper">
      <el-form :inline="true" :model="queryParams" class="search-form" size="small">
        <el-form-item label="班级名称">
          <el-input
            v-model="queryParams.sysClassName"
            placeholder="请输入班级名称"
            clearable
            @keyup.enter.native="handleQuery"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="queryParams.status"
            placeholder="请选择状态"
            clearable
          >
            <el-option
              :key="1"
              :label="'正常'"
              :value="1"
            />
            <el-option
              :key="0"
              :label="'停用'"
              :value="0"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="教师姓名">
          <el-input
            v-model="queryParams.teacherName"
            placeholder="请输入教师姓名"
            clearable
            @keyup.enter.native="handleQuery"
          />
        </el-form-item>
        <el-form-item class="search-buttons">
          <el-button size="medium" @click="resetQuery">重置</el-button>
          <el-button size="medium" type="primary" @click="handleQuery">查询</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 操作按钮 -->
    <div class="action-buttons">
      <el-button size="medium" type="primary" @click="handleAdd">新建</el-button>
      <el-button size="medium" :disabled="multiple" @click="handleDeleteBatch">批量删除</el-button>
    </div>

    <!-- 数据表格 -->
    <div class="table-wrapper">
      <el-table
        v-loading="loading"
        :data="sysClassList"
        @selection-change="handleSelectionChange"
        class="modern-table"
      >
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="班级编号" prop="sysClassCode"  align="center" :show-overflow-tooltip="true" />
      <el-table-column label="班级名称" prop="sysClassName"  align="center" :show-overflow-tooltip="true" />
      <el-table-column label="年级" prop="grade"  align="center" :show-overflow-tooltip="true" />
      <el-table-column label="专业" prop="major"  align="center" :show-overflow-tooltip="true" />
      <el-table-column label="状态" prop="status"  align="center" :show-overflow-tooltip="true">
        <template slot-scope="scope">
          <enum-tag :value="scope.row.status" :label-map="statusEnumMap" preset="normal" />
        </template>
      </el-table-column>
      <el-table-column label="创建时间" prop="createTime"  align="center" :show-overflow-tooltip="true" />
      <el-table-column label="关联教师" prop="teacherNames" align="center" min-width="140" :show-overflow-tooltip="true">
        <template slot-scope="scope">
          <span>{{ scope.row.teacherNames || '—' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="340" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button size="medium"
            type="text"
            @click="handleManageTeachers(scope.row)"
          >管理教师</el-button>
          <el-button size="medium"
            type="text"
            @click="handleManageStudents(scope.row)"
          >管理学生</el-button>
          <el-button size="medium"
            type="text"
            @click="handleUpdate(scope.row)"
          >修改</el-button>
          <el-button size="medium"
            type="text"
            style="color: #f56c6c;"
            @click="handleDelete(scope.row)"
          >删除</el-button>
        </template>
      </el-table-column>
      </el-table>
    </div>

    <!-- 分页 -->
    <pagination
      :total="total"
      :current-page.sync="queryParams.current"
      :page-size.sync="queryParams.size"
      :page-sizes="[5, 10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />

    <!-- 添加或修改对话框（有富文本/MD 时宽度 50%，否则 600px） -->
    <el-dialog :title="title" :visible.sync="open"  width="600px"  append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="班级名称" prop="sysClassName">
          <el-input v-model="form.sysClassName" placeholder="请输入班级名称" />
        </el-form-item>
        <el-form-item v-if="form.id != null" label="班级编号" prop="sysClassCode">
          <el-input v-model="form.sysClassCode" disabled />
        </el-form-item>
        <el-form-item label="年级" prop="grade">
          <el-input v-model="form.grade" placeholder="请输入年级" />
        </el-form-item>
        <el-form-item label="专业" prop="major">
          <el-input v-model="form.major" placeholder="请输入专业" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio
              v-for="(item, index) in statusOptions"
              :key="index"
              :label="item.value"
            >{{ item.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button size="medium" type="primary" @click="submitForm">确 定</el-button>
        <el-button size="medium" @click="cancel">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 班级学生管理 -->
    <el-dialog
      :title="studentDialogTitle"
      :visible.sync="studentOpen"
      width="900px"
      append-to-body
      @close="handleStudentDialogClose"
    >
      <div class="student-manage-toolbar">
        <el-input
          v-model="studentQueryParams.name"
          placeholder="搜索学生姓名"
          clearable
          size="small"
          style="width: 180px; margin-right: 12px;"
          @keyup.enter.native="loadClassStudents"
        />
        <el-input
          v-model="studentQueryParams.phone"
          placeholder="搜索手机号"
          clearable
          size="small"
          style="width: 180px; margin-right: 12px;"
          @keyup.enter.native="loadClassStudents"
        />
        <el-button size="medium" type="primary" @click="loadClassStudents">查询</el-button>
        <el-button size="medium" type="primary" @click="handleOpenAddStudent">添加学生</el-button>
        <el-button size="medium" :disabled="studentMultiple" @click="handleRemoveStudentsBatch">批量移除</el-button>
      </div>

      <el-table
        v-loading="studentLoading"
        :data="classStudentList"
        @selection-change="handleStudentSelectionChange"
        class="modern-table"
        style="margin-top: 16px;"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="学号" prop="studentNo" align="center" :show-overflow-tooltip="true" />
        <el-table-column label="学生姓名" prop="name" align="center" :show-overflow-tooltip="true" />
        <el-table-column label="手机号" prop="phone" align="center" :show-overflow-tooltip="true" />
        <el-table-column label="加入时间" prop="createTime" align="center" :show-overflow-tooltip="true" />
        <el-table-column label="操作" align="center" width="100">
          <template slot-scope="scope">
            <el-button size="medium" type="text" style="color: #f56c6c;" @click="handleRemoveStudent(scope.row)">移除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <pagination
        :total="studentTotal"
        :current-page.sync="studentQueryParams.current"
        :page-size.sync="studentQueryParams.size"
        :page-sizes="[5, 10, 20, 50]"
        layout="total, sizes, prev, next"
        @size-change="handleStudentSizeChange"
        @current-change="handleStudentCurrentChange"
      />
    </el-dialog>

    <!-- 添加学生弹框 -->
    <el-dialog
      title="添加学生"
      :visible.sync="addStudentOpen"
      width="900px"
      append-to-body
      @close="handleAddStudentDialogClose"
    >
      <div class="student-manage-toolbar">
        <el-input
          v-model="addStudentQueryParams.name"
          placeholder="搜索学生姓名"
          clearable
          size="small"
          style="width: 180px; margin-right: 12px;"
          @keyup.enter.native="loadAddStudentList"
        />
        <el-input
          v-model="addStudentQueryParams.phone"
          placeholder="搜索手机号"
          clearable
          size="small"
          style="width: 180px; margin-right: 12px;"
          @keyup.enter.native="loadAddStudentList"
        />
        <el-button size="medium" type="primary" @click="loadAddStudentList">查询</el-button>
      </div>

      <el-table
        v-loading="addStudentLoading"
        :data="addStudentList"
        @selection-change="handleAddStudentSelectionChange"
        class="modern-table"
        style="margin-top: 16px;"
      >
        <el-table-column type="selection" width="55" align="center" :selectable="isAddStudentSelectable" />
        <el-table-column label="学号" prop="studentNo" align="center" :show-overflow-tooltip="true" />
        <el-table-column label="学生姓名" prop="name" align="center" :show-overflow-tooltip="true" />
        <el-table-column label="手机号" prop="phone" align="center" :show-overflow-tooltip="true" />
        <el-table-column label="状态" prop="status" align="center">
          <template slot-scope="scope">
            <enum-tag :value="scope.row.status" :label-map="statusEnumMap" preset="normal" />
          </template>
        </el-table-column>
        <el-table-column label="备注" align="center" width="90">
          <template slot-scope="scope">
            <el-tag v-if="isStudentInClass(scope.row.id)" size="small" type="info">已加入</el-tag>
          </template>
        </el-table-column>
      </el-table>

      <pagination
        :total="addStudentTotal"
        :current-page.sync="addStudentQueryParams.current"
        :page-size.sync="addStudentQueryParams.size"
        :page-sizes="[5, 10, 20, 50]"
        layout="total, sizes, prev, next"
        @size-change="handleAddStudentSizeChange"
        @current-change="handleAddStudentCurrentChange"
      />

      <div slot="footer" class="dialog-footer">
        <el-button size="medium" type="primary" :disabled="!addStudentSelectedIds.length" @click="handleConfirmAddStudents">确 定</el-button>
        <el-button size="medium" @click="addStudentOpen = false">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 班级教师管理 -->
    <el-dialog
      :title="teacherDialogTitle"
      :visible.sync="teacherOpen"
      width="900px"
      append-to-body
      @close="handleTeacherDialogClose"
    >
      <div class="student-manage-toolbar">
        <el-input
          v-model="teacherQueryParams.realName"
          placeholder="搜索教师姓名"
          clearable
          size="small"
          style="width: 180px; margin-right: 12px;"
          @keyup.enter.native="loadClassTeachers"
        />
        <el-input
          v-model="teacherQueryParams.phone"
          placeholder="搜索手机号"
          clearable
          size="small"
          style="width: 180px; margin-right: 12px;"
          @keyup.enter.native="loadClassTeachers"
        />
        <el-button size="medium" type="primary" @click="loadClassTeachers">查询</el-button>
        <el-button size="medium" type="primary" @click="handleOpenAddTeacher">添加教师</el-button>
        <el-button size="medium" :disabled="teacherMultiple" @click="handleRemoveTeachersBatch">批量移除</el-button>
      </div>

      <el-table
        v-loading="teacherLoading"
        :data="classTeacherList"
        @selection-change="handleTeacherSelectionChange"
        class="modern-table"
        style="margin-top: 16px;"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="教师姓名" prop="realName" align="center" :show-overflow-tooltip="true" />
        <el-table-column label="手机号" prop="phone" align="center" :show-overflow-tooltip="true" />
        <el-table-column label="关联时间" prop="createTime" align="center" :show-overflow-tooltip="true" />
        <el-table-column label="操作" align="center" width="100">
          <template slot-scope="scope">
            <el-button size="medium" type="text" style="color: #f56c6c;" @click="handleRemoveTeacher(scope.row)">移除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <pagination
        :total="teacherTotal"
        :current-page.sync="teacherQueryParams.current"
        :page-size.sync="teacherQueryParams.size"
        :page-sizes="[5, 10, 20, 50]"
        layout="total, sizes, prev, next"
        @size-change="handleTeacherSizeChange"
        @current-change="handleTeacherCurrentChange"
      />
    </el-dialog>

    <!-- 添加教师弹框 -->
    <el-dialog
      title="添加教师"
      :visible.sync="addTeacherOpen"
      width="900px"
      append-to-body
      @close="handleAddTeacherDialogClose"
    >
      <div class="student-manage-toolbar">
        <el-input
          v-model="addTeacherQueryParams.realName"
          placeholder="搜索教师姓名"
          clearable
          size="small"
          style="width: 180px; margin-right: 12px;"
          @keyup.enter.native="loadAddTeacherList"
        />
        <el-input
          v-model="addTeacherQueryParams.phone"
          placeholder="搜索手机号"
          clearable
          size="small"
          style="width: 180px; margin-right: 12px;"
          @keyup.enter.native="loadAddTeacherList"
        />
        <el-button size="medium" type="primary" @click="loadAddTeacherList">查询</el-button>
      </div>

      <el-table
        v-loading="addTeacherLoading"
        :data="addTeacherList"
        @selection-change="handleAddTeacherSelectionChange"
        class="modern-table"
        style="margin-top: 16px;"
      >
        <el-table-column type="selection" width="55" align="center" :selectable="isAddTeacherSelectable" />
        <el-table-column label="教师姓名" prop="realName" align="center" :show-overflow-tooltip="true" />
        <el-table-column label="手机号" prop="phone" align="center" :show-overflow-tooltip="true" />
        <el-table-column label="状态" prop="status" align="center">
          <template slot-scope="scope">
            <enum-tag :value="scope.row.status" :label-map="statusEnumMap" preset="normal" />
          </template>
        </el-table-column>
        <el-table-column label="备注" align="center" width="90">
          <template slot-scope="scope">
            <el-tag v-if="isTeacherInClass(scope.row.id)" size="small" type="info">已关联</el-tag>
          </template>
        </el-table-column>
      </el-table>

      <pagination
        :total="addTeacherTotal"
        :current-page.sync="addTeacherQueryParams.current"
        :page-size.sync="addTeacherQueryParams.size"
        :page-sizes="[5, 10, 20, 50]"
        layout="total, sizes, prev, next"
        @size-change="handleAddTeacherSizeChange"
        @current-change="handleAddTeacherCurrentChange"
      />

      <div slot="footer" class="dialog-footer">
        <el-button size="medium" type="primary" :disabled="!addTeacherSelectedIds.length" @click="handleConfirmAddTeachers">确 定</el-button>
        <el-button size="medium" @click="addTeacherOpen = false">取 消</el-button>
      </div>
    </el-dialog>

  </div>
</template>

<script>
import {
  pageSysClass,
  getSysClassById,
  saveSysClass,
  updateSysClass,
  deleteSysClass,
  deleteBatchSysClass
} from '@/api/sys_class'
import {
  pageSysClassStudent,
  deleteSysClassStudent,
  deleteBatchSysClassStudent,
  batchSaveSysClassStudent,
  listSysClassStudent
} from '@/api/sys_class_student'
import {
  pageTeacherSysClass,
  deleteTeacherSysClass,
  deleteBatchTeacherSysClass,
  batchSaveTeacherSysClass,
  listTeacherSysClass
} from '@/api/teacher_sys_class'
import { pageSysStudent } from '@/api/sys_student'
import { pageSysUser } from '@/api/sys_user'
import ImgUpload from '@/components/ImgUpload'
import ImagePreview from '@/components/ImagePreview'
import Pagination from '@/components/Pagination'
import BasicEditor from '@/components/BasicEditor'

const TEACHER_ROLE = 'teacher'

export default {
  name: 'SysClass',
  components: {
    ImgUpload,
    ImagePreview,
    Pagination,
    BasicEditor
  },
  data() {
    return {
      loading: true,
      ids: [],
      single: true,
      multiple: true,
      showSearch: true,
      total: 0,
      sysClassList: [],
      title: '',
      open: false,
      queryParams: {
        current: 1,
        size: 5,
        sysClassName:  null,
        status:  null,
        teacherName:  null
      },
      form: {},
      rules: {
        sysClassName: [
          { required: true, message: '班级名称不能为空', trigger: 'blur' }
        ],
        grade: [
          { required: true, message: '年级不能为空', trigger: 'blur' }
        ],
        major: [
          { required: true, message: '专业不能为空', trigger: 'blur' }
        ],
        status: [
          { required: true, message: '状态不能为空', trigger: 'change' }
        ]
      },
      statusOptions: [{value: 1, label: '正常'},{value: 0, label: '停用'}],

      statusEnumMap: { 1: '正常', 0: '停用' },
      studentOpen: false,
      studentLoading: false,
      currentClass: null,
      classStudentList: [],
      studentTotal: 0,
      studentIds: [],
      studentMultiple: true,
      boundStudentIds: [],
      addStudentOpen: false,
      addStudentLoading: false,
      addStudentList: [],
      addStudentTotal: 0,
      addStudentSelectedIds: [],
      addStudentQueryParams: {
        current: 1,
        size: 5,
        name: null,
        phone: null,
        status: 1
      },
      studentQueryParams: {
        current: 1,
        size: 5,
        name: null,
        phone: null,
        sysClassId: null
      },
      teacherOpen: false,
      teacherLoading: false,
      classTeacherList: [],
      teacherTotal: 0,
      teacherIds: [],
      teacherMultiple: true,
      boundTeacherIds: [],
      addTeacherOpen: false,
      addTeacherLoading: false,
      addTeacherList: [],
      addTeacherTotal: 0,
      addTeacherSelectedIds: [],
      addTeacherQueryParams: {
        current: 1,
        size: 5,
        realName: null,
        phone: null,
        role: TEACHER_ROLE,
        status: 1
      },
      teacherQueryParams: {
        current: 1,
        size: 5,
        realName: null,
        phone: null,
        sysClassId: null
      }
    }
  },
  computed: {
    studentDialogTitle() {
      if (this.currentClass && this.currentClass.sysClassName) {
        return `管理学生 - ${this.currentClass.sysClassName}`
      }
      return '管理学生'
    },
    teacherDialogTitle() {
      if (this.currentClass && this.currentClass.sysClassName) {
        return `管理教师 - ${this.currentClass.sysClassName}`
      }
      return '管理教师'
    }
  },
  created() {
    this.getList()
  },
  methods: {
    /** 查询班级列表（范围查询绑定 xxxRange，传参拆成 xxxStart/xxxEnd） */
    getList() {
      this.loading = true
      const { current, size, ...rest } = this.queryParams
      const entity = { ...rest }
      pageSysClass(current, size, entity).then(response => {
        const pageData = response.data
        this.sysClassList = pageData.records || []
        this.total = Number(pageData.total) || 0
        this.loading = false
      }).catch(() => {
        this.loading = false
      })
    },
    /** 枚举列展示：根据 value 取 label，无则显示原值 */
    getEnumLabel(val, map) {
      if (map == null || map[val] === undefined) return val
      return map[val]
    },
    /** 取消按钮 */
    cancel() {
      this.open = false
      this.reset()
    },
    /** 表单重置 */
    reset() {
      this.form = {}
      if (this.$refs.form) {
        this.$refs.form.resetFields()
      }
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.current = 1
      this.getList()
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.queryParams.current = 1
      this.queryParams.size = this.queryParams.size || 5
      this.queryParams.sysClassName = null
      this.queryParams.status = null
      this.queryParams.teacherName = null
      this.handleQuery()
    },
    /** 多选框选中数据 */
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset()
      this.open = true
      this.title = '添加班级'
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset()
      const id = row.id || this.ids[0]
      getSysClassById(id).then(response => {
        this.form = response.data
        this.open = true
        this.title = '修改班级'
      })
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs['form'].validate(valid => {
        if (valid) {
          if (this.form.id != null) {
            updateSysClass(this.form).then(response => {
              this.$message.success('修改成功')
              this.open = false
              this.getList()
            })
          } else {
            saveSysClass(this.form).then(response => {
              this.$message.success('新增成功')
              this.open = false
              this.getList()
            })
          }
        }
      })
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const ids = row.id || this.ids
      this.$confirm('是否确认删除编号为"' + ids + '"的数据项？', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        return deleteSysClass(ids)
      }).then(() => {
        this.getList()
        this.$message.success('删除成功')
      }).catch(() => {})
    },
    /** 批量删除按钮操作 */
    handleDeleteBatch() {
      const ids = this.ids
      this.$confirm('是否确认删除选中的' + ids.length + '条数据？', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        return deleteBatchSysClass(ids)
      }).then(() => {
        this.getList()
        this.$message.success('删除成功')
      }).catch(() => {})
    },
    /** 分页大小改变 */
    handleSizeChange(val) {
      this.queryParams.size = val
      this.queryParams.current = 1
      this.getList()
    },
    /** 当前页改变 */
    handleCurrentChange(val) {
      this.queryParams.current = val
      this.getList()
    },
    handleManageStudents(row) {
      this.currentClass = row
      this.studentQueryParams = {
        current: 1,
        size: 5,
        name: null,
        phone: null,
        sysClassId: row.id
      }
      this.studentIds = []
      this.studentMultiple = true
      this.studentOpen = true
      this.loadBoundStudentIds()
      this.loadClassStudents()
    },
    handleStudentDialogClose() {
      this.classStudentList = []
      this.boundStudentIds = []
      this.addStudentOpen = false
      if (!this.teacherOpen) {
        this.currentClass = null
      }
    },
    loadBoundStudentIds() {
      if (!this.currentClass) {
        return Promise.resolve()
      }
      return listSysClassStudent({ sysClassId: this.currentClass.id }).then(response => {
        const list = response.data || []
        this.boundStudentIds = list.map(item => item.studentId)
      })
    },
    loadClassStudents() {
      if (!this.currentClass) return
      this.studentLoading = true
      const { current, size, ...rest } = this.studentQueryParams
      pageSysClassStudent(current, size, { ...rest, sysClassId: this.currentClass.id }).then(response => {
        const pageData = response.data
        this.classStudentList = pageData.records || []
        this.studentTotal = Number(pageData.total) || 0
        this.studentLoading = false
      }).catch(() => {
        this.studentLoading = false
      })
    },
    handleStudentSelectionChange(selection) {
      this.studentIds = selection.map(item => item.id)
      this.studentMultiple = !selection.length
    },
    handleOpenAddStudent() {
      this.addStudentQueryParams = {
        current: 1,
        size: 5,
        name: null,
        phone: null,
        status: 1
      }
      this.addStudentSelectedIds = []
      this.addStudentOpen = true
      this.loadBoundStudentIds().then(() => {
        this.loadAddStudentList()
      })
    },
    handleAddStudentDialogClose() {
      this.addStudentSelectedIds = []
      this.addStudentList = []
    },
    loadAddStudentList() {
      this.addStudentLoading = true
      const { current, size, ...rest } = this.addStudentQueryParams
      pageSysStudent(current, size, rest).then(response => {
        const pageData = response.data
        this.addStudentList = pageData.records || []
        this.addStudentTotal = Number(pageData.total) || 0
        this.addStudentLoading = false
      }).catch(() => {
        this.addStudentLoading = false
      })
    },
    isStudentInClass(studentId) {
      return this.boundStudentIds.includes(studentId)
    },
    isAddStudentSelectable(row) {
      return !this.isStudentInClass(row.id)
    },
    handleAddStudentSelectionChange(selection) {
      this.addStudentSelectedIds = selection.map(item => item.id)
    },
    handleConfirmAddStudents() {
      if (!this.currentClass || !this.addStudentSelectedIds.length) return
      batchSaveSysClassStudent({
        sysClassId: this.currentClass.id,
        studentIds: this.addStudentSelectedIds
      }).then(response => {
        this.$message.success(response.msg || '添加成功')
        this.addStudentOpen = false
        this.loadBoundStudentIds()
        this.loadClassStudents()
      })
    },
    handleAddStudentSizeChange(val) {
      this.addStudentQueryParams.size = val
      this.addStudentQueryParams.current = 1
      this.loadAddStudentList()
    },
    handleAddStudentCurrentChange(val) {
      this.addStudentQueryParams.current = val
      this.loadAddStudentList()
    },
    handleRemoveStudent(row) {
      this.$confirm(`是否确认将"${row.name}"从班级中移除？`, '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        return deleteSysClassStudent(row.id)
      }).then(() => {
        this.$message.success('移除成功')
        this.loadBoundStudentIds()
        this.loadClassStudents()
      }).catch(() => {})
    },
    handleRemoveStudentsBatch() {
      const ids = this.studentIds
      this.$confirm(`是否确认移除选中的 ${ids.length} 名学生？`, '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        return deleteBatchSysClassStudent(ids)
      }).then(() => {
        this.$message.success('移除成功')
        this.loadBoundStudentIds()
        this.loadClassStudents()
      }).catch(() => {})
    },
    handleStudentSizeChange(val) {
      this.studentQueryParams.size = val
      this.studentQueryParams.current = 1
      this.loadClassStudents()
    },
    handleStudentCurrentChange(val) {
      this.studentQueryParams.current = val
      this.loadClassStudents()
    },
    handleManageTeachers(row) {
      this.currentClass = row
      this.teacherQueryParams = {
        current: 1,
        size: 5,
        realName: null,
        phone: null,
        sysClassId: row.id
      }
      this.teacherIds = []
      this.teacherMultiple = true
      this.teacherOpen = true
      this.loadBoundTeacherIds()
      this.loadClassTeachers()
    },
    handleTeacherDialogClose() {
      this.classTeacherList = []
      this.boundTeacherIds = []
      this.addTeacherOpen = false
      if (!this.studentOpen) {
        this.currentClass = null
      }
    },
    loadBoundTeacherIds() {
      if (!this.currentClass) {
        return Promise.resolve()
      }
      return listTeacherSysClass({ sysClassId: this.currentClass.id }).then(response => {
        const list = response.data || []
        this.boundTeacherIds = list.map(item => item.teacherId)
      })
    },
    loadClassTeachers() {
      if (!this.currentClass) return
      this.teacherLoading = true
      const { current, size, ...rest } = this.teacherQueryParams
      pageTeacherSysClass(current, size, { ...rest, sysClassId: this.currentClass.id }).then(response => {
        const pageData = response.data
        this.classTeacherList = pageData.records || []
        this.teacherTotal = Number(pageData.total) || 0
        this.teacherLoading = false
      }).catch(() => {
        this.teacherLoading = false
      })
    },
    handleTeacherSelectionChange(selection) {
      this.teacherIds = selection.map(item => item.id)
      this.teacherMultiple = !selection.length
    },
    handleOpenAddTeacher() {
      this.addTeacherQueryParams = {
        current: 1,
        size: 5,
        realName: null,
        phone: null,
        role: TEACHER_ROLE,
        status: 1
      }
      this.addTeacherSelectedIds = []
      this.addTeacherOpen = true
      this.loadBoundTeacherIds().then(() => {
        this.loadAddTeacherList()
      })
    },
    handleAddTeacherDialogClose() {
      this.addTeacherSelectedIds = []
      this.addTeacherList = []
    },
    loadAddTeacherList() {
      this.addTeacherLoading = true
      const { current, size, ...rest } = this.addTeacherQueryParams
      pageSysUser(current, size, rest).then(response => {
        const pageData = response.data
        this.addTeacherList = pageData.records || []
        this.addTeacherTotal = Number(pageData.total) || 0
        this.addTeacherLoading = false
      }).catch(() => {
        this.addTeacherLoading = false
      })
    },
    isTeacherInClass(teacherId) {
      return this.boundTeacherIds.includes(teacherId)
    },
    isAddTeacherSelectable(row) {
      return !this.isTeacherInClass(row.id)
    },
    handleAddTeacherSelectionChange(selection) {
      this.addTeacherSelectedIds = selection.map(item => item.id)
    },
    handleConfirmAddTeachers() {
      if (!this.currentClass || !this.addTeacherSelectedIds.length) return
      batchSaveTeacherSysClass({
        sysClassId: this.currentClass.id,
        teacherIds: this.addTeacherSelectedIds
      }).then(response => {
        this.$message.success(response.msg || '添加成功')
        this.addTeacherOpen = false
        this.loadBoundTeacherIds()
        this.loadClassTeachers()
        this.getList()
      })
    },
    handleAddTeacherSizeChange(val) {
      this.addTeacherQueryParams.size = val
      this.addTeacherQueryParams.current = 1
      this.loadAddTeacherList()
    },
    handleAddTeacherCurrentChange(val) {
      this.addTeacherQueryParams.current = val
      this.loadAddTeacherList()
    },
    handleRemoveTeacher(row) {
      this.$confirm(`是否确认将"${row.realName}"从班级中移除？`, '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        return deleteTeacherSysClass(row.id)
      }).then(() => {
        this.$message.success('移除成功')
        this.loadBoundTeacherIds()
        this.loadClassTeachers()
        this.getList()
      }).catch(() => {})
    },
    handleRemoveTeachersBatch() {
      const ids = this.teacherIds
      this.$confirm(`是否确认移除选中的 ${ids.length} 名教师？`, '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        return deleteBatchTeacherSysClass(ids)
      }).then(() => {
        this.$message.success('移除成功')
        this.loadBoundTeacherIds()
        this.loadClassTeachers()
        this.getList()
      }).catch(() => {})
    },
    handleTeacherSizeChange(val) {
      this.teacherQueryParams.size = val
      this.teacherQueryParams.current = 1
      this.loadClassTeachers()
    },
    handleTeacherCurrentChange(val) {
      this.teacherQueryParams.current = val
      this.loadClassTeachers()
    }
  }
}
</script>

<style scoped lang="scss">
.student-manage-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0;
  margin-bottom: 16px;
}
</style>
