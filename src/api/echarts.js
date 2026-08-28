import request from '@/utils/request'

// 考试状态分布
export function adminExamStatusDistribution() {
  return request({
    url: '/echarts/adminExamStatusDistribution',
    method: 'get'
  })
}

// 教师课程数量排行
export function adminTeacherCourseCountTop() {
  return request({
    url: '/echarts/adminTeacherCourseCountTop',
    method: 'get'
  })
}

// 月度考试发布趋势
export function adminMonthlyExamPublishTrend(params) {
  return request({
    url: '/echarts/adminMonthlyExamPublishTrend',
    method: 'post',
    data: params
  })
}

// 班级学生人数分布
export function adminStudentClassDistribution() {
  return request({
    url: '/echarts/adminStudentClassDistribution',
    method: 'get'
  })
}

// 题目类型占比
export function adminQuestionTypeDistribution() {
  return request({
    url: '/echarts/adminQuestionTypeDistribution',
    method: 'get'
  })
}

// 我的考试状态分布
export function teacherMyExamStatusDistribution() {
  return request({
    url: '/echarts/teacherMyExamStatusDistribution',
    method: 'get'
  })
}

// 任教班级考试平均分对比
export function teacherMyClassScoreAvgTop() {
  return request({
    url: '/echarts/teacherMyClassScoreAvgTop',
    method: 'get'
  })
}

// 各课程试卷数量
export function teacherMyPaperCountByCourse() {
  return request({
    url: '/echarts/teacherMyPaperCountByCourse',
    method: 'get'
  })
}

// 考试学生完成率
export function teacherMyExamStudentFinishRate() {
  return request({
    url: '/echarts/teacherMyExamStudentFinishRate',
    method: 'get'
  })
}

// 各题型学生平均得分对比
export function teacherMyQuestionScoreAvgByType() {
  return request({
    url: '/echarts/teacherMyQuestionScoreAvgByType',
    method: 'get'
  })
}

// 我的考试得分趋势
export function studentMyExamScoreTrend() {
  return request({
    url: '/echarts/studentMyExamScoreTrend',
    method: 'get'
  })
}

// 各题型正确率对比
export function studentMyCorrectRateByQuestionType() {
  return request({
    url: '/echarts/studentMyCorrectRateByQuestionType',
    method: 'get'
  })
}

// 我的考试状态分布
export function studentMyExamStatusDistribution() {
  return request({
    url: '/echarts/studentMyExamStatusDistribution',
    method: 'get'
  })
}

