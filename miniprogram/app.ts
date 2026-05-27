import { getCurrentSession, syncSessionUserToRegistry } from './utils/user'
import { API_CONFIG } from './config/api'

App<IAppOption>({
  globalData: {},
  onLaunch() {
    if (API_CONFIG.auth?.useCloudRun && wx.cloud) {
      const env = (API_CONFIG.auth.cloudEnv || '').trim()
      wx.cloud.init({
        env: env || undefined,
        traceUser: true
      })
    }

    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    syncSessionUserToRegistry()

    const session = getCurrentSession()
    if (session) {
      wx.redirectTo({
        url: '/pages/member/member'
      })
    }
  },
  onShow() {
    const session = getCurrentSession()
    const pages = getCurrentPages()
    const currentPage = pages[pages.length - 1]

    if (session && currentPage && currentPage.route === 'pages/login/login') {
      wx.redirectTo({
        url: '/pages/member/member'
      })
    }
  }
})
