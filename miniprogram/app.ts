import {
  getCurrentSession,
  syncSessionUserToRegistry,
  repairDefaultMemberPermissions,
  syncCurrentUserFromRemote
} from './utils/user'
import { getRequiredCloudEnvId, isCloudRunEnabled } from './utils/cloud-request'

App<IAppOption>({
  globalData: {},
  onLaunch() {
    if (isCloudRunEnabled() && wx.cloud) {
      try {
        const envId = getRequiredCloudEnvId()
        wx.cloud.init({
          env: envId,
          traceUser: true
        })
      } catch (e) {
        console.error('[cloud]', (e as Error).message)
      }
    }

    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    repairDefaultMemberPermissions()
    syncSessionUserToRegistry()
    void syncCurrentUserFromRemote()

    const session = getCurrentSession()
    if (session) {
      wx.redirectTo({
        url: '/pages/member/member'
      })
    }
  },
  onShow() {
    void syncCurrentUserFromRemote()
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
