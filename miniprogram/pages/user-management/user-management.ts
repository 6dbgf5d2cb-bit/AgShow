import {
  getAllUsers,
  pullRemoteUsersAndMerge,
  isUserApiEnabled,
  deleteUsers,
  setUserRoles,
  batchUpdateRole,
  batchUpdateMemberLevel,
  batchAddUsers,
  MemberLevelConfig,
  AccountStatusConfig,
  RoleConfig,
  MemberLevel,
  UserRole,
  User
} from '../../utils/user'

type UserListItem = User & {
  levelName: string
  levelColor: string
  roleNames: string
}

Page({
  data: {
    users: [] as User[],
    filteredUsers: [] as UserListItem[],
    selectedUsers: [] as string[],
    filterLevel: '',
    showDeleteModal: false,
    showRoleModal: false,
    showLevelModal: false,
    showBatchAddModal: false,
    showSingleUserRoleModal: false,
    selectedRole: '',
    roleAction: 'add' as 'add' | 'remove',
    selectedLevel: '',
    currentUserId: '',
    currentUserName: '',
    currentUserRoles: [] as string[],
    batchUsernames: '',
    batchPhones: '',
    levelOptions: [
      { value: 'normal', label: '普通会员', color: '#999999' },
      { value: 'gold', label: '金牌会员', color: '#FFD700' },
      { value: 'vip', label: '贵宾会员', color: '#FF6B6B' },
      { value: 'premium', label: 'VIP会员', color: '#9B59B6' }
    ],
    roleOptions: [] as Array<{ value: string; label: string }>,
    totalUserCount: 0,
    cloudSyncEnabled: false,
    loadingUsers: false
  },

  onLoad() {
    this.setData({ cloudSyncEnabled: isUserApiEnabled() })
    this.loadRoleOptions()
    this.loadUsers()
  },

  onShow() {
    this.loadUsers(false)
  },

  onPullDownRefresh() {
    this.loadUsers(true)
    wx.stopPullDownRefresh()
  },

  toDisplayUser(user: User): UserListItem {
    const level = (user.memberLevel || 'normal') as MemberLevel
    return {
      userId: user.userId,
      username: user.username,
      phone: user.phone,
      email: user.email || '',
      realName: user.realName || '',
      idCardEncrypted: user.idCardEncrypted || '',
      passwordSalt: user.passwordSalt,
      passwordHash: user.passwordHash,
      status: user.status,
      registerIp: user.registerIp,
      lastLoginIp: user.lastLoginIp,
      lastLoginTime: user.lastLoginTime,
      loginFailCount: user.loginFailCount,
      lockTime: user.lockTime,
      registerTime: user.registerTime,
      lastPasswordChangeTime: user.lastPasswordChangeTime,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      gender: user.gender,
      birthday: user.birthday,
      region: user.region,
      timezone: user.timezone,
      language: user.language,
      memberLevel: user.memberLevel,
      points: user.points,
      wechatOpenId: user.wechatOpenId,
      roles: user.roles,
      levelName: MemberLevelConfig[level]?.name || '普通会员',
      levelColor: MemberLevelConfig[level]?.color || '#999999',
      roleNames: this.formatRoleNames(user.roles)
    }
  },

  formatRoleNames(roles: UserRole[]): string {
    if (!roles || !Array.isArray(roles) || roles.length === 0) {
      return '会员'
    }
    return roles.map((r) => RoleConfig[r]?.name || r).join(', ')
  },

  loadRoleOptions() {
    const roleOptions = Object.entries(RoleConfig).map(([key, value]) => ({
      value: key,
      label: value.name
    }))
    this.setData({ roleOptions })
  },

  async loadUsers(pullRemote = true) {
    this.setData({ loadingUsers: true })
    let users = getAllUsers()

    if (pullRemote && isUserApiEnabled()) {
      try {
        users = await pullRemoteUsersAndMerge()
      } catch (error: any) {
        wx.showToast({
          title: error.message || '云端用户拉取失败',
          icon: 'none',
          duration: 2500
        })
      }
    }

    const displayList = users.map((u) => this.toDisplayUser(u))
    this.setData({
      users,
      totalUserCount: users.length,
      filterLevel: '',
      filteredUsers: displayList,
      loadingUsers: false,
      cloudSyncEnabled: isUserApiEnabled()
    })
  },

  setFilterLevel(e: WechatMiniprogram.TouchEvent) {
    const level = e.currentTarget.dataset.level ?? ''
    this.setData({ filterLevel: level })
    this.filterUsers()
  },

  filterUsers() {
    const { users, filterLevel } = this.data
    const list = filterLevel
      ? users.filter((u) => u.memberLevel === filterLevel)
      : users
    this.setData({
      filteredUsers: list.map((u) => this.toDisplayUser(u))
    })
  },

  toggleSelectAll() {
    const { filteredUsers, selectedUsers } = this.data
    const allIds = filteredUsers.map(u => u.userId)
    
    if (selectedUsers.length === allIds.length) {
      this.setData({ selectedUsers: [] })
    } else {
      this.setData({ selectedUsers: [...allIds] })
    }
  },

  toggleSelectUser(e: any) {
    const userId = e.currentTarget.dataset.id
    const { selectedUsers } = this.data
    
    if (selectedUsers.includes(userId)) {
      this.setData({
        selectedUsers: selectedUsers.filter(id => id !== userId)
      })
    } else {
      this.setData({
        selectedUsers: [...selectedUsers, userId]
      })
    }
  },

  isSelected(userId: string): boolean {
    return this.data.selectedUsers.includes(userId)
  },

  get allSelected(): boolean {
    const { filteredUsers, selectedUsers } = this.data
    return filteredUsers.length > 0 && selectedUsers.length === filteredUsers.length
  },

  getLevelName(level: MemberLevel): string {
    return MemberLevelConfig[level]?.name || '普通会员'
  },

  getLevelColor(level: MemberLevel): string {
    return MemberLevelConfig[level]?.color || '#999999'
  },

  getStatusName(status: string): string {
    return AccountStatusConfig[status as keyof typeof AccountStatusConfig]?.name || status
  },

  getStatusColor(status: string): string {
    return AccountStatusConfig[status as keyof typeof AccountStatusConfig]?.color || '#999'
  },

  getRoleNames(roles: UserRole[]): string {
    if (!roles || !Array.isArray(roles) || roles.length === 0) {
      return '会员'
    }
    return roles.map((r) => RoleConfig[r]?.name || r).join(', ')
  },

  showDeleteConfirm() {
    this.setData({ showDeleteModal: true })
  },

  closeDeleteModal() {
    this.setData({ showDeleteModal: false })
  },

  async confirmDelete() {
    const { selectedUsers } = this.data

    try {
      const deletedCount = await deleteUsers(selectedUsers)
      if (deletedCount === 0) {
        wx.showToast({ title: '未删除任何用户', icon: 'none' })
        return
      }
      wx.showToast({
        title: `删除成功，共删除 ${deletedCount} 个用户`,
        icon: 'success',
        duration: 1500
      })
      this.setData({
        showDeleteModal: false,
        selectedUsers: []
      })
      this.loadUsers(false)
    } catch (e) {
      console.error('[user-management] delete failed', e)
      wx.showToast({
        title: '删除失败',
        icon: 'none',
        duration: 2500
      })
      this.loadUsers(false)
    }
  },

  showRoleModal() {
    this.loadRoleOptions()
    this.setData({
      showRoleModal: true,
      selectedRole: '',
      roleAction: 'add'
    })
  },

  closeRoleModal() {
    this.setData({ showRoleModal: false })
  },

  selectRole(e: any) {
    this.setData({ selectedRole: e.currentTarget.dataset.value })
  },

  setRoleAction(e: WechatMiniprogram.TouchEvent) {
    const action = e.currentTarget.dataset.action as 'add' | 'remove'
    if (action === 'add' || action === 'remove') {
      this.setData({ roleAction: action })
    }
  },

  async confirmRoleChange() {
    const { selectedUsers, selectedRole, roleAction } = this.data

    if (!selectedRole) {
      wx.showToast({ title: '请选择角色', icon: 'none' })
      return
    }

    try {
      const updatedCount = await batchUpdateRole(
        selectedUsers,
        selectedRole as UserRole,
        roleAction === 'add'
      )
      if (updatedCount === 0) {
        wx.showToast({ title: '没有用户被修改', icon: 'none' })
        return
      }
      wx.showToast({
        title: `${roleAction === 'add' ? '添加' : '移除'}成功，共修改 ${updatedCount} 个用户`,
        icon: 'success',
        duration: 1500
      })
      this.setData({
        showRoleModal: false,
        selectedUsers: []
      })
      this.loadUsers(false)
    } catch (e) {
      console.error('[user-management] role change failed', e)
      wx.showToast({ title: '角色修改失败', icon: 'none' })
    }
  },

  showLevelModal() {
    this.setData({
      showLevelModal: true,
      selectedLevel: ''
    })
  },

  closeLevelModal() {
    this.setData({ showLevelModal: false })
  },

  showSingleUserRoleModal(e: any) {
    const userId = e.currentTarget.dataset.id
    const userName = e.currentTarget.dataset.name
    const user = this.data.users.find(u => u.userId === userId)
    
    this.loadRoleOptions()
    
    this.setData({
      showSingleUserRoleModal: true,
      currentUserId: userId,
      currentUserName: userName,
      currentUserRoles: user?.roles || []
    })
  },

  closeSingleUserRoleModal() {
    this.setData({ showSingleUserRoleModal: false })
  },

  toggleUserRole(e: any) {
    const role = e.currentTarget.dataset.role as UserRole
    const { currentUserRoles } = this.data
    
    if (currentUserRoles.includes(role)) {
      if (currentUserRoles.length > 1) {
        this.setData({
          currentUserRoles: currentUserRoles.filter(r => r !== role)
        })
      } else {
        wx.showToast({
          title: '至少保留一个角色',
          icon: 'none'
        })
      }
    } else {
      this.setData({
        currentUserRoles: [...currentUserRoles, role]
      })
    }
  },

  async confirmSingleUserRoleChange() {
    const { currentUserId, currentUserRoles } = this.data

    try {
      const saved = await setUserRoles(currentUserId, currentUserRoles as UserRole[])
      if (!saved) {
        wx.showToast({ title: '用户不存在', icon: 'none' })
        return
      }

      wx.showToast({
        title: '角色授权成功',
        icon: 'success',
        duration: 1500
      })

      this.setData({
        showSingleUserRoleModal: false
      })

      this.loadUsers(false)
    } catch (e) {
      console.error('[user-management] single role change failed', e)
      wx.showToast({ title: '角色授权失败', icon: 'none' })
    }
  },

  selectLevel(e: any) {
    this.setData({ selectedLevel: e.currentTarget.dataset.value })
  },

  async confirmLevelChange() {
    const { selectedUsers, selectedLevel } = this.data

    if (!selectedLevel) {
      wx.showToast({ title: '请选择等级', icon: 'none' })
      return
    }

    try {
      const updatedCount = await batchUpdateMemberLevel(selectedUsers, selectedLevel as MemberLevel)
      if (updatedCount === 0) {
        wx.showToast({ title: '没有用户被修改', icon: 'none' })
        return
      }
      wx.showToast({
        title: `等级修改成功，共修改 ${updatedCount} 个用户`,
        icon: 'success',
        duration: 1500
      })
      this.setData({
        showLevelModal: false,
        selectedUsers: []
      })
      this.loadUsers(false)
    } catch (e) {
      console.error('[user-management] level change failed', e)
      wx.showToast({ title: '等级修改失败', icon: 'none' })
    }
  },

  showBatchAddModal() {
    this.setData({
      showBatchAddModal: true,
      batchUsernames: '',
      batchPhones: ''
    })
  },

  closeBatchAddModal() {
    this.setData({ showBatchAddModal: false })
  },

  onBatchUsernamesInput(e: any) {
    this.setData({ batchUsernames: e.detail.value })
  },

  onBatchPhonesInput(e: any) {
    this.setData({ batchPhones: e.detail.value })
  },

  confirmBatchAdd() {
    const { batchUsernames, batchPhones } = this.data
    
    if (!batchUsernames.trim()) {
      wx.showToast({ title: '请输入用户名', icon: 'none' })
      return
    }

    const usernames = batchUsernames.trim().split('\n').filter(name => name.trim())
    const phones = batchPhones.trim().split('\n').filter(phone => phone.trim())
    
    const newUsers = usernames.map((username, index) => ({
      username: username.trim(),
      phone: phones[index] || '',
      email: '',
      realName: '',
      idCardEncrypted: '',
      status: 'normal' as const,
      registerIp: '192.168.1.1',
      lastLoginIp: '',
      lastLoginTime: 0,
      loginFailCount: 0,
      lockTime: 0,
      nickname: username.trim(),
      avatarUrl: 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0',
      gender: 'other' as const,
      birthday: '',
      region: '',
      timezone: 'Asia/Shanghai',
      language: 'zh-CN',
      memberLevel: 'normal' as MemberLevel,
      points: 0,
      roles: ['member'] as UserRole[]
    }))

    const createdUsers = batchAddUsers(newUsers)
    
    wx.showToast({
      title: `添加成功，共添加 ${createdUsers.length} 个用户`,
      icon: 'success',
      duration: 1500
    })

    this.setData({
      showBatchAddModal: false,
      batchUsernames: '',
      batchPhones: ''
    })
    
    this.loadUsers()
  },

  goBack() {
    wx.navigateBack()
  },

  goToRoleManagement() {
    wx.navigateTo({
      url: '/pages/role-management/role-management'
    })
  },

  goToModuleManagement() {
    wx.navigateTo({
      url: '/pages/module-management/module-management'
    })
  },

  goToHomeConfig() {
    wx.navigateTo({
      url: '/pages/home-config/home-config'
    })
  },

  noop() {
    // 空函数，用于阻止事件冒泡
  }
})