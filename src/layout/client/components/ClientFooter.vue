<template>
  <footer class="client-footer">
    <div class="footer-inner">
      <div class="footer-top">
        <section class="footer-col">
          <h4 class="col-title">平台介绍</h4>
          <ul class="link-list">
            <li>{{ clientBrandName }}为学员提供高效、稳定、智能的在线测评体验</li>
            <li>支持单选、多选、判断、填空、简答等题型</li>
            <li>自动保存作答进度，交卷后即时查看成绩</li>
          </ul>
        </section>

        <section class="footer-col">
          <h4 class="col-title">使用帮助</h4>
          <ul class="link-list">
            <li><a href="javascript:void(0)" @click="go('/user/exams')">查看我的考试</a></li>
            <li><a href="javascript:void(0)" @click="go('/user/profile')">修改个人信息</a></li>
            <li><a href="javascript:void(0)" @click="go('/user/login')">学员登录</a></li>
          </ul>
        </section>

        <section class="footer-col">
          <h4 class="col-title">考试须知</h4>
          <ul class="link-list">
            <li>请在规定时间内完成考试</li>
            <li>考试过程中可手动保存答案</li>
            <li>交卷后客观题自动评分</li>
          </ul>
        </section>

        <section class="footer-col">
          <h4 class="col-title">联系我们</h4>
          <ul class="link-list contact-list">
            <li>技术支持：exam-center@example.com</li>
            <li>服务时间：工作日 9:00 - 18:00</li>
          </ul>
        </section>
      </div>

      <div class="footer-bottom">
        <p>© 2026 {{ clientBrandName }} · 智慧测评学员端</p>
      </div>
    </div>
  </footer>
</template>

<script>
import defaultSettings from '@/settings'

export default {
  name: 'ClientFooter',
  computed: {
    clientBrandName() {
      return defaultSettings.clientTitle || '睿考云'
    }
  },
  methods: {
    go(path) {
      if (this.$route.path !== path) {
        this.$router.push(path)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
@import "../client-theme.scss";

.client-footer {
  margin-top: 36px;
  background: linear-gradient(180deg, $client-footer-bg-start 0%, $client-footer-bg-end 100%);
  border-top: 1px solid $client-footer-border;
  box-shadow: 0 -2px 10px $client-footer-shadow;
}

.footer-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 34px 20px 18px;
}

.footer-top {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 28px;
  padding-bottom: 24px;
  border-bottom: 1px solid #f2e5e8;
}

.col-title {
  margin: 0 0 14px;
  font-size: 16px;
  font-weight: 700;
  color: $client-footer-title;
}

.link-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.link-list li {
  margin-bottom: 10px;
  line-height: 1.7;
  color: $client-footer-text;
  font-size: 14px;
}

.link-list a {
  color: $client-footer-text;
  text-decoration: none;
  transition: color 0.2s ease;
  cursor: pointer;
}

.link-list a:hover {
  color: $client-footer-link-hover;
}

.footer-bottom {
  text-align: center;
  padding-top: 16px;
}

.footer-bottom p {
  margin: 6px 0;
  font-size: 12px;
  color: $client-footer-bottom-text;
}

@media (max-width: 960px) {
  .footer-top {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .footer-top {
    grid-template-columns: 1fr;
  }
}
</style>
