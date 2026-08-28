import request from '@/utils/request'

export function clientMyCourses() {
  return request({
    url: '/client/statistics/courses',
    method: 'get',
    authType: 'client'
  })
}

export function clientCourseScoreTimeline(courseId) {
  return request({
    url: `/client/statistics/course/${courseId}/score-timeline`,
    method: 'get',
    authType: 'client'
  })
}
