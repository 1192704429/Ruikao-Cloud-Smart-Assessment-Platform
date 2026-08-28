<template>
  <div class="app-container course-page">
    <!-- 搜索表单 -->
    <div class="search-wrapper">
      <el-form :inline="true" :model="queryParams" class="search-form" size="small">
        <el-form-item label="课程名称">
          <el-input
            v-model="queryParams.courseName"
            placeholder="请输入课程名称"
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
            <el-option :key="1" :label="'启用'" :value="1" />
            <el-option :key="0" :label="'停用'" :value="0" />
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
      <el-button size="medium" type="primary" icon="el-icon-plus" @click="handleAdd">新建课程</el-button>
      <el-button size="medium" :disabled="multiple" icon="el-icon-delete" @click="handleDeleteBatch">批量删除</el-button>
      <span v-if="ids.length" class="selected-tip">已选 {{ ids.length }} 项</span>
    </div>

    <!-- 卡片列表 -->
    <div v-loading="loading" class="course-card-grid">
      <div
        v-for="item in courseList"
        :key="item.id"
        class="course-card"
        :class="{ selected: isSelected(item.id) }"
        @click="toggleSelect(item.id)"
      >
        <div class="card-cover">
          <img
            v-if="item.courseCover"
            :src="item.courseCover"
            :alt="item.courseName"
            class="cover-img"
          >
          <div v-else class="cover-placeholder">
            <i class="el-icon-reading" />
          </div>
          <div class="cover-overlay" />
          <el-checkbox
            :value="isSelected(item.id)"
            class="card-checkbox"
            @click.native.stop
            @change="val => handleCardSelect(item.id, val)"
          />
          <enum-tag
            class="card-status"
            :value="item.status"
            :label-map="statusEnumMap"
            preset="enable"
          />
        </div>

        <div class="card-body">
          <div class="card-code">{{ item.courseCode || '-' }}</div>
          <h3 class="card-title" :title="item.courseName">{{ item.courseName }}</h3>
          <p class="card-desc" :title="item.description">{{ item.description || '暂无描述' }}</p>
          <div class="card-meta">
            <span><i class="el-icon-time" /> {{ item.createTime || '-' }}</span>
          </div>
        </div>

        <div class="card-footer" @click.stop>
          <el-button size="medium" type="text" icon="el-icon-edit" @click="handleUpdate(item)">修改</el-button>
          <el-button size="medium" type="text" class="danger-btn" icon="el-icon-delete" @click="handleDelete(item)">删除</el-button>
        </div>
      </div>
    </div>

    <el-empty v-if="!loading && !courseList.length" description="暂无课程数据" class="course-empty" />

    <!-- 分页 -->
    <pagination
      :total="total"
      :current-page.sync="queryParams.current"
      :page-size.sync="queryParams.size"
      :page-sizes="[12, 24, 48]"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />

    <!-- 添加或修改对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="560px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="课程名称" prop="courseName">
          <el-input v-model="form.courseName" placeholder="请输入课程名称" />
        </el-form-item>
        <el-form-item v-if="form.id != null" label="课程编号" prop="courseCode">
          <el-input v-model="form.courseCode" disabled />
        </el-form-item>
        <el-form-item label="课程封面" prop="courseCover">
          <img-upload v-model="form.courseCover" :limit="1" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio
              v-for="(option, index) in statusOptions"
              :key="index"
              :label="option.value"
            >{{ option.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="课程描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="4"
            placeholder="请输入课程描述"
          />
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
  pageCourse,
  getCourseById,
  saveCourse,
  updateCourse,
  deleteCourse,
  deleteBatchCourse
} from '@/api/course'
import ImgUpload from '@/components/ImgUpload'
import Pagination from '@/components/Pagination'

export default {
  name: 'Course',
  components: {
    ImgUpload,
    Pagination
  },
  data() {
    return {
      loading: true,
      ids: [],
      single: true,
      multiple: true,
      total: 0,
      courseList: [],
      title: '',
      open: false,
      queryParams: {
        current: 1,
        size: 12,
        courseName: null,
        status: null
      },
      form: {},
      rules: {
        courseName: [
          { required: true, message: '课程名称不能为空', trigger: 'blur' }
        ],
        courseCover: [
          { required: true, message: '课程封面不能为空', trigger: 'blur' }
        ],
        status: [
          { required: true, message: '状态不能为空', trigger: 'change' }
        ],
        description: [
          { required: true, message: '课程描述不能为空', trigger: 'blur' }
        ]
      },
      statusOptions: [{ value: 1, label: '启用' }, { value: 0, label: '停用' }],
      statusEnumMap: { 1: '启用', 0: '停用' }
    }
  },
  created() {
    this.getList()
  },
  methods: {
    getList() {
      this.loading = true
      const { current, size, ...rest } = this.queryParams
      pageCourse(current, size, { ...rest }).then(response => {
        const pageData = response.data
        this.courseList = pageData.records || []
        this.total = Number(pageData.total) || 0
        this.loading = false
      }).catch(() => {
        this.loading = false
      })
    },
    isSelected(id) {
      return this.ids.includes(id)
    },
    handleCardSelect(id, checked) {
      if (checked) {
        if (!this.ids.includes(id)) this.ids.push(id)
      } else {
        this.ids = this.ids.filter(item => item !== id)
      }
      this.syncSelectionState()
    },
    toggleSelect(id) {
      this.handleCardSelect(id, !this.isSelected(id))
    },
    syncSelectionState() {
      this.single = this.ids.length !== 1
      this.multiple = !this.ids.length
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
      this.queryParams.size = this.queryParams.size || 12
      this.queryParams.courseName = null
      this.queryParams.status = null
      this.handleQuery()
    },
    handleAdd() {
      this.reset()
      this.open = true
      this.title = '添加课程'
    },
    handleUpdate(row) {
      this.reset()
      const id = row.id || this.ids[0]
      getCourseById(id).then(response => {
        this.form = response.data
        this.open = true
        this.title = '修改课程'
      })
    },
    submitForm() {
      this.$refs.form.validate(valid => {
        if (!valid) return
        const request = this.form.id != null ? updateCourse(this.form) : saveCourse(this.form)
        request.then(() => {
          this.$message.success(this.form.id != null ? '修改成功' : '新增成功')
          this.open = false
          this.getList()
        })
      })
    },
    handleDelete(row) {
      const ids = row.id || this.ids
      this.$confirm('是否确认删除编号为"' + ids + '"的数据项？', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => deleteCourse(ids)).then(() => {
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
      }).then(() => deleteBatchCourse(ids)).then(() => {
        this.ids = []
        this.syncSelectionState()
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
.course-page {
  .selected-tip {
    margin-left: 12px;
    font-size: 13px;
    color: #409eff;
  }
}

.course-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  min-height: 120px;
  margin-bottom: 20px;
}

.course-card {
  background: #fff;
  border-radius: 14px;
  border: 1px solid #ebeef5;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 28px rgba(64, 158, 255, 0.12);
    border-color: rgba(64, 158, 255, 0.25);
  }

  &.selected {
    border-color: #409eff;
    box-shadow: 0 8px 24px rgba(64, 158, 255, 0.16);
  }
}

.card-cover {
  position: relative;
  height: 160px;
  background: linear-gradient(135deg, #e0f2fe 0%, #f0fdfa 100%);
  overflow: hidden;
}

.cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.35s ease;
}

.course-card:hover .cover-img {
  transform: scale(1.05);
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 48px;
}

.cover-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.05) 0%, rgba(15, 23, 42, 0.35) 100%);
  pointer-events: none;
}

.card-checkbox {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 2;

  ::v-deep .el-checkbox__inner {
    width: 18px;
    height: 18px;
    border-radius: 4px;
    border-color: rgba(255, 255, 255, 0.85);
    background: rgba(255, 255, 255, 0.9);
  }
}

.card-status {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 2;
}

.card-body {
  padding: 16px 16px 10px;
  flex: 1;
}

.card-code {
  font-size: 12px;
  color: #909399;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
}

.card-title {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-desc {
  margin: 0 0 12px;
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
  height: 42px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.card-meta {
  font-size: 12px;
  color: #909399;

  i {
    margin-right: 4px;
  }
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  padding: 8px 12px 12px;
  border-top: 1px solid #f2f3f5;

  .danger-btn {
    color: #f56c6c;
  }
}

.course-empty {
  padding: 40px 0 20px;
}

@media (max-width: 768px) {
  .course-card-grid {
    grid-template-columns: 1fr;
  }
}
</style>
