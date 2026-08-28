<template>
  <div class="pagination-wrapper" :class="{ 'is-compact': compact }" v-show="total > 0">
    <el-pagination
      :current-page="currentPage"
      :page-sizes="computedPageSizes"
      :page-size="pageSize"
      :total="total"
      :layout="layout"
      :background="background"
      :small="small"
      class="pagination"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />
  </div>
</template>

<script>
export default {
  name: 'Pagination',
  computed: {
    computedPageSizes() {
      const sizes = [...this.pageSizes]
      if (!sizes.includes(this.pageSize)) {
        sizes.push(this.pageSize)
        sizes.sort((a, b) => a - b)
      }
      return sizes
    }
  },
  props: {
    currentPage: {
      type: Number,
      default: 1
    },
    pageSize: {
      type: Number,
      default: 10
    },
    total: {
      type: Number,
      default: 0,
      required: true
    },
    pageSizes: {
      type: Array,
      default: () => [10, 20, 50, 100]
    },
    layout: {
      type: String,
      default: 'total, sizes, prev, pager, next, jumper'
    },
    background: {
      type: Boolean,
      default: false
    },
    small: {
      type: Boolean,
      default: false
    },
    // 弹窗等窄容器内使用，允许横向滚动
    compact: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    handleSizeChange(val) {
      this.$emit('update:pageSize', val)
      this.$emit('size-change', val)
    },
    handleCurrentChange(val) {
      this.$emit('update:currentPage', val)
      this.$emit('current-change', val)
    }
  }
}
</script>

<style scoped lang="scss">
$primary-color: #409EFF;
$primary-light: rgba(64, 158, 255, 0.1);
$neutral-text: #606266;
$neutral-text-light: #909399;
$neutral-bg: #ffffff;
$neutral-border: #dcdfe6;
$neutral-button-bg: #ffffff;
$transition-base: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

.pagination-wrapper {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
  align-items: center;

  &.is-compact {
    width: 100%;
    justify-content: flex-start;
    overflow-x: auto;
  }

  .pagination {
    background-color: #ffffff;
    border-radius: 8px;
    padding: 12px 20px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.08);
    display: inline-flex;
    align-items: center;

    ::v-deep .el-pagination__total {
      color: $neutral-text;
      font-size: 14px;
      font-weight: 400;
      margin-right: 10px;
      white-space: nowrap;
    }

    ::v-deep .el-pagination__sizes {
      margin-right: 10px;

      .el-select {
        .el-input {
          .el-input__inner {
            border-radius: 6px;
            border: 1px solid $neutral-border;
            background-color: $neutral-bg;
            transition: $transition-base;
            font-size: 14px;
            height: 32px;
            line-height: 32px;
            color: $neutral-text;
            padding: 0 24px 0 8px;

            &:hover {
              border-color: $primary-color;
            }

            &:focus {
              border-color: $primary-color;
              box-shadow: 0 0 0 2px $primary-light;
            }
          }
        }

        .el-input__suffix {
          .el-select__caret {
            color: $neutral-text-light;
          }
        }
      }
    }

    ::v-deep .btn-prev,
    ::v-deep .btn-next {
      background-color: $neutral-button-bg;
      border: 1px solid $neutral-border;
      border-radius: 4px;
      color: $neutral-text;
      min-width: 32px;
      height: 32px;
      line-height: 32px;
      transition: $transition-base;
      margin: 0 4px;
      padding: 0 8px;
      font-size: 14px;

      &:hover:not(.disabled) {
        color: $primary-color;
        border-color: $primary-color;
      }

      &.disabled {
        color: #c0c4cc;
        cursor: not-allowed;
        background-color: #f5f7fa;
        border-color: $neutral-border;
      }
    }

    ::v-deep .el-pager {
      margin: 0 4px;

      li {
        background-color: transparent;
        border: none;
        border-radius: 50%;
        color: $neutral-text;
        min-width: 32px;
        width: 32px;
        height: 32px;
        line-height: 32px;
        margin: 0 2px;
        padding: 0;
        transition: $transition-base;
        font-weight: 400;
        font-size: 14px;

        &:not(.active):hover {
          color: $primary-color;
          background-color: $primary-light;
        }

        &.active {
          background-color: $primary-color;
          color: #ffffff;
          font-weight: 500;
        }
      }
    }

    ::v-deep .el-pagination__jump {
      margin-left: 10px;
      color: $neutral-text;
      font-size: 14px;
      white-space: nowrap;

      .el-input {
        width: 50px;
        margin: 0 8px;

        .el-input__inner {
          border-radius: 6px;
          border: 1px solid $neutral-border;
          background-color: $neutral-bg;
          text-align: center;
          height: 32px;
          line-height: 32px;
          font-size: 14px;
          color: $neutral-text;
          padding: 0 8px;
        }
      }
    }

    &.el-pagination--small {
      padding: 8px 16px;

      ::v-deep .el-pager li {
        min-width: 28px;
        width: 28px;
        height: 28px;
        line-height: 28px;
        font-size: 13px;
      }
    }
  }
}

@media (max-width: 768px) {
  .pagination-wrapper {
    justify-content: center;

    .pagination {
      padding: 10px 16px;

      ::v-deep .el-pagination__total,
      ::v-deep .el-pagination__jump {
        display: none;
      }
    }
  }
}
</style>
