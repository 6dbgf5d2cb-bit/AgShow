import { getLogById, pullRemoteLogsAndMerge, getPublisherInfo, incrementViewCount, toggleLike, addComment, deleteComment, deleteLog, toggleComments, TravelLog, TravelLogComment } from '../../utils/travellog'
import { applyResolvedUrl, resolveMediaUrlMap } from '../../utils/cloud-storage'
import { getCurrentSession, getUserById, MemberLevel, MemberLevelConfig } from '../../utils/user'
import {
  fetchMpShareConfig,
  isContentApiEnabled,
  shareLogToOfficialAccount
} from '../../utils/content-api'
import {
  getOfficialAccountDisplayName,
  isOfficialAccountConfigured,
  openOfficialAccountProfile
} from '../../utils/official-account'

Page({
  data: {
    log: null as TravelLog | null,
    logId: '',
    publisherInfo: null as { nickname: string; avatarUrl: string; memberLevel: MemberLevel; phone: string } | null,
    canViewPhone: false,
    publisherLevelName: '',
    publisherLevelColor: '',
    publishTime: '',
    isPublisher: false,
    isAdmin: false,
    hasSession: false,
    comments: [] as TravelLogComment[],
    newComment: '',
    liked: false,
    allowComments: true,
    canShareToMp: false,
    mpShareEnabled: false,
    sharingToMp: false,
    officialAccountName: '',
    showOfficialAccount: false
  },

  onLoad(options: { logId?: string }) {
    if (!options?.logId) {
      wx.showToast({
        title: '参数错误',
        icon: 'none'
      })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }

    this.setData({
      logId: options.logId,
      officialAccountName: getOfficialAccountDisplayName(),
      showOfficialAccount: isOfficialAccountConfigured()
    })
    this.loadLog()
    this.loadMpShareConfig()
  },

  onShow() {
    this.loadLog()
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
  },

  async loadMpShareConfig() {
    if (!isContentApiEnabled()) {
      this.setData({ mpShareEnabled: false })
      return
    }
    try {
      const cfg = await fetchMpShareConfig()
      this.setData({ mpShareEnabled: cfg.shareToMpEnabled })
    } catch {
      this.setData({ mpShareEnabled: false })
    }
  },

  async loadLog() {
    try {
      await pullRemoteLogsAndMerge()
    } catch {
      // 离线时仍可读本地缓存
    }
    const log = getLogById(this.data.logId)
    if (!log) {
      wx.showToast({
        title: '旅行记不存在',
        icon: 'none'
      })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }

    incrementViewCount(this.data.logId)

    const publisherInfo = getPublisherInfo(log.publisherId)

    const session = getCurrentSession()
    const canView = session ? this.canViewPhone(session.userId) : false

    const currentUser = session ? getUserById(session.userId) : null
    const isPublisher = currentUser ? log.publisherId === currentUser.userId : false
    const isAdmin = currentUser ? currentUser.roles.includes('admin') : false

    const likesKey = `travel_log_likes_${this.data.logId}`
    const likes = wx.getStorageSync(likesKey) || []
    const liked = session ? likes.includes(session.userId) : false

    const mediaUrls = [...(log.images || []), ...(log.videos || [])].filter((u): u is string => !!u)
    const resolved = await resolveMediaUrlMap(mediaUrls)
    const displayLog = {
      ...log,
      images: (log.images || []).map((img) => applyResolvedUrl(img, resolved)),
      videos: (log.videos || []).map((v) => applyResolvedUrl(v, resolved))
    }

    this.setData({
      log: displayLog,
      publisherInfo: publisherInfo || { nickname: '未知用户', avatarUrl: '', memberLevel: 'normal', phone: '' },
      canViewPhone: canView,
      publisherLevelName: MemberLevelConfig[publisherInfo?.memberLevel as MemberLevel]?.name || '普通会员',
      publisherLevelColor: MemberLevelConfig[publisherInfo?.memberLevel as MemberLevel]?.color || '#999',
      publishTime: this.formatDate(log.publishTime),
      isPublisher,
      isAdmin,
      hasSession: !!session,
      comments: log.comments,
      allowComments: log.allowComments,
      liked,
      canShareToMp: (isPublisher || isAdmin) && !!(displayLog.images && displayLog.images.length > 0)
    })
  },

  formatDate(timestamp: number): string {
    const date = new Date(timestamp)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day} ${hour}:${minute}`
  },

  canViewPhone(viewerId: string): boolean {
    const viewer = getUserById(viewerId)
    if (!viewer) return false
    if (viewer.roles.includes('admin')) return true
    const goldLevels: MemberLevel[] = ['gold', 'vip', 'premium']
    return goldLevels.includes(viewer.memberLevel)
  },

  makePhoneCall() {
    if (!this.data.canViewPhone || !this.data.publisherInfo?.phone) {
      wx.showToast({
        title: '暂无权限查看联系方式',
        icon: 'none'
      })
      return
    }
    wx.makePhoneCall({
      phoneNumber: this.data.publisherInfo.phone
    })
  },

  viewPublisherProfile() {
    wx.showToast({
      title: '用户主页开发中',
      icon: 'none'
    })
  },

  onLike() {
    if (!this.data.hasSession) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }

    const session = getCurrentSession()
    if (!session) return

    const result = toggleLike(this.data.logId, session.userId)
    this.setData({
      liked: result.liked,
      'log.likeCount': result.count
    })
  },

  onCommentInput(event: { detail: { value: string } }) {
    this.setData({ newComment: event.detail.value })
  },

  submitComment() {
    if (!this.data.hasSession) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }

    if (!this.data.newComment.trim()) {
      wx.showToast({
        title: '请输入评论内容',
        icon: 'none'
      })
      return
    }

    const session = getCurrentSession()
    if (!session) return

    const success = addComment(this.data.logId, session.userId, this.data.newComment.trim())
    if (success) {
      wx.showToast({
        title: '评论成功',
        icon: 'success'
      })
      this.setData({ newComment: '' })
      this.loadLog()
    } else {
      wx.showToast({
        title: '评论失败，评论功能可能已关闭',
        icon: 'none'
      })
    }
  },

  deleteComment(event: { currentTarget: { dataset: { commentid: string } } }) {
    const commentId = event.currentTarget.dataset.commentid
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条评论吗？',
      confirmColor: '#ff4d4f',
      success: (res) => {
        if (res.confirm) {
          const session = getCurrentSession()
          if (!session) return
          
          const success = deleteComment(this.data.logId, commentId, session.userId)
          if (success) {
            wx.showToast({
              title: '删除成功',
              icon: 'success'
            })
            this.loadLog()
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

  toggleComments() {
    const success = toggleComments(this.data.logId)
    if (success) {
      this.setData({ allowComments: !this.data.allowComments })
      wx.showToast({
        title: this.data.allowComments ? '已关闭评论' : '已开启评论',
        icon: 'success'
      })
    }
  },

  editLog() {
    wx.navigateTo({
      url: `/pages/travellog-publish/travellog-publish?logId=${this.data.logId}`
    })
  },

  deleteLog() {
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这篇旅行记吗？删除后无法恢复。',
      confirmColor: '#ff4d4f',
      success: (res) => {
        if (res.confirm) {
          const success = deleteLog(this.data.logId)
          if (success) {
            wx.showToast({
              title: '删除成功',
              icon: 'success',
              duration: 1500
            })
            setTimeout(() => wx.navigateBack(), 1500)
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

  previewImage(event: { currentTarget: { dataset: { index: number } } }) {
    const index = event.currentTarget.dataset.index
    const images = this.data.log?.images || []
    wx.previewImage({
      urls: images,
      current: images[index]
    })
  },

  getUserAvatar(authorId: string): string {
    const user = getUserById(authorId)
    return user?.avatarUrl || ''
  },

  formatCommentTime(timestamp: number): string {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - timestamp
    
    if (diff < 60000) {
      return '刚刚'
    } else if (diff < 3600000) {
      return `${Math.floor(diff / 60000)}分钟前`
    } else if (diff < 86400000) {
      return `${Math.floor(diff / 3600000)}小时前`
    } else if (diff < 604800000) {
      return `${Math.floor(diff / 86400000)}天前`
    } else {
      return `${date.getMonth() + 1}-${date.getDate()}`
    }
  },

  getCurrentUserId(): string {
    const session = getCurrentSession()
    return session?.userId || ''
  },

  goBack() {
    wx.navigateBack()
  },

  onShareAppMessage() {
    const log = this.data.log
    const cover =
      log?.images && log.images.length > 0
        ? log.images[0]
        : ''
    return {
      title: log?.title || '旅行记',
      path: `/pages/travellog-detail/travellog-detail?logId=${this.data.logId}`,
      imageUrl: cover
    }
  },

  onShareTimeline() {
    const log = this.data.log
    return {
      title: log?.title || '旅行记',
      query: `logId=${this.data.logId}`
    }
  },

  openOfficialAccount() {
    openOfficialAccountProfile()
  },

  onShareMenu() {
    const items: string[] = ['转发给好友']
    if (this.data.mpShareEnabled && this.data.canShareToMp) {
      items.push('同步到公众号草稿')
    }
    if (isOfficialAccountConfigured()) {
      items.push(`打开${this.data.officialAccountName}`)
    }
    wx.showActionSheet({
      itemList: items,
      success: (res) => {
        const label = items[res.tapIndex]
        if (label === '转发给好友') {
          wx.showShareMenu({ menus: ['shareAppMessage'] })
          wx.showToast({ title: '请点击右上角转发', icon: 'none' })
        } else if (label === '同步到公众号草稿') {
          this.shareToOfficialAccount()
        } else if (label?.startsWith('打开')) {
          this.openOfficialAccount()
        }
      }
    })
  },

  async shareToOfficialAccount() {
    if (!this.data.canShareToMp) {
      wx.showToast({ title: '仅作者或管理员可分享', icon: 'none' })
      return
    }
    if (!this.data.mpShareEnabled) {
      wx.showModal({
        title: '公众号同步未就绪',
        content:
          '请在云托管环境变量中配置公众号 MP_APPID、MP_APP_SECRET，并重新部署服务。也可使用「转发给好友」分享小程序卡片。',
        showCancel: false
      })
      return
    }

    const log = this.data.log
    if (!log?.images?.length) {
      wx.showToast({ title: '需至少一张图片作为封面', icon: 'none' })
      return
    }

    const session = getCurrentSession()
    if (!session) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      return
    }

    wx.showModal({
      title: '同步到公众号',
      content: `将生成图文草稿至「${this.data.officialAccountName}」，请在公众平台草稿箱审核后发布。`,
      success: async (res) => {
        if (!res.confirm) return
        this.setData({ sharingToMp: true })
        wx.showLoading({ title: '生成草稿中...' })
        try {
          const imageUrls = (log.images || []).filter((u) => /^https?:\/\//i.test(u))
          const result = await shareLogToOfficialAccount({
            logId: this.data.logId,
            userId: session.userId,
            authorName: this.data.publisherInfo?.nickname,
            imageUrls,
            log
          })
          wx.hideLoading()
          wx.showModal({
            title: '已创建草稿',
            content: result.message,
            showCancel: false
          })
          this.loadLog()
        } catch (e: unknown) {
          wx.hideLoading()
          const msg = e instanceof Error ? e.message : '同步失败'
          wx.showToast({ title: msg, icon: 'none', duration: 3000 })
        } finally {
          this.setData({ sharingToMp: false })
        }
      }
    })
  }
})