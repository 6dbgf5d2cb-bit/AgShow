import { getCurrentSession, logout, getUserById, MemberLevelConfig, AccountStatusConfig, RoleConfig, addPoints, checkModulePermission, User, MemberLevel, UserRole } from '../../utils/user'

interface MenuItem {
  id: string
  name: string
  icon: string
}

Page({
  data: {
    userInfo: null as any,
    fullUser: null as User | null,
    isAdmin: false,
    
    headerBgColor: '#667eea',
    avatarUrl: '',
    nickname: '',
    levelColor: '#999999',
    levelName: '普通会员',
    username: '',
    points: 0,
    statusColor: '#52c41a',
    statusName: '正常',
    roleNames: '会员',
    userId: '',
    phone: '未绑定',
    email: '未绑定',
    registerTime: '未登录',
    lastLoginTime: '未登录',
    lastLoginIp: '未知',
    privileges: [] as string[],
    menuItems: [] as MenuItem[]
  },

  async loadUserInfo() {
    const session = getCurrentSession()
    
    if (!session) {
      wx.redirectTo({
        url: '/pages/login/login'
      })
      return
    }

    const userInfo = session.userInfo
    const fullUser = getUserById(session.userId)
    
    const memberLevel = userInfo.memberLevel || 'normal'
    const status = userInfo.status || 'normal'
    const roles = userInfo.roles || ['member']

    this.setData({
      userInfo: userInfo,
      fullUser: fullUser,
      isAdmin: roles.includes('admin'),
      headerBgColor: MemberLevelConfig[memberLevel]?.color || '#667eea',
      avatarUrl: userInfo.avatarUrl || '',
      nickname: userInfo.nickname || '',
      levelColor: MemberLevelConfig[memberLevel]?.color || '#999999',
      levelName: MemberLevelConfig[memberLevel]?.name || '普通会员',
      username: userInfo.username || '',
      points: userInfo.points || 0,
      statusColor: AccountStatusConfig[status]?.color || '#52c41a',
      statusName: AccountStatusConfig[status]?.name || '正常',
      roleNames: roles.map(r => RoleConfig[r].name).join('、'),
      userId: userInfo.userId || '',
      phone: fullUser?.phone || '未绑定',
      email: fullUser?.email || '未绑定',
      registerTime: fullUser?.registerTime ? this.formatDate(fullUser.registerTime) : '未登录',
      lastLoginTime: fullUser?.lastLoginTime ? this.formatDate(fullUser.lastLoginTime) : '未登录',
      lastLoginIp: fullUser?.lastLoginIp || '未知',
      privileges: MemberLevelConfig[memberLevel]?.privileges || []
    })

    this.loadMenuItems(session.userId)
  },

  loadMenuItems(userId: string) {
    const defaultItems: MenuItem[] = [
      { id: 'profile', name: '个人资料', icon: '👤' },
      { id: 'travel', name: '自驾游', icon: '🚗' },
      { id: 'travellog', name: '旅行记', icon: '📝' },
      { id: 'health', name: '健康检测', icon: '🏥' },
      { id: 'orders', name: '我的订单', icon: '🛒' },
      { id: 'points', name: '积分中心', icon: '⭐' },
      { id: 'settings', name: '设置', icon: '⚙️' }
    ]

    const userLayout = this.getUserLayout(userId)
    const menuItems: MenuItem[] = []

    defaultItems.forEach(item => {
      if (checkModulePermission(userId, item.id, 'view')) {
        const layoutItem = userLayout.find((li: any) => li.id === item.id)
        if (!layoutItem || layoutItem.enabled !== false) {
          menuItems.push({
            ...item,
            position: layoutItem?.position ?? menuItems.length
          })
        }
      }
    })

    menuItems.sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
    
    this.setData({ menuItems })
  },

  getUserLayout(userId: string): any[] {
    try {
      const data = wx.getStorageSync('member_user_layout_' + userId)
      return data ? JSON.parse(data) : []
    } catch {
      return []
    }
  },

  onLogout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          logout()
          wx.redirectTo({
            url: '/pages/login/login'
          })
        }
      }
    })
  },

  handleMenuClick(e: any) {
    const menuId = e.currentTarget.dataset.id
    const menuMap: Record<string, () => void> = {
      profile: this.goToProfile.bind(this),
      travel: this.goToTravel.bind(this),
      travellog: this.goToTravelLog.bind(this),
      health: this.goToHealth.bind(this),
      orders: this.goToOrders.bind(this),
      points: this.goToPoints.bind(this),
      settings: this.goToSettings.bind(this)
    }
    
    const handler = menuMap[menuId]
    if (handler) {
      handler()
    }
  },

  goToProfile() {
    wx.navigateTo({
      url: '/pages/profile-edit/profile-edit'
    })
  },

  goToTravel() {
    if (!this.checkPermission('travel')) {
      wx.showToast({
        title: '您没有权限访问此功能',
        icon: 'none'
      })
      return
    }
    wx.navigateTo({
      url: '/pages/travel-list/travel-list'
    })
  },

  goToTravelLog() {
    if (!this.checkPermission('travellog')) {
      wx.showToast({
        title: '您没有权限访问此功能',
        icon: 'none'
      })
      return
    }
    wx.navigateTo({
      url: '/pages/travellog-list/travellog-list'
    })
  },

  goToHealth() {
    if (!this.checkPermission('health')) {
      wx.showToast({
        title: '您没有权限访问此功能',
        icon: 'none'
      })
      return
    }
    wx.navigateTo({
      url: '/pages/health-detection/health-detection'
    })
  },

  goToOrders() {
    if (!this.checkPermission('orders')) {
      wx.showToast({
        title: '您没有权限访问此功能',
        icon: 'none'
      })
      return
    }
    wx.showToast({
      title: '订单管理功能开发中',
      icon: 'none'
    })
  },

  goToPoints() {
    if (!this.checkPermission('points')) {
      wx.showToast({
        title: '您没有权限访问此功能',
        icon: 'none'
      })
      return
    }
    wx.showToast({
      title: '积分商城功能开发中',
      icon: 'none'
    })
  },

  goToSettings() {
    if (!this.checkPermission('settings')) {
      wx.showToast({
        title: '您没有权限访问此功能',
        icon: 'none'
      })
      return
    }
    wx.navigateTo({
      url: '/pages/settings/settings'
    })
  },

  goToAdmin() {
    if (!this.data.isAdmin) {
      wx.showToast({
        title: '您不是管理员',
        icon: 'none'
      })
      return
    }
    wx.navigateTo({
      url: '/pages/admin/admin'
    })
  },

  checkPermission(moduleId: string): boolean {
    const userId = this.data.userInfo?.userId
    if (!userId) return false
    return checkModulePermission(userId, moduleId, 'view')
  },

  async addTestPoints() {
    if (!this.data.isAdmin || !this.data.userInfo?.userId) return

    const newPoints = addPoints(this.data.userInfo.userId, 100)
    
    if (newPoints > 0) {
      this.loadUserInfo()
      wx.showToast({
        title: `已添加100积分，当前积分: ${newPoints}`,
        icon: 'success'
      })
    }
  },

  formatDate(timestamp: number): string {
    if (!timestamp) return '未登录'
    const date = new Date(timestamp)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  },

  onLoad() {
    this.loadUserInfo()
  },

  onShow() {
    this.loadUserInfo()
  }
})