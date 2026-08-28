const TYPE_LABELS = {
  1: '单选题',
  2: '多选题',
  3: '判断题',
  4: '填空题',
  5: '简答题'
}

export function getQuestionTypeLabel(type) {
  return TYPE_LABELS[Number(type)] || '未知题型'
}

export function parseQuestionOptions(optionsStr, questionType) {
  const type = Number(questionType)
  if (type === 4 || type === 5) {
    return []
  }
  if (!optionsStr) {
    if (type === 3) {
      return [
        { label: 'A', content: '正确' },
        { label: 'B', content: '错误' }
      ]
    }
    return []
  }
  try {
    const parsed = JSON.parse(optionsStr)
    if (Array.isArray(parsed)) {
      return parsed.map((item, index) => {
        if (typeof item === 'string') {
          return { label: getOptionLabel(index), content: item }
        }
        return {
          label: item.label || getOptionLabel(index),
          content: item.content || item.text || item.value || ''
        }
      })
    }
  } catch (e) {
    const parts = String(optionsStr).split(',').map(s => s.trim()).filter(Boolean)
    return parts.map((content, index) => ({
      label: getOptionLabel(index),
      content
    }))
  }
  return []
}

export function getOptionLabel(index) {
  return String.fromCharCode(65 + index)
}

export function normalizeMultipleAnswer(list) {
  return [...new Set((list || []).map(item => String(item).trim().toUpperCase()).filter(Boolean))].sort().join(',')
}

export function formatJudgeAnswer(answer) {
  if (answer === 'A' || answer === 'B') return answer
  if (answer === '正确' || answer === '1' || answer === true) return 'A'
  if (answer === '错误' || answer === '0' || answer === false) return 'B'
  return answer
}

export function formatAnswerDisplay(type, answer, options) {
  const questionType = Number(type)
  if (!answer) return '-'
  if (questionType === 3) {
    return formatJudgeAnswer(answer) === 'A' ? '正确' : '错误'
  }
  if (questionType === 1 || questionType === 2) {
    const labels = String(answer).split(',').map(s => s.trim()).filter(Boolean)
    const optionList = options || []
    return labels.map(label => {
      const opt = optionList.find(item => item.label === label)
      return opt ? `${label}. ${opt.content}` : label
    }).join('；')
  }
  return answer
}
