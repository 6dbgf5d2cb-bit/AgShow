import {
  getHomePageConfigs,
  getModuleConfigs,
  PermissionAction,
  HomePageConfig,
  saveHomePageConfigsToStorage,
  pullAdminSystemConfigAndApply,
  persistAdminSystemConfigToCloud,
  getCurrentSession,
  guardModulePermission,
  requireModulePermission,
  getFeaturedTravellogId,
  saveFeaturedTravellogId
} from '../../utils/user'
import { getActiveLogs, pullRemoteLogsAndMerge } from '../../utils/travellog'

Page({
  data: {
    configs: [] as HomePageConfig[],
    featuredTravellogId: '',
    travellogOptions: [] as { logId: string; title: string }[],
    featuredIndex: 0
  },

  async onLoad() {
    const session = getCurrentSession()
    if (!session?.userId || !guardModulePermission(session.userId, 'system_settings', 'view')) {
      return
    }
    try {
      await pullAdminSystemConfigAndApply()
    } catch {
      // 离线时沿用本地
    }
    try {
      await pullRemoteLogsAndMerge()
    } catch {
      /* 离线 */
    }
    this.loadConfigs()
  },

  loadConfigs() {
    const configs = JSON.parse(JSON.stringify(getHomePageConfigs()))
    const logs = getActiveLogs()
    const travellogOptions = logs.map((l) => ({ logId: l.logId, title: l.title || l.logId }))
    const featuredTravellogId = getFeaturedTravellogId()
    let featuredIndex = travellogOptions.findIndex((o) => o.logId === featuredTravellogId)
    if (featuredIndex < 0) featuredIndex = 0
    this.setData({
      configs,
      travellogOptions,
      featuredTravellogId: travellogOptions[featuredIndex]?.logId || '',
      featuredIndex
    })
  },

  onFeaturedChange(e: WechatMiniprogram.PickerChange) {
    const idx = Number(e.detail.value)
    const opt = this.data.travellogOptions[idx]
    if (!opt) return
    this.setData({
      featuredIndex: idx,
      featuredTravellogId: opt.logId
    })
  },

  getModuleName(moduleId: string): string {
    const module = getModuleConfigs().find(m => m.id === moduleId)
    return module?.name || moduleId
  },

  toggleEnabled(e: any) {
    const session = getCurrentSession()
    if (!session?.userId || !requireModulePermission(session.userId, 'system_settings', 'edit')) {
      return
    }

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
    const session = getCurrentSession()
    if (!session?.userId || !requireModulePermission(session.userId, 'system_settings', 'edit')) {
      return
    }

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
    const session = getCurrentSession()
    if (!session?.userId || !requireModulePermission(session.userId, 'system_settings', 'edit')) {
      return
    }

    saveHomePageConfigsToStorage(this.data.configs)
    saveFeaturedTravellogId(this.data.featuredTravellogId)
    void persistAdminSystemConfigToCloud()

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