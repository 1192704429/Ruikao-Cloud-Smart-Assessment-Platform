import request from '@/utils/request'

export function listPaperQuestion(data) {
  return request({
    url: '/paper_question/list',
    method: 'post',
    data: data || {}
  })
}

export function batchSavePaperQuestion(data) {
  return request({
    url: '/paper_question/batchSave',
    method: 'post',
    data
  })
}

export function updatePaperQuestion(data) {
  return request({
    url: '/paper_question',
    method: 'put',
    data
  })
}

export function deletePaperQuestion(id) {
  return request({
    url: '/paper_question/' + id,
    method: 'delete'
  })
}
