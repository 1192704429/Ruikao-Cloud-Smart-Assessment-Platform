import request from '@/utils/request'

export function teacherStatCourses() {
  return request({
    url: '/teacher/statistics/courses',
    method: 'get'
  })
}

export function teacherCourseExamTimeline(courseId) {
  return request({
    url: `/teacher/statistics/course/${courseId}/exam-timeline`,
    method: 'get'
  })
}

export function teacherCourseStudents(courseId) {
  return request({
    url: `/teacher/statistics/course/${courseId}/students`,
    method: 'get'
  })
}

export function teacherCourseStudentTimeline(courseId, studentId) {
  return request({
    url: `/teacher/statistics/course/${courseId}/student-timeline/${studentId}`,
    method: 'get'
  })
}

export function teacherStatExams(courseId) {
  return request({
    url: '/teacher/statistics/exams',
    method: 'get',
    params: courseId ? { courseId } : {}
  })
}

export function teacherExamSummary(examId) {
  return request({
    url: `/teacher/statistics/exam/${examId}/summary`,
    method: 'get'
  })
}

export function teacherExamStudentScores(examId) {
  return request({
    url: `/teacher/statistics/exam/${examId}/student-scores`,
    method: 'get'
  })
}
