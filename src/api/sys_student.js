import request from '@/utils/request'

// 分页查询学生列表（current、size 放路径参数，其余放 body）
export function pageSysStudent(current, size, params) {
  return request({
    url: `/sys_student/page?current=${current}&size=${size}`,
    method: 'post',
    data: params
  })
}

// 查询学生详情
export function getSysStudentById(id) {
  return request({
    url: '/sys_student/' + id,
    method: 'get'
  })
}

// 新增学生
export function saveSysStudent(data) {
  return request({
    url: '/sys_student',
    method: 'post',
    data: data
  })
}

// 修改学生
export function updateSysStudent(data) {
  return request({
    url: '/sys_student',
    method: 'put',
    data: data
  })
}

// 删除学生
export function deleteSysStudent(ids) {
  return request({
    url: '/sys_student/' + ids,
    method: 'delete'
  })
}

// 批量删除学生
export function deleteBatchSysStudent(ids) {
  return request({
    url: '/sys_student/batch',
    method: 'delete',
    data: ids
  })
}
