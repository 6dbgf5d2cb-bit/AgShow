import {
  getCurrentSession,
  logout,
  getUserById,
  syncCurrentUserFromRemote,
  MemberLevelConfig,
  AccountStatusConfig,
  RoleConfig,
  addPoints,
  checkModulePermission,
  User,
  MemberLevel
} from '../../utils/user'
import { syncAllFromCloud } from '../../utils/cloud-sync'

interface MenuItem {
  id: string
  name: string
  icon: string
  position?: number
}

interface AdminMenuItem {
  id: string
  name: string
  desc: string
  icon: string
  url: string
}

Page({
  data: {
    isLoggedIn: false,
    userInfo: null as any,
    fullUser: null as User | null,
    isAdmin: false,
    headerBgColor: '#667eea',
    avatarUrl: '',
    nickname: '未登录',
    levelColor: '#999999',
    levelName: '访客',
    username: '',
    points: 0,
    statusColor: '#52c41a',
    statusName: '未登录',
    roleNames: '',
    userId: '',
    phone: '未绑定',
    email: '未绑定',
    registerTime: '—',
    lastLoginTime: '—',
    lastLoginIp: '未知',
    privileges: [] as string[],
    menuItems: [] as MenuItem[],
    adminMenuItems: [] as AdminMenuItem[]
  },

  async loadUserInfo() {
    try {
      await syncAllFromCloud()
    } catch {
      /* 离线 */
    }
    await syncCurrentUserFromRemote()

    const session = getCurrentSession()
    if (!session) {
      this.setData({
        isLoggedIn: false,
        isAdmin: false,
        userInfo: null,
        fullUser: null,
        avatarUrl: '',
        nickname: '未登录',
        levelName: '访客',
        username: '',
        points: 0,
        statusName: '未登录',
        roleNames: '',
        userId: '',
        menuItems: [],
        adminMenuItems: []
      })
      return
    }

    const fullUser = getUserById(session.userId)
    const userInfo = session.userInfo
    const memberLevel = fullUser?.memberLevel || userInfo.memberLevel || 'normal'
    const status = fullUser?.status || userInfo.status || 'normal'
    const roles = fullUser?.roles || userInfo.roles || ['member']
    const isAdmin = roles.includes('admin')

    this.setData({
      isLoggedIn: true,
      userInfo,
      fullUser,
      isAdmin,
      headerBgColor: MemberLevelConfig[memberLevel]?.color || '#667eea',
      avatarUrl: fullUser?.avatarUrl || userInfo.avatarUrl || '',
      nickname: fullUser?.nickname || userInfo.nickname || '',
      levelColor: MemberLevelConfig[memberLevel]?.color || '#999999',
      levelName: MemberLevelConfig[memberLevel]?.name || '普通会员',
      username: fullUser?.username || userInfo.username || '',
      points: fullUser?.points ?? userInfo.points ?? 0,
      statusColor: AccountStatusConfig[status]?.color || '#52c41a',
      statusName: AccountStatusConfig[status]?.name || '正常',
      roleNames: roles.map((r) => RoleConfig[r].name).join('、'),
      userId: userInfo.userId || '',
      phone: fullUser?.phone || '未绑定',
      email: fullUser?.email || '未绑定',
      registerTime: fullUser?.registerTime ? this.formatDate(fullUser.registerTime) : '—',
      lastLoginTime: fullUser?.lastLoginTime ? this.formatDate(fullUser.lastLoginTime) : '—',
      lastLoginIp: fullUser?.lastLoginIp || '未知',
      privileges: MemberLevelConfig[memberLevel]?.privileges || [],
      adminMenuItems: isAdmin ? this.buildAdminMenu() : []
    })

    this.loadMenuItems(session.userId)
  },

  buildAdminMenu(): AdminMenuItem[] {
    return [
      { id: 'admin', name: '管理后台', desc: '数据概览与快捷操作', icon: '🔧', url: '/pages/admin/admin' },
      { id: 'users', name: '用户列表', desc: '管理所有用户', icon: '👥', url: '/pages/user-management/user-management' },
      { id: 'roles', name: '角色权限', desc: '配置角色权限', icon: '🛡️', url: '/pages/role-management/role-management' },
      { id: 'modules', name: '模块管理', desc: '系统模块开关', icon: '📦', url: '/pages/module-management/module-management' },
      { id: 'home', name: '首页配置', desc: '首页模块与精选旅行记', icon: '🏠', url: '/pages/home-config/home-config' },
      { id: 'travel', name: '自驾游管理', desc: '线路内容', icon: '🚗', url: '/pages/travel-list/travel-list' },
      { id: 'log', name: '旅行记管理', desc: '游记内容', icon: '📝', url: '/pages/travellog-list/travellog-list' },
      { id: 'logs', name: '操作日志', desc: '系统日志', icon: '📋', url: '/pages/logs/logs' }
    ]
  },

  loadMenuItems(userId: string) {
    const defaultItems: MenuItem[] = [
      { id: 'profile', name: '个人资料', icon: '👤' },
      { id: 'orders', name: '我的订单', icon: '🛒' },
      { id: 'points', name: '积分中心', icon: '⭐' },
      { id: 'settings', name: '设置', icon: '⚙️' }
    ]

    const userLayout = this.getUserLayout(userId)
    const menuItems: MenuItem[] = []

    defaultItems.forEach((item) => {
      if (checkModulePermission(userId, item.id, 'view')) {
        const layoutItem = userLayout.find((li: { id: string }) => li.id === item.id)
        if (!layoutItem || layoutItem.enabled !== false) {
          menuItems.push({
            ...item,
            position: layoutItem?.position ?? menuItems.length
          })
        }
      }
    })

    menuItems.sort((a, b) => (a.position || 0) - (b.position || 0))
    this.setData({ menuItems })
  },

  getUserLayout(userId: string): { id: string; enabled?: boolean; position?: number }[] {
    try {
      const data = wx.getStorageSync('member_user_layout_' + userId)
      return data ? JSON.parse(data) : []
    } catch {
      return []
    }
  },

  goLogin() {
    wx.navigateTo({ url: '/pages/login/login' })
  },

  goRegister() {
    wx.navigateTo({ url: '/pages/register/register' })
  },

  goHome() {
    wx.reLaunch({ url: '/pages/index/index' })
  },

  onAdminItemTap(e: WechatMiniprogram.TouchEvent) {
    const url = e.currentTarget.dataset.url as string
    if (url) wx.navigateTo({ url })
  },

  onLogout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          logout()
          void this.loadUserInfo()
        }
      }
    })
  },

  handleMenuClick(e: WechatMiniprogram.TouchEvent) {
    const menuId = e.currentTarget.dataset.id as string
    const menuMap: Record<string, () => void> = {
      profile: () => wx.navigateTo({ url: '/pages/profile-edit/profile-edit' }),
      orders: () => wx.showToast({ title: '订单管理功能开发中', icon: 'none' }),
      points: () => wx.showToast({ title: '积分商城功能开发中', icon: 'none' }),
      settings: () => wx.navigateTo({ url: '/pages/settings/settings' })
    }
    const handler = menuMap[menuId]
    if (handler) handler()
  },

  async addTestPoints() {
    if (!this.data.isAdmin || !this.data.userInfo?.userId) return
    const newPoints = addPoints(this.data.userInfo.userId, 100)
    if (newPoints > 0) {
      void this.loadUserInfo()
      wx.showToast({ title: `已添加100积分，当前: ${newPoints}`, icon: 'success' })
    }
  },

  formatDate(timestamp: number): string {
    if (!timestamp) return '—'
    const date = new Date(timestamp)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  },

  onLoad() {
    void this.loadUserInfo()
  },

  onShow() {
    void this.loadUserInfo()
  }
})
