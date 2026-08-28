import request from '@/utils/request'

// 分页查询教师班级绑定列表（current、size 放路径参数，其余放 body）
export function pageTeacherSysClass(current, size, params) {
  return request({
    url: `/teacher_sys_class/page?current=${current}&size=${size}`,
    method: 'post',
    data: params
  })
}

// 查询教师班级绑定详情
export function getTeacherSysClassById(id) {
  return request({
    url: '/teacher_sys_class/' + id,
    method: 'get'
  })
}

// 新增教师班级绑定
export function saveTeacherSysClass(data) {
  return request({
    url: '/teacher_sys_class',
    method: 'post',
    data: data
  })
}

// 修改教师班级绑定
export function updateTeacherSysClass(data) {
  return request({
    url: '/teacher_sys_class',
    method: 'put',
    data: data
  })
}

// 删除教师班级绑定
export function deleteTeacherSysClass(ids) {
  return request({
    url: '/teacher_sys_class/' + ids,
    method: 'delete'
  })
}

// 批量删除教师班级绑定
export function deleteBatchTeacherSysClass(ids) {
  return request({
    url: '/teacher_sys_class/batch',
    method: 'delete',
    data: ids
  })
}

// 批量添加班级教师
export function batchSaveTeacherSysClass(data) {
  return request({
    url: '/teacher_sys_class/batchSave',
    method: 'post',
    data: data
  })
}

// 查询班级教师绑定列表（不分页）
export function listTeacherSysClass(data) {
  return request({
    url: '/teacher_sys_class/list',
    method: 'post',
    data: data || {}
  })
}


// 下拉选项：教师ID
export function listSysUser(data) {
  return request({
    url: '/sys_user/list',
    method: 'post',
    data: data || {}
  })
}

// 下拉选项：班级ID
export function listSysClass(data) {
  return request({
    url: '/sys_class/list',
    method: 'post',
    data: data || {}
  })
}
