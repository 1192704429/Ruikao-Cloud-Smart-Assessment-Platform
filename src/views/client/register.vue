<template>
  <div class="client-auth-page">
    <div class="auth-card">
      <div class="auth-brand">
        <div class="auth-logo">{{ brandShort }}</div>
        <h2 class="auth-title">{{ brandTitle }}</h2>
        <p class="auth-subtitle">创建账号，开启智慧测评之旅</p>
      </div>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="0" class="auth-form">
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            name="username"
            autocomplete="username"
            prefix-icon="el-icon-postcard"
            placeholder="请输入学号（登录账号）"
            @input="handleFieldInput('username')"
          />
        </el-form-item>
        <el-form-item prop="name">
          <el-input
            v-model="form.name"
            name="name"
            autocomplete="name"
            prefix-icon="el-icon-user-solid"
            placeholder="请输入姓名"
            @input="handleFieldInput('name')"
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            name="password"
            autocomplete="new-password"
            prefix-icon="el-icon-lock"
            type="password"
            show-password
            placeholder="请输入密码（至少6位）"
            @input="handleFieldInput('password')"
          />
        </el-form-item>
        <el-form-item prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            name="confirmPassword"
            autocomplete="new-password"
            prefix-icon="el-icon-lock"
            type="password"
            show-password
            placeholder="请再次输入密码"
            @input="handleFieldInput('confirmPassword')"
          />
        </el-form-item>
        <el-form-item>
          <el-button size="medium" :loading="loading" class="auth-btn" @click="handleRegister">注 册</el-button>
        </el-form-item>
      </el-form>
      <div class="auth-links">
        <el-link type="primary" @click="$router.push('/user/login')">已有账号？去登录</el-link>
      </div>
    </div>
  </div>
</template>

<script>
import { trimRequired, syncAuthFormFromDom } from '@/utils/client-auth-form'
import defaultSettings from '@/settings'

const FORM_FIELDS = ['username', 'name', 'password', 'confirmPassword']

export default {
  name: 'ClientRegister',
  computed: {
    brandTitle() {
      return defaultSettings.clientTitle || '睿考云'
    },
    brandShort() {
      return (this.brandTitle || '睿').slice(0, 1)
    }
  },
  data() {
    const validateConfirm = (rule, value, callback) => {
      if (value !== this.form.password) {
        callback(new Error('两次输入的密码不一致'))
      } else {
        callback()
      }
    }
    return {
      loading: false,
      form: {
        username: '',
        name: '',
        password: '',
        confirmPassword: ''
      },
      rules: {
        username: [{ validator: trimRequired('请输入学号'), trigger: ['blur', 'change'] }],
        name: [{ validator: trimRequired('请输入姓名'), trigger: ['blur', 'change'] }],
        password: [
          { validator: trimRequired('请输入密码'), trigger: ['blur', 'change'] },
          { min: 6, message: '密码至少 6 位', trigger: ['blur', 'change'] }
        ],
        confirmPassword: [
          { validator: trimRequired('请再次输入密码'), trigger: ['blur', 'change'] },
          { validator: validateConfirm, trigger: ['blur', 'change'] }
        ]
      }
    }
  },
  mounted() {
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
      if (prop === 'username' || prop === 'name') {
        this.form[prop] = (this.form[prop] || '').trim()
      }
      if (this.$refs.formRef) {
        this.$refs.formRef.clearValidate(prop)
      }
    },
    handleRegister() {
      this.syncFormFromDom()
      this.form.username = (this.form.username || '').trim()
      this.form.name = (this.form.name || '').trim()
      this.$refs.formRef.validate(async valid => {
        if (!valid) return
        this.loading = true
        try {
          await this.$store.dispatch('clientUser/register', this.form)
          this.$message.success('注册成功，请登录')
          this.$router.push('/user/login')
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
