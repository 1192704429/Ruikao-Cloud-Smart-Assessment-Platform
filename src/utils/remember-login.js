const STORAGE_KEY = 'exam_center_remember_login'

export function getRememberLogin() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (!data || !data.rememberMe) return null
    return {
      rememberMe: true,
      username: data.username || '',
      password: data.password || ''
    }
  } catch (e) {
    return null
  }
}

export function setRememberLogin({ username, password }) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    rememberMe: true,
    username: username || '',
    password: password || ''
  }))
}

export function clearRememberLogin() {
  localStorage.removeItem(STORAGE_KEY)
}
