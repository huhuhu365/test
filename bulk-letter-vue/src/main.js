import { createApp, h } from 'vue'
import { createRouter, createWebHistory, RouterView } from 'vue-router'
import Root from './Root.vue'
import App from './App.vue'
import Users from './Users.vue'
import './style.css'

// Vue Router 使用 HTML5 History 模式，因此地址栏会显示 /home 等正常路径，
// 而不是带 # 的哈希地址。Vite 开发服务器会自动把这些路径回退到 index.html。
const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: Root,
      // Root 是所有业务页面共同的“布局/权限外壳”。子路由只负责切换内容。
      children: [
        { path: '', redirect: '/home' },
        { path: 'home', name: 'home', component: App },
        { path: 'compose', redirect: '/home' },
        { path: 'recipients', name: 'recipients', component: App },
        { path: 'preview', name: 'preview', component: App },
        { path: 'result', name: 'result', component: App },
        { path: 'users', name: 'users', component: Users },
      ],
    },
    // 捕获不存在的路径，避免用户看到空白页面。
    { path: '/:pathMatch(.*)*', redirect: '/home' },
  ],
})

// 根组件只放一个 RouterView，实际组件由上面的 routes 配置决定。
createApp({ render: () => h(RouterView) }).use(router).mount('#app')
