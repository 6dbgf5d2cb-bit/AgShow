import {
  getAllUsers,
  getCurrentUser,
  addPoints,
  clearAllUsers,
  loginWithWeChat
} from '../../utils/user'
import { getLocalWechatOpenId, wxLoginAsync } from '../../utils/auth'

Page({
  data: {
    userCount: 0,
    adminCount: 0,
    memberCount: 0,
    todayActive: 0,
    selectedMenuItem: '',
    selectedActionItem: ''
  },

  onLoad() {
    this.loadStats()
  },

  onShow() {
    this.loadStats()
  },

  async loadStats() {
    const users = getAllUsers()
    const userCount = users.length
    const adminCount = users.filter((u) => (u.roles || []).includes('admin')).length
    const memberCount = users.filter(u => u.memberLevel !== 'normal').length
    const todayActive = Math.floor(Math.random() * 10) + 1

    this.setData({ userCount, adminCount, memberCount, todayActive })
  },

  selectMenuItem(key: string) {
    this.setData({ selectedMenuItem: key })
  },

  selectActionItem(key: string) {
    this.setData({ selectedActionItem: key })
  },

  goToUserManagement() {
    this.selectMenuItem('user-management')
    setTimeout(() => {
      wx.navigateTo({ url: '/pages/user-management/user-management' })
    }, 150)
  },

  goToRoleManagement() {
    this.selectMenuItem('role-management')
    setTimeout(() => {
      wx.navigateTo({ url: '/pages/role-management/role-management' })
    }, 150)
  },

  goToMemberLevel() {
    this.selectMenuItem('member-level')
    setTimeout(() => {
      wx.navigateTo({ url: '/pages/member-level/member-level' })
    }, 150)
  },

  goToRoleAssignment() {
    this.selectMenuItem('role-assignment')
    setTimeout(() => {
      wx.navigateTo({ url: '/pages/user-management/user-management' })
    }, 150)
  },

  goToTravelManagement() {
    this.selectMenuItem('travel-list')
    setTimeout(() => {
      wx.navigateTo({ url: '/pages/travel-list/travel-list' })
    }, 150)
  },

  goToTravelLogManagement() {
    this.selectMenuItem('travellog-list')
    setTimeout(() => {
      wx.navigateTo({ url: '/pages/travellog-list/travellog-list' })
    }, 150)
  },

  goToModuleManagement() {
    this.selectMenuItem('module-management')
    setTimeout(() => {
      wx.navigateTo({ url: '/pages/module-management/module-management' })
    }, 150)
  },

  goToHomeConfig() {
    this.selectMenuItem('home-config')
    setTimeout(() => {
      wx.navigateTo({ url: '/pages/home-config/home-config' })
    }, 150)
  },

  goToLogs() {
    this.selectMenuItem('logs')
    setTimeout(() => {
      wx.navigateTo({ url: '/pages/logs/logs' })
    }, 150)
  },

  goToMember() {
    this.selectMenuItem('')
    wx.navigateTo({ url: '/pages/member/member' })
  },

  addTestPoints() {
    this.selectActionItem('add-points')
    const currentUser = getCurrentUser()
    if (currentUser) {
      addPoints(currentUser.userId, 100)
      wx.showToast({
        title: '积分已添加',
        icon: 'success'
      })
    }
    setTimeout(() => {
      this.setData({ selectedActionItem: '' })
    }, 500)
  },

  refreshCache() {
    this.selectActionItem('refresh-cache')
    this.loadStats()
    wx.showToast({
      title: '用户列表已刷新',
      icon: 'success'
    })
    setTimeout(() => {
      this.setData({ selectedActionItem: '' })
    }, 500)
  },

  /** 管理员同机测试：登记当前微信身份到用户库，不退出管理员会话 */
  async registerWeChatUser() {
    this.selectActionItem('register-wx')
    try {
      await wxLoginAsync()
      const openId = getLocalWechatOpenId()
      await loginWithWeChat({
        wxCode: '',
        openId,
        nickname: '微信用户',
        avatarUrl: ''
      })
      this.loadStats()
    } catch (error: any) {
      wx.showToast({
        title: error.message || '登记失败',
        icon: 'none'
      })
    }
    setTimeout(() => {
      this.setData({ selectedActionItem: '' })
    }, 500)
  },

  clearTestData() {
    this.selectActionItem('clear-data')
    wx.showModal({
      title: '确认清除',
      content: '确定要清除测试数据吗？此操作不可撤销。',
      success: (res) => {
        if (res.confirm) {
          clearAllUsers()
          this.loadStats()
          wx.showToast({
            title: '数据已清除',
            icon: 'success'
          })
        }
        this.setData({ selectedActionItem: '' })
      }
    })
  }
})