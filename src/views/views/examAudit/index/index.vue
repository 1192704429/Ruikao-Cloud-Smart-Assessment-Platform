<template>
  <div class="app-container exam-audit-page">
    <div class="search-wrapper">
      <el-form :inline="true" :model="queryParams" class="search-form" size="small">
        <el-form-item label="考试名称">
          <el-input
            v-model="queryParams.examName"
            placeholder="请输入考试名称"
            clearable
            @keyup.enter.native="handleQuery"
          />
        </el-form-item>
        <el-form-item label="课程名称">
          <el-input
            v-model="queryParams.courseName"
            placeholder="请输入课程名称"
            clearable
            @keyup.enter.native="handleQuery"
          />
        </el-form-item>
        <el-form-item label="提交教师">
          <el-input
            v-model="queryParams.realName"
            placeholder="请输入教师姓名"
            clearable
            @keyup.enter.native="handleQuery"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
            <el-option
              v-for="item in statusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item class="search-buttons">
          <el-button size="medium" @click="resetQuery">重置</el-button>
          <el-button size="medium" type="primary" @click="handleQuery">查询</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="table-wrapper">
      <el-table v-loading="loading" :data="examList" class="modern-table">
        <el-table-column label="考试名称" prop="examName" align="left" min-width="160" :show-overflow-tooltip="true" />
        <el-table-column label="课程名称" prop="courseName" align="center" min-width="120" :show-overflow-tooltip="true" />
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
        <el-table-column label="提交教师" prop="realName" align="center" min-width="100" :show-overflow-tooltip="true" />
        <el-table-column label="创建时间" prop="createTime" align="center" min-width="160" :show-overflow-tooltip="true" />
        <el-table-column label="操作" align="center" width="160" class-name="small-padding fixed-width">
          <template slot-scope="scope">
            <el-button size="medium"
              v-if="scope.row.status === 0"
              type="text"
              @click="handleAudit(scope.row)"
            >审核</el-button>
            <el-button size="medium"
              v-if="scope.row.status === 1"
              type="text"
              @click="handlePublish(scope.row)"
            >发布</el-button>
            <el-button size="medium" type="text" @click="handleView(scope.row)">详情</el-button>
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

    <!-- 审核对话框 -->
    <el-dialog title="考试审核" :visible.sync="auditOpen" width="640px" append-to-body>
      <el-form ref="auditForm" :model="auditForm" :rules="auditRules" label-width="120px">
        <el-form-item label="考试名称">
          <el-input :value="auditForm.examName" disabled />
        </el-form-item>
        <el-form-item label="所属课程">
          <el-input :value="auditForm.courseName" disabled />
        </el-form-item>
        <el-form-item label="提交教师">
          <el-input :value="auditForm.realName" disabled />
        </el-form-item>
        <el-form-item label="考试时间">
          <el-input :value="formatExamTime(auditForm)" disabled />
        </el-form-item>
        <el-form-item label="审核结果" prop="status">
          <el-radio-group v-model="auditForm.status">
            <el-radio :label="1">通过</el-radio>
            <el-radio :label="2">驳回</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="审核备注" prop="auditRemark">
          <el-input
            v-model="auditForm.auditRemark"
            type="textarea"
            :rows="3"
            :placeholder="auditForm.status === 2 ? '请填写驳回原因' : '可选填写审核说明'"
          />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button size="medium" type="primary" @click="submitAudit">确 定</el-button>
        <el-button size="medium" @click="auditOpen = false">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 详情对话框 -->
    <exam-detail-dialog :visible.sync="detailOpen" :exam-id="detailExamId" />
  </div>
</template>

<script>
import { pageExam, getExamById, auditExam } from '@/api/exam'
import Pagination from '@/components/Pagination'
import ExamDetailDialog from '@/components/ExamDetailDialog'

export default {
  name: 'ExamAudit',
  components: {
    Pagination,
    ExamDetailDialog
  },
  data() {
    const validateAuditRemark = (rule, value, callback) => {
      if (this.auditForm.status === 2 && !(value && value.trim())) {
        callback(new Error('驳回时请填写审核备注'))
        return
      }
      callback()
    }
    return {
      loading: true,
      total: 0,
      examList: [],
      auditOpen: false,
      detailOpen: false,
      detailExamId: null,
      queryParams: {
        current: 1,
        size: 10,
        examName: null,
        courseName: null,
        realName: null,
        status: 0
      },
      auditForm: {
        id: null,
        examName: '',
        courseName: '',
        realName: '',
        startTime: '',
        endTime: '',
        status: 1,
        auditRemark: ''
      },
      auditRules: {
        status: [
          { required: true, message: '请选择审核结果', trigger: 'change' }
        ],
        auditRemark: [
          { validator: validateAuditRemark, trigger: 'blur' }
        ]
      },
      statusOptions: [
        { value: 5, label: '草稿' },
        { value: 0, label: '待审核' },
        { value: 1, label: '已通过' },
        { value: 2, label: '已驳回' },
        { value: 3, label: '已发布' },
        { value: 4, label: '已结束' }
      ],
      statusEnumMap: { 5: '草稿', 0: '待审核', 1: '已通过', 2: '已驳回', 3: '已发布', 4: '已结束' }
    }
  },
  watch: {
    'auditForm.status'() {
      if (this.$refs.auditForm) {
        this.$refs.auditForm.validateField('auditRemark')
      }
    }
  },
  created() {
    this.getList()
  },
  methods: {
    getList() {
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
    handleQuery() {
      this.queryParams.current = 1
      this.getList()
    },
    resetQuery() {
      this.queryParams.current = 1
      this.queryParams.examName = null
      this.queryParams.courseName = null
      this.queryParams.realName = null
      this.queryParams.status = 0
      this.handleQuery()
    },
    handleAudit(row) {
      getExamById(row.id).then(response => {
        const data = response.data || {}
        this.auditForm = {
          id: data.id,
          examName: data.examName,
          courseName: data.courseName,
          realName: data.realName,
          startTime: data.startTime,
          endTime: data.endTime,
          status: 1,
          auditRemark: ''
        }
        this.auditOpen = true
        this.$nextTick(() => {
          if (this.$refs.auditForm) {
            this.$refs.auditForm.clearValidate()
          }
        })
      })
    },
    handleView(row) {
      this.detailExamId = row.id
      this.detailOpen = true
    },
    handlePublish(row) {
      this.$confirm('确认发布考试「' + row.examName + '」？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        return auditExam({ id: row.id, status: 3 })
      }).then(() => {
        this.$message.success('发布成功')
        this.getList()
      }).catch(() => {})
    },
    formatExamTime(row) {
      if (!row.startTime && !row.endTime) {
        return ''
      }
      return (row.startTime || '') + ' ~ ' + (row.endTime || '')
    },
    submitAudit() {
      this.$refs.auditForm.validate(valid => {
        if (!valid) {
          return
        }
        auditExam({
          id: this.auditForm.id,
          status: this.auditForm.status,
          auditRemark: this.auditForm.auditRemark
        }).then(() => {
          this.$message.success('审核成功')
          this.auditOpen = false
          this.getList()
        })
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
.exam-audit-page {
  .search-wrapper {
    margin-bottom: 16px;
  }
}
</style>
