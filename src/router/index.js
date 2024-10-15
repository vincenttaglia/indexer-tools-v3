// Composables
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('@/layouts/default/Default.vue'),
    children: [
      {
        path: '',
        name: 'Home',
        // route level code-splitting
        // this generates a separate chunk (about.[hash].js) for this route
        // which is lazy-loaded when the route is visited.
        component: () => import(/* webpackChunkName: "home" */ '@/views/SubgraphsDashboard.vue'),
      },
      {
        path: 'allocations',
        name: 'Allocations Dashboard',
        component: () => import('@/views/AllocationsDashboard.vue'),
      },
      {
        path: 'wizard',
        name: 'Allocation Wizard',
        component: () => import('@/views/AllocationWizard.vue'),
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/Settings.vue'),
      },
      {
        path: 'actions-manager',
        name: 'Actions Manager',
        component: () => import('@/views/ActionQueueManager.vue'),
      },
      {
        path: 'offchain-manager',
        name: 'Offchain Sync Manager',
        component: () => import('@/views/OffchainSyncManager.vue'),
      },
      {
        path: 'query-dashboard',
        name: 'Query Fee Dashboard',
        component: () => import('@/views/QueryDashboard.vue'),
      }
    ],
  },
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
})

export default router
