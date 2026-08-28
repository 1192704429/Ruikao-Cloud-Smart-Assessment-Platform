import request from '@/utils/request'

// 教师查看学生考试答题详情
export function getExamStudentResult(examId, studentId) {
  return request({
    url: `/exam_student/studentResult/${examId}/${studentId}`,
    method: 'get'
  })
}

// 分页查询考试人员记录
export function pageExamStudent(current, size, params) {
  return request({
    url: `/exam_student/page?current=${current}&size=${size}`,
    method: 'post',
    data: params
  })
}

// 查询考试人员列表
export function listExamStudent(data) {
  return request({
    url: '/exam_student/list',
    method: 'post',
    data: data || {}
  })
}

// 考试人员设置：班级-学生树
export function getExamClassStudentTree(examId) {
  return request({
    url: '/exam_student/classStudentTree/' + examId,
    method: 'get'
  })
}

// 批量保存考试人员
export function batchSaveExamStudent(data) {
  return request({
    url: '/exam_student/batchSave',
    method: 'post',
    data: data
  })
}
