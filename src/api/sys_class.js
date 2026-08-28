import request from '@/utils/request'

// 分页查询班级列表（current、size 放路径参数，其余放 body）
export function pageSysClass(current, size, params) {
  return request({
    url: `/sys_class/page?current=${current}&size=${size}`,
    method: 'post',
    data: params
  })
}

// 查询班级详情
export function getSysClassById(id) {
  return request({
    url: '/sys_class/' + id,
    method: 'get'
  })
}

// 新增班级
export function saveSysClass(data) {
  return request({
    url: '/sys_class',
    method: 'post',
    data: data
  })
}

// 修改班级
export function updateSysClass(data) {
  return request({
    url: '/sys_class',
    method: 'put',
    data: data
  })
}

// 删除班级
export function deleteSysClass(ids) {
  return request({
    url: '/sys_class/' + ids,
    method: 'delete'
  })
}

// 批量删除班级
export function deleteBatchSysClass(ids) {
  return request({
    url: '/sys_class/batch',
    method: 'delete',
    data: ids
  })
}
