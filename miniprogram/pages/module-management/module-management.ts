import {
  getModuleConfigs,
  PermissionAction,
  ModuleConfig,
  saveModuleConfigsToStorage,
  pullAdminSystemConfigAndApply
} from '../../utils/user'

Page({
  data: {
    modules: [] as ModuleConfig[]
  },

  async onLoad() {
    try {
      await pullAdminSystemConfigAndApply()
    } catch {
      // 离线时沿用本地
    }
    this.loadModules()
  },

  loadModules() {
    const modules = JSON.parse(JSON.stringify(getModuleConfigs()))
    this.setData({ modules })
  },

  toggleModule(e: any) {
    const moduleId = e.currentTarget.dataset.id
    const { modules } = this.data
    
    const updatedModules = modules.map(m => {
      if (m.id === moduleId) {
        return { ...m, enabled: !m.enabled }
      }
      return m
    })

    this.setData({ modules: updatedModules })
  },

  togglePermission(e: any) {
    const moduleId = e.currentTarget.dataset.id
    const action = e.currentTarget.dataset.action as PermissionAction
    const { modules } = this.data
    
    const updatedModules = modules.map(m => {
      if (m.id === moduleId) {
        return {
          ...m,
          permissions: {
            ...m.permissions,
            [action]: !m.permissions[action]
          }
        }
      }
      return m
    })

    this.setData({ modules: updatedModules })
  },

  saveModules() {
    saveModuleConfigsToStorage(this.data.modules)
    
    wx.showToast({
      title: '模块配置已保存',
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