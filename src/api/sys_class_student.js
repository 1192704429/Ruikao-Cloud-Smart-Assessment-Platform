import request from '@/utils/request'

// 分页查询班级学生绑定列表（current、size 放路径参数，其余放 body）
export function pageSysClassStudent(current, size, params) {
  return request({
    url: `/sys_class_student/page?current=${current}&size=${size}`,
    method: 'post',
    data: params
  })
}

// 查询班级学生绑定详情
export function getSysClassStudentById(id) {
  return request({
    url: '/sys_class_student/' + id,
    method: 'get'
  })
}

// 新增班级学生绑定
export function saveSysClassStudent(data) {
  return request({
    url: '/sys_class_student',
    method: 'post',
    data: data
  })
}

// 修改班级学生绑定
export function updateSysClassStudent(data) {
  return request({
    url: '/sys_class_student',
    method: 'put',
    data: data
  })
}

// 删除班级学生绑定
export function deleteSysClassStudent(ids) {
  return request({
    url: '/sys_class_student/' + ids,
    method: 'delete'
  })
}

// 批量删除班级学生绑定
export function deleteBatchSysClassStudent(ids) {
  return request({
    url: '/sys_class_student/batch',
    method: 'delete',
    data: ids
  })
}

// 批量添加班级学生
export function batchSaveSysClassStudent(data) {
  return request({
    url: '/sys_class_student/batchSave',
    method: 'post',
    data: data
  })
}

// 查询班级学生绑定列表（不分页）
export function listSysClassStudent(data) {
  return request({
    url: '/sys_class_student/list',
    method: 'post',
    data: data || {}
  })
}

export function listSysClass(data) {
  return request({
    url: '/sys_class/list',
    method: 'post',
    data: data || {}
  })
}

// 下拉选项：学生ID
export function listSysStudent(data) {
  return request({
    url: '/sys_student/list',
    method: 'post',
    data: data || {}
  })
}
