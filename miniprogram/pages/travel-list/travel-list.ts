import { getActiveRoutes, pullRemoteRoutesAndMerge, DifficultyConfig, canPublishRoute } from '../../utils/travel'
import { applyResolvedUrl, resolveMediaUrlMap } from '../../utils/cloud-storage'
import { getCurrentSession } from '../../utils/user'

Page({
  data: {
    routes: [] as any[],
    filteredRoutes: [] as any[],
    activeDifficulty: '',
    isRefreshing: false,
    canPublish: false
  },

  onLoad() {
    this.loadRoutes()
    this.checkPublishPermission()
  },

  onShow() {
    this.loadRoutes()
    this.checkPublishPermission()
  },

  async loadRoutes() {
    try {
      await pullRemoteRoutesAndMerge()
    } catch {
      wx.showToast({ title: '同步线路失败', icon: 'none', duration: 2000 })
    }
    const routes = getActiveRoutes()
    const mediaUrls = routes.flatMap((r) =>
      [r.coverImage, ...(r.images || [])].filter((u): u is string => !!u)
    )
    const resolved = await resolveMediaUrlMap(mediaUrls)
    const displayRoutes = routes.map((r) => ({
      ...r,
      coverImage: applyResolvedUrl(r.coverImage, resolved),
      images: (r.images || []).map((img) => applyResolvedUrl(img, resolved))
    }))
    this.setData({
      routes: displayRoutes,
      filteredRoutes: displayRoutes
    })
  },

  checkPublishPermission() {
    const session = getCurrentSession()
    if (session) {
      const result = canPublishRoute(session.userId)
      this.setData({ canPublish: result.canPublish })
    } else {
      this.setData({ canPublish: false })
    }
  },

  filterByDifficulty(difficulty: string) {
    this.setData({ activeDifficulty: difficulty })
    
    const { routes } = this.data
    if (!difficulty) {
      this.setData({ filteredRoutes: routes })
      return
    }
    
    const filtered = routes.filter(r => r.difficulty === difficulty)
    this.setData({ filteredRoutes: filtered })
  },

  async onRefresh() {
    this.setData({ isRefreshing: true })
    await this.loadRoutes()
    this.setData({ isRefreshing: false })
  },

  getDifficultyName(difficulty: string): string {
    return DifficultyConfig[difficulty as keyof typeof DifficultyConfig]?.name || difficulty
  },

  getDifficultyColor(difficulty: string): string {
    return DifficultyConfig[difficulty as keyof typeof DifficultyConfig]?.color || '#999'
  },

  goToDetail(e: any) {
    const routeId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/travel-detail/travel-detail?id=${routeId}`
    })
  },

  goToPublish() {
    const session = getCurrentSession()
    if (!session) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      wx.navigateTo({ url: '/pages/login/login' })
      return
    }

    const result = canPublishRoute(session.userId)
    if (!result.canPublish) {
      wx.showModal({
        title: '权限不足',
        content: result.message + '，是否前往升级会员？',
        confirmText: '去升级',
        success: (res) => {
          if (res.confirm) {
            wx.showToast({
              title: '请联系管理员升级',
              icon: 'none'
            })
          }
        }
      })
      return
    }

    wx.navigateTo({
      url: '/pages/travel-publish/travel-publish'
    })
  },

  goBack() {
    wx.navigateBack()
  }
})