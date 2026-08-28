<template>
  <div class="login-page">
    <div class="page-deco">
      <div class="sky-cloud cloud-1" />
      <div class="sky-cloud cloud-2" />
      <div class="sky-cloud cloud-3" />
      <div class="sky-orb orb-1" />
      <div class="sky-orb orb-2" />
      <div class="sky-orb orb-3" />
    </div>

    <div class="login-center">
      <div class="hero-inner">
        <h1 class="hero-title">{{ brandTitle }}</h1>
        <p class="hero-desc">{{ brandSlogan }}</p>
        <ul class="hero-chips">
          <li><i class="el-icon-cloudy" /> 智能组卷</li>
          <li><i class="el-icon-odometer" /> 精准评测</li>
          <li><i class="el-icon-data-analysis" /> 数据洞察</li>
        </ul>
      </div>

      <section class="login-panel">
        <div class="login-card">
          <div class="card-head">
            <div class="card-icon">
              <i class="el-icon-unlock" />
            </div>
            <div class="card-titles">
              <h2>账户登录</h2>
              <p>欢迎登录 {{ brandTitle }}</p>
            </div>
          </div>

        <el-form
          ref="loginForm"
          :model="loginForm"
          :rules="loginRules"
          class="login-form"
          @keyup.enter.native="handleLogin"
        >
          <el-form-item prop="username">
            <el-input
              v-model="loginForm.username"
              prefix-icon="el-icon-user"
              placeholder="用户名"
            />
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
              prefix-icon="el-icon-lock"
              type="password"
              placeholder="密码"
              show-password
            />
          </el-form-item>

          <el-form-item prop="captcha">
            <div class="captcha-row">
              <el-input
                v-model="loginForm.captcha"
                prefix-icon="el-icon-picture-outline"
                placeholder="验证码"
                class="captcha-input"
              />
              <div class="captcha-box" @click="refreshCaptcha">
                <img v-if="captchaImageUrl" :src="captchaImageUrl" alt="验证码">
                <span v-else class="captcha-tip">获取</span>
              </div>
            </div>
          </el-form-item>

          <div class="form-extra">
            <el-checkbox v-model="rememberMe">记住我</el-checkbox>
            <a href="javascript:void(0)" class="link-muted">忘记密码？</a>
          </div>

          <el-button size="medium"
            type="primary"
            class="submit-btn"
            :loading="loading"
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form>

        <div class="auth-links">
          <router-link to="/user/home" class="link-home">学员端首页</router-link>
        </div>
        </div>
      </section>

      <p class="foot-text"></p>
    </div>
  </div>
</template>

<script>
import { getCaptcha } from '@/api/user'
import { getRememberLogin, setRememberLogin, clearRememberLogin } from '@/utils/remember-login'
import defaultSettings from '@/settings'

export default {
  name: 'Login9',
  data() {
    const validateUsername = (rule, value, callback) => {
      if (!value) callback(new Error('请输入用户名'))
      else callback()
    }
    const validatePassword = (rule, value, callback) => {
      if (!value) callback(new Error('请输入密码'))
      else if (value.length < 6) callback(new Error('密码长度不能少于6位'))
      else callback()
    }
    const validateCaptcha = (rule, value, callback) => {
      if (!value) callback(new Error('请输入验证码'))
      else callback()
    }
    return {
      loginForm: {
        username: '',
        password: '',
        captcha: '',
        captchaKey: ''
      },
      loginRules: {
        username: [{ validator: validateUsername, trigger: 'blur' }],
        password: [{ validator: validatePassword, trigger: 'blur' }],
        captcha: [{ validator: validateCaptcha, trigger: 'blur' }]
      },
      rememberMe: false,
      loading: false,
      captchaImageUrl: ''
    }
  },
  computed: {
    brandTitle() {
      return defaultSettings.title || '睿考云'
    },
    brandSlogan() {
      return defaultSettings.slogan || '数字化考试评估一体化平台'
    }
  },
  mounted() {
    this.loadRememberedLogin()
    this.refreshCaptcha()
  },
  beforeDestroy() {
    if (this.captchaImageUrl) {
      window.URL.revokeObjectURL(this.captchaImageUrl)
    }
  },
  methods: {
    loadRememberedLogin() {
      const saved = getRememberLogin()
      if (!saved) return
      this.rememberMe = true
      this.loginForm.username = saved.username
      this.loginForm.password = saved.password
    },
    saveRememberLogin() {
      if (this.rememberMe) {
        setRememberLogin({
          username: (this.loginForm.username || '').trim(),
          password: this.loginForm.password || ''
        })
      } else {
        clearRememberLogin()
      }
    },
    refreshCaptcha() {
      const cacheKey = Date.now().toString()
      this.loginForm.captchaKey = cacheKey
      if (this.captchaImageUrl) {
        window.URL.revokeObjectURL(this.captchaImageUrl)
      }
      getCaptcha(cacheKey).then(blob => {
        this.captchaImageUrl = window.URL.createObjectURL(blob)
      }).catch(error => {
        console.error('获取验证码失败:', error)
        this.$message.error('获取验证码失败，请重试')
      })
    },
    handleLogin() {
      this.$refs.loginForm.validate(valid => {
        if (!valid) return false
        this.loading = true
        this.$store.dispatch('user/login', this.loginForm).then(() => {
          this.saveRememberLogin()
          this.$router.push('/index')
        }).catch(() => {
          this.refreshCaptcha()
          this.loginForm.captcha = ''
        }).finally(() => {
          this.loading = false
        })
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 24px;
  background: linear-gradient(180deg, #e0f2fe 0%, #f0fdfa 55%, #ecfeff 100%);
}

.page-deco {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.login-center {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 400px;
}

.sky-cloud {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.55);
  pointer-events: none;
}

.cloud-1 {
  width: 220px;
  height: 90px;
  top: 12%;
  left: 8%;
  border-radius: 90px;
  box-shadow: 60px 10px 0 -8px rgba(255, 255, 255, 0.45);
}

.cloud-2 {
  width: 160px;
  height: 70px;
  top: 22%;
  right: 12%;
  border-radius: 70px;
  box-shadow: -45px 8px 0 -6px rgba(255, 255, 255, 0.4);
}

.cloud-3 {
  width: 120px;
  height: 50px;
  bottom: 18%;
  left: 35%;
  border-radius: 50px;
  opacity: 0.7;
}

.sky-orb {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}

.orb-1 {
  width: 14px;
  height: 14px;
  top: 28%;
  left: 42%;
  background: rgba(125, 211, 252, 0.6);
}

.orb-2 {
  width: 8px;
  height: 8px;
  top: 18%;
  right: 28%;
  background: rgba(153, 246, 228, 0.8);
}

.orb-3 {
  width: 20px;
  height: 20px;
  bottom: 30%;
  right: 20%;
  background: rgba(255, 255, 255, 0.65);
  border: 1px solid rgba(56, 189, 248, 0.15);
}

.hero-inner {
  width: 100%;
  text-align: center;
}

.hero-title {
  margin: 0 0 10px;
  font-size: 36px;
  font-weight: 700;
  color: #0369a1;
  letter-spacing: 1px;
  white-space: pre-line;
}

.hero-desc {
  margin: 0 0 20px;
  font-size: 15px;
  color: #0e7490;
  opacity: 0.75;
  white-space: pre-line;
}

.hero-chips {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;

  li {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border-radius: 24px;
    font-size: 13px;
    color: #0c4a6e;
    background: rgba(255, 255, 255, 0.5);
    border: 1px solid rgba(56, 189, 248, 0.15);

    i {
      color: #38bdf8;
    }
  }
}

.login-panel {
  width: 100%;
  margin-top: 16px;
}

.login-card {
  width: 100%;
  padding: 28px 32px 32px;
  background: #fff;
  border-radius: 20px;
  border: 1px solid rgba(186, 230, 253, 0.6);
  box-shadow:
    0 20px 50px rgba(56, 189, 248, 0.12),
    0 4px 12px rgba(15, 23, 42, 0.04);
}

.card-head {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 28px;
}

.card-icon {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  border-radius: 12px;
  background: linear-gradient(135deg, #e0f2fe 0%, #ccfbf1 100%);
  color: #38bdf8;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-titles {
  h2 {
    margin: 0 0 2px;
    font-size: 20px;
    font-weight: 700;
    color: #0369a1;
  }

  p {
    margin: 0;
    font-size: 13px;
    color: #94a3b8;
  }
}

.login-form {
  ::v-deep .el-form-item {
    margin-bottom: 20px;
  }

  ::v-deep .el-input__inner {
    height: 44px;
    line-height: 44px;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    background: #f8fafc;
    color: #334155;
    transition: all 0.2s ease;

    &::placeholder {
      color: #94a3b8;
    }

    &:focus {
      border-color: #7dd3fc;
      background: #fff;
      box-shadow: 0 0 0 3px rgba(125, 211, 252, 0.25);
    }
  }

  ::v-deep .el-input__prefix {
    color: #94a3b8;
  }

  ::v-deep .el-checkbox__label {
    color: #64748b;
    font-size: 13px;
  }

  ::v-deep .el-checkbox__input.is-checked .el-checkbox__inner {
    background-color: #38bdf8;
    border-color: #38bdf8;
  }
}

.captcha-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.captcha-input {
  flex: 1;
}

.captcha-box {
  width: 108px;
  height: 44px;
  flex-shrink: 0;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  background: #f8fafc;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .captcha-tip {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    color: #94a3b8;
  }

  &:hover {
    border-color: #38bdf8;
  }
}

.form-extra {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 4px 0 24px;

  .link-muted {
    font-size: 13px;
    color: #64748b;
    text-decoration: none;

    &:hover {
      color: #38bdf8;
    }
  }
}

.submit-btn {
  width: 100%;
  height: 46px;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  letter-spacing: 2px;
  background: #38bdf8;
  box-shadow: 0 8px 20px rgba(56, 189, 248, 0.3);

  &:hover,
  &:focus {
    background: #0ea5e9;
  }
}

.auth-links {
  margin-top: 20px;
  text-align: center;

  .link-home {
    font-size: 13px;
    color: #64748b;
    text-decoration: none;

    &:hover {
      color: #38bdf8;
    }
  }
}

.foot-text {
  margin: 20px 0 0;
  font-size: 12px;
  color: #94a3b8;
  text-align: center;
  white-space: pre-line;
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 28px;
  }

  .login-panel {
    margin-top: 12px;
  }

  .login-card {
    padding: 24px 22px 28px;
  }
}
</style>
