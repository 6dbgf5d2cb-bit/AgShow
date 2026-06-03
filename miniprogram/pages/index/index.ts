import {
  getCurrentSession,
  getUserById,
  MemberLevelConfig,
  getFeaturedTravellogId,
  pullAdminSystemConfigAndApply
} from '../../utils/user'
import { getActiveLogs, getLogById, pullRemoteLogsAndMerge, TravelLog } from '../../utils/travellog'
import { syncAllFromCloud } from '../../utils/cloud-sync'

Page({
  data: {
    isLoggedIn: false,
    avatarUrl: '',
    displayName: '未登录',
    statusHint: '点击登录 / 进入个人中心',
    featuredLog: null as TravelLog | null,
    featuredExcerpt: '',
    featuredEmpty: true
  },

  async onLoad() {
    await this.refresh()
  },

  async onShow() {
    await this.refresh()
  },

  async refresh() {
    try {
      await syncAllFromCloud()
      await pullAdminSystemConfigAndApply()
      await pullRemoteLogsAndMerge()
    } catch {
      /* 离线沿用本地 */
    }
    this.loadUserHeader()
    this.loadFeaturedLog()
  },

  loadUserHeader() {
    const session = getCurrentSession()
    if (!session) {
      this.setData({
        isLoggedIn: false,
        avatarUrl: '',
        displayName: '未登录',
        statusHint: '点击登录 / 进入个人中心'
      })
      return
    }
    const full = getUserById(session.userId)
    const level = full?.memberLevel || session.userInfo?.memberLevel || 'normal'
    const levelName = MemberLevelConfig[level]?.name || '会员'
    this.setData({
      isLoggedIn: true,
      avatarUrl: full?.avatarUrl || session.userInfo?.avatarUrl || '',
      displayName: full?.nickname || session.userInfo?.nickname || session.userInfo?.username || '会员',
      statusHint: levelName
    })
  },

  loadFeaturedLog() {
    let featuredId = getFeaturedTravellogId()
    let log = featuredId ? getLogById(featuredId) : null
    if (!log) {
      const list = getActiveLogs()
      log = list[0] || null
    }
    if (!log) {
      this.setData({ featuredLog: null, featuredExcerpt: '', featuredEmpty: true })
      return
    }
    const plain = String(log.content || '').replace(/\s+/g, ' ').trim()
    this.setData({
      featuredLog: log,
      featuredExcerpt: plain.slice(0, 120) + (plain.length > 120 ? '…' : ''),
      featuredEmpty: false
    })
  },

  onHeaderTap() {
    const session = getCurrentSession()
    if (session) {
      wx.reLaunch({ url: '/pages/member/member' })
    } else {
      wx.navigateTo({ url: '/pages/login/login' })
    }
  },

  onFeaturedTap() {
    const log = this.data.featuredLog
    if (!log?.logId) return
    wx.navigateTo({
      url: `/pages/travellog-detail/travellog-detail?logId=${log.logId}`
    })
  },

  goTravel() {
    wx.reLaunch({ url: '/pages/travel-list/travel-list' })
  },

  goTravellog() {
    wx.reLaunch({ url: '/pages/travellog-list/travellog-list' })
  },

  goHealth() {
    wx.navigateTo({ url: '/pages/health-detection/health-detection?tab=symptom' })
  },

  goScience() {
    wx.reLaunch({ url: '/pages/science/science' })
  },

  goScienceItem(e: WechatMiniprogram.TouchEvent) {
    const type = e.currentTarget.dataset.type as string
    if (type === 'bazi') {
      wx.navigateTo({ url: '/pages/health-detection/health-detection?tab=bazi' })
      return
    }
    if (type === 'ziwei') {
      wx.navigateTo({ url: '/pages/ziwei/ziwei' })
      return
    }
    if (type === 'liuyao') {
      wx.navigateTo({ url: '/pages/liuyao/liuyao' })
      return
    }
    if (type === 'fengshui') {
      wx.navigateTo({ url: '/pages/fengshui/fengshui' })
    }
  }
})
