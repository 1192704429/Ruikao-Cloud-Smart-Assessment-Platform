import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

/* 布局组件 */
import Layout from '@/layout'


/**
 * 常量路由
 * 不需要权限的基础页面
 * 所有角色都可以访问
 */
export const constantRoutes = [
  // 用户相关
  {
    path: '/',
    redirect: '/user/home',
    hidden: true
  },
  {
    path: '/user/login',
    component: () => import('@/views/client/login'),
    hidden: true,
    meta: {
      appType: 'client',
      requiresAuth: false
    }
  },
  {
    path: '/user/register',
    component: () => import('@/views/client/register'),
    hidden: true,
    meta: {
      appType: 'client',
      requiresAuth: false
    }
  },
  // 管理员相关
  {
    // 管理员登录
    path: '/login',
    component: () => import('@/views/login/index'),
    hidden: true
  },
  {
    // 管理员首页
    path: '/index',
    component: Layout,
    children: [
      {
        path: '',
        name: '首页',
        component: () => import('@/views/index/index'),
        meta: { title: '首页', icon: 'dashboard' }
      }
    ]
  },
  {
    path: '/404',
    component: () => import('@/views/404'),
    hidden: true
  },
]

/**
 * 异步路由
 * 需要根据角色动态添加的路由
 */
export const asyncRoutes = [
  {
    path: '/teacherManagement',
    name: 'TeacherManagement',
    component: Layout,
    meta: { title: '教师管理', icon: 'el-icon-s-custom', roles: ['admin'] },
    redirect: '/teacherManagement/index',
    children: [
      {
        path: '/teacherManagement/index',
        name: 'TeacherManagementIndex',
        component: () => import('@/views/views/teacherManagement/index'),
        meta: { title: '教师管理', icon: 'el-icon-s-custom', roles: ['admin'] }
      }
    ]
  },
  {
    path: '/courseManagement',
    name: 'CourseManagement',
    component: Layout,
    meta: { title: '课程管理', icon: 'el-icon-notebook-2', roles: ['admin'] },
    redirect: '/courseManagement/index',
    children: [
      {
        path: '/courseManagement/index',
        name: 'CourseManagementIndex',
        component: () => import('@/views/views/courseManagement/index'),
        meta: { title: '课程管理', icon: 'el-icon-notebook-2', roles: ['admin'] }
      }
    ]
  },
  {
    path: '/studentManagement',
    name: 'StudentManagement',
    component: Layout,
    meta: { title: '学生管理', icon: 'el-icon-user', roles: ['admin'] },
    redirect: '/studentManagement/index',
    children: [
      {
        path: '/studentManagement/index',
        name: 'StudentManagementIndex',
        component: () => import('@/views/views/studentManagement/index'),
        meta: { title: '学生管理', icon: 'el-icon-user', roles: ['admin'] }
      }
    ]
  },
  {
    path: '/classManagement',
    name: 'ClassManagement',
    component: Layout,
    meta: { title: '班级管理', icon: 'el-icon-office-building', roles: ['admin'] },
    redirect: '/classManagement/index',
    children: [
      {
        path: '/classManagement/index',
        name: 'ClassManagementIndex',
        component: () => import('@/views/views/classManagement/index'),
        meta: { title: '班级管理', icon: 'el-icon-office-building', roles: ['admin'] }
      }
    ]
  },
  {
    path: '/examAudit',
    name: 'ExamAudit',
    component: Layout,
    meta: { title: '考试审核', icon: 'el-icon-document-checked', roles: ['admin'] },
    redirect: '/examAudit/index',
    children: [
      {
        path: '/examAudit/index',
        name: 'ExamAuditIndex',
        component: () => import('@/views/views/examAudit/index'),
        meta: { title: '考试审核', icon: 'el-icon-document-checked', roles: ['admin'] }
      }
    ]
  },
  {
    path: '/questionManagement',
    name: 'QuestionManagement',
    component: Layout,
    meta: { title: '题库管理', icon: 'el-icon-edit-outline', roles: ['teacher'] },
    redirect: '/teacherQuestionList',
    children: [
      {
        path: '/teacherQuestionList',
        name: 'TeacherQuestionList',
        component: () => import('@/views/views/teacherQuestionList/index'),
        meta: { title: '题库管理', icon: 'el-icon-edit-outline', roles: ['teacher'] }
      }
    ]
  },
  {
    path: '/examPaperManagement',
    name: 'ExamPaperManagement',
    component: Layout,
    meta: { title: '试卷管理', icon: 'el-icon-document', roles: ['teacher'] },
    redirect: '/examPaperManagement/index',
    children: [
      {
        path: '/examPaperManagement/index',
        name: 'ExamPaperManagementIndex',
        component: () => import('@/views/views/examPaperManagement/index'),
        meta: { title: '试卷管理', icon: 'el-icon-document', roles: ['teacher'] }
      }
    ]
  },
  {
    path: '/examManagement',
    name: 'ExamManagement',
    component: Layout,
    meta: { title: '考试管理', icon: 'el-icon-date', roles: ['teacher'] },
    redirect: '/examManagement/index',
    children: [
      {
        path: '/examManagement/index',
        name: 'ExamManagementIndex',
        component: () => import('@/views/views/examManagement/index'),
        meta: { title: '考试管理', icon: 'el-icon-date', roles: ['teacher'] }
      }
    ]
  },
  {
    path: '/examDetail',
    name: 'ExamDetail',
    component: Layout,
    meta: { title: '考试详情', icon: 'el-icon-data-line', roles: ['teacher'] },
    redirect: '/examDetail/index',
    children: [
      {
        path: '/examDetail/index',
        name: 'ExamDetailIndex',
        component: () => import('@/views/views/examDetail/index'),
        meta: { title: '考试详情', icon: 'el-icon-data-line', roles: ['teacher'] }
      }
    ]
  },
  {
    path: '/teacherStatistics',
    name: 'TeacherStatistics',
    component: Layout,
    meta: { title: '成绩统计', icon: 'el-icon-data-analysis', roles: ['teacher'] },
    redirect: '/teacherStatistics/index',
    children: [
      {
        path: '/teacherStatistics/index',
        name: 'TeacherStatisticsIndex',
        component: () => import('@/views/views/teacherStatistics/index'),
        meta: { title: '成绩统计', icon: 'el-icon-data-analysis', roles: ['teacher'] }
      }
    ]
  },
  {
    path: '/knowledgeManagement',
    name: 'KnowledgeManagement',
    component: Layout,
    meta: { title: '知识库管理', icon: 'el-icon-folder-opened', roles: ['teacher'] },
    redirect: '/knowledgeManagement/index',
    children: [
      {
        path: '/knowledgeManagement/index',
        name: 'KnowledgeManagementIndex',
        component: () => import('@/views/views/knowledgeManagement/index'),
        meta: { title: '知识库管理', icon: 'el-icon-folder-opened', roles: ['teacher'] }
      }
    ]
  }
]

/**
 * 用户端路由
 * 统一挂在用户端布局 @/layout/client 下，meta.appType 固定为 'client'，
 * 由 permission.js 按 appType 走独立的用户端鉴权流程。
 * meta.requiresAuth 控制是否需要登录后才能访问。
 */
export const clientAsyncRoutes = [
  {
    path: '/user',
    component: () => import('@/layout/client'),
    redirect: '/user/home',
    hidden: true,
    meta: { appType: 'client' },
    children: [
      {
        path: 'home',
        name: 'ClientHome',
        component: () => import('@/views/client/home'),
        meta: { title: '首页', navTitle: '首页', appType: 'client', requiresAuth: true, showInHeader: true }
      },
      {
        path: 'exams',
        name: 'ClientExams',
        component: () => import('@/views/client/exams'),
        meta: { title: '我的考试', navTitle: '我的考试', appType: 'client', requiresAuth: true, showInHeader: true }
      },
      {
        path: 'statistics',
        name: 'ClientStatistics',
        component: () => import('@/views/client/statistics'),
        meta: { title: '课程统计', navTitle: '课程统计', appType: 'client', requiresAuth: true, showInHeader: true }
      },
      {
        path: 'profile',
        name: 'ClientProfile',
        component: () => import('@/views/client/profile'),
        meta: { title: '个人中心', navTitle: '个人中心', appType: 'client', requiresAuth: true, showInHeader: true }
      },
      {
        path: 'exam/:examId',
        name: 'ClientExamTake',
        component: () => import('@/views/client/exam-take'),
        meta: { title: '在线考试', appType: 'client', requiresAuth: true, showInHeader: false }
      },
      {
        path: 'exam/:examId/result',
        name: 'ClientExamResult',
        component: () => import('@/views/client/exam-result'),
        meta: { title: '考试成绩', appType: 'client', requiresAuth: true, showInHeader: false }
      }
    ]
  }
]

const createRouter = () => new Router({
  mode: 'history',
  scrollBehavior: () => ({ y: 0 }),
  routes: [...constantRoutes, ...clientAsyncRoutes]
})

const router = createRouter()

export function resetRouter() {
  const newRouter = createRouter()
  router.matcher = newRouter.matcher // reset router
}


/**
 * 根据角色添加路由
 * @param {Array} roles - 用户角色数组
 * @returns {Array} - 符合用户角色的可访问路由数组
 */
export function addRoutesByRoles(roles) {
  // 不能用 JSON 深拷贝，会把 component 的函数丢失，导致页面渲染失败
  function cloneRoutes(routes) {
    return routes.map(route => {
      const clonedRoute = {
        ...route,
        meta: route.meta ? { ...route.meta } : undefined
      }
      if (route.children) {
        clonedRoute.children = cloneRoutes(route.children)
      }
      return clonedRoute
    })
  }
  const routePool = cloneRoutes(asyncRoutes)
  // 递归过滤子路由
  function filterChildRoutes(children) {
    if (!children) return [];
    return children.filter(child => {
      let hasAccess = false;
      // 检查当前路由是否有可访问的角色
      if (child.meta && child.meta.roles) {
        hasAccess = roles.some(role => child.meta.roles.includes(role));
      } else {
        hasAccess = true;
      }

      // 递归处理子路由
      if (child.children) {
        const filteredChildren = filterChildRoutes(child.children);
        child.children = filteredChildren;
        // 如果当前路由没有直接访问权限，但子路由有，则认为该路由可访问
        hasAccess = hasAccess || filteredChildren.length > 0;
      }
      return hasAccess;
    });
  }
  const accessedRoutes = routePool.filter(route => {
    const filteredChildren = filterChildRoutes(route.children);
    route.children = filteredChildren;
    // 如果父路由有子路由，或者父路由自身有匹配的角色，则保留该父路由
    const hasRouteAccess = filteredChildren.length > 0;
    return hasRouteAccess;
  });
  // 动态添加可访问的路由到路由实例中
  router.addRoutes(accessedRoutes);
  // 返回符合用户角色的可访问路由数组
  return accessedRoutes;
}

export default router

