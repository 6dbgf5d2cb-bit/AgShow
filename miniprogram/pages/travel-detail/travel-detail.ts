import { getRouteById, pullRemoteRoutesAndMerge, getPublisherInfo, incrementViewCount, canViewPhone, makePhoneCall, deleteRoute, signUpRoute, isUserSignedUp, DifficultyConfig, RouteParticipant } from '../../utils/travel'
import { applyResolvedUrl, resolveMediaUrlMap } from '../../utils/cloud-storage'
import { getCurrentSession, getUserById, MemberLevelConfig, MemberLevel, checkModulePermission } from '../../utils/user'

Page({
  data: {
    routeId: '',
    route: null as any,
    publisherInfo: null as any,
    canViewPhone: false,
    difficultyName: '',
    difficultyColor: '',
    publisherLevelName: '',
    publisherLevelColor: '',
    publishTime: '',
    isPublisher: false,
    isAdmin: false,
    participants: [] as RouteParticipant[],
    participantCount: 0,
    isSignedUp: false,
    isFull: false,
    hasSession: false,
    galleryImages: [] as string[],
    previewUrls: [] as string[]
  },

  onLoad(options: any) {
    if (options.id) {
      this.setData({ routeId: options.id })
      this.checkPermissionAndLoad()
    }
  },

  checkPermissionAndLoad() {
    const session = getCurrentSession()
    if (!session) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }

    const hasPermission = checkModulePermission(session.userId, 'travel', 'view')
    if (!hasPermission) {
      wx.showToast({
        title: '您没有权限访问此功能',
        icon: 'none'
      })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }

    this.loadRouteDetail()
  },

  async loadRouteDetail() {
    try {
      await pullRemoteRoutesAndMerge()
    } catch {
      // 离线时仍可读本地缓存
    }
    const route = getRouteById(this.data.routeId)
    if (!route) {
      wx.showToast({
        title: '线路不存在',
        icon: 'none'
      })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }

    incrementViewCount(this.data.routeId)

    const publisherInfo = getPublisherInfo(route.publisherId)
    
    const session = getCurrentSession()
    const canView = session ? canViewPhone(session.userId) : false

    const currentUser = session ? getUserById(session.userId) : null
    const isPublisher = currentUser ? route.publisherId === currentUser.userId : false
    const isAdmin = currentUser ? currentUser.roles.includes('admin') : false
    const isSignedUp = session ? isUserSignedUp(route.routeId, session.userId) : false
    const participants = route.participants || []
    const participantCount = participants.length
    const isFull = participantCount >= (route.maxParticipants || 10)

    const rawGallery = (route.images || []).filter((url: string) => !!url)
    const mediaUrls = [route.coverImage, ...rawGallery].filter((u): u is string => !!u)
    const resolved = await resolveMediaUrlMap(mediaUrls)
    const coverImage = applyResolvedUrl(route.coverImage, resolved)
    const galleryImages = rawGallery.map((url) => applyResolvedUrl(url, resolved))
    const previewUrls: string[] = []
    if (coverImage) previewUrls.push(coverImage)
    galleryImages.forEach((url: string) => {
      if (!previewUrls.includes(url)) previewUrls.push(url)
    })

    this.setData({
      route: { ...route, coverImage, images: galleryImages },
      galleryImages,
      previewUrls,
      publisherInfo: publisherInfo || { nickname: '未知用户', avatarUrl: '', memberLevel: 'normal', phone: '' },
      canViewPhone: canView,
      difficultyName: DifficultyConfig[route.difficulty]?.name || route.difficulty,
      difficultyColor: DifficultyConfig[route.difficulty]?.color || '#999',
      publisherLevelName: MemberLevelConfig[publisherInfo?.memberLevel as MemberLevel]?.name || '普通会员',
      publisherLevelColor: MemberLevelConfig[publisherInfo?.memberLevel as MemberLevel]?.color || '#999',
      publishTime: this.formatDate(route.publishTime),
      isPublisher,
      isAdmin,
      participants,
      participantCount,
      isSignedUp,
      isFull,
      hasSession: !!session
    })
  },

  editRoute() {
    wx.navigateTo({
      url: `/pages/travel-publish/travel-publish?id=${this.data.routeId}`
    })
  },

  deleteRoute() {
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条线路吗？删除后无法恢复。',
      confirmColor: '#ff4d4f',
      success: async (res) => {
        if (res.confirm) {
          const success = await deleteRoute(this.data.routeId, {
            fromAdmin: !!this.data.isAdmin
          })
          if (success) {
            wx.showToast({
              title: '删除成功',
              icon: 'success'
            })
            setTimeout(() => {
              wx.navigateBack()
            }, 1500)
          } else {
            wx.showToast({
              title: '删除失败',
              icon: 'none'
            })
          }
        }
      }
    })
  },

  formatDate(timestamp: number): string {
    if (!timestamp) return '未知'
    const date = new Date(timestamp)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  },

  getSeasonName(season: string): string {
    const seasonMap: Record<string, string> = {
      spring: '春季',
      summer: '夏季',
      autumn: '秋季',
      winter: '冬季'
    }
    return seasonMap[season] || season
  },

  makePhoneCall() {
    if (this.data.publisherInfo?.phone) {
      makePhoneCall(this.data.publisherInfo.phone)
    }
  },

  showUpgradeTip() {
    wx.showModal({
      title: '升级会员',
      content: '升级为金牌会员及以上即可查看发布者电话，是否联系管理员升级？',
      confirmText: '联系管理员',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({
            title: '请联系管理员升级',
            icon: 'none'
          })
        }
      }
    })
  },

  viewPublisherProfile() {
    wx.showToast({
      title: '用户主页开发中',
      icon: 'none'
    })
  },

  async signUp() {
    const session = getCurrentSession()
    if (!session) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }

    const result = await signUpRoute(this.data.routeId, session.userId)
    
    if (result.success) {
      wx.showToast({
        title: result.message,
        icon: 'success'
      })
      this.loadRouteDetail()
    } else {
      wx.showToast({
        title: result.message,
        icon: 'none'
      })
    }
  },

  callParticipant(e: any) {
    const phone = e.currentTarget.dataset.phone
    if (phone) {
      makePhoneCall(phone)
    }
  },

  formatSignUpTime(timestamp: number): string {
    if (!timestamp) return '未知'
    const date = new Date(timestamp)
    return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
  },

  getLevelName(level: MemberLevel): string {
    return MemberLevelConfig[level]?.name || '普通会员'
  },

  getLevelColor(level: MemberLevel): string {
    return MemberLevelConfig[level]?.color || '#999'
  },

  previewImage(e: any) {
    const url = e.currentTarget.dataset.url as string
    const { previewUrls } = this.data
    if (!previewUrls.length) return
    wx.previewImage({
      urls: previewUrls,
      current: url || previewUrls[0]
    })
  },

  goBack() {
    wx.navigateBack()
  }
})