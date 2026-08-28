<template>
  <div class="client-auth-page">
    <div class="auth-card">
      <div class="auth-brand">
        <div class="auth-logo">{{ brandShort }}</div>
        <h2 class="auth-title">{{ brandTitle }}</h2>
        <p class="auth-subtitle">欢迎回来，请使用学号登录</p>
      </div>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="0" class="auth-form">
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            name="username"
            autocomplete="username"
            prefix-icon="el-icon-user"
            placeholder="请输入学号"
            @input="handleFieldInput('username')"
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            name="password"
            autocomplete="current-password"
            prefix-icon="el-icon-lock"
            type="password"
            show-password
            placeholder="请输入密码"
            @input="handleFieldInput('password')"
            @keyup.enter.native="handleLogin"
          />
        </el-form-item>
        <el-form-item>
          <el-button size="medium" :loading="loading" class="auth-btn" @click="handleLogin">登 录</el-button>
        </el-form-item>
      </el-form>
      <div class="auth-links">
        <el-link type="primary" @click="$router.push('/user/register')">没有账号？立即注册</el-link>
        <el-link type="info" @click="$router.push('/login')">管理后台入口</el-link>
      </div>
    </div>
  </div>
</template>

<script>
import { trimRequired, syncAuthFormFromDom } from '@/utils/client-auth-form'
import defaultSettings from '@/settings'

const FORM_FIELDS = ['username', 'password']

export default {
  name: 'ClientLogin',
  computed: {
    brandTitle() {
      return defaultSettings.clientTitle || '睿考云'
    },
    brandShort() {
      return (this.brandTitle || '睿').slice(0, 1)
    }
  },
  data() {
    return {
      loading: false,
      form: {
        username: '',
        password: ''
      },
      rules: {
        username: [{ validator: trimRequired('请输入学号'), trigger: ['blur', 'change'] }],
        password: [{ validator: trimRequired('请输入密码'), trigger: ['blur', 'change'] }]
      }
    }
  },
  mounted() {
    // 浏览器自动填充不会触发 v-model，延迟同步一次
    this.$nextTick(() => {
      this.syncFormFromDom()
      setTimeout(() => this.syncFormFromDom(), 300)
    })
  },
  methods: {
    syncFormFromDom() {
      syncAuthFormFromDom(this.$refs.formRef, this.form, FORM_FIELDS)
    },
    handleFieldInput(prop) {
      if (prop === 'username') {
        this.form.username = (this.form.username || '').trim()
      }
      if (this.$refs.formRef) {
        this.$refs.formRef.clearValidate(prop)
      }
    },
    handleLogin() {
      this.syncFormFromDom()
      this.form.username = (this.form.username || '').trim()
      this.$refs.formRef.validate(async valid => {
        if (!valid) return
        this.loading = true
        try {
          await this.$store.dispatch('clientUser/login', this.form)
          const redirect = this.$route.query.redirect || '/user/home'
          this.$router.push(redirect)
        } finally {
          this.loading = false
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/layout/client/auth-page.scss';
</style>
