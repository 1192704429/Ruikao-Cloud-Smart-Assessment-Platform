import request from '@/utils/request'

export function adminDashboardOverview() {
  return request({
    url: '/dashboard/admin/overview',
    method: 'get'
  })
}

export function teacherDashboardOverview() {
  return request({
    url: '/dashboard/teacher/overview',
    method: 'get'
  })
}
