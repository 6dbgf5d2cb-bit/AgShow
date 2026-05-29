import {
  getHomePageConfigs,
  getModuleConfigs,
  PermissionAction,
  HomePageConfig,
  saveHomePageConfigsToStorage,
  pullAdminSystemConfigAndApply
} from '../../utils/user'

Page({
  data: {
    configs: [] as HomePageConfig[]
  },

  async onLoad() {
    try {
      await pullAdminSystemConfigAndApply()
    } catch {
      // 离线时沿用本地
    }
    this.loadConfigs()
  },

  loadConfigs() {
    const configs = JSON.parse(JSON.stringify(getHomePageConfigs()))
    this.setData({ configs })
  },

  getModuleName(moduleId: string): string {
    const module = getModuleConfigs().find(m => m.id === moduleId)
    return module?.name || moduleId
  },

  toggleEnabled(e: any) {
    const moduleId = e.currentTarget.dataset.id
    const { configs } = this.data
    
    const updatedConfigs = configs.map(c => {
      if (c.moduleId === moduleId) {
        return { ...c, enabled: !c.enabled }
      }
      return c
    })

    this.setData({ configs: updatedConfigs })
  },

  togglePermission(e: any) {
    const moduleId = e.currentTarget.dataset.id
    const action = e.currentTarget.dataset.action as PermissionAction
    const { configs } = this.data
    
    const updatedConfigs = configs.map(c => {
      if (c.moduleId === moduleId) {
        return {
          ...c,
          permissions: {
            ...c.permissions,
            [action]: !c.permissions[action]
          }
        }
      }
      return c
    })

    this.setData({ configs: updatedConfigs })
  },

  saveConfig() {
    saveHomePageConfigsToStorage(this.data.configs)
    
    wx.showToast({
      title: '首页配置已保存',
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