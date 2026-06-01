import {
  getCurrentSession,
  getUserById,
  updatePassword,
  checkModulePermission,
  requireModulePermission,
  User
} from '../../utils/user'

interface ModuleItem {
  id: string
  name: string
  icon: string
  enabled: boolean
  position: number
}

const USER_LAYOUT_KEY = 'member_user_layout_'

Page({
  data: {
    userInfo: null as any,
    modules: [] as ModuleItem[],
    showEditModal: false,
    editingModuleId: '',
    editingPosition: 0,
    totalModules: 0,
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
    showOldPassword: false,
    showNewPassword: false,
    showConfirmPassword: false,
    passwordLoading: false
  },

  onLoad() {
    this.loadUserInfo()
    this.loadUserModules()
  },

  loadUserInfo() {
    const session = getCurrentSession()
    if (session) {
      const user = getUserById(session.userId)
      this.setData({ userInfo: user })
    }
  },

  loadUserModules() {
    const session = getCurrentSession()
    if (!session) return

    const availableModules = [
      { id: 'profile', name: '个人资料', icon: '👤' },
      { id: 'travel', name: '自驾游', icon: '🚗' },
      { id: 'health', name: '健康检测', icon: '🏥' },
      { id: 'orders', name: '我的订单', icon: '🛒' },
      { id: 'points', name: '积分中心', icon: '⭐' },
      { id: 'settings', name: '设置', icon: '⚙️' }
    ]

    const userLayout = this.getUserLayout(session.userId)
    const modules: ModuleItem[] = []

    availableModules.forEach((module, index) => {
      const hasPermission = checkModulePermission(session.userId, module.id, 'view')
      if (hasPermission) {
        const layoutItem = userLayout.find((item: ModuleItem) => item.id === module.id)
        modules.push({
          ...module,
          enabled: layoutItem?.enabled ?? true,
          position: layoutItem?.position ?? index
        })
      }
    })

    modules.sort((a, b) => a.position - b.position)
    this.setData({ 
      modules,
      totalModules: modules.length
    })
  },

  getUserLayout(userId: string): ModuleItem[] {
    try {
      const data = wx.getStorageSync(USER_LAYOUT_KEY + userId)
      return data ? JSON.parse(data) : []
    } catch {
      return []
    }
  },

  saveUserLayout(userId: string, layout: ModuleItem[]) {
    wx.setStorageSync(USER_LAYOUT_KEY + userId, JSON.stringify(layout))
  },

  toggleModule(e: any) {
    const moduleId = e.currentTarget.dataset.id
    const { modules } = this.data
    
    const updatedModules = modules.map(m => 
      m.id === moduleId ? { ...m, enabled: !m.enabled } : m
    )
    
    this.setData({ modules: updatedModules })
    this.saveLayout()
  },

  startEditPosition(e: any) {
    const moduleId = e.currentTarget.dataset.id
    const module = this.data.modules.find(m => m.id === moduleId)
    
    if (module) {
      this.setData({
        showEditModal: true,
        editingModuleId: moduleId,
        editingPosition: module.position + 1
      })
    }
  },

  onPositionInput(e: any) {
    const value = parseInt(e.detail.value) || 1
    this.setData({ editingPosition: Math.max(1, Math.min(value, this.data.totalModules)) })
  },

  confirmPositionChange() {
    const { modules, editingModuleId, editingPosition } = this.data
    
    const updatedModules = modules.map(m => 
      m.id === editingModuleId ? { ...m, position: editingPosition - 1 } : m
    )
    
    const sortedModules = [...updatedModules].sort((a, b) => a.position - b.position)
    const repositionedModules = sortedModules.map((m, index) => ({ ...m, position: index }))
    
    this.setData({ 
      modules: repositionedModules,
      showEditModal: false
    })
    this.saveLayout()
  },

  closeEditModal() {
    this.setData({ showEditModal: false })
  },

  saveLayout() {
    const session = getCurrentSession()
    if (session) {
      this.saveUserLayout(session.userId, this.data.modules)
    }
  },

  goToProfileEdit() {
    const session = getCurrentSession()
    if (!session?.userId || !requireModulePermission(session.userId, 'profile', 'edit')) {
      return
    }
    wx.navigateTo({
      url: '/pages/profile-edit/profile-edit'
    })
  },

  onOldPasswordInput(e: WechatMiniprogram.Input) {
    this.setData({ oldPassword: e.detail.value })
  },

  onNewPasswordInput(e: WechatMiniprogram.Input) {
    this.setData({ newPassword: e.detail.value })
  },

  onConfirmPasswordInput(e: WechatMiniprogram.Input) {
    this.setData({ confirmPassword: e.detail.value })
  },

  toggleOldPasswordVisible() {
    this.setData({ showOldPassword: !this.data.showOldPassword })
  },

  toggleNewPasswordVisible() {
    this.setData({ showNewPassword: !this.data.showNewPassword })
  },

  toggleConfirmPasswordVisible() {
    this.setData({ showConfirmPassword: !this.data.showConfirmPassword })
  },

  async submitPasswordChange() {
    if (this.data.passwordLoading) return
    const session = getCurrentSession()
    if (!session?.userId) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      return
    }

    const oldPassword = this.data.oldPassword.trim()
    const newPassword = this.data.newPassword.trim()
    const confirmPassword = this.data.confirmPassword.trim()

    if (!oldPassword) {
      wx.showToast({ title: '请输入当前密码', icon: 'none' })
      return
    }
    if (newPassword.length < 6) {
      wx.showToast({ title: '新密码不少于6位', icon: 'none' })
      return
    }
    if (newPassword === oldPassword) {
      wx.showToast({ title: '新密码不能与旧密码相同', icon: 'none' })
      return
    }
    if (newPassword !== confirmPassword) {
      wx.showToast({ title: '两次输入的新密码不一致', icon: 'none' })
      return
    }

    if (!requireModulePermission(session.userId, 'settings', 'edit')) {
      return
    }

    this.setData({ passwordLoading: true })
    try {
      const ok = await updatePassword(session.userId, oldPassword, newPassword)
      if (!ok) {
        wx.showToast({ title: '当前密码错误', icon: 'none' })
        return
      }
      this.setData({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      wx.showToast({ title: '密码修改成功', icon: 'success' })
    } finally {
      this.setData({ passwordLoading: false })
    }
  },

  goBack() {
    wx.navigateBack()
  },

  refreshLayout() {
    this.loadUserModules()
    wx.showToast({
      title: '布局已刷新',
      icon: 'success'
    })
  },

  noop() {
    // 空函数，用于阻止事件冒泡
  }
})