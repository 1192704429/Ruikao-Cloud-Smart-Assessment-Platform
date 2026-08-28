import request from '@/utils/request'

// 查询考试列表（不分页）
export function listExam(data) {
  return request({
    url: '/exam/list',
    method: 'post',
    data: data || {}
  })
}

// 分页查询考试列表（current、size 放路径参数，其余放 body）
export function pageExam(current, size, params) {
  return request({
    url: `/exam/page?current=${current}&size=${size}`,
    method: 'post',
    data: params
  })
}

// 查询考试详情
export function getExamById(id) {
  return request({
    url: '/exam/' + id,
    method: 'get'
  })
}

// 新增考试
export function saveExam(data) {
  return request({
    url: '/exam',
    method: 'post',
    data: data
  })
}

// 修改考试
export function updateExam(data) {
  return request({
    url: '/exam',
    method: 'put',
    data: data
  })
}

// 删除考试
export function deleteExam(ids) {
  return request({
    url: '/exam/' + ids,
    method: 'delete'
  })
}

// 批量删除考试
export function deleteBatchExam(ids) {
  return request({
    url: '/exam/batch',
    method: 'delete',
    data: ids
  })
}

// 教师提交考试审核
export function submitExamAudit(id) {
  return request({
    url: '/exam/submitAudit/' + id,
    method: 'put'
  })
}

// 发布考试（已通过）
export function publishExam(id) {
  return request({
    url: '/exam/publish/' + id,
    method: 'put'
  })
}

// 管理员审核考试
export function auditExam(data) {
  return request({
    url: '/exam/audit',
    method: 'put',
    data: data
  })
}


// 下拉选项：所属课程
export function listCourse(data) {
  return request({
    url: '/course/list',
    method: 'post',
    data: data || {}
  })
}

// 下拉选项：发布教师
export function listSysUser(data) {
  return request({
    url: '/sys_user/list',
    method: 'post',
    data: data || {}
  })
}
