/** 去除首尾空格后再校验必填 */
export function trimRequired(message) {
  return (rule, value, callback) => {
    if (!(value || '').trim()) {
      callback(new Error(message))
    } else {
      callback()
    }
  }
}

/**
 * 同步 DOM 输入框值到 form（解决浏览器自动填充不触发 v-model 的问题）
 */
export function syncAuthFormFromDom(formRef, form, fields) {
  const formEl = formRef && formRef.$el
  if (!formEl) return
  const inputs = formEl.querySelectorAll('input.el-input__inner')
  fields.forEach((field, index) => {
    const input = inputs[index]
    if (!input) return
    const raw = input.value
    if (raw === undefined || raw === null) return
    form[field] = field === 'password' || field === 'confirmPassword' ? raw : raw.trim()
  })
}
