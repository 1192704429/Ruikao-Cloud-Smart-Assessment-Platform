import request from '@/utils/request'

// 查询试卷列表（不分页，用于下拉）
export function listExamPaper(data) {
  return request({
    url: '/exam_paper/list',
    method: 'post',
    data: data || {}
  })
}

// 发布试卷
export function publishExamPaper(id) {
  return request({
    url: '/exam_paper/publish/' + id,
    method: 'put'
  })
}

// 取消发布试卷
export function unpublishExamPaper(id) {
  return request({
    url: '/exam_paper/unpublish/' + id,
    method: 'put'
  })
}

// 智能组卷
export function aiAssembleExamPaper(data) {
  return request({
    url: '/exam_paper/aiAssemble',
    method: 'post',
    data
  })
}

// 分页查询试卷列表（current、size 放路径参数，其余放 body）
export function pageExamPaper(current, size, params) {
  return request({
    url: `/exam_paper/page?current=${current}&size=${size}`,
    method: 'post',
    data: params
  })
}

// 查询试卷详情
export function getExamPaperById(id) {
  return request({
    url: '/exam_paper/' + id,
    method: 'get'
  })
}

// 新增试卷
export function saveExamPaper(data) {
  return request({
    url: '/exam_paper',
    method: 'post',
    data: data
  })
}

// 修改试卷
export function updateExamPaper(data) {
  return request({
    url: '/exam_paper',
    method: 'put',
    data: data
  })
}

// 删除试卷
export function deleteExamPaper(ids) {
  return request({
    url: '/exam_paper/' + ids,
    method: 'delete'
  })
}

// 批量删除试卷
export function deleteBatchExamPaper(ids) {
  return request({
    url: '/exam_paper/batch',
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
