import request from '@/utils/request'

export function clientMyExams() {
  return request({
    url: '/client/exam/my',
    method: 'get',
    authType: 'client'
  })
}

export function clientStartExam(examId) {
  return request({
    url: `/client/exam/${examId}/start`,
    method: 'post',
    authType: 'client'
  })
}

export function clientGetExamPaper(examId) {
  return request({
    url: `/client/exam/${examId}/paper`,
    method: 'get',
    authType: 'client'
  })
}

export function clientSaveExamAnswers(examId, data) {
  return request({
    url: `/client/exam/${examId}/save`,
    method: 'post',
    data,
    authType: 'client'
  })
}

export function clientSubmitExam(examId, data) {
  return request({
    url: `/client/exam/${examId}/submit`,
    method: 'post',
    data: data || {},
    authType: 'client'
  })
}

export function clientGetExamResult(examId) {
  return request({
    url: `/client/exam/${examId}/result`,
    method: 'get',
    authType: 'client'
  })
}
