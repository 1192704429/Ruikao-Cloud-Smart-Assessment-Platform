import request from '@/utils/request'

// 分页查询课程列表（current、size 放路径参数，其余放 body）
export function pageCourse(current, size, params) {
  return request({
    url: `/course/page?current=${current}&size=${size}`,
    method: 'post',
    data: params
  })
}

// 查询课程详情
export function getCourseById(id) {
  return request({
    url: '/course/' + id,
    method: 'get'
  })
}

// 新增课程
export function saveCourse(data) {
  return request({
    url: '/course',
    method: 'post',
    data: data
  })
}

// 修改课程
export function updateCourse(data) {
  return request({
    url: '/course',
    method: 'put',
    data: data
  })
}

// 删除课程
export function deleteCourse(ids) {
  return request({
    url: '/course/' + ids,
    method: 'delete'
  })
}

// 批量删除课程
export function deleteBatchCourse(ids) {
  return request({
    url: '/course/batch',
    method: 'delete',
    data: ids
  })
}


// 下拉选项：授课教师
export function listSysUser(data) {
  return request({
    url: '/sys_user/list',
    method: 'post',
    data: data || {}
  })
}
