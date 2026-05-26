import { getRolePermissionConfigs, ModuleConfigs, RoleConfig, UserRole, PermissionAction, saveRoleToConfig, removeRoleFromConfig, saveRolePermissionsToConfig, removeRolePermissionsFromConfig } from '../../utils/user'

Page({
  data: {
    roles: [] as Array<{ role: string; name: string }>,
    activeRole: 'admin' as UserRole,
    modules: ModuleConfigs,
    permissions: {} as Record<string, Record<string, Record<PermissionAction, boolean>>>,
    selectedRoles: [] as string[],
    
    showAddRoleModal: false,
    showDeleteModal: false,
    editingRole: '',
    
    newRoleKey: '',
    newRoleName: '',
    selectedPermissions: [] as string[],
    
    allPermissions: ['dashboard', 'user_management', 'role_management', 'system_settings', 'profile', 'orders', 'points', 'settings', 'browse', 'search', 'all']
  },

  onLoad() {
    this.loadRoles()
    this.loadPermissions()
  },

  onShow() {
    this.loadPermissions()
  },

  loadRoles() {
    const roles = Object.entries(RoleConfig).map(([key, value]) => ({
      role: key,
      name: value.name
    }))
    this.setData({ roles })
  },

  loadPermissions() {
    const permissions = getRolePermissionConfigs()
    this.setData({ permissions })
  },

  selectRole(e: any) {
    const role = e.currentTarget.dataset.role
    this.setData({ activeRole: role })
  },

  toggleSelectRole(e: any) {
    const role = e.currentTarget.dataset.role
    if (role === 'admin') return
    
    const selectedRoles = [...this.data.selectedRoles]
    const index = selectedRoles.indexOf(role)
    
    if (index > -1) {
      selectedRoles.splice(index, 1)
    } else {
      selectedRoles.push(role)
    }
    
    this.setData({ selectedRoles })
  },

  togglePermission(e: any) {
    const moduleId = e.currentTarget.dataset.module
    const action = e.currentTarget.dataset.action as PermissionAction
    const { permissions, activeRole } = this.data

    const newPermissions = { ...permissions }
    if (!newPermissions[activeRole]) {
      newPermissions[activeRole] = {}
    }
    if (!newPermissions[activeRole][moduleId]) {
      newPermissions[activeRole][moduleId] = { view: false, create: false, edit: false, delete: false }
    }
    newPermissions[activeRole][moduleId][action] = !newPermissions[activeRole][moduleId][action]

    this.setData({ permissions: newPermissions })
    
    saveRolePermissionsToConfig(activeRole, newPermissions[activeRole])
  },

  showAddRoleModal() {
    this.setData({
      showAddRoleModal: true,
      editingRole: '',
      newRoleKey: '',
      newRoleName: '',
      selectedPermissions: []
    })
  },

  closeAddRoleModal() {
    this.setData({ showAddRoleModal: false })
  },

  onRoleKeyInput(e: any) {
    this.setData({ newRoleKey: e.detail.value })
  },

  onRoleNameInput(e: any) {
    this.setData({ newRoleName: e.detail.value })
  },

  togglePermissionItem(e: any) {
    const permission = e.currentTarget.dataset.permission
    const selectedPermissions = [...this.data.selectedPermissions]
    const index = selectedPermissions.indexOf(permission)
    
    if (index > -1) {
      selectedPermissions.splice(index, 1)
    } else {
      selectedPermissions.push(permission)
    }
    
    this.setData({ selectedPermissions })
  },

  editRole(e: any) {
    const role = e.currentTarget.dataset.role
    const roleConfig = RoleConfig[role as UserRole]
    
    this.setData({
      showAddRoleModal: true,
      editingRole: role,
      newRoleKey: role,
      newRoleName: roleConfig.name,
      selectedPermissions: [...roleConfig.permissions]
    })
  },

  saveRole() {
    const { editingRole, newRoleKey, newRoleName, selectedPermissions, roles } = this.data
    
    if (!newRoleKey || !newRoleName) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      })
      return
    }

    if (!editingRole && roles.some(r => r.role === newRoleKey)) {
      wx.showToast({
        title: '角色标识已存在',
        icon: 'none'
      })
      return
    }

    if (editingRole) {
      saveRoleToConfig(editingRole, {
        name: newRoleName,
        permissions: selectedPermissions
      })
    } else {
      saveRoleToConfig(newRoleKey, {
        name: newRoleName,
        permissions: selectedPermissions
      })
      
      const currentPermissions = getRolePermissionConfigs()
      if (!currentPermissions[newRoleKey]) {
        const newPermissions: Record<string, Record<PermissionAction, boolean>> = {}
        ModuleConfigs.forEach(module => {
          newPermissions[module.id] = {
            view: false,
            create: false,
            edit: false,
            delete: false
          }
        })
        saveRolePermissionsToConfig(newRoleKey, newPermissions)
      }
    }

    this.loadRoles()
    this.loadPermissions()
    
    wx.showToast({
      title: editingRole ? '角色已更新' : '角色已添加',
      icon: 'success'
    })
    
    this.closeAddRoleModal()
  },

  deleteSingleRole(e: any) {
    const role = e.currentTarget.dataset.role
    
    wx.showModal({
      title: '确认删除',
      content: `确定要删除角色 "${RoleConfig[role as UserRole]?.name}" 吗？`,
      success: (res) => {
        if (res.confirm) {
          this.performDeleteRole(role)
        }
      }
    })
  },

  showDeleteConfirm() {
    this.setData({ showDeleteModal: true })
  },

  closeDeleteModal() {
    this.setData({ showDeleteModal: false })
  },

  confirmDelete() {
    const { selectedRoles } = this.data
    
    selectedRoles.forEach(role => {
      this.performDeleteRole(role)
    })
    
    this.setData({ 
      selectedRoles: [],
      showDeleteModal: false 
    })
    
    wx.showToast({
      title: `已删除 ${selectedRoles.length} 个角色`,
      icon: 'success'
    })
  },

  performDeleteRole(role: string) {
    removeRoleFromConfig(role)
    removeRolePermissionsFromConfig(role)
    
    if (this.data.activeRole === role) {
      const remainingRoles = Object.keys(RoleConfig)
      if (remainingRoles.length > 0) {
        this.setData({ activeRole: remainingRoles[0] })
      }
    }
    
    this.loadRoles()
    this.loadPermissions()
  },

  getActiveRoleName(): string {
    const role = this.data.roles.find(r => r.role === this.data.activeRole)
    return role?.name || ''
  },

  savePermissions() {
    wx.showToast({
      title: '权限配置已保存',
      icon: 'success',
      duration: 1500
    })

    setTimeout(() => {
      wx.navigateBack()
    }, 1500)
  },

  goBack() {
    wx.navigateBack()
  }
})