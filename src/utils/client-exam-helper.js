/** 学员考试状态文案 */
export const STUDENT_EXAM_STATUS_MAP = {
  0: '待考试',
  1: '考试中',
  2: '已完成',
  3: '缺考'
}

export function studentStatusLabel(status) {
  return STUDENT_EXAM_STATUS_MAP[status] || '未知'
}

export function studentStatusTagType(status) {
  const map = { 0: 'warning', 1: 'primary', 2: 'success', 3: 'info' }
  return map[status] || 'info'
}

function parseTime(value) {
  if (!value) return null
  const ts = new Date(String(value).replace(/-/g, '/')).getTime()
  return Number.isNaN(ts) ? null : ts
}

/** 考试是否在可参加的时间窗口内 */
export function isExamInTimeWindow(row, now = Date.now()) {
  const start = parseTime(row && row.startTime)
  const end = parseTime(row && row.endTime)
  if (start != null && now < start) return false
  if (end != null && now > end) return false
  return true
}

/** 考试是否尚未开始 */
export function isExamNotStarted(row, now = Date.now()) {
  const start = parseTime(row && row.startTime)
  return start != null && now < start
}

/** 考试是否已结束 */
export function isExamEnded(row, now = Date.now()) {
  const end = parseTime(row && row.endTime)
  return end != null && now > end
}

/**
 * 操作列展示：不可操作时 show=false
 */
export function getExamAction(row) {
  const status = row && row.studentStatus

  if (status === 2) {
    return { show: true, text: '查看成绩', type: 'result' }
  }

  if (status === 1) {
    if (isExamEnded(row)) {
      return { show: false, hint: '已结束' }
    }
    return { show: true, text: '继续考试', type: 'take' }
  }

  if (status === 3) {
    return { show: false, hint: '缺考' }
  }

  // 待考试 status 0
  if (isExamNotStarted(row)) {
    return { show: false, hint: '未开始' }
  }
  if (isExamEnded(row)) {
    return { show: false, hint: '已结束' }
  }
  if (!isExamInTimeWindow(row)) {
    return { show: false, hint: '-' }
  }

  return { show: true, text: '开始考试', type: 'take' }
}
