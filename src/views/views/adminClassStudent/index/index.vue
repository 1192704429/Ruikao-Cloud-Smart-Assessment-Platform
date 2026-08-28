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
        <el-form-item label="学生姓名">
          <el-input
            v-model="queryParams.name"
            placeholder="请输入学生姓名"
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
        :data="sysClassStudentList"
        @selection-change="handleSelectionChange"
        class="modern-table"
      >
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="创建时间" prop="createTime"  align="center" :show-overflow-tooltip="true" />
      <el-table-column label="班级名称" prop="sysClassName"  align="center" :show-overflow-tooltip="true" />
      <el-table-column label="学生姓名" prop="name"  align="center" :show-overflow-tooltip="true" />
      <el-table-column label="操作" align="center" width="180" class-name="small-padding fixed-width">
        <template slot-scope="scope">
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
        <el-form-item label="班级ID" prop="sysClassId">
          <el-select v-model="form.sysClassId" placeholder="请选择班级ID" clearable style="width: 100%;">
            <el-option
              v-for="(item, idx) in sysClassOptions"
              :key="idx"
              :label="item.sysClassName"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="学生ID" prop="studentId">
          <el-select v-model="form.studentId" placeholder="请选择学生ID" clearable style="width: 100%;">
            <el-option
              v-for="(item, idx) in sysStudentOptions"
              :key="idx"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button size="medium" type="primary" @click="submitForm">确 定</el-button>
        <el-button size="medium" @click="cancel">取 消</el-button>
      </div>
    </el-dialog>

  </div>
</template>

<script>
import {
  pageSysClassStudent,
  getSysClassStudentById,
  saveSysClassStudent,
  updateSysClassStudent,
  deleteSysClassStudent,
  deleteBatchSysClassStudent,
  listSysClass,
  listSysStudent

} from '@/api/sys_class_student'
import ImgUpload from '@/components/ImgUpload'
import ImagePreview from '@/components/ImagePreview'
import Pagination from '@/components/Pagination'
import BasicEditor from '@/components/BasicEditor'

export default {
  name: 'SysClassStudent',
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
      sysClassStudentList: [],
      title: '',
      open: false,
      queryParams: {
        current: 1,
        size: 5,
        sysClassName:  null,
        name:  null
      },
      form: {},
      rules: {
        sysClassId: [
          { required: true, message: '班级ID不能为空', trigger: 'change' }
        ],
        studentId: [
          { required: true, message: '学生ID不能为空', trigger: 'change' }
        ]
      },
      sysClassOptions: [],
      sysStudentOptions: []



    }
  },
  created() {
    this.getList()
    this.getSysClassOptions({})
    this.getSysStudentOptions({})
  },
  methods: {
    /** 查询班级学生绑定列表（范围查询绑定 xxxRange，传参拆成 xxxStart/xxxEnd） */
    getList() {
      this.loading = true
      const { current, size, ...rest } = this.queryParams
      const entity = { ...rest }
      pageSysClassStudent(current, size, entity).then(response => {
        const pageData = response.data
        this.sysClassStudentList = pageData.records || []
        this.total = Number(pageData.total) || 0
        this.loading = false
      }).catch(() => {
        this.loading = false
      })
    },
    /** 获取班级ID下拉选项 */
    getSysClassOptions(params) {
      listSysClass(params || {}).then(response => {
        this.sysClassOptions = response.data || []
      })
    },
    /** 获取学生ID下拉选项 */
    getSysStudentOptions(params) {
      listSysStudent(params || {}).then(response => {
        this.sysStudentOptions = response.data || []
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
      this.queryParams.name = null
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
      this.title = '添加班级学生绑定'
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset()
      const id = row.id || this.ids[0]
      getSysClassStudentById(id).then(response => {
        this.form = response.data
        this.open = true
        this.title = '修改班级学生绑定'
      })
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs['form'].validate(valid => {
        if (valid) {
          if (this.form.id != null) {
            updateSysClassStudent(this.form).then(response => {
              this.$message.success('修改成功')
              this.open = false
              this.getList()
            })
          } else {
            saveSysClassStudent(this.form).then(response => {
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
        return deleteSysClassStudent(ids)
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
        return deleteBatchSysClassStudent(ids)
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
    }
  }
}
</script>

<style scoped lang="scss">
</style>
