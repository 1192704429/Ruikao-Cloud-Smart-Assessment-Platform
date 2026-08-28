<template>
  <div class="app-container">
    <!-- 搜索表单 -->
    <div class="search-wrapper">
      <el-form :inline="true" :model="queryParams" class="search-form" size="small">
        <el-form-item label="用户名">
          <el-input
            v-model="queryParams.username"
            placeholder="请输入用户名"
            clearable
            @keyup.enter.native="handleQuery"
          />
        </el-form-item>
        <el-form-item label="真实姓名">
          <el-input
            v-model="queryParams.realName"
            placeholder="请输入真实姓名"
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
        :data="sysUserList"
        @selection-change="handleSelectionChange"
        class="modern-table"
      >
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="用户名" prop="username" align="center" :show-overflow-tooltip="true" />
      <el-table-column label="真实姓名" prop="realName" align="center" :show-overflow-tooltip="true" />
      <el-table-column label="头像" prop="avatar" align="center">
        <template slot-scope="scope">
          <image-preview v-if="scope.row.avatar" :src="scope.row.avatar" width="60px" height="60px" />
          <span v-else style="color: #909399;">暂无图片</span>
        </template>
      </el-table-column>
      <el-table-column label="手机号" prop="phone" align="center" :show-overflow-tooltip="true" />
      <el-table-column label="邮箱" prop="email" align="center" :show-overflow-tooltip="true" />
      <el-table-column label="状态" prop="status" align="center" :show-overflow-tooltip="true">
        <template slot-scope="scope">
          <enum-tag :value="scope.row.status" :label-map="statusEnumMap" preset="normal" />
        </template>
      </el-table-column>
      <el-table-column label="创建时间" prop="createTime" align="center" :show-overflow-tooltip="true" />
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

    <!-- 添加或修改对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="600px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="真实姓名" prop="realName">
          <el-input v-model="form.realName" placeholder="请输入真实姓名" />
        </el-form-item>
        <el-form-item label="头像" prop="avatar">
          <img-upload v-model="form.avatar" :limit="1" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" placeholder="请输入密码" />
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

  </div>
</template>

<script>
import {
  pageSysUser,
  getSysUserById,
  saveSysUser,
  updateSysUser,
  deleteSysUser,
  deleteBatchSysUser
} from '@/api/sys_user'
import ImgUpload from '@/components/ImgUpload'
import ImagePreview from '@/components/ImagePreview'
import Pagination from '@/components/Pagination'

const TEACHER_ROLE = 'teacher'

export default {
  name: 'TeacherManagement',
  components: {
    ImgUpload,
    ImagePreview,
    Pagination
  },
  data() {
    return {
      loading: true,
      ids: [],
      single: true,
      multiple: true,
      showSearch: true,
      total: 0,
      sysUserList: [],
      title: '',
      open: false,
      queryParams: {
        current: 1,
        size: 5,
        username: null,
        realName: null,
        status: null,
        role: TEACHER_ROLE
      },
      form: {},
      rules: {
        username: [
          { required: true, message: '用户名不能为空', trigger: 'blur' }
        ],
        realName: [
          { required: true, message: '真实姓名不能为空', trigger: 'blur' }
        ],
        phone: [
          { required: true, message: '手机号不能为空', trigger: 'blur' }
        ],
        email: [
          { required: true, message: '邮箱不能为空', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '密码不能为空', trigger: 'blur' }
        ],
        status: [
          { required: true, message: '状态不能为空', trigger: 'change' }
        ]
      },
      statusOptions: [{ value: 1, label: '正常' }, { value: 0, label: '停用' }],
      statusEnumMap: { 1: '正常', 0: '停用' }
    }
  },
  created() {
    this.getList()
  },
  methods: {
    /** 查询教师列表（固定 role=teacher） */
    getList() {
      this.loading = true
      const { current, size, ...rest } = this.queryParams
      const entity = { ...rest, role: TEACHER_ROLE }
      pageSysUser(current, size, entity).then(response => {
        const pageData = response.data
        this.sysUserList = pageData.records || []
        this.total = Number(pageData.total) || 0
        this.loading = false
      }).catch(() => {
        this.loading = false
      })
    },
    getEnumLabel(val, map) {
      if (map == null || map[val] === undefined) return val
      return map[val]
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
      this.queryParams.size = this.queryParams.size || 5
      this.queryParams.username = null
      this.queryParams.realName = null
      this.queryParams.status = null
      this.queryParams.role = TEACHER_ROLE
      this.handleQuery()
    },
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },
    handleAdd() {
      this.reset()
      this.form = { role: TEACHER_ROLE, status: 1 }
      this.open = true
      this.title = '添加教师'
    },
    handleUpdate(row) {
      this.reset()
      const id = row.id || this.ids[0]
      getSysUserById(id).then(response => {
        this.form = response.data
        this.open = true
        this.title = '修改教师'
      })
    },
    submitForm() {
      this.$refs['form'].validate(valid => {
        if (valid) {
          const payload = { ...this.form, role: TEACHER_ROLE }
          if (payload.id != null) {
            updateSysUser(payload).then(() => {
              this.$message.success('修改成功')
              this.open = false
              this.getList()
            })
          } else {
            saveSysUser(payload).then(() => {
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
        return deleteSysUser(ids)
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
        return deleteBatchSysUser(ids)
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
</style>
