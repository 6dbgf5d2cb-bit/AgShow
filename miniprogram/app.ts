import { getCurrentSession, syncSessionUserToRegistry } from './utils/user'

App<IAppOption>({
  globalData: {},
  onLaunch() {
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