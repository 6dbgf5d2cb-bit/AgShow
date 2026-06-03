import { getActiveLogs, pullRemoteLogsAndMerge, canPublishLog, deleteLog, TravelLog, getPublisherInfo } from '../../utils/travellog'
import { applyResolvedUrl, resolveMediaUrlMap } from '../../utils/cloud-storage'
import {
  getCurrentSession,
  checkModulePermission,
  canManageModule,
  requireModulePermission,
  userHasAdminRole
} from '../../utils/user'
import { MemberLevel, MemberLevelConfig } from '../../utils/user'

Page({
  data: {
    logs: [] as any[],
    hasSession: false,
    canPublish: false,
    publishMessage: '',
    isAdmin: false,
    canCreate: false,
    canDelete: false,
    isSelectMode: false,
    selectedLogs: [] as string[],
    selectAll: false,
    selectedCount: 0
  },

  onLoad() {
    const session = getCurrentSession()
    this.loadLogs()
    if (session?.userId) {
      this.refreshActionPermissions(session.userId)
    } else {
      this.setData({
        hasSession: false,
        canPublish: false,
        canCreate: false,
        canDelete: false,
        isAdmin: false
      })
    }
  },

  refreshActionPermissions(userId: string) {
    const result = canPublishLog(userId)
    this.setData({
      hasSession: true,
      canPublish: result.canPublish,
      publishMessage: result.message,
      isAdmin: userHasAdminRole(userId),
      canCreate: checkModulePermission(userId, 'travellog', 'create'),
      canDelete: canManageModule(userId, 'travellog', 'delete')
    })
  },

  onShow() {
    const session = getCurrentSession()
    if (session?.userId) {
      this.refreshActionPermissions(session.userId)
    }
    this.loadLogs()
  },

  async loadLogs() {
    try {
      await pullRemoteLogsAndMerge()
    } catch {
      wx.showToast({ title: '同步旅行记失败', icon: 'none', duration: 2000 })
    }
    const logs = getActiveLogs()
    const mediaUrls = logs.flatMap((l) => (l.images || []).filter((u): u is string => !!u))
    const resolved = await resolveMediaUrlMap(mediaUrls)
    const { selectedLogs } = this.data

    const logsWithPublisher = logs.map(log => {
      const displayImages = (log.images || []).map((img) => applyResolvedUrl(img, resolved))
      const publisherInfo = getPublisherInfo(log.publisherId)
      return {
        ...log,
        images: displayImages,
        publisherInfo: publisherInfo || { nickname: '未知用户', avatarUrl: '', memberLevel: 'normal' as MemberLevel, phone: '' },
        publisherLevelName: MemberLevelConfig[publisherInfo?.memberLevel as MemberLevel]?.name || '普通会员',
        publisherLevelColor: MemberLevelConfig[publisherInfo?.memberLevel as MemberLevel]?.color || '#999',
        selected: selectedLogs.indexOf(log.logId) !== -1
      }
    })

    this.setData({ logs: logsWithPublisher })
  },

  goToDetail(event: { currentTarget: { dataset: { logid: string } } }) {
    if (this.data.isSelectMode) return

    const logId = event.currentTarget.dataset.logid
    wx.navigateTo({
      url: `/pages/travellog-detail/travellog-detail?logId=${logId}`
    })
  },

  goToPublish() {
    const session = getCurrentSession()
    if (!session) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }

    const result = canPublishLog(session.userId)
    if (!result.canPublish) {
      wx.showToast({
        title: result.message,
        icon: 'none'
      })
      return
    }

    wx.navigateTo({
      url: '/pages/travellog-publish/travellog-publish'
    })
  },

  enterSelectMode() {
    const session = getCurrentSession()
    if (!session?.userId || !this.data.canDelete) {
      if (session) requireModulePermission(session.userId, 'travellog', 'delete')
      return
    }
    this.setData({
      isSelectMode: true
    })
    this.loadLogs()
  },

  cancelSelectMode() {
    this.setData({
      isSelectMode: false,
      selectedLogs: [],
      selectAll: false,
      selectedCount: 0
    })
    this.loadLogs()
  },

  toggleSelect(e: any) {
    const logId = e.currentTarget.dataset.logid
    const { selectedLogs, logs } = this.data
    const newSelectedLogs = selectedLogs.filter(id => id !== logId)

    if (newSelectedLogs.length === selectedLogs.length) {
      newSelectedLogs.push(logId)
    }

    const selectAll = newSelectedLogs.length === logs.length && logs.length > 0

    this.setData({
      selectedLogs: newSelectedLogs,
      selectedCount: newSelectedLogs.length,
      selectAll: selectAll
    })

    const updatedLogs = logs.map(log => ({
      ...log,
      selected: newSelectedLogs.indexOf(log.logId) !== -1
    }))
    this.setData({ logs: updatedLogs })
  },

  toggleSelectAll() {
    const { selectAll, logs } = this.data

    if (selectAll) {
      const updatedLogs = logs.map(log => ({ ...log, selected: false }))
      this.setData({
        selectedLogs: [],
        selectAll: false,
        selectedCount: 0,
        logs: updatedLogs
      })
    } else {
      const allIds = logs.map(log => log.logId)
      const updatedLogs = logs.map(log => ({ ...log, selected: true }))
      this.setData({
        selectedLogs: allIds,
        selectAll: true,
        selectedCount: allIds.length,
        logs: updatedLogs
      })
    }
  },

  batchDelete() {
    const session = getCurrentSession()
    if (!session?.userId || !requireModulePermission(session.userId, 'travellog', 'delete')) {
      return
    }

    const { selectedLogs } = this.data

    if (selectedLogs.length === 0) {
      wx.showToast({
        title: '请选择要删除的旅行记',
        icon: 'none'
      })
      return
    }

    wx.showModal({
      title: '确认批量删除',
      content: `确定要删除选中的 ${selectedLogs.length} 篇旅行记吗？删除后无法恢复。`,
      confirmColor: '#ff4d4f',
      success: async (res) => {
        if (res.confirm) {
          let successCount = 0
          for (const logId of selectedLogs) {
            if (await deleteLog(logId)) {
              successCount++
            }
          }

          wx.showToast({
            title: `已删除 ${successCount} 篇旅行记`,
            icon: 'success',
            duration: 1500
          })

          this.cancelSelectMode()
          this.loadLogs()
        }
      }
    })
  }
})