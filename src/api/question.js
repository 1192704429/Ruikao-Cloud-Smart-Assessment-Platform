import request from '@/utils/request'

// 分页查询题目列表（current、size 放路径参数，其余放 body）
export function pageQuestion(current, size, params) {
  return request({
    url: `/question/page?current=${current}&size=${size}`,
    method: 'post',
    data: params
  })
}

// 查询题目详情
export function getQuestionById(id) {
  return request({
    url: '/question/' + id,
    method: 'get'
  })
}

// 新增题目
export function saveQuestion(data) {
  return request({
    url: '/question',
    method: 'post',
    data: data
  })
}

// 修改题目
export function updateQuestion(data) {
  return request({
    url: '/question',
    method: 'put',
    data: data
  })
}

// 删除题目
export function deleteQuestion(ids) {
  return request({
    url: '/question/' + ids,
    method: 'delete'
  })
}

// 批量删除题目
export function deleteBatchQuestion(ids) {
  return request({
    url: '/question/batch',
    method: 'delete',
    data: ids
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

// 下拉选项：创建教师
export function listSysUser(data) {
  return request({
    url: '/sys_user/list',
    method: 'post',
    data: data || {}
  })
}

// AI 根据知识库出题
export function aiGenerateQuestion(data) {
  return request({
    url: '/question/aiGenerate',
    method: 'post',
    data,
    timeout: 600000
  })
}
